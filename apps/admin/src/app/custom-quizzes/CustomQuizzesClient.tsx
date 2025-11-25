'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContentCard } from '@/components/layout/ContentCard'
import { motion } from 'framer-motion'
import { Plus, Edit, Share2, Trash2, FileText, Search } from 'lucide-react'
import { CustomQuizUsageWidget } from '@/components/premium/CustomQuizUsageWidget'
import { ShareQuizModal } from '@/components/premium/ShareQuizModal'
import Link from 'next/link'
import type { CustomQuizzesPageData, CustomQuiz } from './custom-quizzes-server'

type FilterType = 'all' | 'mine' | 'shared'

interface CustomQuizzesClientProps {
	initialData: CustomQuizzesPageData
}

export function CustomQuizzesClient({ initialData }: CustomQuizzesClientProps) {
	const router = useRouter()
	const [quizzes, setQuizzes] = useState(initialData.quizzes)
	const [usage, setUsage] = useState(initialData.usage)
	const [filter, setFilter] = useState<FilterType>('all')
	const [searchQuery, setSearchQuery] = useState('')
	const [shareModalOpen, setShareModalOpen] = useState(false)
	const [selectedQuizForShare, setSelectedQuizForShare] = useState<CustomQuiz | null>(null)

	const filteredQuizzes = quizzes.filter(quiz => {
		const matchesFilter =
			filter === 'all' ||
			(filter === 'mine' && !quiz.isShared) ||
			(filter === 'shared' && quiz.isShared)
		
		const matchesSearch =
			!searchQuery ||
			quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			quiz.blurb?.toLowerCase().includes(searchQuery.toLowerCase())

		return matchesFilter && matchesSearch
	})

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
				// Refresh usage
				const usageRes = await fetch('/api/premium/custom-quizzes/usage', {
					credentials: 'include',
				})
				if (usageRes.ok) {
					const data = await usageRes.json()
					setUsage(data)
				}
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to delete quiz')
			}
		} catch (error) {
			console.error('Error deleting quiz:', error)
			alert('Failed to delete quiz')
		}
	}

	const refreshQuizzes = async () => {
		try {
			const res = await fetch('/api/premium/custom-quizzes?includeShared=true', {
				credentials: 'include',
			})

			if (res.ok) {
				const data = await res.json()
				setQuizzes(data.quizzes || [])
			}
		} catch (error) {
			console.error('Error refreshing quizzes:', error)
		}
	}

	return (
		<PageLayout>
			<PageContainer maxWidth="6xl">
				<PageHeader
					title="My Custom Quizzes"
					subtitle="Create, manage, and share your custom quizzes"
					centered
				/>

				{/* Usage Widget */}
				{usage && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="mb-8"
					>
						<CustomQuizUsageWidget usage={usage} />
					</motion.div>
				)}

				{/* Actions Bar */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
				>
					<div className="flex-1 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
						{/* Search */}
						<div className="relative flex-1 sm:max-w-md">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
							<input
								type="text"
								placeholder="Search quizzes..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-[hsl(var(--border))] rounded-full bg-[hsl(var(--input))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-colors"
							/>
						</div>

						{/* Filter */}
						<div className="flex gap-2">
							{(['all', 'mine', 'shared'] as FilterType[]).map((f) => (
								<button
									key={f}
									onClick={() => setFilter(f)}
									className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
										filter === f
											? 'bg-primary text-primary-foreground hover:bg-primary/90'
											: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
									}`}
								>
									{f === 'all' ? 'All' : f === 'mine' ? 'Mine' : 'Shared'}
								</button>
							))}
						</div>
					</div>

					{/* Create Button */}
					<Link
						href="/custom-quizzes/create"
						className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium"
					>
						<Plus className="w-4 h-4" />
						Create Quiz
					</Link>
				</motion.div>

				{/* Quizzes Grid */}
				{filteredQuizzes.length === 0 ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3 }}
					>
						<ContentCard padding="xl" rounded="3xl" hoverAnimation={false}>
							<div className="text-center py-12">
								<Plus className="w-16 h-16 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
								<h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">
									{searchQuery ? 'No quizzes found' : 'No custom quizzes yet'}
								</h3>
								<p className="text-[hsl(var(--muted-foreground))] mb-6">
									{searchQuery
										? 'Try adjusting your search or filters'
										: 'Create your first custom quiz to get started'}
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
					</motion.div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredQuizzes.map((quiz, index) => (
							<motion.div
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
													onClick={() => {
														setSelectedQuizForShare(quiz)
														setShareModalOpen(true)
													}}
													className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors text-sm font-medium"
												>
													<Share2 className="w-4 h-4" />
													Share
												</button>
												<button
													onClick={() => handleDelete(quiz.id)}
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
							</motion.div>
						))}
					</div>
				)}
			</PageContainer>

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
					usage={usage ? {
						quizzesShared: usage.currentMonth.quizzesShared,
						quizzesSharedLimit: usage.currentMonth.quizzesSharedLimit,
					} : undefined}
				/>
			)}
		</PageLayout>
	)
}

