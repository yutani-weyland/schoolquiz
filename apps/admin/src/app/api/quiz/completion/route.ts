/**
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
    const existingCompletion = await prisma.quizCompletion.findUnique({
      where: {
        userId_quizSlug: {
          userId,
          quizSlug,
        },
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
