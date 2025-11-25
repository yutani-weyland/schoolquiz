'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NavigationProgress - Shows a top loading bar during route transitions
 * This provides immediate visual feedback when navigating between pages
 */
export function NavigationProgress() {
	const pathname = usePathname();
	const [isLoading, setIsLoading] = useState(false);
	const [progress, setProgress] = useState(0);
	const prevPathnameRef = useRef(pathname);
	const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		// Detect navigation start by listening to link clicks
		const handleLinkClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const link = target.closest('a[href^="/"]');
			
			if (link && link.getAttribute('href')?.startsWith('/')) {
				const href = link.getAttribute('href');
				// Don't show progress for same-page links
				if (href && href !== pathname) {
					setIsLoading(true);
					setProgress(10);
					
					// Clear any existing interval
					if (progressIntervalRef.current) {
						clearInterval(progressIntervalRef.current);
					}
					
					// Simulate progress
					progressIntervalRef.current = setInterval(() => {
						setProgress((prev) => {
							if (prev >= 90) {
								if (progressIntervalRef.current) {
									clearInterval(progressIntervalRef.current);
								}
								return 90;
							}
							return prev + 10;
						});
					}, 100);
				}
			}
		};

		// Listen to all link clicks
		document.addEventListener('click', handleLinkClick, true);

		return () => {
			document.removeEventListener('click', handleLinkClick, true);
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
			}
		};
	}, [pathname]);

	useEffect(() => {
		// When pathname changes, navigation is complete
		if (prevPathnameRef.current !== pathname) {
			// Complete the progress bar
			setProgress(100);
			
			// Hide after a short delay
			setTimeout(() => {
				setIsLoading(false);
				setProgress(0);
			}, 200);
			
			prevPathnameRef.current = pathname;
			
			// Clear any running interval
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
			}
		}
	}, [pathname]);

	return (
		<AnimatePresence>
			{isLoading && (
				<motion.div
					className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-blue-600 dark:bg-blue-400 origin-left"
					initial={{ scaleX: 0 }}
					animate={{ scaleX: progress / 100 }}
					exit={{ scaleX: 1, opacity: 0 }}
					transition={{ duration: 0.15, ease: 'easeOut' }}
					style={{ transformOrigin: 'left' }}
				/>
			)}
		</AnimatePresence>
	);
}

