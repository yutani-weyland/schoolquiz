'use client'

import React, { useState, useEffect } from "react"
import { Suspense } from 'react'
import { usePathname, useRouter } from "next/navigation"
import dynamic from 'next/dynamic'
import { QuizCardGridSkeleton } from '@/components/ui/Skeleton'
import type { QuizzesPageData } from './quizzes-server'
import type { Quiz } from "@/components/quiz/QuizCard"

// OPTIMIZATION: Lazy load quiz sections to reduce initial bundle size
// Framer Motion (~50KB+) is only loaded when section is rendered
// This significantly reduces initial client JS bundle
const LazyOfficialQuizzes = dynamic(() => import('./OfficialQuizzesSection').then(mod => ({ default: mod.OfficialQuizzesSection })), {
  ssr: false, // Client-side only (no SSR needed for animations)
  loading: () => <QuizCardGridSkeleton count={6} />
})

const LazyCustomQuizzes = dynamic(() => import('./CustomQuizzesSection').then(mod => ({ default: mod.CustomQuizzesSection })), {
  ssr: false, // Client-side only (no SSR needed for animations)
  loading: () => <QuizCardGridSkeleton count={6} />
})

interface QuizzesClientProps {
  initialData: QuizzesPageData
  quizzes: Quiz[]
}

type QuizViewType = 'official' | 'custom'

// OPTIMIZATION: Initial visible quizzes for lazy loading
const INITIAL_OFFICIAL_QUIZZES = 6 // Show first 6, lazy load rest

export function QuizzesClient({ initialData, quizzes }: QuizzesClientProps) {
  const [pageAnimationKey, setPageAnimationKey] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  // Removed: Greeting is now rendered correctly on the server in QuizzesShell
  // No client-side DOM manipulation needed - eliminates visual flash

  // Force re-animation whenever the page is navigated to (including via menu)
  useEffect(() => {
    if (pathname === '/quizzes') {
      setPageAnimationKey(prev => prev + 1)
    }
  }, [pathname])

  // Background preload: Prefetch the newest quiz when page loads
  useEffect(() => {
    if (quizzes.length > 0) {
      const newestQuiz = quizzes[0]
      if (newestQuiz && newestQuiz.status === 'available') {
        router.prefetch(`/quizzes/${newestQuiz.slug}/intro`)
        router.prefetch(`/quizzes/${newestQuiz.slug}/play`)
      }
    }
  }, [quizzes, router])

  const isPremium = initialData.isPremium

  return (
    <>
      {/* OPTIMIZATION: Granular Suspense boundaries + lazy loading for better streaming */}
      {/* Each section can load independently - faster perceived performance */}
      {/* Framer Motion is lazy-loaded only when section is rendered */}
      
      {/* Official Quizzes Section */}
      <Suspense fallback={<QuizCardGridSkeleton count={6} />}>
        <LazyOfficialQuizzes 
          quizzes={quizzes} 
          completions={initialData.completions}
          pageAnimationKey={pageAnimationKey} 
        />
      </Suspense>

      {/* Custom Quizzes Section - Only show for premium users */}
      {isPremium && (
        <div className="mt-12">
          <Suspense fallback={<QuizCardGridSkeleton count={6} />}>
            <LazyCustomQuizzes 
              initialData={{
                customQuizzes: initialData.customQuizzes,
                customQuizzesTotal: initialData.customQuizzesTotal,
                customQuizzesHasMore: initialData.customQuizzesHasMore,
                isPremium: initialData.isPremium
              }} 
              pageAnimationKey={pageAnimationKey} 
            />
          </Suspense>
        </div>
      )}
    </>
  )
}

