'use server'

/**
 * OPTIMIZATION: Server Action for loading more custom quizzes
 * Reduces round-trips by using server actions instead of API routes
 * Smaller payload and faster than fetch() calls
 */

import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import type { CustomQuiz } from './custom-quizzes-server'

/**
 * Server Action: Load more custom quizzes with pagination
 * OPTIMIZATION: Uses server action instead of API route - faster, smaller payload
 */
export async function loadMoreCustomQuizzes(offset: number, limit: number = 12) {
	try {
		const user = await getCurrentUser()

		if (!user) {
			return { quizzes: [], hasMore: false }
		}

		// Check premium status
		const isPremium = user.tier === 'premium' ||
			user.subscriptionStatus === 'ACTIVE' ||
			user.subscriptionStatus === 'TRIALING' ||
			(user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())

		if (!isPremium) {
			return { quizzes: [], hasMore: false }
		}

		// OPTIMIZATION: Fetch owned quizzes count and data in parallel
		const [ownedQuizzes, ownedCount] = await Promise.all([
			prisma.quiz.findMany({
				where: {
					quizType: 'CUSTOM',
					createdByUserId: user.id,
				},
				select: {
					id: true,
					slug: true,
					title: true,
					blurb: true,
					colorHex: true,
					status: true,
					createdAt: true,
					updatedAt: true,
					_count: {
						select: {
							shares: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
				take: limit,
				skip: offset,
			}),
			prisma.quiz.count({
				where: {
					quizType: 'CUSTOM',
					createdByUserId: user.id,
				},
			}),
		])

		// Transform owned quizzes
		const transformedOwned: CustomQuiz[] = ownedQuizzes.map(quiz => ({
			id: quiz.id,
			slug: quiz.slug || '',
			title: quiz.title,
			blurb: quiz.blurb || undefined,
			colorHex: quiz.colorHex || undefined,
			status: quiz.status,
			createdAt: quiz.createdAt.toISOString(),
			updatedAt: quiz.updatedAt.toISOString(),
			shareCount: quiz._count?.shares || 0,
			isShared: false,
		}))

		const hasMore = offset + limit < ownedCount

		return {
			quizzes: transformedOwned,
			hasMore,
		}
	} catch (error) {
		console.error('Error loading more custom quizzes:', error)
		return { quizzes: [], hasMore: false }
	}
}







