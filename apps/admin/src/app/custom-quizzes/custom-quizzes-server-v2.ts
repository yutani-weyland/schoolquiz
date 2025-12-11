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

// Extended type to handle cache serialization (dates become strings)
type CustomQuizSummaryWithSerializedDates = Omit<CustomQuizSummary, 'createdAt' | 'updatedAt'> & {
	createdAt: Date | string
	updatedAt: Date | string
}

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
	creator?: {
		id: string
		name?: string
		email: string
	}
	isCreatorInSameOrg?: boolean
	playCount?: number
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
 * Helper: Safely convert date to ISO string
 * Handles Date objects, strings, numbers (timestamps), and other formats after cache serialization
 */
function toISOString(date: Date | string | number | null | undefined | any): string {
	// Handle null/undefined
	if (date == null) {
		return new Date().toISOString() // Fallback to now if missing
	}
	
	// If it's a Date object, use toISOString directly
	if (date instanceof Date) {
		// Check if it's a valid date
		if (isNaN(date.getTime())) {
			return new Date().toISOString() // Invalid date, fallback
		}
		return date.toISOString()
	}
	
	// If it's a number (timestamp), convert to Date
	if (typeof date === 'number') {
		const d = new Date(date)
		if (!isNaN(d.getTime())) {
			return d.toISOString()
		}
		return new Date().toISOString() // Invalid timestamp, fallback
	}
	
	// If it's a string, try to parse it
	if (typeof date === 'string') {
		// Check if it's already an ISO string
		if (date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
			return date // Already ISO format
		}
		// Try to parse and convert
		const parsed = new Date(date)
		if (!isNaN(parsed.getTime())) {
			return parsed.toISOString()
		}
		// Can't parse, return as-is (might be invalid but at least won't crash)
		return date
	}
	
	// Last resort: try to convert to Date
	try {
		const d = new Date(date)
		if (!isNaN(d.getTime())) {
			return d.toISOString()
		}
	} catch {
		// Ignore errors
	}
	
	// Ultimate fallback: return current date
	return new Date().toISOString()
}

/**
 * OPTIMIZATION: Transform summary to CustomQuizV2 format
 */
function transformSummaryToQuiz(summary: CustomQuizSummaryWithSerializedDates, userId: string): CustomQuizV2 {
	// Handle createdAt/updatedAt - may be Date object or string (after cache serialization)
	const createdAt = toISOString(summary.createdAt)
	const updatedAt = toISOString(summary.updatedAt)

	return {
		id: summary.id,
		slug: summary.slug,
		title: summary.title,
		blurb: summary.blurb,
		colorHex: summary.colorHex,
		status: summary.status,
		createdAt,
		updatedAt,
		roundCount: summary.roundCount,
		questionCount: summary.questionCount,
		isOrgWide: summary.isOrgWide,
		isTemplate: summary.isTemplate,
		shareCount: summary.shareCount,
		hasUserShares: summary.hasUserShares,
		hasGroupShares: summary.hasGroupShares,
		isShared: summary.createdByUserId !== userId,
		creator: summary.creator,
		isCreatorInSameOrg: summary.isCreatorInSameOrg,
		playCount: summary.playCount,
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

	const quizzes = summariesData.summaries.map(s => {
		try {
			return transformSummaryToQuiz(s, user.id)
		} catch (error) {
			console.error('[Custom Quizzes V2] Error transforming quiz summary:', error)
			console.error('[Custom Quizzes V2] Summary data:', {
				id: s.id,
				createdAt: s.createdAt,
				createdAtType: typeof s.createdAt,
				createdAtIsDate: s.createdAt instanceof Date,
				updatedAt: s.updatedAt,
				updatedAtType: typeof s.updatedAt,
				updatedAtIsDate: s.updatedAt instanceof Date,
			})
			// Return a fallback quiz object to prevent complete failure
			return {
				id: s.id,
				slug: s.slug || '',
				title: s.title || 'Untitled Quiz',
				blurb: s.blurb,
				colorHex: s.colorHex,
				status: s.status || 'draft',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				roundCount: s.roundCount || 0,
				questionCount: s.questionCount || 0,
				isOrgWide: s.isOrgWide || false,
				isTemplate: s.isTemplate || false,
				shareCount: s.shareCount || 0,
				hasUserShares: s.hasUserShares || false,
				hasGroupShares: s.hasGroupShares || false,
				isShared: s.createdByUserId !== user.id,
				sharedBy: s.sharedBy,
			}
		}
	})

	return {
		quizzes,
		quizzesTotal: summariesData.total,
		quizzesHasMore: summariesData.hasMore,
		usage: null, // Not needed anymore
		isPremium: true,
	}
}

