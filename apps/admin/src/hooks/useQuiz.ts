/**
 * useQuiz hook - React hook for fetching quiz data
 * 
 * Provides loading, error, and data states for quiz fetching.
 * Handles caching and error recovery automatically.
 */

import React from 'react';
import { useApiQuery } from './useApiQuery';
import type { QuizData } from '@/services/quizService';

export interface UseQuizResult {
	data: QuizData | null;
	loading: boolean;
	error: Error | null;
	refetch: () => Promise<void>;
	clearError: () => void;
}

/**
 * Hook to fetch quiz data by slug
 * Uses standardized useApiQuery for consistent behavior
 * 
 * @param slug - Quiz slug identifier
 * @param options - Optional configuration
 * @returns Quiz data, loading state, error, and refetch function
 */
export function useQuiz(
	slug: string | null | undefined,
	options?: { enabled?: boolean }
): UseQuizResult {
	// Memoize fetchFn to avoid recreating on every render
	const fetchFn = React.useCallback(async () => {
		if (!slug) {
			throw new Error('Quiz slug is required');
		}

		const response = await fetch(`/api/quizzes/${slug}/data`);

		if (!response.ok) {
			if (response.status === 404) {
				throw new Error(`Quiz not found: ${slug}`);
			}
			if (response.status === 401) {
				throw new Error('Unauthorized: Please sign in to view this quiz');
			}
			if (response.status === 403) {
				throw new Error('Forbidden: You do not have permission to view this quiz');
			}
			throw new Error('Failed to fetch quiz data');
		}

		return response.json();
	}, [slug]);

	const enabled = React.useMemo(
		() => slug !== null && slug !== undefined && (options?.enabled !== false),
		[slug, options?.enabled]
	);

	const result = useApiQuery<QuizData | null>({
		fetchFn,
		enabled,
		cacheKey: slug ? `quiz-${slug}` : undefined,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: {
			count: 2,
			delay: 1000,
		},
	});

	return {
		data: result.data,
		loading: result.loading,
		error: result.error,
		refetch: result.refetch,
		clearError: result.clearError,
	};
}

