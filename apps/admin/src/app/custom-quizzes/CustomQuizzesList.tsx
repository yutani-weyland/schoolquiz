'use client'

/**
 * OPTIMIZATION: Separate component for quizzes list
 * Allows granular Suspense boundaries for better streaming
 * Lazy-loads Framer Motion for animations
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ContentCard } from '@/components/layout/ContentCard'
import { Plus, Edit, Share2, Trash2, FileText, Loader2 } from 'lucide-react'
import type { CustomQuiz } from './custom-quizzes-server'
import { loadMoreCustomQuizzes } from './custom-quizzes-actions'

// OPTIMIZATION: Lazy load Framer Motion - large bundle (~50KB+)
const MotionDiv = dynamic(
	() => import('framer-motion').then(mod => ({ default: mod.motion.div })),
	{ 
		ssr: false, // Client-side only (no SSR for animations)
		loading: () => <div /> // Fallback while loading
	}
)

interface CustomQuizzesListProps {
	initialQuizzes: CustomQuiz[]
	sharedQuizzes: CustomQuiz[]
	hasMore: boolean
	onDelete: (quizId: string) => Promise<void>
	onShare: (quiz: CustomQuiz) => void
}

export function CustomQuizzesList({ 
	initialQuizzes, 
	sharedQuizzes, 
	hasMore: initialHasMore,
	onDelete,
	onShare 
}: CustomQuizzesListProps) {
	const [quizzes, setQuizzes] = useState<CustomQuiz[]>(initialQuizzes)
	const [hasMore, setHasMore] = useState(initialHasMore)
	const [loadingMore, setLoadingMore] = useState(false)
	const loadMoreRef = useRef<HTMLDivElement>(null)

	// OPTIMIZATION: Combine owned and shared quizzes
	const allQuizzes = useMemo(() => {
		return [...quizzes, ...sharedQuizzes]
	}, [quizzes, sharedQuizzes])

	// OPTIMIZATION: Load more quizzes using server action
	const handleLoadMore = useCallback(async () => {
		if (loadingMore || !hasMore) return
		
		setLoadingMore(true)
		try {
			const result = await loadMoreCustomQuizzes(quizzes.length, 12)
			if (result.quizzes.length > 0) {
				setQuizzes(prev => [...prev, ...result.quizzes])
				setHasMore(result.hasMore)
			}
		} catch (error) {
			console.error('Failed to load more quizzes:', error)
		} finally {
			setLoadingMore(false)
		}
	}, [loadingMore, hasMore, quizzes.length])

	// OPTIMIZATION: Infinite scroll using Intersection Observer
	useEffect(() => {
		if (!hasMore) return

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries
				if (entry?.isIntersecting && !loadingMore) {
					handleLoadMore()
				}
			},
			{
				rootMargin: '200px',
				threshold: 0.1,
			}
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
	}, [hasMore, handleLoadMore, loadingMore])

	if (allQuizzes.length === 0) {
		return (
			<ContentCard padding="xl" rounded="3xl" hoverAnimation={false}>
				<div className="text-center py-12">
					<Plus className="w-16 h-16 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
					<h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">
						No custom quizzes yet
					</h3>
					<p className="text-[hsl(var(--muted-foreground))] mb-6">
						Create your first quiz to get started
					</p>
					<Link
						href="/custom-quizzes/create"
						className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium"
					>
						<Plus className="w-4 h-4" />
						Create Your First Quiz
					</Link>
				</div>
			</ContentCard>
		)
	}

	return (
		<>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{allQuizzes.map((quiz, index) => (
					<MotionDiv
						key={quiz.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 + index * 0.05 }}
					>
						<ContentCard padding="lg" rounded="3xl" hoverAnimation={true}>
							{/* Quiz Header */}
							<div
								className="h-32 rounded-xl mb-4 flex items-center justify-center"
								style={{
									backgroundColor: quiz.colorHex || '#6366f1',
								}}
							>
								<h3 className="text-xl font-bold text-white text-center px-4 line-clamp-2">
									{quiz.title}
								</h3>
							</div>

							{/* Quiz Info */}
							<div className="mb-4">
								{quiz.blurb && (
									<p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-2">
										{quiz.blurb}
									</p>
								)}
								<div className="flex items-center gap-2 text-xs">
									<span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
										Custom
									</span>
									{quiz.isShared && (
										<span className="px-2 py-1 bg-[#059669]/10 text-[#059669] rounded-full">
											Shared
										</span>
									)}
									{quiz.shareCount && quiz.shareCount > 0 && (
										<span className="px-2 py-1 bg-accent text-accent-foreground rounded-full">
											{quiz.shareCount} shares
										</span>
									)}
								</div>
							</div>

							{/* Actions */}
							<div className="flex gap-2">
								{!quiz.isShared && (
									<>
										<Link
											href={`/custom-quizzes/create?edit=${quiz.id}`}
											className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors text-sm font-medium"
										>
											<Edit className="w-4 h-4" />
											Edit
										</Link>
										<button
											onClick={() => onShare(quiz)}
											className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors text-sm font-medium"
										>
											<Share2 className="w-4 h-4" />
											Share
										</button>
										<button
											onClick={() => onDelete(quiz.id)}
											className="px-3 py-2 bg-destructive/10 text-destructive rounded-full hover:bg-destructive/20 transition-colors"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</>
								)}
								<Link
									href={`/custom-quizzes/${quiz.id}/play`}
									className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors text-sm font-medium"
								>
									<FileText className="w-4 h-4" />
									Play
								</Link>
							</div>
						</ContentCard>
					</MotionDiv>
				))}
			</div>

			{/* OPTIMIZATION: Infinite scroll sentinel */}
			{hasMore && (
				<div ref={loadMoreRef} className="col-span-full flex justify-center mt-6 min-h-[100px]">
					{loadingMore && (
						<div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
							<Loader2 className="w-5 h-5 animate-spin" />
							<span>Loading more quizzes...</span>
						</div>
					)}
				</div>
			)}
		</>
	)
}







