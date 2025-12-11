/**
 * Landing Page - Performance Optimized
 * 
 * This page is designed for maximum Lighthouse performance:
 * 
 * 1. ABOVE THE FOLD (critical path):
 *    - LandingHero: Server-rendered static content with CSS animations
 *    - LandingHeader: Lightweight header without framer-motion on SSR
 *    - No heavy providers loaded initially
 * 
 * 2. BELOW THE FOLD (lazy loaded):
 *    - LandingBelowFoldWrapper: Client component that lazy loads all below-fold content
 *    - Heavy components (framer-motion, AchievementCard) only load when needed
 *    - All sections use Suspense boundaries for streaming
 * 
 * Target metrics:
 * - LCP < 2.5s (hero text renders immediately)
 * - TBT < 150ms (minimal JS on initial load)
 * - CLS ~ 0 (static layout, no layout shift)
 */

import { LandingHero } from '@/components/marketing/LandingHero';
import { LandingHeader } from '@/components/marketing/LandingHeader';
import { LandingBelowFoldWrapper } from '@/components/marketing/LandingBelowFoldWrapper';

export default function HomePage() {
  return (
    <>
      {/* Lightweight header - no framer-motion, no session */}
      <LandingHeader />
      
      <main className="min-h-screen overflow-x-hidden bg-gray-50 dark:bg-[#0F1419]">
        {/* Hero section - server-rendered, CSS animations only */}
        <LandingHero />
        
        {/* Below-the-fold content - lazy loaded via client wrapper */}
        <LandingBelowFoldWrapper />
      </main>
    </>
  );
}
