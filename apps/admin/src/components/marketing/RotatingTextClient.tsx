'use client';

/**
 * RotatingTextClient - Progressive enhancement for rotating text
 * 
 * Strategy for keeping Lighthouse score high:
 * 1. SSR: Renders static text ("students") - this is what LCP measures
 * 2. After hydration: Swaps in the animated version
 * 
 * This ensures:
 * - LCP is fast (static text renders immediately)
 * - No layout shift (same dimensions)
 * - Animation only starts after page is interactive
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RotatingTextClientProps {
  texts: string[];
  duration?: number;
  className?: string;
}

export function RotatingTextClient({ 
  texts, 
  duration = 3000,
  className = ""
}: RotatingTextClientProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Only start animating after component mounts (client-side)
  useEffect(() => {
    // Small delay to ensure LCP has been measured
    const mountTimer = setTimeout(() => {
      setMounted(true);
    }, 100);

    return () => clearTimeout(mountTimer);
  }, []);

  // Start rotation after mounted
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, duration);

    return () => clearInterval(interval);
  }, [mounted, texts.length, duration]);

  // SSR and initial render: show static text
  if (!mounted) {
    return (
      <span className={className}>
        {texts[0]}
      </span>
    );
  }

  // After hydration: show animated text
  return (
    <span 
      className={`inline-block relative ${className}`} 
      style={{ 
        overflow: "hidden",
        verticalAlign: "bottom",
        minHeight: "1.2em",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ y: "50%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-50%", opacity: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeInOut"
          }}
          className="inline-block"
          style={{
            position: "relative",
            verticalAlign: "bottom"
          }}
        >
          {texts[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
