'use client';

import { Sidebar } from '@/components/admin/Sidebar';
import { Topbar } from '@/components/admin/Topbar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[hsl(var(--background))]">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-6 bg-white dark:bg-[hsl(var(--background))]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
