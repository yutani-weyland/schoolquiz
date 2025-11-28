'use client';

/**
 * Client-only wrapper for QuizPlayer to prevent hydration mismatches
 * QuizPlayer uses Math.random() and other dynamic values that differ between server and client
 * 
 * OPTIMIZATION: Lazy-load QuizPlayer to reduce initial bundle size by ~200-300KB
 * QuizPlayer includes framer-motion (~50KB), canvas-confetti, and other heavy dependencies
 */

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { QuizLoadingSkeleton } from './QuizLoadingSkeleton';
import { QuizQuestion, QuizRound } from './play/types';

// OPTIMIZATION: Lazy-load QuizPlayer - only loads when quiz page is accessed
// This reduces initial bundle size significantly since QuizPlayer is ~1500+ lines
// and includes framer-motion, canvas-confetti, and other heavy dependencies
const QuizPlayer = dynamic(() => import('./QuizPlayer').then(mod => ({ default: mod.QuizPlayer })), {
	ssr: false,
	loading: () => <QuizLoadingSkeleton />,
});

interface QuizPlayerProps {
	quizTitle: string;
	quizColor: string;
	quizSlug: string;
	questions: QuizQuestion[];
	rounds: QuizRound[];
	weekISO?: string;
	isNewest?: boolean;
	isDemo?: boolean;
	maxQuestions?: number;
	onDemoComplete?: (score: number, totalQuestions: number) => void;
	isCustom?: boolean;
	customQuizId?: string;
}

export function QuizPlayerWrapper(props: QuizPlayerProps) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Show loading skeleton during SSR and initial hydration
	if (!isMounted) {
		return <QuizLoadingSkeleton />;
	}

	// Lazy-load QuizPlayer after client-side hydration
	return (
		<Suspense fallback={<QuizLoadingSkeleton />}>
			<QuizPlayer {...props} />
		</Suspense>
	);
}

