/**
 * useQuiz hook - React hook for fetching quiz data
 * 
 * Provides loading, error, and data states for quiz fetching.
 * Handles caching and error recovery automatically.
 */

import { useState, useEffect, useCallback } from 'react';
import { QuizData, QuizService } from '@/services/quizService';

export interface UseQuizResult {
	data: QuizData | null;
	loading: boolean;
	error: Error | null;
	refetch: () => Promise<void>;
}

/**
 * Hook to fetch quiz data by slug
 * 
 * @param slug - Quiz slug identifier
 * @param options - Optional configuration
 * @returns Quiz data, loading state, error, and refetch function
 */
export function useQuiz(
	slug: string | null | undefined,
	options?: { enabled?: boolean }
): UseQuizResult {
	const [data, setData] = useState<QuizData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const fetchQuiz = useCallback(async () => {
		if (!slug || options?.enabled === false) {
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const quizData = await QuizService.getQuizBySlug(slug);
			setData(quizData);
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Failed to fetch quiz');
			setError(error);
			setData(null);
		} finally {
			setLoading(false);
		}
	}, [slug, options?.enabled]);

	useEffect(() => {
		fetchQuiz();
	}, [fetchQuiz]);

	const refetch = useCallback(async () => {
		if (slug) {
			QuizService.clearCache(slug);
		}
		await fetchQuiz();
	}, [slug, fetchQuiz]);

	return { data, loading, error, refetch };
}

