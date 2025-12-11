'use client'

/**
 * OPTIMIZATION: Separate component for actions bar (search, filter, create button)
 * Isolated client component - only loaded when needed
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import type { CustomQuiz } from './custom-quizzes-server'

type FilterType = 'all' | 'mine' | 'shared'

interface CustomQuizzesActionsBarProps {
	quizzes: CustomQuiz[]
	onFilterChange: (filter: FilterType, searchQuery: string, filteredQuizzes: CustomQuiz[]) => void
}

export function CustomQuizzesActionsBar({ quizzes, onFilterChange }: CustomQuizzesActionsBarProps) {
	const [filter, setFilter] = useState<FilterType>('all')
	const [searchQuery, setSearchQuery] = useState('')

	// OPTIMIZATION: Filter quizzes client-side (no server round-trip)
	const filteredQuizzes = useMemo(() => {
		return quizzes.filter(quiz => {
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
	}, [quizzes, filter, searchQuery])

	// Notify parent of filter changes
	useMemo(() => {
		onFilterChange(filter, searchQuery, filteredQuizzes)
	}, [filter, searchQuery, filteredQuizzes, onFilterChange])

	return (
		<div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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
		</div>
	)
}







