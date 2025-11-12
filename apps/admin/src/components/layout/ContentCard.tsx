'use client';

import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';

interface ContentCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'lg' | 'xl' | '2xl' | '3xl';
  animate?: boolean;
  delay?: number;
  hoverAnimation?: boolean; // New prop to control hover animations
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-6 sm:p-8',
  xl: 'p-8 sm:p-10 md:p-12',
};

const roundedClasses = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
};

/**
 * Standard content card with consistent styling and hover animations matching quiz cards
 */
export function ContentCard({ 
  children, 
  className = '', 
  padding = 'lg',
  rounded = '3xl',
  animate = true,
  delay = 0,
  hoverAnimation = true, // Default to true for backward compatibility
}: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const baseClasses = `
    bg-white dark:bg-gray-800 
    border border-gray-200 dark:border-gray-700 
    shadow-lg
    ${paddingClasses[padding]}
    ${roundedClasses[rounded]}
    ${className}
  `;

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        onMouseEnter={() => hoverAnimation && setIsHovered(true)}
        onMouseLeave={() => hoverAnimation && setIsHovered(false)}
        whileHover={hoverAnimation ? { 
          rotate: 1.4,
          scale: 1.02,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        } : {}}
        whileTap={hoverAnimation ? { scale: 0.98 } : {}}
        className={`${baseClasses} ${hoverAnimation ? 'relative overflow-hidden' : ''}`}
      >
        {hoverAnimation && (
          <>
            {/* Subtle gradient overlay on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 pointer-events-none rounded-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.3
              }}
            />
            <div className="relative z-10">
              {children}
            </div>
          </>
        )}
        {!hoverAnimation && children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses}>
      {children}
    </div>
  );
}

