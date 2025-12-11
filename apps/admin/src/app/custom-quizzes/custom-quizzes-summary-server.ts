/**
 * OPTIMIZATION: Summary Query System for Custom Quizzes
 * 
 * These queries return ONLY the fields needed for list views - no nested relations.
 * This dramatically reduces payload size and improves performance.
 * 
 * Summary queries use `select` instead of `include` to avoid over-fetching.
 */

import { prisma } from '@schoolquiz/db'
import type { CustomQuiz } from './custom-quizzes-server'

export type TabType = 'all' | 'shared' | 'recent' | 'drafts'

export interface CustomQuizSummary {
	id: string
	slug: string
	title: string
	blurb?: string
	colorHex?: string
	status: string
	createdAt: Date
	updatedAt: Date
	roundCount: number
	questionCount: number
	isOrgWide: boolean
	isTemplate: boolean
	// Share indicators (aggregates, not full relations)
	shareCount: number // Total shares
	hasUserShares: boolean // Shared with individual users
	hasGroupShares: boolean // Shared with groups
	// Owner info
	createdByUserId: string | null
	creator?: {
		id: string
		name?: string
		email: string
	}
	// Organisation info
	isCreatorInSameOrg?: boolean
	// Play count
	playCount?: number
	// For shared quizzes
	isShared?: boolean
	sharedBy?: {
		id: string
		name?: string
		email: string
	}
}

/**
 * OPTIMIZATION: Get user's organisation ID and group IDs
 * Used for building tab queries
 */
async function getUserOrganisationContext(userId: string): Promise<{
	organisationId: string | null
	groupIds: string[]
}> {
	try {
		// Get user's organisation membership
		const orgMember = await prisma.organisationMember.findFirst({
			where: {
				userId,
				status: 'ACTIVE',
			},
			select: {
				organisationId: true,
				groupMembers: {
					where: {
						group: {
							deletedAt: null,
						},
					},
					select: {
						group: {
							select: {
								id: true,
							},
						},
					},
				},
			},
		})

		const groupIds = orgMember?.groupMembers.map(gm => gm.group.id) || []

		return {
			organisationId: orgMember?.organisationId || null,
			groupIds,
		}
	} catch (error) {
		console.error('[Custom Quizzes Summary] Error fetching user org context:', error)
		return {
			organisationId: null,
			groupIds: [],
		}
	}
}

/**
 * OPTIMIZATION: Build WHERE clause for tab-based filtering
 * Each tab has a specific query pattern optimized for that use case
 */
async function buildTabQuery(
	userId: string,
	tab: TabType,
	searchQuery?: string
): Promise<any> {
	const orgContext = await getUserOrganisationContext(userId)

	const baseWhere: any = {
		quizType: 'CUSTOM',
		status: { not: 'archived' }, // Exclude archived by default
	}

	// Add search filter if provided
	if (searchQuery && searchQuery.trim().length > 0) {
		baseWhere.OR = [
			{ title: { contains: searchQuery, mode: 'insensitive' } },
			{ blurb: { contains: searchQuery, mode: 'insensitive' } },
		]
	}

	switch (tab) {
		case 'shared':
			// Quizzes shared with the user (not owned by them)
			return {
				...baseWhere,
				shares: {
					some: {
						userId: userId, // Legacy - only use this until migration
					},
				},
				createdByUserId: { not: userId }, // Exclude quizzes owned by user
			}

		case 'recent':
			// Recently updated quizzes (owned or shared)
			const recentConditions: any[] = [
				{ createdByUserId: userId }, // Owned
				{
					shares: {
						some: {
							userId: userId, // Shared with user
						},
					},
				},
			]
			return {
				...baseWhere,
				OR: recentConditions,
			}

		case 'drafts':
			// Draft quizzes owned by user
			return {
				...baseWhere,
				createdByUserId: userId,
				status: 'draft',
			}

		case 'all':
		default:
			// Union of: owned + shared
			const conditions: any[] = [
				{ createdByUserId: userId }, // Owned
			]

			// Shared with user (legacy - only userId until migration)
			conditions.push({
				shares: {
					some: {
						userId: userId, // Legacy - only use this until migration
					},
				},
			})

			return {
				...baseWhere,
				OR: conditions,
			}
	}
}

