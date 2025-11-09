import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAuth } from '@/lib/auth';
import { LeaderboardVisibility } from '@prisma/client';

/**
 * POST /api/leaderboards/:id/leave
 * Leave a leaderboard
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const leaderboardId = params.id;
    const body = await request.json();
    const { mute = false } = body;

    const member = await prisma.leaderboardMember.findUnique({
      where: {
        leaderboardId_userId: {
          leaderboardId,
          userId: user.id,
        },
      },
    });

    if (!member || member.leftAt) {
      return NextResponse.json(
        { error: 'Not a member of this leaderboard' },
        { status: 400 }
      );
    }

    const leaderboard = await prisma.leaderboard.findUnique({
      where: { id: leaderboardId },
    });

    // For org-wide boards, allow muting instead of leaving
    if (mute && leaderboard?.visibility === LeaderboardVisibility.ORG_WIDE) {
      await prisma.leaderboardMember.update({
        where: { id: member.id },
        data: { muted: true },
      });
      return NextResponse.json({ muted: true });
    }

    // Otherwise, leave the leaderboard
    await prisma.leaderboardMember.update({
      where: { id: member.id },
      data: { leftAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error leaving leaderboard:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to leave leaderboard' },
      { status: 500 }
    );
  }
}

