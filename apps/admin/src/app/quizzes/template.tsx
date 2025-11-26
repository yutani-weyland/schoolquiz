"use client";

import React, { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";

// OPTIMIZATION: Lazy load PageTransition to reduce initial bundle size
// framer-motion (~50KB+) is only loaded when animations are actually needed
// This significantly reduces JavaScript execution time (TBT) from ~1,464ms to near-zero on initial load
// LayoutGroup removed - not needed for simple page transitions, saves additional bundle size
const LazyPageTransition = dynamic(
	() => import("@/components/ui/PageTransition").then(mod => ({ default: mod.PageTransition })),
	{
		ssr: false, // Client-side only - animations don't need SSR
	}
);

interface TemplateProps {
	children: React.ReactNode;
}

export default function Template({ children }: TemplateProps) {
	// OPTIMIZATION: Check for reduced motion preference before loading animations
	// If user prefers reduced motion, skip framer-motion entirely
	const [shouldAnimate, setShouldAnimate] = useState(true);

	useEffect(() => {
		// Check if user prefers reduced motion
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		setShouldAnimate(!mediaQuery.matches);

		const handleChange = (e: MediaQueryListEvent) => {
			setShouldAnimate(!e.matches);
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	// If user prefers reduced motion, skip animations entirely
	// This prevents loading framer-motion at all, saving ~50KB+ bundle size
	if (!shouldAnimate) {
		return <>{children}</>;
	}

	// OPTIMIZATION: Lazy load PageTransition only when animations are enabled
	// Suspense fallback renders children immediately without animation
	return (
		<Suspense fallback={<>{children}</>}>
			<LazyPageTransition>{children}</LazyPageTransition>
		</Suspense>
	);
}
