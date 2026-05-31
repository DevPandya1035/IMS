import * as argon2 from 'argon2';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { cache } from '../config/redis.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import type { LoginInput, RegisterInput } from '../validators/auth.validator.js';

const accessSecret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

const ARGON2_CONFIG = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
} as const;

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

async function generateAccessToken(userId: string, email: string, role: string): Promise<string> {
  return new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRY)
    .sign(accessSecret);
}

async function generateRefreshToken(userId: string, email: string, role: string): Promise<string> {
  return new SignJWT({ userId, email, role, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRY)
    .sign(refreshSecret);
}

export const authService = {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Contact an administrator.', 403);
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );
      throw new AppError(
        `Account locked. Try again in ${remainingMinutes} minutes.`,
        403
      );
    }

    // Verify password
    const isValid = await argon2.verify(user.passwordHash, input.password);
    if (!isValid) {
      const newAttempts = user.failedAttempts + 1;
      const updateData: Record<string, unknown> = { failedAttempts: newAttempts };

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        throw new AppError('Account locked. Try again in 30 minutes.', 403);
      }

      throw new AppError('Invalid email or password.', 401);
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const accessToken = await generateAccessToken(user.id, user.email, user.role.roleName);
    const refreshToken = await generateRefreshToken(user.id, user.email, user.role.roleName);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        role: {
          id: user.role.id,
          roleName: user.role.roleName,
          rolePermissions: user.role.rolePermissions.map((rp) => ({
            permission: {
              permissionName: rp.permission.permissionName,
            },
          })),
        },
      },
    };
  },

  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new AppError('A user with this email already exists.', 409);
    }

    const role = await prisma.role.findUnique({
      where: { id: input.roleId },
    });
    if (!role) {
      throw new AppError('Invalid role ID.', 400);
    }

    const passwordHash = await argon2.hash(input.password, ARGON2_CONFIG);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        roleId: input.roleId,
      },
      include: { role: true },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.roleName,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  },

  async refresh(refreshToken: string) {
    try {
      // Check if token is revoked
      const isRevoked = await cache.get(`revoked:${refreshToken}`);
      if (isRevoked) {
        throw new AppError('Refresh token has been revoked.', 401);
      }

      const { payload } = await jwtVerify(refreshToken, refreshSecret);

      if (payload.type !== 'refresh') {
        throw new AppError('Invalid token type.', 401);
      }

      const userId = payload.userId as string;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!user || !user.isActive) {
        throw new AppError('User not found or deactivated.', 401);
      }

      // Revoke old refresh token (TTL = 7 days)
      await cache.set(`revoked:${refreshToken}`, 'true', 7 * 24 * 3600);

      // Generate new token pair
      const newAccessToken = await generateAccessToken(user.id, user.email, user.role.roleName);
      const newRefreshToken = await generateRefreshToken(user.id, user.email, user.role.roleName);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          role: {
            id: user.role.id,
            roleName: user.role.roleName,
            rolePermissions: user.role.rolePermissions.map((rp) => ({
              permission: {
                permissionName: rp.permission.permissionName,
              },
            })),
          },
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid or expired refresh token.', 401);
    }
  },

  async logout(refreshToken: string) {
    // Revoke the refresh token
    await cache.set(`revoked:${refreshToken}`, 'true', 7 * 24 * 3600);
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.roleName,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  },

  async updateProfile(userId: string, data: { name?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      role: {
        id: user.role.id,
        roleName: user.role.roleName,
        rolePermissions: user.role.rolePermissions.map((rp) => ({
          permission: {
            permissionName: rp.permission.permissionName,
          },
        })),
      },
    };
  },

  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        role: { select: { id: true, roleName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getRoles() {
    return prisma.role.findMany({
      orderBy: { roleName: 'asc' },
    });
  },

  async updateUser(userId: string, data: { name?: string; roleId?: string; isActive?: boolean }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      role: {
        id: user.role.id,
        roleName: user.role.roleName,
        rolePermissions: user.role.rolePermissions.map((rp) => ({
          permission: {
            permissionName: rp.permission.permissionName,
          },
        })),
      },
    };
  },

  async deleteUser(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  },
};
