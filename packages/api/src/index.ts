// Simple API utilities for the dashboard
import { prisma } from '@schoolquiz/db';
import { z } from 'zod';

// Question schemas
export const QuestionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  answer: z.string().min(1, 'Answer is required'),
  explanation: z.string().optional(),
  difficulty: z.number().min(0).max(1),
  tags: z.string().optional(),
});

export const CreateQuestionSchema = QuestionSchema.extend({
  categoryId: z.string().min(1, 'Category ID is required'),
  createdBy: z.string().min(1, 'Creator ID is required'),
});

// Quiz schemas
export const QuizSchema = z.object({
  title: z.string().min(1, 'Quiz title is required'),
  blurb: z.string().optional(),
  audience: z.string().optional(),
  difficultyBand: z.string().optional(),
  theme: z.string().optional(),
  seasonalTag: z.string().optional(),
});

export const CreateQuizSchema = QuizSchema.extend({
  schoolId: z.string().optional(),
  createdBy: z.string().min(1, 'Creator ID is required'),
});

// Question operations
export async function getQuestions(filters: {
  categoryId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { categoryId, status = 'published', page = 1, limit = 20 } = filters;
  
  const where = {
    ...(categoryId && { categoryId }),
    status,
  };

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        category: true,
        creator: {
          select: { name: true, email: true }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.question.count({ where })
  ]);

  return {
    questions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function createQuestion(data: z.infer<typeof CreateQuestionSchema>) {
  const validatedData = CreateQuestionSchema.parse(data);
  
  return prisma.question.create({
    data: {
      text: validatedData.text,
      answer: validatedData.answer,
      explanation: validatedData.explanation,
      difficulty: validatedData.difficulty,
      tags: validatedData.tags || '',
      categoryId: validatedData.categoryId,
      createdBy: validatedData.createdBy,
      status: 'draft'
    },
    include: {
      category: true,
      creator: {
        select: { name: true, email: true }
      }
    }
  });
}

// Quiz operations
export async function getQuizzes(filters: {
  schoolId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { schoolId, status = 'published', page = 1, limit = 20 } = filters;
  
  const where = {
    ...(schoolId && { schoolId }),
    status,
  };

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      include: {
        school: true,
        creator: {
          select: { name: true, email: true }
        },
        rounds: {
          include: {
            category: true,
            questions: {
              include: {
                question: true
              }
            }
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.quiz.count({ where })
  ]);

  return {
    quizzes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function createQuiz(data: z.infer<typeof CreateQuizSchema>) {
  const validatedData = CreateQuizSchema.parse(data);
  
  return prisma.quiz.create({
    data: {
      title: validatedData.title,
      blurb: validatedData.blurb,
      audience: validatedData.audience,
      difficultyBand: validatedData.difficultyBand,
      theme: validatedData.theme,
      seasonalTag: validatedData.seasonalTag,
      schoolId: validatedData.schoolId,
      createdBy: validatedData.createdBy,
      status: 'draft'
    },
    include: {
      school: true,
      creator: {
        select: { name: true, email: true }
      }
    }
  });
}

// Analytics operations
export async function getAnalytics(filters: {
  schoolId?: string;
  questionId?: string;
  dateRange?: string;
}) {
  const { schoolId, questionId, dateRange = '30d' } = filters;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - parseInt(dateRange.replace('d', '')));

  const where = {
    ...(schoolId && { schoolId }),
    ...(questionId && { questionId }),
    startedAt: {
      gte: startDate,
      lte: endDate
    }
  };

  const [runs, questionStats] = await Promise.all([
    prisma.run.findMany({
      where,
      include: {
        quiz: true,
        school: true,
        teacher: {
          select: { name: true, email: true }
        },
        stats: {
          include: {
            question: true
          }
        }
      },
      orderBy: { startedAt: 'desc' }
    }),
    prisma.runQuestionStat.findMany({
      where: questionId ? { questionId } : {},
      include: {
        question: true,
        run: {
          include: {
            school: true,
            teacher: {
              select: { name: true, email: true }
            }
          }
        }
      }
    })
  ]);

  // Calculate analytics
  const totalRuns = runs.length;
  const totalQuestions = questionStats.length;
  const avgAudienceSize = runs.reduce((sum, run) => sum + run.audienceSize, 0) / totalRuns || 0;

  const questionAnalytics = questionStats.reduce((acc, stat) => {
    const questionId = stat.questionId;
    if (!acc[questionId]) {
      acc[questionId] = {
        question: stat.question,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalSkipped: 0,
        totalExposed: 0,
        avgTime: 0,
        runs: []
      };
    }
    
    acc[questionId].totalCorrect += stat.correct;
    acc[questionId].totalIncorrect += stat.incorrect;
    acc[questionId].totalSkipped += stat.skipped;
    acc[questionId].totalExposed += stat.correct + stat.incorrect + stat.skipped;
    acc[questionId].avgTime = (acc[questionId].avgTime + (stat.avgSecs || 0)) / 2;
    acc[questionId].runs.push(stat.run);
    
    return acc;
  }, {} as Record<string, any>);

  return {
    summary: {
      totalRuns,
      totalQuestions,
      avgAudienceSize,
      dateRange: { startDate, endDate }
    },
    runs,
    questionAnalytics: Object.values(questionAnalytics)
  };
}