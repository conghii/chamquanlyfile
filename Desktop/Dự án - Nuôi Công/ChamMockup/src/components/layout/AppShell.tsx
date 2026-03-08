'use client';

import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { hydrateStore } from '@/stores/useAppStore';

export default function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    hydrateStore();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
