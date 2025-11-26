'use client'

/**
 * OPTIMIZATION: Separate component for official quizzes section
 * Allows granular Suspense boundaries for better streaming
 */

import React, { useState, useRef, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { QuizCard, Quiz } from "@/components/quiz/QuizCard"
import { NextQuizTeaser } from "@/components/quiz/NextQuizTeaser"
import type { QuizCompletion } from './quizzes-server'

interface OfficialQuizzesSectionProps {
  quizzes: Quiz[]
  completions: Record<string, QuizCompletion>
  pageAnimationKey: number
}

const INITIAL_OFFICIAL_QUIZZES = 6 // Show first 6, lazy load rest

export function OfficialQuizzesSection({ quizzes, completions, pageAnimationKey }: OfficialQuizzesSectionProps) {
  const [visibleOfficialQuizzes, setVisibleOfficialQuizzes] = useState(INITIAL_OFFICIAL_QUIZZES)
  const officialLoadMoreRef = React.useRef<HTMLDivElement>(null)

  const visibleOfficialQuizzesList = useMemo(() => 
    quizzes.slice(0, visibleOfficialQuizzes),
    [quizzes, visibleOfficialQuizzes]
  )
  const hasMoreOfficialQuizzes = useMemo(() => 
    visibleOfficialQuizzes < quizzes.length,
    [visibleOfficialQuizzes, quizzes.length]
  )

  // OPTIMIZATION: Lazy load remaining official quizzes (called by infinite scroll)
  const handleLoadMoreOfficial = React.useCallback(() => {
    setVisibleOfficialQuizzes(prev => Math.min(prev + 6, quizzes.length))
  }, [quizzes.length])

  // OPTIMIZATION: Infinite scroll for official quizzes using Intersection Observer
  useEffect(() => {
    if (!hasMoreOfficialQuizzes) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          handleLoadMoreOfficial()
        }
      },
      {
        rootMargin: '200px',
        threshold: 0.1,
      }
    )

    const currentRef = officialLoadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMoreOfficialQuizzes, handleLoadMoreOfficial])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 md:gap-6">
      {/* Next Quiz Teaser Card */}
      <motion.div
        className="hidden md:block h-full"
        key={`teaser-${pageAnimationKey}`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.5,
          delay: 0.1,
          ease: [0.22, 1, 0.36, 1],
          type: 'spring',
          stiffness: 200,
          damping: 20
        }}
      >
        <NextQuizTeaser latestQuizId={quizzes[0]?.id || 12} />
      </motion.div>

      {/* OPTIMIZATION: Lazy load official quizzes - render only visible ones initially */}
      {visibleOfficialQuizzesList.map((quiz, index) => {
        const isNewest = index === 0
        const quizCompletion = completions[quiz.slug] ? {
          score: completions[quiz.slug].score,
          totalQuestions: completions[quiz.slug].totalQuestions,
          completedAt: completions[quiz.slug].completedAt,
        } : null
        return (
          <motion.div
            key={`quiz-${quiz.id}-${pageAnimationKey}`}
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
            <QuizCard 
              quiz={quiz} 
              isNewest={isNewest} 
              index={index}
              completionData={quizCompletion}
            />
          </motion.div>
        )
      })}
      
      {/* OPTIMIZATION: Infinite scroll sentinel for official quizzes */}
      {hasMoreOfficialQuizzes && (
        <div ref={officialLoadMoreRef} className="col-span-full flex justify-center mt-6 min-h-[100px]">
          {/* Loading indicator will show here when loading */}
        </div>
      )}
    </div>
  )
}

