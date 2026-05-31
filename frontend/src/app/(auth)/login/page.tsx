'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../../../store/slices/authSlice';
import { api } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    dispatch(loginStart());
    try {
      const response = await api.post('/auth/login', data);
      const { accessToken, refreshToken, user } = response.data.data;
      dispatch(loginSuccess({ accessToken, refreshToken, user }));
      router.push('/');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Connection error. Please try again.';
      dispatch(loginFailure(errMsg));
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#090a0f] overflow-hidden">
      {/* Background gradients/glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md p-8 mx-4 bg-[#11131e]/80 border border-[#22263f] rounded-2xl shadow-2xl backdrop-blur-xl z-10 transition-all duration-300 hover:border-[#3b426f]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 mb-4 shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-xl tracking-tight">IP</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-sm text-gray-400 mt-2">Sign in to manage your enterprise inventory</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                {...register('email')}
                className={`w-full pl-10 pr-4 py-3 bg-[#0d0e15] border ${
                  errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-[#22263f] focus:border-blue-500'
                } rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none transition-colors duration-200`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={`w-full pl-10 pr-10 py-3 bg-[#0d0e15] border ${
                  errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-[#22263f] focus:border-blue-500'
                } rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none transition-colors duration-200`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-all duration-200 flex items-center justify-center shadow-lg shadow-blue-500/25"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Demo credentials: admin@ims.com / Admin@123</p>
        </div>
      </div>
    </div>
  );
}
