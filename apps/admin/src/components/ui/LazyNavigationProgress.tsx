'use client';

/**
 * OPTIMIZATION: Lazy-loaded wrapper for NavigationProgress
 * Reduces initial bundle size by loading framer-motion only when needed
 * This component can be used in Server Components since it handles the dynamic import client-side
 */
import dynamic from 'next/dynamic';

const LazyNavigationProgress = dynamic(
	() => import('./NavigationProgress').then(mod => ({ default: mod.NavigationProgress })),
	{ ssr: false }
);

export function LazyNavigationProgressWrapper() {
	return <LazyNavigationProgress />;
}







