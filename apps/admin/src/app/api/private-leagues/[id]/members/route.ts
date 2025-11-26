import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireApiAuth } from '@/lib/api-auth'
import { ForbiddenError } from '@/lib/api-error'

/**
 * GET /api/private-leagues/[id]/members
 * Get league members with pagination
 * OPTIMIZATION: Separate endpoint for member lists - only fetch when needed
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const apiStart = Date.now()
		const user = await requireApiAuth()
		const authDuration = Date.now() - apiStart
		console.log(`[League Members API] Auth took ${authDuration}ms`)
		
		const { id } = await params
		const { searchParams } = new URL(request.url)

		// OPTIMIZATION: Use tier from session if available (fast), otherwise check subscription fields
		const isPremium = user.tier === 'premium' ||
			user.subscriptionStatus === 'ACTIVE' ||
			user.subscriptionStatus === 'TRIALING' ||
			(user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())

		if (!isPremium) {
			throw new ForbiddenError('Private leagues are only available to premium users')
		}

		// Pagination parameters
		const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 per page
		const offset = parseInt(searchParams.get('offset') || '0')

		const accessCheckStart = Date.now()
		// OPTIMIZATION: Parallel queries with detailed timing to identify bottlenecks
		const leagueQueryStart = Date.now()
		const membershipQueryStart = Date.now()
		
		const [league, membership] = await Promise.all([
			(prisma as any).privateLeague.findFirst({
				where: { id, deletedAt: null },
				select: {
					id: true,
					createdByUserId: true,
				},
			}).then(result => {
				const duration = Date.now() - leagueQueryStart
				console.log(`[League Members API] League query took ${duration}ms`)
				return result
			}),
			// OPTIMIZATION: Use covering index idx_private_league_members_league_user_active
			(prisma as any).privateLeagueMember.findFirst({
				where: {
					leagueId: id,
					userId: user.id,
					leftAt: null,
				},
				select: {
					id: true,
				},
			}).then(result => {
				const duration = Date.now() - membershipQueryStart
				console.log(`[League Members API] Membership query took ${duration}ms`)
				return result
			}),
		])

		if (!league) {
			return NextResponse.json({ error: 'League not found' }, { status: 404 })
		}

		const accessCheckDuration = Date.now() - accessCheckStart
		console.log(`[League Members API] Access check took ${accessCheckDuration}ms (total)`)
		
		const isMember = !!membership
		if (!isMember && league.createdByUserId !== user.id) {
			return NextResponse.json({ error: 'Access denied' }, { status: 403 })
		}

		const membersQueryStart = Date.now()
		
		// OPTIMIZATION: Fetch members with detailed timing to identify bottlenecks
		// The join to users table might be slow - we'll measure it
		const membersQueryStart1 = Date.now()
		
		// OPTIMIZATION: Check if ordering is needed (can be slow with OFFSET)
		// For small datasets, ordering is fast. For large datasets, consider removing ORDER BY
		const needsOrdering = searchParams.get('orderBy') !== 'none'
		
		const queryOptions: any = {
			where: {
				leagueId: id,
				leftAt: null, // Uses partial index WHERE leftAt IS NULL
			},
			select: {
				id: true,
				userId: true,
				joinedAt: true,
				user: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			take: limit,
			skip: offset,
		}
		
		// Only add ORDER BY if needed (can be slow with large OFFSET)
		if (needsOrdering) {
			queryOptions.orderBy = {
				joinedAt: 'asc', // Uses idx_private_league_members_league_joined
			}
		}
		
		const members = await (prisma as any).privateLeagueMember.findMany(queryOptions)
		const membersQueryDuration1 = Date.now() - membersQueryStart1
		console.log(`[League Members API] Members query (with join${needsOrdering ? ', ordered' : ''}) took ${membersQueryDuration1}ms`)
		
		// OPTIMIZATION: Count query - can be slow with large datasets
		// Consider making this optional or using an estimate for large leagues
		const countQueryStart = Date.now()
		const total = await (prisma as any).privateLeagueMember.count({
			where: {
				leagueId: id,
				leftAt: null, // Uses partial index WHERE leftAt IS NULL
			},
		})
		const countQueryDuration = Date.now() - countQueryStart
		console.log(`[League Members API] Count query took ${countQueryDuration}ms`)
		
		const membersQueryDuration = Date.now() - membersQueryStart
		const totalDuration = Date.now() - apiStart
		console.log(`[League Members API] Total members fetch took ${membersQueryDuration}ms (members: ${membersQueryDuration1}ms, count: ${countQueryDuration}ms), total: ${totalDuration}ms (auth: ${authDuration}ms, access: ${accessCheckDuration}ms)`)

		return NextResponse.json({
			members,
			pagination: {
				total,
				limit,
				offset,
				hasMore: offset + limit < total,
			},
		})
	} catch (error: any) {
		console.error('Error fetching league members:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch members', details: error.message },
			{ status: 500 }
		)
	}
}

