'use client'

/**
 * OPTIMIZATION: Main client component for Custom Quizzes page
 * - Lazy-loads Framer Motion (only when needed)
 * - Uses Suspense boundaries for streaming
 * - Minimizes client JS bundle
 */

import { useState, useTransition, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ContentCard } from '@/components/layout/ContentCard'
import dynamic from 'next/dynamic'
import { Plus, Search } from 'lucide-react'
import { ShareQuizModal } from '@/components/premium/ShareQuizModal'
import { CustomQuizzesTabs, type CustomQuizTab } from './CustomQuizzesTabs'
import { CustomQuizCardGridSkeleton } from '@/components/ui/CustomQuizCardSkeleton'
import Link from 'next/link'
import type { CustomQuizzesPageDataV2, CustomQuizV2 } from './custom-quizzes-server-v2'
import type { CustomQuizzesContext } from './custom-quizzes-context-server'

// OPTIMIZATION: Lazy-load list section (contains Framer Motion)
// Only loads when quizzes are ready - reduces initial bundle by ~50KB+
const LazyCustomQuizzesList = dynamic(
	() => import('./CustomQuizzesListSection').then(mod => ({ default: mod.CustomQuizzesListSection })),
	{ 
		ssr: false, // Client-side only (animations)
		loading: () => <CustomQuizCardGridSkeleton count={6} />
	}
)

interface CustomQuizzesClientProps {
	initialData: CustomQuizzesPageDataV2
	initialTab: CustomQuizTab
	context: CustomQuizzesContext
}

export function CustomQuizzesClient({ 
	initialData, 
	initialTab,
	context 
}: CustomQuizzesClientProps) {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [isPending, startTransition] = useTransition()
	
	// OPTIMIZATION: Ensure quizzes array exists (defensive programming)
	const [quizzes, setQuizzes] = useState<CustomQuizV2[]>(initialData?.quizzes || [])
	const [activeTab, setActiveTab] = useState<CustomQuizTab>(initialTab || 'all')
	const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '')
	const [shareModalOpen, setShareModalOpen] = useState(false)
	const [selectedQuizForShare, setSelectedQuizForShare] = useState<CustomQuizV2 | null>(null)

	// OPTIMIZATION: Update local state when initialData changes (from server-side filtering)
	// Use useEffect to properly handle state updates
	useEffect(() => {
		if (initialData?.quizzes) {
			setQuizzes(initialData.quizzes)
		}
	}, [initialData])

	useEffect(() => {
		if (initialTab) {
			setActiveTab(initialTab)
		}
	}, [initialTab])

	useEffect(() => {
		const currentSearch = searchParams?.get('search') || ''
		if (currentSearch !== searchQuery) {
			setSearchQuery(currentSearch)
		}
	}, [searchParams, searchQuery])

	// OPTIMIZATION: Tab changes trigger server-side filtering (via URL)
	const handleTabChange = (tab: CustomQuizTab) => {
		setActiveTab(tab)
		startTransition(() => {
			const params = new URLSearchParams(searchParams?.toString() || '')
			params.set('tab', tab)
			if (searchQuery) {
				params.set('search', searchQuery)
			}
			router.push(`/custom-quizzes?${params.toString()}`)
		})
	}

	// OPTIMIZATION: Search triggers server-side filtering (via URL)
	const handleSearchChange = (query: string) => {
		setSearchQuery(query)
		startTransition(() => {
			const params = new URLSearchParams(searchParams?.toString() || '')
			params.set('tab', activeTab)
			if (query) {
				params.set('search', query)
			} else {
				params.delete('search')
			}
			router.push(`/custom-quizzes?${params.toString()}`)
		})
	}

	const handleDelete = async (quizId: string) => {
		if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
			return
		}

		try {
			const res = await fetch(`/api/premium/custom-quizzes/${quizId}`, {
				method: 'DELETE',
				credentials: 'include',
			})

			if (res.ok) {
				setQuizzes(quizzes.filter(q => q.id !== quizId))
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to delete quiz')
			}
		} catch (error) {
			console.error('Error deleting quiz:', error)
			alert('Failed to delete quiz')
		}
	}

	// OPTIMIZATION: Refresh quizzes by reloading page data (server-side filtering)
	const refreshQuizzes = () => {
		startTransition(() => {
			router.refresh()
		})
	}

	return (
		<>
			{/* OPTIMIZATION: Tabs - Static, no animation needed for instant render */}
			<div className="mb-6 flex items-center justify-center">
				<CustomQuizzesTabs
					activeTab={activeTab}
					onTabChange={handleTabChange}
				/>
			</div>

			{/* OPTIMIZATION: Actions Bar - Static, no animation needed */}
			<div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
					{/* Search */}
					<div className="relative flex-1 sm:max-w-md">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
						<input
							type="text"
							placeholder="Search quizzes..."
							value={searchQuery}
							onChange={(e) => handleSearchChange(e.target.value)}
							disabled={isPending}
							className="w-full pl-10 pr-4 py-2 border border-[hsl(var(--border))] rounded-full bg-[hsl(var(--input))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-colors disabled:opacity-50"
						/>
					</div>

					{/* Create Button */}
					<Link
						href="/custom-quizzes/create"
						className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium"
					>
						<Plus className="w-4 h-4" />
						Create Quiz
					</Link>
			</div>

			{/* OPTIMIZATION: Granular Suspense boundary - quizzes list loads independently */}
			{/* Shows skeleton immediately, then streams in quiz cards */}
			<Suspense fallback={<CustomQuizCardGridSkeleton count={6} />}>
				{(!quizzes || quizzes.length === 0) ? (
					<ContentCard padding="xl" rounded="3xl" hoverAnimation={false}>
							<div className="text-center py-12">
								<Plus className="w-16 h-16 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
								<h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">
									{searchQuery 
										? 'No quizzes found' 
										: activeTab === 'shared'
											? 'No quizzes shared with you'
											: activeTab === 'recent'
												? 'No recent quizzes'
												: activeTab === 'drafts'
													? 'No drafts'
													: 'No custom quizzes yet'}
								</h3>
								<p className="text-[hsl(var(--muted-foreground))] mb-6">
									{searchQuery
										? 'Try adjusting your search or filters'
										: activeTab === 'shared'
											? 'Quizzes shared with you will appear here'
											: activeTab === 'recent'
												? 'Your recently updated quizzes will appear here'
												: activeTab === 'drafts'
													? 'Your draft quizzes will appear here'
													: 'Create your first quiz to get started'}
								</p>
								{!searchQuery && (
									<Link
										href="/custom-quizzes/create"
										className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium"
									>
										<Plus className="w-4 h-4" />
										Create Your First Quiz
									</Link>
								)}
							</div>
						</ContentCard>
					) : (
						<LazyCustomQuizzesList
							quizzes={quizzes}
							onDelete={handleDelete}
							onShare={(quiz) => {
								setSelectedQuizForShare(quiz)
								setShareModalOpen(true)
							}}
						/>
					)}
			</Suspense>

			{/* Share Modal */}
			{selectedQuizForShare && (
				<ShareQuizModal
					quizId={selectedQuizForShare.id}
					quizTitle={selectedQuizForShare.title}
					isOpen={shareModalOpen}
					onClose={() => {
						setShareModalOpen(false)
						setSelectedQuizForShare(null)
					}}
					onSuccess={() => {
						refreshQuizzes()
					}}
				/>
			)}
		</>
	)
}

