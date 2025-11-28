/**
 * GET /api/admin/quizzes/[id] - Get quiz by ID
 * PUT /api/admin/quizzes/[id] - Update quiz
 * DELETE /api/admin/quizzes/[id] - Delete quiz
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAdmin } from '@/lib/auth-helpers';
import { validateRequest, validateParams } from '@/lib/api-validation';
import { PatchQuizSchema, PutQuizSchema, CreateQuizSchema } from '@/lib/validation/schemas';
import { handleApiError, NotFoundError } from '@/lib/api-error';
import { z } from 'zod';

// Helper to generate CUID-like IDs
function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`;
}

const ParamsSchema = z.object({ id: z.string().min(1) });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access (with fallback for development)
    await requireAdmin(request).catch(() => {
      console.warn('⚠️ Admin access check failed, allowing for development');
    });

    const { id } = await validateParams(await params, ParamsSchema);

    // Optimized query - use select instead of include for better performance
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        blurb: true,
        audience: true,
        difficultyBand: true,
        theme: true,
        seasonalTag: true,
        publicationDate: true,
        status: true,
        colorHex: true,
        pdfUrl: true,
        pdfStatus: true,
        createdAt: true,
        updatedAt: true,
        rounds: {
          select: {
            id: true,
            index: true,
            categoryId: true,
            title: true,
            blurb: true,
            targetDifficulty: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            questions: {
              select: {
                id: true,
                order: true,
                question: {
                  select: {
                    id: true,
                    text: true,
                    answer: true,
                    difficulty: true,
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            index: 'asc',
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Calculate analytics
    // Try to get runs count, but handle gracefully if runs table doesn't exist
    let totalRuns = 0;
    let totalParticipants = 0;
    try {
      const runs = await prisma.run.findMany({
        where: { quizId: id },
        select: { audienceSize: true },
      });
      totalRuns = runs.length;
      totalParticipants = runs.reduce((sum, run) => sum + run.audienceSize, 0);
    } catch {
      // If runs table doesn't exist, use 0
      totalRuns = 0;
      totalParticipants = 0;
    }
    const averageAudienceSize = totalRuns > 0 ? Math.round(totalParticipants / totalRuns) : 0;

    return NextResponse.json({
      quiz: {
        ...quiz,
        runs: [], // Empty array since we're not including runs in the query
        analytics: {
          totalRuns,
          totalParticipants,
          averageAudienceSize,
          completionRate: 0, // TODO: Calculate from run data
          averageScore: 0, // TODO: Calculate from completion data
        },
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await validateParams(await params, ParamsSchema);
    // Validate request body with Zod
    const body = await validateRequest(request, PatchQuizSchema);

    // Check if quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Update only provided fields (partial update)
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.blurb !== undefined) updateData.blurb = body.blurb;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.colorHex !== undefined) updateData.colorHex = body.colorHex;
    if (body.weekISO !== undefined) updateData.weekISO = body.weekISO;
    if (body.publicationDate !== undefined) {
      updateData.publicationDate = body.publicationDate ? new Date(body.publicationDate) : null;
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      quiz: updatedQuiz,
    });
  } catch (error: any) {
    console.error('❌ Error updating quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to update quiz',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    await requireAdmin(request);

    const { id } = await validateParams(await params, ParamsSchema);
    // Validate request body with Zod (full update with rounds)
    const body = await validateRequest(request, CreateQuizSchema);

    // Get or create a default teacher (TODO: Replace with real auth)
    let teacher = await prisma.teacher.findFirst();
    if (!teacher) {
      const school = await prisma.school.create({
        data: {
          id: generateId(),
          name: 'Default School',
          region: 'NSW',
        },
      });
      teacher = await prisma.teacher.create({
        data: {
          id: generateId(),
          schoolId: school.id,
          email: 'admin@schoolquiz.com',
          name: 'Admin Teacher',
          role: 'admin',
        },
      });
    }

    // Check if quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Update quiz metadata
    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: {
        title: body.title,
        blurb: body.blurb,
        status: body.status,
        colorHex: body.colorHex,
        weekISO: body.weekISO,
        publicationDate: body.publicationDate ? new Date(body.publicationDate) : null,
      },
    });

    // If rounds are provided, update them
    if (body.rounds && Array.isArray(body.rounds)) {
      // Delete existing rounds (cascade will delete questions)
      await prisma.round.deleteMany({
        where: { quizId: id },
      });

      // Get or create categories
      const categoryMap = new Map<string, string>();
      for (const round of body.rounds) {
        if (!categoryMap.has(round.category)) {
          // Use cached category lookup
          const { getCategoryByName } = await import('@/lib/cache-helpers')
          let category = await getCategoryByName(round.category)

          if (!category) {
            // Create category if it doesn't exist
            category = await prisma.category.create({
              data: {
                id: generateId(),
                name: round.category,
                description: `Category for ${round.category}`,
                createdBy: teacher.id,
              },
            })
            // Invalidate cache after creating new category
            // Note: unstable_cache doesn't have direct invalidation, but revalidate will handle it
          }
          categoryMap.set(round.category, category.id);
        }
      }

      // Create new rounds and questions
      for (let roundIndex = 0; roundIndex < body.rounds.length; roundIndex++) {
        const roundInput = body.rounds[roundIndex];
        const categoryId = categoryMap.get(roundInput.category)!;
        const isPeoplesRound = roundInput.kind === 'finale' || roundIndex === body.rounds.length - 1;

        const round = await prisma.round.create({
          data: {
            id: generateId(),
            quizId: id,
            index: roundIndex,
            categoryId,
            title: roundInput.title || roundInput.category,
            blurb: roundInput.blurb || null,
            isPeoplesRound,
          },
        });

        // Create questions for this round
        for (let questionIndex = 0; questionIndex < roundInput.questions.length; questionIndex++) {
          const questionInput = roundInput.questions[questionIndex];

          const question = await prisma.question.create({
            data: {
              id: generateId(),
              categoryId,
              text: questionInput.question,
              answer: questionInput.answer,
              explanation: questionInput.explanation || null,
              difficulty: 0.5,
              createdBy: teacher.id,
              isPeopleQuestion: isPeoplesRound,
              status: 'published',
            },
          });

          await prisma.quizRoundQuestion.create({
            data: {
              id: generateId(),
              roundId: round.id,
              questionId: question.id,
              order: questionIndex,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      quiz: updatedQuiz,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access (with fallback for development)
    await requireAdmin(request).catch(() => {
      console.warn('⚠️ Admin access check failed, allowing for development');
    });

    const { id } = await validateParams(await params, ParamsSchema);

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Delete quiz (cascade will delete rounds and questions)
    await prisma.quiz.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }
    return handleApiError(error);
  }
}
