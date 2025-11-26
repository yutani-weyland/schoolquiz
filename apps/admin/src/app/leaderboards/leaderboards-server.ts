import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { LeaderboardVisibility } from '@prisma/client'

export interface Leaderboard {
	id: string
	name: string
	description: string | null
	visibility: 'ORG_WIDE' | 'GROUP' | 'AD_HOC'
	organisation?: {
		id: string
		name: string
	}
	organisationGroup?: {
		id: string
		name: string
		type: string
	}
	creator?: {
		id: string
		name: string
		email: string
	}
	members: Array<{
		id: string
		userId: string
		muted: boolean
		leftAt: string | null
	}>
}

export interface LeaderboardsPageData {
	leaderboards: {
		orgWide: Leaderboard[]
		group: Leaderboard[]
		adHoc: Leaderboard[]
	}
	isPremium: boolean
}

/**
 * Fetch leaderboards data server-side
 * Reuses the same logic as the API route for consistency
 */
export async function getLeaderboardsPageData(): Promise<LeaderboardsPageData> {
	const user = await getCurrentUser()

	if (!user) {
		return {
			leaderboards: {
				orgWide: [],
				group: [],
				adHoc: [],
			},
			isPremium: false,
		}
	}

	// Check premium status
	const isPremium = user.tier === 'premium' ||
		user.subscriptionStatus === 'ACTIVE' ||
		user.subscriptionStatus === 'TRIALING' ||
		(user.freeTrialUntil !== null && new Date(user.freeTrialUntil) > new Date())

	try {
		// Get user's organisation memberships
		const memberships = await prisma.organisationMember.findMany({
			where: {
				userId: user.id,
				status: 'ACTIVE',
				deletedAt: null,
			},
			include: {
				organisation: true,
				groupMembers: {
					include: {
						group: true,
					},
				},
			},
		})

		const organisationIds = memberships.map(m => m.organisationId)
		const groupIds = memberships.flatMap(m =>
			m.groupMembers.map(gm => gm.group.id)
		)

		// Fetch all three types in parallel
		const [orgWideLeaderboards, groupLeaderboards, adHocLeaderboards] = await Promise.all([
			// Get organisation-wide leaderboards
			prisma.leaderboard.findMany({
				where: {
					organisationId: { in: organisationIds },
					visibility: LeaderboardVisibility.ORG_WIDE,
					deletedAt: null,
				},
				include: {
					organisation: {
						select: {
							id: true,
							name: true,
						},
					},
					members: {
						where: {
							userId: user.id,
							leftAt: null,
						},
						select: {
							id: true,
							userId: true,
							muted: true,
							leftAt: true,
						},
					},
				},
			}),

			// Get group leaderboards (only if premium)
			isPremium ? prisma.leaderboard.findMany({
				where: {
					organisationGroupId: { in: groupIds },
					visibility: LeaderboardVisibility.GROUP,
					deletedAt: null,
				},
				include: {
					organisation: {
						select: {
							id: true,
							name: true,
						},
					},
					organisationGroup: {
						select: {
							id: true,
							name: true,
							type: true,
						},
					},
					members: {
						where: {
							userId: user.id,
							leftAt: null,
						},
						select: {
							id: true,
							userId: true,
							muted: true,
							leftAt: true,
						},
					},
				},
			}) : Promise.resolve([]),

			// Get ad-hoc leaderboards (only if premium)
			isPremium ? prisma.leaderboard.findMany({
				where: {
					visibility: LeaderboardVisibility.AD_HOC,
					deletedAt: null,
					members: {
						some: {
							userId: user.id,
							leftAt: null,
						},
					},
				},
				include: {
					creator: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					members: {
						where: {
							leftAt: null,
						},
						select: {
							id: true,
							userId: true,
							muted: true,
							leftAt: true,
						},
					},
				},
			}) : Promise.resolve([]),
		])

		// Transform to match expected format
		const transformLeaderboard = (lb: any): Leaderboard => ({
			id: lb.id,
			name: lb.name,
			description: lb.description,
			visibility: lb.visibility,
			organisation: lb.organisation ? {
				id: lb.organisation.id,
				name: lb.organisation.name,
			} : undefined,
			organisationGroup: lb.organisationGroup ? {
				id: lb.organisationGroup.id,
				name: lb.organisationGroup.name,
				type: lb.organisationGroup.type,
			} : undefined,
			creator: lb.creator ? {
				id: lb.creator.id,
				name: lb.creator.name,
				email: lb.creator.email,
			} : undefined,
			members: lb.members.map((m: any) => ({
				id: m.id,
				userId: m.userId,
				muted: m.muted || false,
				leftAt: m.leftAt ? m.leftAt.toISOString() : null,
			})),
		})

		return {
			leaderboards: {
				orgWide: orgWideLeaderboards.map(transformLeaderboard),
				group: groupLeaderboards.map(transformLeaderboard),
				adHoc: adHocLeaderboards.map(transformLeaderboard),
			},
			isPremium,
		}
	} catch (error: any) {
		console.error('[Leaderboards Server] Error fetching leaderboards:', error)
		// Return empty on error
		return {
			leaderboards: {
				orgWide: [],
				group: [],
				adHoc: [],
			},
			isPremium,
		}
	}
}

