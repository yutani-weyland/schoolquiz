'use client'

/**
 * OPTIMIZATION: Separate component for custom quizzes section
 * Allows granular Suspense boundaries for better streaming
 */

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { QuizCard, Quiz } from "@/components/quiz/QuizCard"
import { Plus, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { getQuizColor } from '@/lib/colors'
import { loadMoreCustomQuizzes } from './quizzes-actions'
import type { CustomQuiz, QuizzesPageData } from './quizzes-server'

interface CustomQuizzesSectionProps {
  initialData: Pick<QuizzesPageData, 'customQuizzes' | 'customQuizzesTotal' | 'customQuizzesHasMore' | 'isPremium'>
  pageAnimationKey: number
}

export function CustomQuizzesSection({ initialData, pageAnimationKey }: CustomQuizzesSectionProps) {
  const [customQuizzes, setCustomQuizzes] = useState<CustomQuiz[]>(initialData.customQuizzes)
  const [customQuizzesHasMore, setCustomQuizzesHasMore] = useState(initialData.customQuizzesHasMore)
  const [loadingMoreCustom, setLoadingMoreCustom] = useState(false)
  const customLoadMoreRef = React.useRef<HTMLDivElement>(null)

  // OPTIMIZATION: Load more custom quizzes using server action (called by infinite scroll)
  const handleLoadMoreCustom = React.useCallback(async () => {
    if (loadingMoreCustom || !customQuizzesHasMore) return
    
    setLoadingMoreCustom(true)
    try {
      const result = await loadMoreCustomQuizzes(customQuizzes.length, 12)
      if (result.quizzes.length > 0) {
        setCustomQuizzes(prev => [...prev, ...result.quizzes])
        setCustomQuizzesHasMore(result.hasMore)
      }
    } catch (error) {
      console.error('Failed to load more custom quizzes:', error)
    } finally {
      setLoadingMoreCustom(false)
    }
  }, [loadingMoreCustom, customQuizzesHasMore, customQuizzes.length])

  // OPTIMIZATION: Infinite scroll for custom quizzes using Intersection Observer
  useEffect(() => {
    if (!customQuizzesHasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting && !loadingMoreCustom) {
          handleLoadMoreCustom()
        }
      },
      {
        rootMargin: '200px',
        threshold: 0.1,
      }
    )

    const currentRef = customLoadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [customQuizzesHasMore, handleLoadMoreCustom, loadingMoreCustom])

  if (!initialData.isPremium) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 md:gap-6">
      {customQuizzes.length === 0 ? (
        <div className="col-span-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-12 text-center"
          >
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No custom quizzes yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first custom quiz to get started
            </p>
            <Link
              href="/premium/create-quiz"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Your First Quiz
            </Link>
          </motion.div>
        </div>
      ) : (
        <>
          {customQuizzes.map((quiz, index) => {
            const quizCard: Quiz = {
              id: parseInt(quiz.id.slice(-2)) || 0,
              slug: quiz.slug,
              title: quiz.title,
              blurb: quiz.blurb || '',
              weekISO: '',
              colorHex: quiz.colorHex || getQuizColor(0),
              status: quiz.status as any,
            }
            return (
              <motion.div
                key={`custom-quiz-${quiz.id}-${pageAnimationKey}`}
                className="h-auto sm:h-full"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 + (index * 0.05),
                  ease: [0.22, 1, 0.36, 1],
                  type: 'spring',
                  stiffness: 200,
                  damping: 20
                }}
              >
                <QuizCard quiz={quizCard} isNewest={false} index={index} />
              </motion.div>
            )
          })}
          
          {customQuizzesHasMore && (
            <div ref={customLoadMoreRef} className="col-span-full flex justify-center mt-6 min-h-[100px]">
              {loadingMoreCustom && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading more quizzes...</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

