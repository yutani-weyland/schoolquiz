'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { QuizPlayerWrapper } from '@/components/quiz/QuizPlayerWrapper'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Loader2 } from 'lucide-react'
import { transformQuizToPlayFormat } from '@/lib/transformers/quizTransformers'

export default function CustomQuizPlayPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quizData, setQuizData] = useState<any>(null)
  const [metadata, setMetadata] = useState<any>(null)

  useEffect(() => {
    if (session?.user?.id) {
      loadQuiz()
    } else if (session === null) {
      router.push('/sign-in')
    }
  }, [quizId, session])

  const loadQuiz = async () => {
    try {
      if (!session?.user?.id) {
        router.push('/sign-in')
        return
      }

      const res = await fetch(`/api/premium/custom-quizzes/${quizId}`, {
        credentials: 'include', // Send session cookie
      })

      if (!res.ok) {
        if (res.status === 404) {
          setError('Quiz not found or you do not have access')
        } else {
          const errorData = await res.json()
          setError(errorData.error || 'Failed to load quiz')
        }
        return
      }

      const data = await res.json()
      const quiz = data.quiz

      // Transform rounds and questions to play format
      const rounds = quiz.rounds.map((round: any, index: number) => ({
        number: index + 1,
        title: round.title || `Round ${index + 1}`,
        blurb: round.blurb || '',
      }))

      const questions = quiz.rounds.flatMap((round: any, roundIndex: number) => 
        round.questions.map((q: any, qIndex: number) => ({
          id: parseInt(q.id, 36) || qIndex + roundIndex * 100, // Convert CUID to number
          question: q.text,
          answer: q.answer,
          roundNumber: roundIndex + 1,
          ...(q.explanation && { explanation: q.explanation }),
        }))
      )
      
      setQuizData({ questions, rounds })
      setMetadata({
        slug: quiz.slug || quizId,
        title: quiz.title,
        blurb: quiz.blurb || '',
        weekISO: new Date().toISOString().split('T')[0],
        colorHex: quiz.colorHex || '#6366f1',
        isCustom: true,
      })
    } catch (err: any) {
      console.error('Error loading custom quiz:', err)
      setError(err.message || 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error || !quizData || !metadata) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            {error || 'Quiz not found'}
          </h2>
          <button
            onClick={() => router.push('/custom-quizzes')}
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            Back to My Quizzes
          </button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <QuizPlayerWrapper
        quizTitle={metadata.title}
        quizColor={metadata.colorHex}
        quizSlug={metadata.slug}
        questions={quizData.questions}
        rounds={quizData.rounds}
        weekISO={metadata.weekISO}
        isNewest={false}
        isCustom={true}
        customQuizId={quizId}
      />
    </ErrorBoundary>
  )
}

