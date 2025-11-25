'use client';

import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl',
  '4xl': 'max-w-7xl',
  '6xl': 'max-w-[1600px]',
  full: 'max-w-full',
};

/**
 * Standard page container with consistent max-width and padding
 */
export function PageContainer({ children, maxWidth = '2xl', className = '' }: PageContainerProps) {
  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

