'use client';

import React, { ReactNode, useState } from 'react';
import { Lock } from 'lucide-react';
import { useUserAccess, AccessTier } from '@/contexts/UserAccessContext';
import { motion, AnimatePresence } from 'framer-motion';

interface LockedFeatureProps {
  children: ReactNode;
  tierRequired: AccessTier;
  onUpgradeClick?: () => void;
  blurIntensity?: 'light' | 'medium' | 'heavy';
  showPadlock?: boolean;
  tooltipText?: string;
  className?: string;
}

const tierLabels: Record<AccessTier, string> = {
  visitor: 'Sign up',
  free: 'Upgrade to Premium',
  premium: 'Premium',
};

const defaultTooltips: Record<AccessTier, string> = {
  visitor: 'Sign up to unlock this feature',
  free: 'Upgrade to Premium to unlock this feature',
  premium: 'Premium feature',
};

export function LockedFeature({
  children,
  tierRequired,
  onUpgradeClick,
  blurIntensity = 'medium',
  showPadlock = true,
  tooltipText,
  className = '',
}: LockedFeatureProps) {
  const { tier, isPremium, isFree, isVisitor } = useUserAccess();
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine if feature is locked
  const isLocked = 
    (tierRequired === 'premium' && !isPremium) ||
    (tierRequired === 'free' && isVisitor);

  if (!isLocked) {
    return <>{children}</>;
  }

  const blurClass = {
    light: 'blur-[1px]',
    medium: 'blur-[2px]',
    heavy: 'blur-[3px]',
  }[blurIntensity];

  const tooltip = tooltipText || defaultTooltips[tierRequired];
  const upgradeLabel = tierLabels[tierRequired];

  const handleClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // Default behavior: redirect to signup/upgrade
      if (isVisitor) {
        window.location.href = '/sign-up';
      } else {
        window.location.href = '/upgrade';
      }
    }
  };

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Blurred content */}
      <div className={`${blurClass} pointer-events-none select-none`}>
        {children}
      </div>

      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-white/40 dark:bg-black/40 flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={tooltip}
      >
        {/* Padlock icon */}
        {showPadlock && (
          <div className="flex flex-col items-center gap-2">
            <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
              <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-1 bg-white dark:bg-gray-800 rounded-full shadow-sm">
              {upgradeLabel}
            </span>
          </div>
        )}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none"
          >
            {tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



