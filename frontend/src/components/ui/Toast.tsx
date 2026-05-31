'use client';

import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { removeToast } from '../../store/slices/toastSlice';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export function ToastContainer() {
  const toasts = useAppSelector((state) => state.toast.toasts);
  const dispatch = useAppDispatch();

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col space-y-3 w-full max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={(id) => dispatch(removeToast(id))} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: any; onClose: (id: string) => void }) {
  useEffect(() => {
    const duration = toast.duration || 4000;
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    error: <AlertCircle className="h-5 w-5 text-red-400" />,
    info: <Info className="h-5 w-5 text-blue-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
  };

  const borders = {
    success: 'border-emerald-500/20 bg-emerald-950/20',
    error: 'border-red-500/20 bg-red-950/20',
    info: 'border-blue-500/20 bg-blue-950/20',
    warning: 'border-amber-500/20 bg-amber-950/20',
  };

  return (
    <div
      className={`flex items-start justify-between p-4 rounded-xl border backdrop-blur-md shadow-2xl animate-slide-in transition-all duration-300 ${
        borders[toast.type as keyof typeof borders]
      }`}
    >
      <div className="flex space-x-3">
        <span className="flex-shrink-0 mt-0.5">{icons[toast.type as keyof typeof icons]}</span>
        <p className="text-sm font-medium text-white">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-500 hover:text-white transition-colors ml-4 flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
