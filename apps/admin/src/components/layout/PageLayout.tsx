'use client';

import { ReactNode } from 'react';
import { SiteHeader } from '@/components/SiteHeader';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  headerFadeLogo?: boolean;
}

/**
 * Standard page layout wrapper with consistent spacing and background
 */
export function PageLayout({ children, className = '', headerFadeLogo = false }: PageLayoutProps) {
  return (
    <>
      <SiteHeader fadeLogo={headerFadeLogo} />
      <main className={`min-h-screen bg-gray-50 dark:bg-[#0F1419] pt-24 pb-16 ${className}`}>
        {children}
      </main>
    </>
  );
}

