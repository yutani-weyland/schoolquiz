/**
 * OPTIMIZATION: Version 2 of custom quizzes server functions
 * Uses summary queries for dramatically improved performance
 * Supports tab-based filtering (All/Mine/Shared/Groups/Organisation)
 */

import { getCurrentUser } from '@/lib/auth'
import { unstable_cache } from 'next/cache'
import { 
	getCustomQuizSummariesForUser, 
	type TabType,
	type CustomQuizSummary 
} from './custom-quizzes-summary-server'
import type { UsageData } from './custom-quizzes-server'

export interface CustomQuizV2 {
	id: string
	slug: string
	title: string
	blurb?: string
	colorHex?: string
	status: string
	createdAt: string
	updatedAt: string
	roundCount: number
	questionCount: number
	isOrgWide: boolean
	isTemplate: boolean
	shareCount: number
	hasUserShares: boolean
	hasGroupShares: boolean
	isShared?: boolean
	sharedBy?: {
		id: string
		name?: string
		email: string
	}
}

export interface CustomQuizzesPageDataV2 {
	quizzes: CustomQuizV2[]
	quizzesTotal: number
	quizzesHasMore: boolean
	usage: UsageData | null
	isPremium: boolean
}

/**
 * OPTIMIZATION: Transform summary to CustomQuizV2 format
 */
function transformSummaryToQuiz(summary: CustomQuizSummary, userId: string): CustomQuizV2 {
	return {
		id: summary.id,
		slug: summary.slug,
		title: summary.title,
		blurb: summary.blurb,
		colorHex: summary.colorHex,
		status: summary.status,
		createdAt: summary.createdAt.toISOString(),
		updatedAt: summary.updatedAt.toISOString(),
		roundCount: summary.roundCount,
		questionCount: summary.questionCount,
		isOrgWide: summary.isOrgWide,
		isTemplate: summary.isTemplate,
		shareCount: summary.shareCount,
		hasUserShares: summary.hasUserShares,
		hasGroupShares: summary.hasGroupShares,
		isShared: summary.createdByUserId !== userId,
		sharedBy: summary.sharedBy,
	}
}

/**
 * OPTIMIZATION: Fetch custom quizzes using summary queries
 * Supports tab-based filtering and search
 */
export async function getCustomQuizzesPageDataV2(
	tab: TabType = 'all',
	options: {
		limit?: number
		offset?: number
		searchQuery?: string
	} = {}
): Promise<CustomQuizzesPageDataV2> {
	const user = await getCurrentUser()

	if (!user) {
		return {
			quizzes: [],
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
			quizzes: [],
			quizzesTotal: 0,
			quizzesHasMore: false,
			usage: null,
			isPremium: false,
		}
	}

	const { limit = 20, offset = 0, searchQuery } = options

	// OPTIMIZATION: Cache summary queries separately per tab
	const cacheKey = `custom-quizzes-summary-${user.id}-${tab}-${limit}-${offset}-${searchQuery || ''}`
	const getCachedSummaries = unstable_cache(
		async () => getCustomQuizSummariesForUser(user.id, tab, { limit, offset, searchQuery }),
		[cacheKey],
		{
			revalidate: 30, // 30 seconds - quizzes change frequently
			tags: [`custom-quizzes-${user.id}`, `custom-quizzes-tab-${tab}`],
		}
	)

	// OPTIMIZATION: Single query - no usage data needed (removed widget)
	const summariesData = await getCachedSummaries()

	const quizzes = summariesData.summaries.map(s => transformSummaryToQuiz(s, user.id))

	return {
		quizzes,
		quizzesTotal: summariesData.total,
		quizzesHasMore: summariesData.hasMore,
		usage: null, // Not needed anymore
		isPremium: true,
	}
}