/**
 * OPTIMIZATION: Get custom quiz summaries for a user
 * Returns ONLY fields needed for list view - no nested relations
 * 
 * This is the core summary query that replaces full quiz fetches
 */
export async function getCustomQuizSummariesForUser(
	userId: string,
	tab: TabType = 'all',
	options: {
		limit?: number
		offset?: number
		searchQuery?: string
	} = {}
): Promise<{
	summaries: CustomQuizSummary[]
	total: number
	hasMore: boolean
}> {
	const { limit = 20, offset = 0, searchQuery } = options

	try {
		const where = await buildTabQuery(userId, tab, searchQuery)
		
		// Get user's organisation ID for checking if creator is in same org
		const userOrgContext = await getUserOrganisationContext(userId)
		const userOrgId = userOrgContext.organisationId

		// OPTIMIZATION: Fetch count and data in parallel
		// Note: If migration hasn't been run, roundCount/questionCount/isOrgWide/isTemplate may not exist
		// We'll handle this gracefully by selecting only fields that exist
		const [quizzes, total] = await Promise.all([
			prisma.quiz.findMany({
				where,
				select: {
					id: true,
					slug: true,
					title: true,
					blurb: true,
					colorHex: true,
					status: true,
					createdAt: true,
					updatedAt: true,
					createdByUserId: true,
					// Fetch creator info
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					// OPTIMIZATION: Pure aggregates - computed in DB, zero relation fetching
					_count: {
						select: {
							shares: true,        // Total share count
							rounds: true,        // Round count (computed in DB)
							customQuestions: true, // Question count (computed in DB)
						},
					},
					// Minimal share metadata for indicators (only first share for "shared by")
					// OPTIMIZATION: Fetch first share, filter null userIds in transformation
					shares: {
						select: {
							userId: true, // Legacy - only use this until migration
							user: {
								select: {
									id: true,
									name: true,
									email: true,
								},
							},
						},
						take: 3, // Fetch a few to find first non-null userId
					},
				},
				orderBy: tab === 'recent' 
					? { updatedAt: 'desc' } 
					: tab === 'drafts'
					? { updatedAt: 'desc' }
					: { updatedAt: 'desc' },
				take: limit,
				skip: offset,
			}),
			prisma.quiz.count({ where }),
		])

		// OPTIMIZATION: Fetch all completion counts in one query
		const quizIds = quizzes.map(q => q.id)
		const completionCounts = await prisma.quizCompletion.groupBy({
			by: ['quizId'],
			where: {
				quizId: { in: quizIds },
				quizType: 'CUSTOM',
			},
			_count: {
				id: true,
			},
		}).catch(() => []) // Silently fail if query fails

		// Create a map of quizId -> playCount
		const playCountMap = new Map<string, number>()
		completionCounts.forEach(item => {
			if (item.quizId) {
				playCountMap.set(item.quizId, item._count.id)
			}
		})

		// OPTIMIZATION: Transform to summary format
		// Handle missing fields gracefully (if migration not run)
		const summaries: CustomQuizSummary[] = await Promise.all(quizzes.map(async (quiz) => {
			// Determine if this quiz is shared (not owned by user)
			const isShared = quiz.createdByUserId !== userId

			// Get share indicators (legacy support - only userId until migration)
			const userShares = quiz.shares.filter(s => s.userId !== null)
			const hasUserShares = userShares.length > 0
			const hasGroupShares = false // Will be true after migration when targetType exists

			// Get creator info (from quiz.user relation)
			let creator: CustomQuizSummary['creator'] | undefined
			if (quiz.user) {
				creator = {
					id: quiz.user.id,
					name: quiz.user.name || undefined,
					email: quiz.user.email,
				}
			}

			// Check if creator is in same organisation as current user
			let isCreatorInSameOrg = false
			if (userOrgId && quiz.createdByUserId && quiz.createdByUserId !== userId) {
				try {
					const creatorOrgMember = await prisma.organisationMember.findFirst({
						where: {
							userId: quiz.createdByUserId,
							organisationId: userOrgId,
							status: 'ACTIVE',
						},
						select: { id: true },
					})
					isCreatorInSameOrg = !!creatorOrgMember
				} catch (error) {
					// Silently fail - org check is optional
					console.error('Error checking creator organisation:', error)
				}
			}

			// Get sharedBy info if shared
			let sharedBy: CustomQuizSummary['sharedBy'] | undefined
			if (isShared && userShares.length > 0) {
				const firstShare = userShares[0]
				if (firstShare.user) {
					sharedBy = {
						id: firstShare.user.id,
						name: firstShare.user.name || undefined,
						email: firstShare.user.email,
					}
				}
			}

			// Get play count from the pre-fetched map
			const playCount = playCountMap.get(quiz.id) || 0

			return {
				id: quiz.id,
				slug: quiz.slug || '',
				title: quiz.title,
				blurb: quiz.blurb || undefined,
				colorHex: quiz.colorHex || undefined,
				status: quiz.status,
				createdAt: quiz.createdAt,
				updatedAt: quiz.updatedAt,
				// OPTIMIZATION: Use aggregate counts from _count (computed in DB, no relation fetching)
				roundCount: quiz._count.rounds || 0,
				questionCount: quiz._count.customQuestions || 0,
				// Handle missing fields gracefully (if migration not run)
				isOrgWide: false, // Will be populated after migration
				isTemplate: false, // Will be populated after migration
				shareCount: quiz._count.shares || 0,
				hasUserShares,
				hasGroupShares,
				createdByUserId: quiz.createdByUserId,
				creator,
				isCreatorInSameOrg,
				playCount,
				isShared,
				sharedBy,
			}
		}))

		const hasMore = offset + limit < total

		return {
			summaries,
			total,
			hasMore,
		}
	} catch (error) {
		console.error('[Custom Quizzes Summary] Error fetching summaries:', error)
		// If error is due to missing columns (migration not run), return empty result gracefully
		if (error instanceof Error && (
			error.message?.includes('does not exist') || 
			error.message?.includes('column') ||
			(error as any).code === 'P2022' ||
			(error as any).code === '42703'
		)) {
			console.warn('[Custom Quizzes Summary] Database migration may not be run. Please run migration 014_enhance_custom_quizzes_schema.sql')
			return {
				summaries: [],
				total: 0,
				hasMore: false,
			}
		}
		// Re-throw other errors
		throw error
	}
}

