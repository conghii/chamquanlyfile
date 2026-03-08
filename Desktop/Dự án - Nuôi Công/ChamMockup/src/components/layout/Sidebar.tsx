'use client';

import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wand2,
  Image,
  Calendar,
  Settings,
  Shirt,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { id: 'generator', label: 'Generator', icon: Wand2, href: '/generator' },
  { id: 'gallery', label: 'Gallery', icon: Image, href: '/gallery' },
  { id: 'calendar', label: 'Season Calendar', icon: Calendar, href: '/calendar' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Shirt className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">ChamMockup</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Seasonal Mockup AI</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-violet-600 dark:text-violet-400')} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-500" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-500" />
        )}
      </button>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            For Etsy & POD sellers 🇺🇸
          </p>
        </div>
      )}
    </aside>
  );
}
