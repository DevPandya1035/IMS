'use client';

import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { Sidebar } from '../../components/ui/Sidebar';
import { TopBar } from '../../components/ui/TopBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main dashboard view container */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'pl-64' : 'pl-20'
        }`}
      >
        {/* Topbar navigation action items */}
        <TopBar />

        {/* Dynamic page contents */}
        <main className="flex-1 p-6 mt-16 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
