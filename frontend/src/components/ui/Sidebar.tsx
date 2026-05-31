'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  Home,
  FileText,
  ShoppingCart,
  Users,
  Truck,
  Receipt,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  TrendingUp,
  Brain,
} from 'lucide-react';
import { usePermission } from '../auth/RoleGuard';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  permission?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Products', href: '/products', icon: Package, permission: 'VIEW_PRODUCT' },
  { label: 'Categories', href: '/categories', icon: Layers, permission: 'MANAGE_CATEGORIES' },
  { label: 'Stock Levels', href: '/inventory', icon: Boxes, permission: 'VIEW_PRODUCT' },
  { label: 'Warehouses', href: '/warehouses', icon: Home, permission: 'MANAGE_WAREHOUSES' },
  { label: 'Purchase Orders', href: '/purchase-orders', icon: FileText, permission: 'CREATE_PO' },
  { label: 'Sales Orders', href: '/sales', icon: ShoppingCart, permission: 'CREATE_SO' },
  { label: 'Customers', href: '/customers', icon: Users, permission: 'CREATE_SO' },
  { label: 'Suppliers', href: '/suppliers', icon: Truck, permission: 'CREATE_PO' },
  { label: 'Invoices & Payments', href: '/invoices', icon: Receipt, permission: 'VIEW_INVOICE' },
  { label: 'Inventory Analytics', href: '/analytics', icon: TrendingUp, permission: 'VIEW_REPORTS' },
  { label: 'AI Forecasting', href: '/forecasting', icon: Brain, permission: 'VIEW_FORECAST' },
  { label: 'Audit Logs', href: '/audit-logs', icon: History, permission: 'VIEW_AUDIT_LOGS' },
];

export function Sidebar() {
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const user = useAppSelector((state) => state.auth.user);

  const { checkPermission } = usePermission();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  const filteredItems = mounted
    ? navItems.filter((item) => !item.permission || checkPermission(item.permission))
    : navItems.filter((item) => !item.permission);

  return (
    <aside
      className={`fixed top-0 left-0 z-20 h-screen bg-[#0b0c14] border-r border-[#1e2235] transition-all duration-300 flex flex-col ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand logo header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#1e2235]">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-[10px]">IMS</span>
          </div>
          {sidebarOpen && (
            <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap">
              IMS
            </span>
          )}
        </div>
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="text-gray-400 hover:text-white p-1 hover:bg-[#1a1c2d] rounded-lg transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>

      {/* Main navigation list */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-[#131523]'
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
              {sidebarOpen && <span className="text-sm whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Profile & Logout Footer */}
      <div className="p-4 border-t border-[#1e2235] bg-[#090a0f]">
        {mounted && sidebarOpen && user && (
          <div className="mb-4 px-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Logged in as</p>
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-blue-400 font-medium">{user.role.roleName}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
