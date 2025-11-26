import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { unstable_cache } from 'next/cache'

export interface CustomQuiz {
	id: string
	slug: string
	title: string
	blurb?: string
	colorHex?: string
	status: string
	createdAt: string
	updatedAt: string
	// OPTIMIZATION: Added metadata fields (from summary queries)
	roundCount?: number
	questionCount?: number
	isOrgWide?: boolean
	isTemplate?: boolean
	// Share indicators
	shareCount?: number
	hasUserShares?: boolean
	hasGroupShares?: boolean
	isShared?: boolean
	sharedBy?: {
		id: string
		name?: string
		email: string
	}
}

export interface UsageData {
	currentMonth: {
		quizzesCreated: number
		quizzesShared: number
		quizzesCreatedLimit: number
		quizzesSharedLimit: number
	}
	storage: {
		totalQuizzes: number
		maxQuizzes: number
	}
	canCreate: boolean
	canShare: boolean
}

export interface CustomQuizzesPageData {
	ownedQuizzes: CustomQuiz[] // Paginated owned quizzes
	sharedQuizzes: CustomQuiz[] // All shared quizzes (no pagination needed)
	quizzesTotal: number // Total count for pagination
	quizzesHasMore: boolean // Whether there are more owned quizzes to load
	usage: UsageData | null
	isPremium: boolean
}

/**
 * OPTIMIZATION: Fetch usage data server-side with parallel queries
 */
export async function fetchUsageData(userId: string): Promise<UsageData | null> {
	try {
		const now = new Date()
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

		// OPTIMIZATION: Execute all count queries in parallel
		const [quizzesCreatedThisMonth, quizzesSharedThisMonth, totalQuizzes] = await Promise.all([
			prisma.quiz.count({
				where: {
					quizType: 'CUSTOM',
					createdByUserId: userId,
					createdAt: {
						gte: startOfMonth,
					},
				},
			}),
			prisma.customQuizShare.count({
				where: {
					quiz: {
						createdByUserId: userId,
					},
					createdAt: {
						gte: startOfMonth,
					},
				},
			}),
			prisma.quiz.count({
				where: {
					quizType: 'CUSTOM',
					createdByUserId: userId,
				},
			}),
		])

		// Premium limits (matching API limits)
		const quizzesCreatedLimit = 10
		const quizzesSharedLimit = 20
		const maxQuizzes = 50

		return {
			currentMonth: {
				quizzesCreated: quizzesCreatedThisMonth,
				quizzesShared: quizzesSharedThisMonth,
				quizzesCreatedLimit,
				quizzesSharedLimit,
			},
			storage: {
				totalQuizzes,
				maxQuizzes,
			},
			canCreate: totalQuizzes < maxQuizzes && quizzesCreatedThisMonth < quizzesCreatedLimit,
			canShare: quizzesSharedThisMonth < quizzesSharedLimit,
		}
	} catch (error) {
		console.error('[Custom Quizzes Server] Error fetching usage:', error)
		return null
	}
}

/**
 * OPTIMIZATION: Fetch custom quizzes server-side with caching
 * Only fetches metadata needed for list view (no rounds/questions)
 * Returns quizzes, total count, and whether there are more to load
 */
