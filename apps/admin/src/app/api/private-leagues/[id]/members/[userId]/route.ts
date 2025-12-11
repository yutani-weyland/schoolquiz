import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireApiAuth } from '@/lib/api-auth'

/**
 * DELETE /api/private-leagues/[id]/members/[userId]
 * Remove a member from a league (only creator can remove members)
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; userId: string }> }
) {
	try {
		const user = await requireApiAuth()
		const { id: leagueId, userId: memberUserId } = await params

		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		// Check if user is premium (private leagues are premium-only)
		if (user.tier !== 'premium') {
			return NextResponse.json(
				{ error: 'Private leagues are only available to premium users' },
				{ status: 403 }
			)
		}

		// Get league and verify creator
		const league = await (prisma as any).privateLeague.findFirst({
			where: { 
				id: leagueId,
				deletedAt: null,
			},
			select: {
				id: true,
				createdByUserId: true,
			},
		})

		if (!league) {
			return NextResponse.json(
				{ error: 'League not found' },
				{ status: 404 }
			)
		}

		// Only creator can remove members
		if (league.createdByUserId !== user.id) {
			return NextResponse.json(
				{ error: 'Only the league creator can remove members' },
				{ status: 403 }
			)
		}

		// Prevent removing the creator
		if (memberUserId === league.createdByUserId) {
			return NextResponse.json(
				{ error: 'Cannot remove the league creator' },
				{ status: 400 }
			)
		}

		// Check if member exists and is active
		const member = await (prisma as any).privateLeagueMember.findFirst({
			where: {
				leagueId,
				userId: memberUserId,
				leftAt: null,
			},
			select: {
				id: true,
				userId: true,
			},
		})

		if (!member) {
			return NextResponse.json(
				{ error: 'Member not found or already removed' },
				{ status: 404 }
			)
		}

		// Soft delete by setting leftAt timestamp
		await (prisma as any).privateLeagueMember.update({
			where: { id: member.id },
			data: {
				leftAt: new Date(),
			},
		})

		return NextResponse.json({ 
			success: true,
			message: 'Member removed successfully',
		})
	} catch (error: any) {
		console.error('Error removing member:', error)
		return NextResponse.json(
			{ 
				error: 'Failed to remove member', 
				details: error.message || String(error) 
			},
			{ status: 500 }
		)
	}
}
