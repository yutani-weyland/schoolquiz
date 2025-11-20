'use client';

/**
 * Client-only wrapper for QuizPlayer to prevent hydration mismatches
 * QuizPlayer uses Math.random() and other dynamic values that differ between server and client
 */

import { useEffect, useState } from 'react';
import { QuizPlayer } from './QuizPlayer';
import { QuizLoadingSkeleton } from './QuizLoadingSkeleton';
import { QuizQuestion, QuizRound } from './play/types';

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

	// Only render QuizPlayer after client-side hydration
	return <QuizPlayer {...props} />;
}

