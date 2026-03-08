'use client';

import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import AuthButton from '../auth/AuthButton';
import { Bell, Search } from 'lucide-react';

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  '/': { title: 'Dashboard', description: 'Overview of your seasonal mockup activity' },
  '/generator': { title: 'Generator', description: 'Create AI-powered seasonal apparel mockups' },
  '/gallery': { title: 'Gallery', description: 'Your saved mockup collection' },
  '/calendar': { title: 'Season Calendar', description: 'Plan your seasonal design schedule' },
  '/settings': { title: 'Settings', description: 'Configure API keys and preferences' },
};

export default function Header() {
  const pathname = usePathname();
  const page = PAGE_TITLES[pathname] ?? { title: 'ChamMockup', description: '' };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{page.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{page.description}</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500"></span>
        </button>
        <ThemeToggle />
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />
        <AuthButton />
      </div>
    </header>
  );
}
