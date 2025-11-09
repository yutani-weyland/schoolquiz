'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  className?: string;
  centered?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
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
 * Standard page header with consistent typography and spacing
 */
export function PageHeader({ 
  title, 
  subtitle, 
  className = '', 
  centered = false,
  maxWidth = '2xl'
}: PageHeaderProps) {
  const containerClass = centered ? 'text-center' : '';
  const widthClass = maxWidthClasses[maxWidth];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`mb-12 md:mb-16 ${containerClass} ${className}`}
    >
      <div className={`${centered ? 'mx-auto' : ''} ${widthClass}`}>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}

