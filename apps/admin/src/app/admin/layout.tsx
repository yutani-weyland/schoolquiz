'use client';

import { Sidebar } from '@/components/admin/Sidebar';
import { Topbar } from '@/components/admin/Topbar';
import { ThemeProvider } from '@/components/admin/ThemeProvider';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <Topbar />
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
