'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { toggleTheme } from '../../store/slices/uiSlice';
import { Sun, Moon, Bell, Check, BellOff, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';

export function TopBar() {
  const dispatch = useAppDispatch();
  const { theme, sidebarOpen } = useAppSelector((state) => state.ui);
  const user = useAppSelector((state) => state.auth.user);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get('/notifications?unread=true');
      setNotifications(res.data.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchNotifications();
    // Poll notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);


  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications([]);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 z-10 h-16 bg-[#0b0c14]/80 backdrop-blur-md border-b border-[#1e2235] transition-all duration-300 flex items-center justify-between px-6 ${
        sidebarOpen ? 'left-64' : 'left-20'
      }`}
    >
      {/* Title */}
      <div>
        <h2 className="text-sm font-medium text-gray-400">Inventory Management System</h2>
      </div>

      {/* Toolbar actions */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="text-gray-400 hover:text-white p-2 hover:bg-[#1a1c2d] rounded-xl transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-gray-400 hover:text-white p-2 hover:bg-[#1a1c2d] rounded-xl transition-colors relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#11131e] border border-[#22263f] rounded-2xl shadow-2xl py-2 z-30">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#22263f]">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Alerts ({notifications.length})
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchNotifications}
                    className="text-gray-500 hover:text-white transition-colors"
                    disabled={loading}
                    title="Refresh"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <BellOff className="h-8 w-8 mb-2 opacity-40" />
                    <span className="text-xs">No unread notifications</span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 hover:bg-[#131625] transition-colors border-b border-[#22263f] last:border-none flex items-start justify-between group"
                    >
                      <div className="flex-1 pr-2">
                        <p className="text-xs font-semibold text-white">{n.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-gray-600 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-gray-600 hover:text-green-400 transition-colors p-1"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        {mounted && user && (
          <div className="flex items-center space-x-3 border-l border-[#1e2235] pl-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow shadow-blue-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-white leading-none">{user.name}</p>
              <span className="text-[10px] text-gray-500 mt-1 block leading-none">{user.role.roleName}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopBar;
