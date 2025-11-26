'use client'

/**
 * OPTIMIZATION: Separate component for custom quizzes list
 * Allows granular Suspense boundaries and lazy-loading Framer Motion
 * Only loads animations when this section is rendered
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { CustomQuizCardGridSkeleton } from '@/components/ui/CustomQuizCardSkeleton'
import type { CustomQuizV2 } from './custom-quizzes-server-v2'

// OPTIMIZATION: Lazy-load Framer Motion - only load when section renders
// This reduces initial bundle by ~50KB+
const LazyQuizCard = dynamic(
	() => import('./CustomQuizCard').then(mod => ({ default: mod.CustomQuizCard })),
	{ ssr: false, loading: () => <CustomQuizCardGridSkeleton count={1} /> }
)

interface CustomQuizzesListSectionProps {
	quizzes: CustomQuizV2[]
	onDelete: (quizId: string) => void
	onShare: (quiz: CustomQuizV2) => void
}

const INITIAL_QUIZZES = 12 // Show first 12, lazy load rest

export function CustomQuizzesListSection({ 
	quizzes, 
	onDelete, 
	onShare 
}: CustomQuizzesListSectionProps) {
	const [visibleQuizzes, setVisibleQuizzes] = useState(INITIAL_QUIZZES)
	const loadMoreRef = useRef<HTMLDivElement>(null)

	const visibleQuizzesList = useMemo(() => 
		quizzes.slice(0, visibleQuizzes),
		[quizzes, visibleQuizzes]
	)
	const hasMore = useMemo(() => 
		visibleQuizzes < quizzes.length,
		[visibleQuizzes, quizzes.length]
	)

	// OPTIMIZATION: Infinite scroll using Intersection Observer
	useEffect(() => {
		if (!hasMore) return

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries
				if (entry?.isIntersecting) {
					setVisibleQuizzes(prev => Math.min(prev + 6, quizzes.length))
				}
			},
			{ rootMargin: '200px' } // Start loading before reaching bottom
		)

		const currentRef = loadMoreRef.current
		if (currentRef) {
			observer.observe(currentRef)
		}

		return () => {
			if (currentRef) {
				observer.unobserve(currentRef)
			}
		}
	}, [hasMore, quizzes.length])

	if (quizzes.length === 0) {
		return null // Empty state handled by parent
	}

	return (
		<>
			{/* OPTIMIZATION: Lazy-loaded cards with progressive rendering */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{visibleQuizzesList.map((quiz, index) => (
					<LazyQuizCard
						key={quiz.id}
						quiz={quiz}
						onDelete={onDelete}
						onShare={onShare}
						index={index}
					/>
				))}
			</div>
			
			{/* Infinite scroll sentinel */}
			{hasMore && (
				<div ref={loadMoreRef} className="h-20 flex items-center justify-center">
					<CustomQuizCardGridSkeleton count={3} />
				</div>
			)}
		</>
	)
}