/**
 * OPTIMIZATION: Get a single quiz summary (for detail page header)
 * Still uses summary query - no full quiz data
 */
export async function getCustomQuizSummaryById(
	quizId: string,
	userId: string
): Promise<CustomQuizSummary | null> {
	try {
		const quiz = await prisma.quiz.findFirst({
			where: {
				id: quizId,
				quizType: 'CUSTOM',
				OR: [
					{ createdByUserId: userId },
					{
						shares: {
							some: {
								OR: [
									{ targetType: 'user', targetId: userId },
									{ targetType: 'group', targetId: { in: [] } }, // Will be populated with user's groups
									{ targetType: 'organisation' },
								],
							},
						},
					},
					{ isOrgWide: true },
				],
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
				roundCount: true,
				questionCount: true,
				isOrgWide: true,
				isTemplate: true,
				createdByUserId: true,
				_count: {
					select: {
						shares: true,
					},
				},
			},
		})

		if (!quiz) return null

		return {
			id: quiz.id,
			slug: quiz.slug || '',
			title: quiz.title,
			blurb: quiz.blurb || undefined,
			colorHex: quiz.colorHex || undefined,
			status: quiz.status,
			createdAt: quiz.createdAt,
			updatedAt: quiz.updatedAt,
			roundCount: quiz.roundCount || 0,
			questionCount: quiz.questionCount || 0,
			isOrgWide: quiz.isOrgWide || false,
			isTemplate: quiz.isTemplate || false,
			shareCount: quiz._count.shares || 0,
			hasUserShares: false, // Would need additional query
			hasGroupShares: false, // Would need additional query
			createdByUserId: quiz.createdByUserId,
			isShared: quiz.createdByUserId !== userId,
		}
	} catch (error) {
		console.error('[Custom Quizzes Summary] Error fetching summary:', error)
		return null
	}
}

