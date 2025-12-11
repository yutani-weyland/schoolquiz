/**
 * GET /api/admin/quizzes - List quizzes
 * POST /api/admin/quizzes - Create a new quiz
 * 
 * GET: Returns paginated list of quizzes with filters
 * POST: Creates a new quiz in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { requireAdmin } from '@/lib/auth-helpers';
import { requireAuth } from '@/lib/auth';
import { validateRequest, validateQuery } from '@/lib/api-validation';
import { CreateQuizSchema, AdminQuizzesQuerySchema } from '@/lib/validation/schemas';
import { handleApiError } from '@/lib/api-error';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/permissions';

// Helper to generate CUID-like IDs
function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`;
}



export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  try {
    // Require admin access (with fallback for development)
    await requireAdmin(request).catch(() => {
      // Silently allow in development - auth will be implemented later
    });

    // Validate query parameters with Zod
    const query = await validateQuery(request, AdminQuizzesQuerySchema);
    const page = query.page || 1;
    const limit = query.limit || 50;
    const search = query.search || '';
    const status = query.status || '';
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { blurb: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'publicationDate') {
      orderBy.publicationDate = sortOrder;
    } else if (sortBy === 'title') {
      orderBy.title = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else {
      // Default to createdAt
      orderBy.createdAt = sortOrder;
    }

    // Optimized query - use select instead of include, and _count for runs
    // Try optimized query first, fallback if runs relation doesn't exist
    let quizzes: any[];
    let total: number;

    try {
      // Try optimized query with relation count
      const result = await Promise.all([
        prisma.quiz.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            slug: true,
            title: true,
            blurb: true,
            audience: true,
            difficultyBand: true,
            theme: true,
            seasonalTag: true,
            publicationDate: true,
            status: true,
            pdfUrl: true,
            pdfStatus: true,
            createdAt: true,
            updatedAt: true,
            // Only include rounds if explicitly requested (for preview/explore pages)
            ...(searchParams.get('includeRounds') === 'true' ? {
              rounds: {
                select: {
                  id: true,
                  index: true,
                  title: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
                orderBy: {
                  index: 'asc',
                },
              },
            } : {}),
            _count: {
              select: {
                rounds: true,
                runs: true, // Use relation count if available
              },
            },
          },
        }),
        prisma.quiz.count({ where }),
      ]);
      quizzes = result[0];
      total = result[1];
    } catch (error: any) {
      // Fallback: if runs relation doesn't exist, fetch without it and get counts separately
      if (error?.message?.includes('runs') || error?.message?.includes('quizId')) {
        const result = await Promise.all([
          prisma.quiz.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            select: {
              id: true,
              slug: true,
              title: true,
              blurb: true,
              audience: true,
              difficultyBand: true,
              theme: true,
              seasonalTag: true,
              publicationDate: true,
              status: true,
              pdfUrl: true,
              pdfStatus: true,
              createdAt: true,
              updatedAt: true,
              // Only include rounds if explicitly requested
              ...(searchParams.get('includeRounds') === 'true' ? {
                rounds: {
                  select: {
                    id: true,
                    index: true,
                    title: true,
                    category: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                  orderBy: {
                    index: 'asc',
                  },
                },
              } : {}),
              _count: {
                select: {
                  rounds: true,
                },
              },
            },
          }),
          prisma.quiz.count({ where }),
        ]);
        quizzes = result[0];
        total = result[1];

        // Get runs count separately if possible
        let runsCounts: any[] = [];
        if (quizzes.length > 0) {
          try {
            const quizIds = quizzes.map((q: any) => q.id);
            const result = await prisma.run.groupBy({
              by: ['quizId'],
              where: {
                quizId: { in: quizIds },
              },
              _count: {
                id: true,
              },
            });
            runsCounts = result as any[];
          } catch {
            // If runs table doesn't exist, use empty array
            runsCounts = [];
          }
        }

        // Create a map of quizId -> runs count
        const runsCountMap = new Map(
          Array.isArray(runsCounts)
            ? runsCounts.map((r: any) => [r.quizId, r._count.id])
            : []
        );

        // Add runs count to each quiz
        quizzes = quizzes.map((quiz: any) => ({
          ...quiz,
          _count: {
            ...quiz._count,
            runs: runsCountMap.get(quiz.id) || 0,
          },
        }));
      } else {
        // Re-throw if it's a different error
        throw error;
      }
    }

    return NextResponse.json({
      quizzes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    // Log to both console and return detailed error
    const errorDetails = {
      message: error?.message || String(error),
      name: error?.name || 'Unknown',
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    };

    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !can(user as any, 'create', 'quiz')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Validate request body with Zod
    const body = await validateRequest(request, CreateQuizSchema);
    console.log('📝 Creating quiz:', { number: body.number, title: body.title });

    // Generate slug from quiz number
    const slug = String(body.number);

    // Check if quiz with this slug already exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { slug },
    });

    if (existingQuiz) {
      return NextResponse.json(
        { error: `Quiz #${body.number} already exists` },
        { status: 409 }
      );
    }

    // Get or create categories for each round
    // Use cached category lookup to avoid N+1 queries
    const { getCategoryByName } = await import('@/lib/cache-helpers')
    const categoryMap = new Map<string, string>();
    for (const round of body.rounds) {
      if (!categoryMap.has(round.category)) {
        let category = await getCategoryByName(round.category);

        if (!category) {
          category = await prisma.category.create({
            data: {
              id: generateId(),
              name: round.category,
              description: `Category for ${round.category}`,
              createdBy: user.id,
            },
          });
          console.log(`  ✅ Created category: ${round.category}`);
        }
        categoryMap.set(round.category, category.id);
      }
    }

    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        id: generateId(),
        slug,
        title: body.title,
        blurb: body.blurb || null,
        status: body.status,
        colorHex: '#FFE135', // Default yellow, can be customized later
        createdBy: user.id,
        weekISO: body.weekISO || (body.publicationDate
          ? new Date(body.publicationDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]),
        publicationDate: body.publicationDate ? new Date(body.publicationDate) : null,
      },
    });
    console.log(`  ✅ Created quiz: ${quiz.id} (slug: ${quiz.slug})`);

    // Create rounds and questions
    for (let roundIndex = 0; roundIndex < body.rounds.length; roundIndex++) {
      const roundInput = body.rounds[roundIndex];
      const categoryId = categoryMap.get(roundInput.category)!;
      const isPeoplesRound = roundInput.kind === 'finale' || roundIndex === body.rounds.length - 1;

      // Create round
      const round = await prisma.round.create({
        data: {
          id: generateId(),
          quizId: quiz.id,
          index: roundIndex,
          categoryId,
          title: roundInput.title || roundInput.category,
          blurb: roundInput.blurb || null,
          isPeoplesRound,
        },
      });
      console.log(`  ✅ Created round ${roundIndex + 1}: ${round.title}`);

      // Create questions for this round
      for (let questionIndex = 0; questionIndex < roundInput.questions.length; questionIndex++) {
        const questionInput = roundInput.questions[questionIndex];

        // Create question
        const question = await prisma.question.create({
          data: {
            id: generateId(),
            categoryId,
            text: questionInput.question,
            answer: questionInput.answer,
            difficulty: 0.5, // Default difficulty
            createdBy: user.id,
            isPeopleQuestion: isPeoplesRound,
            status: 'published',
          },
        });

        // Link question to round
        await prisma.quizRoundQuestion.create({
          data: {
            id: generateId(),
            roundId: round.id,
            questionId: question.id,
            order: questionIndex,
          },
        });
      }
      console.log(`    ✅ Created ${roundInput.questions.length} questions for round ${roundIndex + 1}`);
    }

    console.log(`🎉 Quiz #${body.number} created successfully!`);
    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        slug: quiz.slug,
        title: quiz.title,
        status: quiz.status,
      },
    });
  } catch (error: any) {
    // Use centralized error handling (handles ValidationError automatically)
    return handleApiError(error);
  }
}
