/**
 * useQuiz hook - React hook for fetching quiz data
 * 
 * Provides loading, error, and data states for quiz fetching.
 * Handles caching and error recovery automatically.
 */

import { useApiQuery } from './useApiQuery';
import { QuizData, QuizService } from '@/services/quizService';

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
	const result = useApiQuery<QuizData | null>({
		fetchFn: async () => {
			if (!slug) {
				throw new Error('Quiz slug is required');
			}
			const quizData = await QuizService.getQuizBySlug(slug);
			if (!quizData) {
				throw new Error(`Quiz not found: ${slug}`);
			}
			return quizData;
		},
		enabled: slug !== null && slug !== undefined && (options?.enabled !== false),
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

