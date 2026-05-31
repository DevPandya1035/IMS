'use client';

import React from 'react';
import { useAppSelector } from '../../store/hooks';

interface RoleGuardProps {
  children: React.ReactNode;
  permission?: string;
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, permission, fallback = null }: RoleGuardProps) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Admin bypasses all authorization checks
  if (user.role.roleName === 'Admin') {
    return <>{children}</>;
  }

  if (permission) {
    const hasPerm = user.role.rolePermissions.some(
      (rp) => rp.permission.permissionName === permission
    );
    if (!hasPerm) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Hook for functional permission checks
export function usePermission() {
  const { user } = useAppSelector((state) => state.auth);

  const checkPermission = (permissionName: string): boolean => {
    if (!user) return false;
    if (user.role.roleName === 'Admin') return true;
    return user.role.rolePermissions.some(
      (rp) => rp.permission.permissionName === permissionName
    );
  };

  return { checkPermission, role: user?.role?.roleName };
}

export default RoleGuard;