async function fetchCustomQuizzes(
	userId: string, 
	limit: number = 12, 
	offset: number = 0
): Promise<{ ownedQuizzes: CustomQuiz[]; sharedQuizzes: CustomQuiz[]; total: number; hasMore: boolean }> {
	try {
		// OPTIMIZATION: Fetch owned quizzes count and data in parallel
		const [ownedQuizzes, ownedCount] = await Promise.all([
			prisma.quiz.findMany({
				where: {
					quizType: 'CUSTOM',
					createdByUserId: userId,
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
					createdByUserId: userId,
				},
			}),
		])

		// OPTIMIZATION: Fetch shared quizzes (always include all shared, no pagination)
		// Shared quizzes are typically few, so pagination not needed
		const shares = await prisma.customQuizShare.findMany({
			where: {
				userId: userId,
			},
			select: {
				quiz: {
					select: {
						id: true,
						slug: true,
						title: true,
						blurb: true,
						colorHex: true,
						status: true,
						createdAt: true,
						updatedAt: true,
						user: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
				},
			},
		})

		// Transform owned quizzes
		const transformedOwned = ownedQuizzes.map(quiz => ({
			id: quiz.id,
			slug: quiz.slug,
			title: quiz.title,
			blurb: quiz.blurb || undefined,
			colorHex: quiz.colorHex || undefined,
			status: quiz.status,
			createdAt: quiz.createdAt.toISOString(),
			updatedAt: quiz.updatedAt.toISOString(),
			shareCount: quiz._count?.shares || 0,
			isShared: false,
		}))

		// Transform shared quizzes
		const transformedShared = shares.map(share => ({
			id: share.quiz.id,
			slug: share.quiz.slug,
			title: share.quiz.title,
			blurb: share.quiz.blurb || undefined,
			colorHex: share.quiz.colorHex || undefined,
			status: share.quiz.status,
			createdAt: share.quiz.createdAt.toISOString(),
			updatedAt: share.quiz.updatedAt.toISOString(),
			isShared: true,
			sharedBy: share.quiz.user ? {
				id: share.quiz.user.id,
				name: share.quiz.user.name || undefined,
				email: share.quiz.user.email || '',
			} : undefined,
		}))

		// OPTIMIZATION: Return owned and shared separately for better pagination control
		const total = ownedCount + shares.length
		const hasMore = offset + limit < ownedCount

		return { 
			ownedQuizzes: transformedOwned, 
			sharedQuizzes: transformedShared as CustomQuiz[],
			total, 
			hasMore 
		}
	} catch (error) {
		console.error('[Custom Quizzes Server] Error fetching quizzes:', error)
		// If schema not migrated yet, return empty result
		if (error instanceof Error && (
			error.message?.includes('does not exist') || 
			error.message?.includes('column') ||
			(error as any).code === 'P2022'
		)) {
			return { ownedQuizzes: [], sharedQuizzes: [], total: 0, hasMore: false }
		}
		throw error
	}
}

/**
 * OPTIMIZATION: Main function to fetch all data needed for the Custom Quizzes page
 * Adds caching and pagination support
 */
export async function getCustomQuizzesPageData(limit?: number, offset: number = 0): Promise<CustomQuizzesPageData> {
	const user = await getCurrentUser()

	if (!user) {
		return {
			ownedQuizzes: [],
			sharedQuizzes: [],
			quizzesTotal: 0,
			quizzesHasMore: false,
			usage: null,
			isPremium: false,
		}
	}

	// Check premium status
	const isPremium = user.tier === 'premium' || 
		user.subscriptionStatus === 'ACTIVE' ||
		user.subscriptionStatus === 'TRIALING' ||
		(user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())

	if (!isPremium) {
		return {
			ownedQuizzes: [],
			sharedQuizzes: [],
			quizzesTotal: 0,
			quizzesHasMore: false,
			usage: null,
			isPremium: false,
		}
	}

	// OPTIMIZATION: Cache quizzes and usage data separately
	// Quizzes cache for 30 seconds (frequently updated)
	// Usage cache for 60 seconds (less frequently updated)
	const initialLimit = limit || 12
	const getCachedQuizzes = unstable_cache(
		async () => fetchCustomQuizzes(user.id, initialLimit, offset),
		[`custom-quizzes-${user.id}-${initialLimit}-${offset}`],
		{
			revalidate: 30,
			tags: [`custom-quizzes-${user.id}`],
		}
	)

	const getCachedUsage = unstable_cache(
		async () => fetchUsageData(user.id),
		[`custom-quizzes-usage-${user.id}`],
		{
			revalidate: 60,
			tags: [`custom-quizzes-usage-${user.id}`],
		}
	)

	// OPTIMIZATION: Fetch quizzes and usage in parallel (already parallelized)
	const [quizzesData, usage] = await Promise.all([
		getCachedQuizzes(),
		getCachedUsage(),
	])

	return {
		ownedQuizzes: quizzesData.ownedQuizzes,
		sharedQuizzes: quizzesData.sharedQuizzes,
		quizzesTotal: quizzesData.total,
		quizzesHasMore: quizzesData.hasMore,
		usage,
		isPremium: true,
	}
}

