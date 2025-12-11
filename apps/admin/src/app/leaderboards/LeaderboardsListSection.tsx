'use client'

/**
 * OPTIMIZATION: Separate component for leaderboards list
 * Allows granular Suspense boundaries and lazy-loading Framer Motion
 * Only loads animations when this section is rendered
 * KAHOOT-LIKE PERFORMANCE: Animations loaded on-demand, not upfront
 */

import dynamic from 'next/dynamic'
import type { LeaderboardSummary } from './leaderboards-summary-server'

// OPTIMIZATION: Lazy-load Framer Motion - only load when section renders
// This reduces initial bundle by ~50KB+
const LazyMotionDiv = dynamic(
	() => import('framer-motion').then(mod => ({ default: mod.motion.div })),
	{
		ssr: false,
		loading: () => <div />, // Minimal fallback
	}
)

const LazyMotionButton = dynamic(
	() => import('framer-motion').then(mod => ({ default: mod.motion.button })),
	{
		ssr: false,
		loading: () => <button />, // Minimal fallback
	}
)

interface LeaderboardsListSectionProps {
	leaderboards: Array<LeaderboardSummary & { section: 'orgWide' | 'group' | 'adHoc' }>
	onJoin: (leaderboardId: string) => void
	onLeave: (leaderboardId: string, mute: boolean) => void
}

export function LeaderboardsListSection({
	leaderboards,
	onJoin,
	onLeave,
}: LeaderboardsListSectionProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{leaderboards.map((leaderboard, index) => (
				<LazyMotionDiv
					key={leaderboard.id}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: index * 0.05 }}
					className={`bg-white dark:bg-gray-800 rounded-lg border ${
						leaderboard.isMuted
							? 'border-gray-200 dark:border-gray-700 opacity-60'
							: 'border-gray-200 dark:border-gray-700 hover:border-blue-500'
					} p-6`}
				>
					<div className="flex items-start justify-between mb-3">
						<div className="flex-1">
							<h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
								{leaderboard.name}
								{leaderboard.isMuted && (
									<svg
										className="w-4 h-4 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
										/>
									</svg>
								)}
							</h3>
							<div className="flex items-center gap-2 mb-2">
								<span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
									{leaderboard.visibility === 'ORG_WIDE'
										? 'Org-wide'
										: leaderboard.visibility === 'GROUP'
											? 'Group'
											: 'Ad-hoc'}
								</span>
								{leaderboard.organisationGroup && (
									<span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
										{leaderboard.organisationGroup.name}
									</span>
								)}
								{leaderboard.organisation && (
									<span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
										{leaderboard.organisation.name}
									</span>
								)}
							</div>
						</div>
					</div>

					{leaderboard.description && (
						<p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
							{leaderboard.description}
						</p>
					)}

					<div className="flex items-center justify-between">
						<span className="text-sm text-gray-500 dark:text-gray-400">
							{leaderboard.memberCount} member{leaderboard.memberCount !== 1 ? 's' : ''}
						</span>

						<div className="flex gap-2">
							{leaderboard.isMember ? (
								<>
									{leaderboard.visibility === 'ORG_WIDE' && (
										<LazyMotionButton
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={() => onLeave(leaderboard.id, true)}
											className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex items-center gap-1"
										>
											{leaderboard.isMuted ? (
												<svg
													className="w-3 h-3"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
													/>
												</svg>
											) : (
												<svg
													className="w-3 h-3"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
													/>
												</svg>
											)}
											{leaderboard.isMuted ? 'Unmute' : 'Mute'}
										</LazyMotionButton>
									)}
									<LazyMotionButton
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => onLeave(leaderboard.id, false)}
										className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
									>
										Leave
									</LazyMotionButton>
								</>
							) : (
								<LazyMotionButton
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => onJoin(leaderboard.id)}
									transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.8 }}
									className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
								>
									Join
								</LazyMotionButton>
							)}
						</div>
					</div>
				</LazyMotionDiv>
			))}
		</div>
	)
}







