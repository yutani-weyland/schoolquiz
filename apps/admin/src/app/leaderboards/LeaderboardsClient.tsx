'use client'

/**
 * OPTIMIZATION: Main client component for Leaderboards page
 * - Lazy-loads Framer Motion (only when needed)
 * - Uses server actions instead of API routes
 * - Uses summary data (minimal payload)
 * - KAHOOT-LIKE PERFORMANCE: Minimal client JS, instant interactions
 */

import { useState, useTransition, useEffect, useRef } from 'react'
import { Trophy, Users, Building2, Search, Bell, BellOff } from 'lucide-react'
import { useUserTier } from '@/hooks/useUserTier'
import { UpgradeModal } from '@/components/premium/UpgradeModal'
import { canAccessFeature } from '@/lib/feature-gating'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { LeaderboardsSummaryData, LeaderboardSummary } from './leaderboards-summary-server'
import { joinLeaderboard, leaveLeaderboard, loadMoreLeaderboards } from './leaderboards-actions'
import { LeaderboardCardGridSkeleton } from '@/components/ui/LeaderboardCardSkeleton'

// OPTIMIZATION: Lazy-load LeaderboardsListSection to reduce initial bundle size
// Framer Motion (~50KB+) is only loaded when this section is rendered
const LazyLeaderboardsList = dynamic(
	() => import('./LeaderboardsListSection').then(mod => ({ default: mod.LeaderboardsListSection })),
	{
		ssr: false, // Client-side only (animations)
		loading: () => <LeaderboardCardGridSkeleton count={6} /> // Skeleton for initial load
	}
)

interface LeaderboardsClientProps {
	initialData: LeaderboardsSummaryData
}

