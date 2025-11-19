/**
 * POST /api/admin/quizzes/[id]/duplicate
 * Duplicate a quiz with all its rounds and questions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAdmin } from '@/lib/auth-helpers';

// Helper to generate CUID-like IDs
function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    await requireAdmin(request);

    const { id } = await params;

    // Get the original quiz with all relations
    const originalQuiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        rounds: {
          include: {
            category: true,
            questions: {
              include: {
                question: true,
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
        creator: true,
      },
    });

    if (!originalQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

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

    // Generate new slug (append "-copy" or increment number)
    let newSlug = originalQuiz.slug ? `${originalQuiz.slug}-copy` : `quiz-${Date.now()}`;
    let slugCounter = 1;
    while (await prisma.quiz.findUnique({ where: { slug: newSlug } })) {
      newSlug = originalQuiz.slug ? `${originalQuiz.slug}-copy-${slugCounter}` : `quiz-${Date.now()}-${slugCounter}`;
      slugCounter++;
    }

    // Create duplicated quiz
    const duplicatedQuiz = await prisma.quiz.create({
      data: {
        id: generateId(),
        slug: newSlug,
        title: `${originalQuiz.title} (Copy)`,
        blurb: originalQuiz.blurb,
        status: 'draft', // Always duplicate as draft
        colorHex: originalQuiz.colorHex,
        createdBy: teacher.id,
        weekISO: originalQuiz.weekISO,
        publicationDate: null, // Clear publication date for draft
      },
    });

    // Duplicate rounds and questions
    for (const originalRound of originalQuiz.rounds) {
      const duplicatedRound = await prisma.round.create({
        data: {
          id: generateId(),
          quizId: duplicatedQuiz.id,
          index: originalRound.index,
          categoryId: originalRound.categoryId,
          title: originalRound.title,
          blurb: originalRound.blurb,
          targetDifficulty: originalRound.targetDifficulty,
          isPeoplesRound: originalRound.isPeoplesRound,
        },
      });

      // Duplicate questions for this round
      for (const roundQuestion of originalRound.questions) {
        const originalQuestion = roundQuestion.question;

        // Create a new question (duplicate the question itself)
        const duplicatedQuestion = await prisma.question.create({
          data: {
            id: generateId(),
            categoryId: originalQuestion.categoryId,
            text: originalQuestion.text,
            answer: originalQuestion.answer,
            explanation: originalQuestion.explanation,
            difficulty: originalQuestion.difficulty,
            tags: originalQuestion.tags,
            status: 'draft', // Duplicated questions start as draft
            createdBy: teacher.id,
            isPeopleQuestion: originalQuestion.isPeopleQuestion,
          },
        });

        // Link duplicated question to duplicated round
        await prisma.quizRoundQuestion.create({
          data: {
            id: generateId(),
            roundId: duplicatedRound.id,
            questionId: duplicatedQuestion.id,
            order: roundQuestion.order,
          },
        });
      }
    }

    console.log(`✅ Duplicated quiz ${id} to ${duplicatedQuiz.id}`);

    return NextResponse.json({
      success: true,
      quiz: {
        id: duplicatedQuiz.id,
        slug: duplicatedQuiz.slug,
        title: duplicatedQuiz.title,
        status: duplicatedQuiz.status,
      },
    });
  } catch (error: any) {
    console.error('❌ Error duplicating quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to duplicate quiz',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

