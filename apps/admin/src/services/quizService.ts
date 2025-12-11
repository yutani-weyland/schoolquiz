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
	 * 
	 * @param slug - The quiz slug
	 * @param user - Optional user object to check permissions (required for drafts)
	 */
	static async getQuizBySlug(slug: string, user?: { id: string; platformRole?: string | null } | null): Promise<QuizData> {
		// Check cache first
		const cached = this.cache.get(slug);
		if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
			// TODO: Add permission check for cached data too?
			// For now, we assume if it's in cache it might be public, but this is risky.
			// Ideally we should cache the "public" version separately or re-check permissions.
			// To be safe, let's skip cache if we need to check permissions for now.
			// return cached.data;
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
						// SECURITY CHECK: Access Control
						const isPublished = quiz.status === 'published';

						if (!isPublished) {
							// If not published, user MUST be authenticated
							if (!user) {
								throw new Error('Unauthorized: Quiz is not published');
							}

							// User must be the creator OR an admin
							const isCreator = quiz.createdByUserId === user.id || quiz.createdBy === user.id; // Check both new and legacy fields
							const isAdmin = user.platformRole === 'PlatformAdmin' || user.platformRole === 'OrgAdmin';

							if (!isCreator && !isAdmin) {
								throw new Error('Forbidden: You do not have permission to view this draft quiz');
							}
						}

						const transformed = transformQuizToPlayFormat(quiz as QuizWithRelations);

						// Only cache if public
						if (isPublished) {
							this.cache.set(slug, { data: transformed, timestamp: Date.now() });
						}

						return transformed;
					}
				}
			} catch (error) {
				// Log error but continue to fallback
				console.warn(`[QuizService] Failed to fetch quiz ${slug} from database, falling back to mock data:`, error);
				// If it was an auth error, re-throw it
				if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
					throw error;
				}
			}
		}

		// Fallback to mock data (development/testing)
		if (hasMockQuizData(slug)) {
			const mockData = getMockQuizData(slug);
			if (mockData) {
				// Mock data is always considered "public" for dev purposes, 
				// but in a real scenario we might want to restrict this too.
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

