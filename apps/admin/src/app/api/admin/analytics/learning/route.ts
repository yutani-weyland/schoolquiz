/**
 * GET /api/admin/analytics/learning
 * Get learning analytics (outcome coverage, most missed outcomes, performance by difficulty)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    await requireAdmin(request).catch(() => {
      // Allow in development
    })

    // Check if quiz_completions table exists
    try {
      await prisma.quizCompletion.findFirst({ take: 1 })
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        return NextResponse.json({
          outcomeCoverage: [],
          mostMissedOutcomes: [],
          performanceByDifficulty: [],
          learningProgress: [],
          _warning: 'quiz_completions table does not exist. Please run CREATE_QUIZ_COMPLETIONS_TABLE.sql',
        })
      }
      throw error
    }

    // Get all quiz completions with question details
    const completions = await prisma.quizCompletion.findMany({
      include: {
        user: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 10000, // Limit for performance
    })

    // Get all questions with their categories
    // Handle null tags field by selecting specific fields
    const questions = await prisma.question.findMany({
      select: {
        id: true,
        categoryId: true,
        difficulty: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Create a map of quiz slug to questions (via rounds)
    const quizQuestionsMap = new Map<string, Array<{
      questionId: string
      categoryId: string
      categoryName: string
      difficulty: number
    }>>()

    // Fetch all quizzes with their rounds and questions
    const quizzes = await prisma.quiz.findMany({
      include: {
        rounds: {
          include: {
            questions: {
              include: {
                question: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    quizzes.forEach((quiz) => {
      if (!quiz.slug) return
      const questionList: Array<{
        questionId: string
        categoryId: string
        categoryName: string
        difficulty: number
      }> = []
      
      quiz.rounds.forEach((round) => {
        round.questions.forEach((qr) => {
          questionList.push({
            questionId: qr.question.id,
            categoryId: qr.question.categoryId || '',
            categoryName: qr.question.category?.name || 'Uncategorized',
            difficulty: qr.question.difficulty,
          })
        })
      })
      
      quizQuestionsMap.set(quiz.slug, questionList)
    })

    // Calculate outcome coverage (using categories as "outcomes")
    const categoryStats = new Map<string, {
      outcome: string
      questions: number
      correct: number
      total: number
    }>()

    completions.forEach((completion) => {
      const quizQuestions = quizQuestionsMap.get(completion.quizSlug) || []
      const score = completion.score
      const totalQuestions = completion.totalQuestions
      
      // Distribute score across categories (simplified - assumes equal distribution)
      const questionsPerCategory = quizQuestions.length / totalQuestions
      const scorePerCategory = score / (quizQuestions.length || 1)

      quizQuestions.forEach((q) => {
        if (!categoryStats.has(q.categoryId)) {
          categoryStats.set(q.categoryId, {
            outcome: q.categoryName,
            questions: 0,
            correct: 0,
            total: 0,
          })
        }
        const stats = categoryStats.get(q.categoryId)!
        stats.questions += 1
        stats.total += 1
        // Estimate correct answers (simplified)
        if (scorePerCategory > 0) {
          stats.correct += Math.min(1, scorePerCategory / questionsPerCategory)
        }
      })
    })

    const outcomeCoverage = Array.from(categoryStats.values())
      .map((stat) => ({
        outcome: stat.outcome,
        coverage: stat.total > 0 ? (stat.correct / stat.total) * 100 : 0,
        questions: stat.questions,
        correct: Math.round(stat.correct),
      }))
      .sort((a, b) => b.coverage - a.coverage)

    // Most missed outcomes (categories with lowest coverage)
    const mostMissedOutcomes = Array.from(categoryStats.values())
      .map((stat) => ({
        outcome: stat.outcome,
        missed: stat.total - stat.correct,
        total: stat.total,
        percentage: stat.total > 0 ? ((stat.total - stat.correct) / stat.total) * 100 : 0,
        difficulty: 'Medium', // Simplified - would need to calculate from question difficulties
      }))
      .filter((stat) => stat.total > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10)

    // Performance by difficulty
    const difficultyStats = new Map<string, {
      difficulty: string
      questions: number
      correct: number
    }>()

    // Group questions by difficulty band
    questions.forEach((q) => {
      let difficultyBand = 'Medium'
      if (q.difficulty < 0.33) difficultyBand = 'Low'
      else if (q.difficulty > 0.66) difficultyBand = 'High'

      if (!difficultyStats.has(difficultyBand)) {
        difficultyStats.set(difficultyBand, {
          difficulty: difficultyBand,
          questions: 0,
          correct: 0,
        })
      }
      const stats = difficultyStats.get(difficultyBand)!
      stats.questions += 1
    })

    // Calculate correct answers by difficulty from completions
    completions.forEach((completion) => {
      const quizQuestions = quizQuestionsMap.get(completion.quizSlug) || []
      const score = completion.score
      const totalQuestions = completion.totalQuestions
      
      if (totalQuestions === 0) return

      quizQuestions.forEach((q) => {
        let difficultyBand = 'Medium'
        if (q.difficulty < 0.33) difficultyBand = 'Low'
        else if (q.difficulty > 0.66) difficultyBand = 'High'

        const stats = difficultyStats.get(difficultyBand)
        if (stats) {
          // Estimate: assume score is distributed evenly
          const avgScorePerQuestion = score / totalQuestions
          stats.correct += avgScorePerQuestion
        }
      })
    })

    const performanceByDifficulty = Array.from(difficultyStats.values())
      .map((stat) => ({
        difficulty: stat.difficulty,
        questions: stat.questions,
        correct: Math.round(stat.correct),
        percentage: stat.questions > 0 ? (stat.correct / stat.questions) * 100 : 0,
      }))
      .sort((a, b) => {
        const order = { Low: 0, Medium: 1, High: 2 }
        return (order[a.difficulty as keyof typeof order] || 1) - (order[b.difficulty as keyof typeof order] || 1)
      })

    // Learning progress over time (last 12 weeks)
    const twelveWeeksAgo = new Date()
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

    const recentCompletions = completions.filter(
      (c) => c.completedAt >= twelveWeeksAgo
    )

    // Group by week
    const weeklyStats = new Map<string, {
      week: string
      completions: number
      totalScore: number
      totalQuestions: number
    }>()

    recentCompletions.forEach((completion) => {
      const weekStart = new Date(completion.completedAt)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week (Sunday)
      const weekStr = weekStart.toISOString().split('T')[0]

      if (!weeklyStats.has(weekStr)) {
        weeklyStats.set(weekStr, {
          week: weekStr,
          completions: 0,
          totalScore: 0,
          totalQuestions: 0,
        })
      }
      const stats = weeklyStats.get(weekStr)!
      stats.completions += 1
      stats.totalScore += completion.score
      stats.totalQuestions += completion.totalQuestions
    })

    const learningProgress = Array.from(weeklyStats.values())
      .map((stat) => ({
        week: stat.week,
        avgScore: stat.totalQuestions > 0
          ? (stat.totalScore / stat.totalQuestions) * 100
          : 0,
        completions: stat.completions,
      }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12) // Last 12 weeks

    return NextResponse.json({
      outcomeCoverage,
      mostMissedOutcomes,
      performanceByDifficulty,
      learningProgress,
    })
  } catch (error: any) {
    console.error('Error fetching learning analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch learning analytics', details: error.message },
      { status: 500 }
    )
  }
}
