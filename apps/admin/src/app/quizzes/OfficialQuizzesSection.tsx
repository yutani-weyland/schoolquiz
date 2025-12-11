'use client'

/**
 * OPTIMIZATION: Separate component for official quizzes section
 * Allows granular Suspense boundaries for better streaming
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { QuizCard, Quiz } from "@/components/quiz/QuizCard"
import { NextQuizTeaser } from "@/components/quiz/NextQuizTeaser"
import { TeamSelector } from "@/components/quiz/TeamSelector"
import { useTeams } from "@/hooks/useTeams"
import { useQueryClient } from "@tanstack/react-query"
import type { QuizCompletion } from './quizzes-server'

interface OfficialQuizzesSectionProps {
  quizzes: Quiz[]
  completions: Record<string, QuizCompletion[]>
  pageAnimationKey: number
  isPremium: boolean
}

const INITIAL_OFFICIAL_QUIZZES = 6 // Show first 6, lazy load rest

export function OfficialQuizzesSection({ quizzes, completions, pageAnimationKey, isPremium }: OfficialQuizzesSectionProps) {
  const [visibleOfficialQuizzes, setVisibleOfficialQuizzes] = useState(INITIAL_OFFICIAL_QUIZZES)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const officialLoadMoreRef = React.useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { teams, isLoading: teamsLoading } = useTeams()

  // Prefetch teams data immediately when component mounts (if premium)
  React.useEffect(() => {
    if (isPremium && !teamsLoading && teams.length === 0) {
      queryClient.prefetchQuery({
        queryKey: ['user-teams'],
        queryFn: async () => {
          const response = await fetch('/api/user/teams', {
            credentials: 'include',
          });
          if (!response.ok) {
            if (response.status === 403) {
              return { teams: [], count: 0, maxTeams: 10 };
            }
            throw new Error('Failed to fetch teams');
          }
          return response.json();
        },
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [isPremium, teamsLoading, teams.length, queryClient]);

  // Load selected team from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && isPremium) {
      const stored = localStorage.getItem('selectedTeamId')
      // Check if user explicitly selected "(no team)" - stored as 'null' string
      if (stored === 'null') {
        setSelectedTeamId(null)
      } else if (stored) {
        setSelectedTeamId(stored)
      } else if (teams.length > 0 && !teamsLoading) {
        // Auto-select default team if no team is selected and user hasn't explicitly chosen "(no team)"
        const defaultTeam = teams.find(t => t.isDefault) || teams[0]
        if (defaultTeam) {
          setSelectedTeamId(defaultTeam.id)
        }
      }
    }
  }, [isPremium, teams, teamsLoading])

  // Store selected team in localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedTeamId === null) {
        // Store 'null' as string to indicate explicit "(no team)" selection
        localStorage.setItem('selectedTeamId', 'null')
      } else if (selectedTeamId) {
        localStorage.setItem('selectedTeamId', selectedTeamId)
      } else {
        localStorage.removeItem('selectedTeamId')
      }
    }
  }, [selectedTeamId])

  // Helper function to get best completion for a quiz (filtered by team if selected)
  const getBestCompletion = useCallback((quizSlug: string): QuizCompletion | null => {
    const quizCompletions = completions[quizSlug] || []
    if (quizCompletions.length === 0) return null

    // Filter by selected team: if teamId is selected, show that team's completions
    // If null (no team), show only personal completions (teamId is null)
    // If undefined (not using team selector), show all completions
    const filteredCompletions = selectedTeamId !== undefined
      ? selectedTeamId === null
        ? quizCompletions.filter(c => c.teamId === null)
        : quizCompletions.filter(c => c.teamId === selectedTeamId)
      : quizCompletions

    if (filteredCompletions.length === 0) return null

    // Return the best score (highest score/totalQuestions ratio)
    return filteredCompletions.reduce((best, current) => {
      const bestRatio = best.score / best.totalQuestions
      const currentRatio = current.score / current.totalQuestions
      return currentRatio > bestRatio ? current : best
    })
  }, [completions, selectedTeamId])

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
    <div className="space-y-6">
      {/* Team Selector removed - now shown under greeting in QuizzesShell */}

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
        const bestCompletion = getBestCompletion(quiz.slug)
          const quizCompletion = bestCompletion ? {
            score: bestCompletion.score,
            totalQuestions: bestCompletion.totalQuestions,
            completedAt: bestCompletion.completedAt,
          } : null
          
          // Get all team completions for this quiz (for multi-team display)
          const allCompletions = completions[quiz.slug] || []
          const teamCompletions = allCompletions
            .filter(c => c.teamId !== null) // Only team completions
            .map(c => ({
              teamId: c.teamId || null,
              teamName: c.teamName || null,
              teamColor: c.teamColor || null,
              score: c.score,
              totalQuestions: c.totalQuestions,
              completedAt: c.completedAt,
            }))
            // Sort by score descending (best scores first)
            .sort((a, b) => {
              const aRatio = a.score / a.totalQuestions
              const bRatio = b.score / b.totalQuestions
              return bRatio - aRatio
            })
          
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
                teamCompletions={teamCompletions.length > 0 ? teamCompletions : undefined}
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
    </div>
  )
}







