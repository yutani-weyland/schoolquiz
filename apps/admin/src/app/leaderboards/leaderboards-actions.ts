'use server'

/**
 * OPTIMIZATION: Server Actions for leaderboard operations
 * KAHOOT-LIKE PERFORMANCE: Eliminates API route round-trips, reduces client JS
 */

import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { revalidateTag } from 'next/cache'

export async function joinLeaderboard(leaderboardId: string) {
	const user = await getCurrentUser()
	if (!user) {
		throw new Error('Unauthorized')
	}

	try {
		// Check if already a member
		const existing = await prisma.leaderboardMember.findUnique({
			where: {
				leaderboardId_userId: {
					leaderboardId,
					userId: user.id,
				},
			},
		})

		if (existing && !existing.leftAt) {
			return { success: true, message: 'Already a member' }
		}

		if (existing && existing.leftAt) {
			// Rejoin
			await prisma.leaderboardMember.update({
				where: {
					id: existing.id,
				},
				data: {
					leftAt: null,
					joinedAt: new Date(),
				},
			})
		} else {
			// New member
			await prisma.leaderboardMember.create({
				data: {
					leaderboardId,
					userId: user.id,
				},
			})
		}

		// OPTIMIZATION: Revalidate cache
		revalidateTag(`leaderboards-${user.id}`)

		return { success: true }
	} catch (error: any) {
		console.error('Error joining leaderboard:', error)
		throw new Error(error.message || 'Failed to join leaderboard')
	}
}

export async function leaveLeaderboard(leaderboardId: string, mute: boolean = false) {
	const user = await getCurrentUser()
	if (!user) {
		throw new Error('Unauthorized')
	}

	try {
		const membership = await prisma.leaderboardMember.findUnique({
			where: {
				leaderboardId_userId: {
					leaderboardId,
					userId: user.id,
				},
			},
		})

		if (!membership || membership.leftAt) {
			return { success: true, message: 'Not a member' }
		}

		if (mute) {
			// Mute instead of leaving (for org-wide boards)
			await prisma.leaderboardMember.update({
				where: {
					id: membership.id,
				},
				data: {
					muted: true,
				},
			})
		} else {
			// Leave
			await prisma.leaderboardMember.update({
				where: {
					id: membership.id,
				},
				data: {
					leftAt: new Date(),
				},
			})
		}

		// OPTIMIZATION: Revalidate cache
		revalidateTag(`leaderboards-${user.id}`)

		return { success: true }
	} catch (error: any) {
		console.error('Error leaving leaderboard:', error)
		throw new Error(error.message || 'Failed to leave leaderboard')
	}
}

/**
 * OPTIMIZATION: Load more leaderboards (for pagination/infinite scroll)
 */
export async function loadMoreLeaderboards(
	offset: number,
	limit: number = 20
): Promise<{
	orgWide: Array<{
		id: string
		name: string
		description: string | null
		visibility: 'ORG_WIDE'
		memberCount: number
		isMember: boolean
		isMuted: boolean
		organisation?: { id: string; name: string }
	}>
	group: Array<{
		id: string
		name: string
		description: string | null
		visibility: 'GROUP'
		memberCount: number
		isMember: boolean
		isMuted: boolean
		organisation?: { id: string; name: string }
		organisationGroup?: { id: string; name: string; type: string }
	}>
	adHoc: Array<{
		id: string
		name: string
		description: string | null
		visibility: 'AD_HOC'
		memberCount: number
		isMember: boolean
		isMuted: boolean
		creator?: { id: string; name: string; email: string }
	}>
	hasMore: boolean
}> {
	const user = await getCurrentUser()
	if (!user) {
		throw new Error('Unauthorized')
	}

	const isPremium =
		user.tier === 'premium' ||
		user.subscriptionStatus === 'ACTIVE' ||
		user.subscriptionStatus === 'TRIALING' ||
		(user.freeTrialUntil !== null && new Date(user.freeTrialUntil) > new Date())

	// Get organisation context
	const memberships = await prisma.organisationMember.findMany({
		where: {
			userId: user.id,
			status: 'ACTIVE',
			deletedAt: null,
		},
		select: {
			organisationId: true,
			groupMembers: {
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

	const orgIds = memberships.map(m => m.organisationId)
	const groupIds = memberships.flatMap(m => m.groupMembers.map(gm => gm.group.id))

	// Import and use the summary function
	const { getLeaderboardSummaries } = await import('./leaderboards-summary-server')
	const result = await getLeaderboardSummaries(user.id, orgIds, groupIds, isPremium, {
		limit,
		offset,
	})

	return {
		orgWide: result.orgWide,
		group: result.group,
		adHoc: result.adHoc,
		hasMore: result.hasMore || false,
	}
}
