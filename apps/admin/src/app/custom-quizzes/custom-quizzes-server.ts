import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'

export interface CustomQuiz {
	id: string
	slug: string
	title: string
	blurb?: string
	colorHex?: string
	status: string
	createdAt: string
	updatedAt: string
	shareCount?: number
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
	quizzes: CustomQuiz[]
	usage: UsageData | null
	isPremium: boolean
}

/**
 * Fetch usage data server-side
 */
async function fetchUsageData(userId: string): Promise<UsageData | null> {
	try {
		const now = new Date()
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

		// Count quizzes created this month
		const quizzesCreatedThisMonth = await prisma.quiz.count({
			where: {
				quizType: 'CUSTOM',
				createdByUserId: userId,
				createdAt: {
					gte: startOfMonth,
				},
			},
		})

		// Count quizzes shared this month
		const quizzesSharedThisMonth = await prisma.customQuizShare.count({
			where: {
				quiz: {
					createdByUserId: userId,
				},
				createdAt: {
					gte: startOfMonth,
				},
			},
		})

		// Count total quizzes
		const totalQuizzes = await prisma.quiz.count({
			where: {
				quizType: 'CUSTOM',
				createdByUserId: userId,
			},
		})

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
 * Fetch custom quizzes server-side
 */
async function fetchCustomQuizzes(userId: string): Promise<CustomQuiz[]> {
	try {
		// Get quizzes created by user
		const ownedQuizzes = await prisma.quiz.findMany({
			where: {
				quizType: 'CUSTOM',
				createdByUserId: userId,
			},
			include: {
				_count: {
					select: {
						shares: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		})

		// Get quizzes shared with user
		const shares = await prisma.customQuizShare.findMany({
			where: {
				userId: userId,
			},
			include: {
				quiz: {
					include: {
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

		return [...transformedOwned, ...transformedShared] as CustomQuiz[]
	} catch (error) {
		console.error('[Custom Quizzes Server] Error fetching quizzes:', error)
		// If schema not migrated yet, return empty array
		if (error instanceof Error && (
			error.message?.includes('does not exist') || 
			error.message?.includes('column') ||
			(error as any).code === 'P2022'
		)) {
			return []
		}
		throw error
	}
}

/**
 * Main function to fetch all data needed for the Custom Quizzes page
 */
export async function getCustomQuizzesPageData(): Promise<CustomQuizzesPageData> {
	const user = await getCurrentUser()

	if (!user) {
		return {
			quizzes: [],
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
			quizzes: [],
			usage: null,
			isPremium: false,
		}
	}

	// Fetch quizzes and usage in parallel
	const [quizzes, usage] = await Promise.all([
		fetchCustomQuizzes(user.id),
		fetchUsageData(user.id),
	])

	return {
		quizzes,
		usage,
		isPremium: true,
	}
}