export function LeaderboardsClient({ initialData }: LeaderboardsClientProps) {
	const router = useRouter()
	const { tier, isPremium: hookIsPremium } = useUserTier()
	const [isPending, startTransition] = useTransition()
	const [showUpgradeModal, setShowUpgradeModal] = useState(false)
	const [leaderboards, setLeaderboards] = useState(initialData)
	const [filter, setFilter] = useState<'all' | 'orgWide' | 'group' | 'adHoc'>('all')
	const [searchQuery, setSearchQuery] = useState('')
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [hasMore, setHasMore] = useState(initialData.hasMore || false)
	const loadMoreRef = useRef<HTMLDivElement>(null)

	// OPTIMIZATION: Sync state when initialData changes (from server-side refresh)
	useEffect(() => {
		setLeaderboards(initialData)
		setHasMore(initialData.hasMore || false)
	}, [initialData])

	// OPTIMIZATION: Infinite scroll using Intersection Observer
	useEffect(() => {
		if (!hasMore || isLoadingMore || searchQuery) return // Don't load more if searching

		const observer = new IntersectionObserver(
			entries => {
				const [entry] = entries
				if (entry?.isIntersecting) {
					handleLoadMore()
				}
			},
			{
				root: null, // viewport
				rootMargin: '200px', // Load when 200px from bottom
				threshold: 0.1,
			}
		)

		if (loadMoreRef.current) {
			observer.observe(loadMoreRef.current)
		}

		return () => {
			if (loadMoreRef.current) {
				observer.unobserve(loadMoreRef.current)
			}
		}
	}, [hasMore, isLoadingMore, searchQuery])

	const handleLoadMore = async () => {
		if (isLoadingMore || !hasMore) return

		setIsLoadingMore(true)
		try {
			const currentCount =
				leaderboards.orgWide.length + leaderboards.group.length + leaderboards.adHoc.length
			const newData = await loadMoreLeaderboards(currentCount, 20)

			setLeaderboards(prev => ({
				orgWide: [...prev.orgWide, ...newData.orgWide],
				group: [...prev.group, ...newData.group],
				adHoc: [...prev.adHoc, ...newData.adHoc],
				isPremium: prev.isPremium,
			}))
			setHasMore(newData.hasMore)
		} catch (error) {
			console.error('Failed to load more leaderboards:', error)
		} finally {
			setIsLoadingMore(false)
		}
	}

	// Use server data first, fallback to hook
	const isPremium = initialData.isPremium || hookIsPremium

	const handleJoin = async (leaderboardId: string) => {
		// Check if user can access this feature
		if (!canAccessFeature(tier, 'all_leaderboards')) {
			setShowUpgradeModal(true)
			return
		}

		try {
			await joinLeaderboard(leaderboardId)
			// OPTIMIZATION: Refresh via router instead of API call
			startTransition(() => {
				router.refresh()
			})
		} catch (error) {
			console.error('Error joining leaderboard:', error)
			alert('Failed to join leaderboard')
		}
	}

	const handleLeave = async (leaderboardId: string, mute: boolean = false) => {
		try {
			await leaveLeaderboard(leaderboardId, mute)
			// OPTIMIZATION: Refresh via router instead of API call
			startTransition(() => {
				router.refresh()
			})
		} catch (error) {
			console.error('Error leaving leaderboard:', error)
			alert('Failed to leave leaderboard')
		}
	}

	const filterLeaderboards = <T extends LeaderboardSummary>(list: T[]): T[] => {
		if (!searchQuery) return list
		const query = searchQuery.toLowerCase()
		return list.filter(
			lb =>
				lb.name.toLowerCase().includes(query) ||
				lb.description?.toLowerCase().includes(query)
		)
	}

	const allLeaderboards: Array<LeaderboardSummary & { section: 'orgWide' | 'group' | 'adHoc' }> = [
		...leaderboards.orgWide.map(lb => ({ ...lb, section: 'orgWide' as const })),
		...leaderboards.group.map(lb => ({ ...lb, section: 'group' as const })),
		...leaderboards.adHoc.map(lb => ({ ...lb, section: 'adHoc' as const })),
	]

	const filteredLeaderboards =
		filter === 'all'
			? allLeaderboards
			: allLeaderboards.filter(lb => lb.section === filter)

	const displayLeaderboards = filterLeaderboards(filteredLeaderboards)

	return (
		<>
			{/* Filters */}
			<div className="mb-6 flex flex-col sm:flex-row gap-4">
				<div className="flex-1 relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
					<input
						type="text"
						placeholder="Search leaderboards..."
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						disabled={isPending}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
					/>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => setFilter('all')}
						disabled={isPending}
						className={`px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${filter === 'all'
								? 'bg-blue-600 text-white'
								: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
							}`}
					>
						All
					</button>
					<button
						onClick={() => setFilter('orgWide')}
						disabled={isPending}
						className={`px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${filter === 'orgWide'
								? 'bg-blue-600 text-white'
								: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
							}`}
					>
						Org-wide
					</button>
					{isPremium && (
						<>
							<button
								onClick={() => setFilter('group')}
								disabled={isPending}
								className={`px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${filter === 'group'
										? 'bg-blue-600 text-white'
										: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
									}`}
							>
								Group
							</button>
							<button
								onClick={() => setFilter('adHoc')}
								disabled={isPending}
								className={`px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${filter === 'adHoc'
										? 'bg-blue-600 text-white'
										: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
									}`}
							>
								Ad-hoc
							</button>
						</>
					)}
				</div>
			</div>

			{/* Leaderboards List */}
			{displayLeaderboards.length === 0 ? (
				<div className="text-center py-12">
					<Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
					<p className="text-gray-500 dark:text-gray-400">
						{searchQuery
							? 'No leaderboards match your search'
							: 'No leaderboards available'}
					</p>
				</div>
			) : (
				<>
					{/* Section Headers (when showing all) */}
					{filter === 'all' && (
						<>
							{leaderboards.orgWide.length > 0 && (
								<SectionHeader
									title="Organisation-wide"
									count={leaderboards.orgWide.length}
									icon={Building2}
								/>
							)}
							{isPremium && leaderboards.group.length > 0 && (
								<SectionHeader
									title="Group Leaderboards"
									count={leaderboards.group.length}
									icon={Users}
								/>
							)}
							{isPremium && leaderboards.adHoc.length > 0 && (
								<SectionHeader
									title="Ad-hoc Leaderboards"
									count={leaderboards.adHoc.length}
									icon={Trophy}
								/>
							)}
						</>
					)}

					{/* OPTIMIZATION: Lazy-loaded list section with Framer Motion */}
					<Suspense fallback={<LeaderboardCardGridSkeleton count={6} />}>
						<LazyLeaderboardsList
							leaderboards={displayLeaderboards}
							onJoin={handleJoin}
							onLeave={handleLeave}
						/>
					</Suspense>

					{/* OPTIMIZATION: Infinite scroll sentinel */}
					{hasMore && !searchQuery && (
						<div ref={loadMoreRef} className="flex justify-center py-8">
							{isLoadingMore ? (
								<LeaderboardCardGridSkeleton count={3} />
							) : (
								// Invisible sentinel for infinite scroll
								<div className="h-1 w-1" />
							)}
						</div>
					)}
				</>
			)}

			{/* Upgrade Modal */}
			<UpgradeModal
				isOpen={showUpgradeModal}
				onClose={() => setShowUpgradeModal(false)}
				feature="Private Leagues & All Leaderboards"
			/>
		</>
	)
}

function SectionHeader({
	title,
	count,
	icon: Icon,
}: {
	title: string
	count: number
	icon: any
}) {
	return (
		<div className="flex items-center gap-2 mt-8 mb-4">
			<Icon className="w-5 h-5 text-gray-400" />
			<h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
			<span className="text-sm text-gray-500 dark:text-gray-400">({count})</span>
		</div>
	)
}
