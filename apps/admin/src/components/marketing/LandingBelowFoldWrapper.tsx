'use client';

/**
 * LandingBelowFoldWrapper - Client wrapper for lazy loading below-fold content
 * 
 * This is needed because Next.js 15 doesn't allow ssr: false in Server Components.
 * We wrap the dynamic import in a client component.
 */

import dynamic from 'next/dynamic';

const LandingBelowFold = dynamic(
  () => import('./LandingBelowFold').then(mod => mod.LandingBelowFold),
  { 
    ssr: false,
    loading: () => (
      <div className="py-16 flex justify-center">
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    )
  }
);

export function LandingBelowFoldWrapper() {
  return <LandingBelowFold />;
}
