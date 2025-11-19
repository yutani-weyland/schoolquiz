/**
 * Quiz Service - Data access layer for quiz data
 * 
 * This service abstracts data fetching, allowing easy switch from mock to database.
 * Currently uses mock data, but can be updated to fetch from API/database.
 */

import { QuizQuestion, QuizRound } from '@/components/quiz/play/types';
import { getMockQuizData, hasMockQuizData } from '@/lib/mock/quiz-fixtures';

export interface QuizData {
	questions: QuizQuestion[];
	rounds: QuizRound[];
}

export class QuizService {
	private static cache: Map<string, { data: QuizData; timestamp: number }> = new Map();
	private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

	/**
	 * Get quiz data by slug
	 * Uses cache if available, otherwise fetches from source
	 */
	static async getQuizBySlug(slug: string): Promise<QuizData> {
		// Check cache first
		const cached = this.cache.get(slug);
		if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
			return cached.data;
		}

		// Try to fetch from API first (when DB is available)
		// Skip API call for now and use mock data directly to avoid hanging
		// TODO: Re-enable API call when database is ready
		// try {
		// 	const response = await fetch(`/api/quizzes/${slug}/data`);
		// 	if (response.ok) {
		// 		const data = await response.json();
		// 		this.cache.set(slug, { data, timestamp: Date.now() });
		// 		return data;
		// 	}
		// } catch (error) {
		// 	console.warn(`Failed to fetch quiz ${slug} from API, falling back to mock data:`, error);
		// }

		// Fallback to mock data (development/testing)
		if (hasMockQuizData(slug)) {
			const mockData = getMockQuizData(slug);
			if (mockData) {
				this.cache.set(slug, { data: mockData, timestamp: Date.now() });
				return mockData;
			}
		}

		throw new Error(`Quiz not found: ${slug}`);
	}

	/**
	 * Clear cache for a specific quiz or all quizzes
	 */
	static clearCache(slug?: string): void {
		if (slug) {
			this.cache.delete(slug);
		} else {
			this.cache.clear();
		}
	}

	/**
	 * Prefetch quiz data (useful for prefetching next quiz)
	 */
	static async prefetchQuiz(slug: string): Promise<void> {
		try {
			await this.getQuizBySlug(slug);
		} catch (error) {
			// Silently fail prefetch
			console.warn(`Failed to prefetch quiz ${slug}:`, error);
		}
	}
}

