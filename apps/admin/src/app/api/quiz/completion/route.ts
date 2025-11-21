/**
 * GET /api/quiz/completion?quizSlug=<slug>
 * Retrieve a quiz completion for the authenticated user
 * 
 * POST /api/quiz/completion
 * Save a quiz completion to the database
 * 
 * Accepts quiz completion data and saves it, then checks for newly unlocked achievements.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';

interface RoundScore {
  roundNumber: number;
  category: string;
  score: number;
  totalQuestions: number;
}

interface CompletionRequest {
  quizSlug: string;
  score: number;
  totalQuestions: number;
  completionTimeSeconds: number;
  roundScores?: RoundScore[];
  categories?: string[];
}

export async function GET(request: NextRequest) {
  try {
    // Get auth token and user ID from headers
    const authHeader = request.headers.get('Authorization');
    const userId = request.headers.get('X-User-Id');

    if (!authHeader || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized - authentication required' },
        { status: 401 }
      );
    }

    // Get quizSlug from query parameters
    const quizSlug = request.nextUrl.searchParams.get('quizSlug');

    if (!quizSlug) {
      return NextResponse.json(
        { error: 'Missing required query parameter: quizSlug' },
        { status: 400 }
      );
    }

    console.log(`[Quiz Completion API] GET request for userId: ${userId}, quizSlug: ${quizSlug}`);

    // Verify user exists - wrap in try-catch to handle DB errors gracefully
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    } catch (dbError: any) {
      console.error('❌ Database error when fetching user:', dbError);
      console.error('Error code:', dbError.code);
      console.error('Error message:', dbError.message);
      console.error('Error stack:', dbError.stack);
      // Return 500 with details instead of throwing
      return NextResponse.json(
        {
          error: 'Database error when fetching user',
          details: dbError.message || 'Unknown database error',
          code: dbError.code,
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find completion for this user and quiz
    // Using findFirst since it's more reliable than composite unique key syntax
    let completion;
    try {
      completion = await prisma.quizCompletion.findFirst({
        where: {
          userId,
          quizSlug,
        },
      });
    } catch (dbError: any) {
      console.error('❌ Database error when fetching completion:', dbError);
      console.error('Error code:', dbError.code);
      console.error('Error message:', dbError.message);
      console.error('Error meta:', dbError.meta);
      console.error('Error stack:', dbError.stack);
      
      // If table doesn't exist, return null gracefully
      // Check for various error codes and messages that indicate table doesn't exist
      const errorMessage = dbError.message?.toLowerCase() || '';
      const isTableMissing = 
        dbError.code === 'P2021' || // Table does not exist
        dbError.code === '42P01' || // PostgreSQL: relation does not exist
        errorMessage.includes('does not exist') ||
        errorMessage.includes('relation') && errorMessage.includes('does not exist') ||
        errorMessage.includes('table') && errorMessage.includes('does not exist') ||
        errorMessage.includes('quiz_completions') && errorMessage.includes('does not exist');
      
      if (isTableMissing) {
        console.warn('⚠️ QuizCompletion table does not exist yet, returning null');
        console.warn('💡 To fix: Run CREATE_QUIZ_COMPLETIONS_TABLE.sql in your Supabase SQL Editor');
        return NextResponse.json({
          completion: null,
        });
      }
      
      // Return 500 with details instead of throwing to ensure error is properly formatted
      return NextResponse.json(
        {
          error: 'Database error when fetching completion',
          details: dbError.message || 'Unknown database error',
          code: dbError.code,
        },
        { status: 500 }
      );
    }

    if (!completion) {
      return NextResponse.json({
        completion: null,
      });
    }

    return NextResponse.json({
      completion: {
        id: completion.id,
        quizSlug: completion.quizSlug,
        score: completion.score,
        totalQuestions: completion.totalQuestions,
        timeSeconds: completion.timeSeconds,
        completedAt: completion.completedAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching quiz completion:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      name: error.name,
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch quiz completion',
        details: error.message || 'Unknown error',
        code: error.code,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token and user ID from headers
    const authHeader = request.headers.get('Authorization');
    const userId = request.headers.get('X-User-Id');

    if (!authHeader || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized - authentication required' },
        { status: 401 }
      );
    }

    const body: CompletionRequest = await request.json();
    const { quizSlug, score, totalQuestions, completionTimeSeconds, roundScores, categories } = body;

    // Validate required fields
    if (!quizSlug || score === undefined || totalQuestions === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: quizSlug, score, totalQuestions' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { slug: quizSlug },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Check if completion already exists (upsert behavior)
    const existingCompletion = await prisma.quizCompletion.findFirst({
      where: {
        userId,
        quizSlug,
      },
    });

    let completion;
    if (existingCompletion) {
      // Update existing completion if new score is better or same
      if (score >= existingCompletion.score) {
        completion = await prisma.quizCompletion.update({
          where: { id: existingCompletion.id },
          data: {
            score,
            totalQuestions,
            timeSeconds: completionTimeSeconds || null,
            completedAt: new Date(),
          },
        });
      } else {
        // Keep existing completion if it's better
        completion = existingCompletion;
      }
    } else {
      // Create new completion
      completion = await prisma.quizCompletion.create({
        data: {
          userId,
          quizSlug,
          score,
          totalQuestions,
          timeSeconds: completionTimeSeconds || null,
          completedAt: new Date(),
        },
      });
    }

    // TODO: Check for newly unlocked achievements
    // This would integrate with the achievement system
    // For now, return empty array
    const newlyUnlockedAchievements: string[] = [];

    // Update user streak if applicable
    // This is a simplified version - you might want more sophisticated streak logic
    try {
      const userStreak = await prisma.userStreak.findUnique({
        where: { userId },
      });

      if (userStreak) {
        // Update streak logic here
        // For now, just update lastQuizDate
        await prisma.userStreak.update({
          where: { userId },
          data: {
            lastQuizDate: new Date(),
          },
        });
      } else {
        // Create initial streak
        await prisma.userStreak.create({
          data: {
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastQuizDate: new Date(),
            streakStartDate: new Date(),
          },
        });
      }
    } catch (streakError) {
      // Log but don't fail the request if streak update fails
      console.warn('Failed to update user streak:', streakError);
    }

    console.log(`✅ Quiz completion saved: User ${userId}, Quiz ${quizSlug}, Score ${score}/${totalQuestions}`);

    return NextResponse.json({
      success: true,
      completion: {
        id: completion.id,
        score: completion.score,
        totalQuestions: completion.totalQuestions,
        completedAt: completion.completedAt,
      },
      newlyUnlockedAchievements,
    });
  } catch (error: any) {
    console.error('❌ Error saving quiz completion:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save quiz completion',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
