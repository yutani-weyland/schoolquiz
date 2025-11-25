'use client'

import React, { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SiteHeader } from "@/components/SiteHeader"
import { QuizCard, Quiz } from "@/components/quiz/QuizCard"
import { NextQuizTeaser } from "@/components/quiz/NextQuizTeaser"
import { SkeletonCard } from "@/components/ui/Skeleton"
import { Footer } from "@/components/Footer"
import { usePathname } from "next/navigation"
import { getQuizColor } from '@/lib/colors'
import { Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { QuizzesPageData, QuizCompletion } from './quizzes-server'

interface QuizzesClientProps {
  initialData: QuizzesPageData
  quizzes: Quiz[]
}

type QuizViewType = 'official' | 'custom'

export function QuizzesClient({ initialData, quizzes }: QuizzesClientProps) {
  const [mounted, setMounted] = useState(false)
  const [pageAnimationKey, setPageAnimationKey] = useState(0)
  const [viewType, setViewType] = useState<QuizViewType>('official')
  const [customQuizzes, setCustomQuizzes] = useState(initialData.customQuizzes)
  const [completions, setCompletions] = useState(initialData.completions)
  const pathname = usePathname()

  // Force re-animation whenever the page is navigated to (including via menu)
  useEffect(() => {
    if (pathname === '/quizzes') {
      setPageAnimationKey(prev => prev + 1)
    }
  }, [pathname])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch custom quizzes when viewType changes to 'custom' (if not already loaded)
  useEffect(() => {
    if (viewType === 'custom' && initialData.isPremium && customQuizzes.length === 0) {
      fetch('/api/premium/custom-quizzes?includeShared=true', {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          if (data.quizzes) {
            setCustomQuizzes(data.quizzes)
          }
        })
        .catch(error => {
          console.error('Error fetching custom quizzes:', error)
        })
    }
  }, [viewType, initialData.isPremium, customQuizzes.length])

  const userName = initialData.userName
  const isLoggedIn = initialData.isLoggedIn
  const isPremium = initialData.isPremium

  return (
    <>
      <SiteHeader fadeLogo={true} />
      <main className="min-h-screen pt-24 pb-0">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-6 lg:px-8 xl:px-12">
          {/* Page Title */}
          <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white text-center mb-8 min-h-[1.2em] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!mounted ? (
                <motion.div
                  key="skeleton-title"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-md mx-auto"
                >
                  <div className="w-full h-[80px] bg-[hsl(var(--muted))] rounded-lg animate-pulse" />
                </motion.div>
              ) : (
                <motion.h1
                  key={isLoggedIn && userName ? `greeting-${userName}` : 'default-title'}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full"
                >
                  {isLoggedIn && userName ? `G'day ${userName}!` : "Your Quizzes"}
                </motion.h1>
              )}
            </AnimatePresence>
          </div>

          {/* Segmented Control - Only show for premium users */}
          {isPremium && (
            <div className="mb-8 flex items-center justify-center">
              <div className="inline-flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                <button
                  onClick={() => setViewType('official')}
                  className={`px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    viewType === 'official'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Weekly Quiz Drop
                </button>
                <button
                  onClick={() => setViewType('custom')}
                  className={`px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    viewType === 'custom'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  My Custom Quizzes
                </button>
              </div>
            </div>
          )}

          {/* Quizzes Grid - Responsive with overlapping cards on mobile */}
          {viewType === 'custom' && isPremium ? (
            // Custom Quizzes View
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 md:gap-6">
              {customQuizzes.length === 0 ? (
                // Empty state - no custom quizzes
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
                // Display custom quizzes
                customQuizzes.map((quiz, index) => {
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
                })
              )}
            </div>
          ) : (
            // Official Quizzes View (default)
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 md:gap-6">
              <>
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

                {quizzes.map((quiz, index) => {
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
                        delay: 0.1 + (index * 0.05), // Stagger by 50ms per card
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
              </>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}

