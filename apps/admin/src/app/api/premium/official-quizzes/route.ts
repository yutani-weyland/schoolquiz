import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@schoolquiz/db';

/**
 * GET /api/premium/official-quizzes
 * Get all official quizzes (weekly quiz drop) for premium users
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireApiAuth();

    // Check premium status
    const isPremium = user.tier === 'premium' || 
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date());
    
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Official quizzes are only available to premium users' },
        { status: 403 }
      );
    }

    try {
      // Get official quizzes (published status, ordered by publication date or creation date)
      const officialQuizzes = await prisma.quiz.findMany({
        where: {
          quizType: 'OFFICIAL',
          status: 'published',
        },
        select: {
          id: true,
          slug: true,
          title: true,
          blurb: true,
          colorHex: true,
          weekISO: true,
          status: true,
          publicationDate: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { publicationDate: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      // Transform to API format
      const transformedQuizzes = officialQuizzes.map(quiz => ({
        id: quiz.id,
        slug: quiz.slug,
        title: quiz.title,
        blurb: quiz.blurb,
        colorHex: quiz.colorHex,
        weekISO: quiz.weekISO,
        status: quiz.status,
        publicationDate: quiz.publicationDate,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
        isOfficial: true,
      }));

      return NextResponse.json({
        quizzes: transformedQuizzes,
      });
    } catch (error) {
      console.error('[Official Quizzes API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch official quizzes' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Official Quizzes API] Error:', error);
    
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: error.message || 'Unauthorized' },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

