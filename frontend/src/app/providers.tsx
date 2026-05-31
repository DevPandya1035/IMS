'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/index';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { useRouter, usePathname } from 'next/navigation';

function AuthSync({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, theme } = useAppSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    theme: state.ui.theme,
  }));

  // Sync theme to document class list
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Listen for logout events (from API client)
  useEffect(() => {
    const handleLogout = () => {
      dispatch(logout());
      router.push('/login');
    };

    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, [dispatch, router]);

  // Auth routing guard
  useEffect(() => {
    const isAuthRoute = pathname === '/login';
    if (!isAuthenticated && !isAuthRoute) {
      router.push('/login');
    } else if (isAuthenticated && isAuthRoute) {
      router.push('/');
    }
  }, [isAuthenticated, pathname, router]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthSync>{children}</AuthSync>
    </Provider>
  );
}
