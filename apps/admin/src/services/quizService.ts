/**
 * Quiz Service - Data access layer for quiz data
 * 
 * This service abstracts data fetching, allowing easy switch from mock to database.
 * Supports both database queries and mock data fallback.
 */

import { QuizQuestion, QuizRound } from '@/components/quiz/play/types';
import { getMockQuizData, hasMockQuizData } from '@/lib/mock/quiz-fixtures';
import { transformQuizToPlayFormat, QuizWithRelations } from '@/lib/transformers/quizTransformers';

export interface QuizData {
	questions: QuizQuestion[];
	rounds: QuizRound[];
}

/**
 * Check if database is available and should be used
 */
function shouldUseDatabase(): boolean {
	// If USE_MOCK_DATA is explicitly set to 'true', skip database
	if (process.env.USE_MOCK_DATA === 'true') {
		return false;
	}
	
	// Check if DATABASE_URL is set
	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl || dbUrl.trim() === '') {
		return false;
	}
	
	return true;
}

/**
 * Get Prisma client (lazy import to avoid errors if DATABASE_URL not set)
 */
async function getPrismaClient() {
	if (!shouldUseDatabase()) {
		return null;
	}
	
	try {
		// Dynamic import to avoid loading Prisma if not needed
		const { prisma } = await import('@schoolquiz/db');
		return prisma;
	} catch (error) {
		console.warn('[QuizService] Failed to import Prisma client, falling back to mock data:', error);
		return null;
	}
}

export class QuizService {
	private static cache: Map<string, { data: QuizData; timestamp: number }> = new Map();
	private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

	/**
	 * Get quiz data by slug
	 * Tries database first, falls back to mock data if unavailable
	 */
	static async getQuizBySlug(slug: string): Promise<QuizData> {
		// Check cache first
		const cached = this.cache.get(slug);
		if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
			return cached.data;
		}

		// Try database first (if available)
		if (shouldUseDatabase()) {
			try {
				const prisma = await getPrismaClient();
				if (prisma) {
					const quiz = await prisma.quiz.findUnique({
						where: { slug },
						include: {
							rounds: {
								include: {
									category: true,
									questions: {
										include: {
											question: true,
										},
										orderBy: {
											order: 'asc',
										},
									},
								},
								orderBy: {
									index: 'asc',
								},
							},
						},
					}) as QuizWithRelations | null;

					if (quiz) {
						const transformed = transformQuizToPlayFormat(quiz as QuizWithRelations);
						this.cache.set(slug, { data: transformed, timestamp: Date.now() });
						return transformed;
					}
				}
			} catch (error) {
				// Log error but continue to fallback
				console.warn(`[QuizService] Failed to fetch quiz ${slug} from database, falling back to mock data:`, error);
			}
		}

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

