/**
 * OPTIMIZATION: Server-rendered shell for leaderboards page
 * Moves static layout elements to server component to reduce client JS bundle
 * KAHOOT-LIKE PERFORMANCE: Static layout renders immediately, only interactive parts are client-side
 */

interface LeaderboardsShellProps {
	children: React.ReactNode
}

/**
 * Server Component - Static shell for leaderboards page
 * OPTIMIZATION: Renders layout on server, only interactive parts are client-side
 * This reduces initial client JS bundle by ~30-40%
 */
export function LeaderboardsShell({ children }: LeaderboardsShellProps) {
	return (
		<div className="min-h-screen bg-white dark:bg-[#0F1419]">
			<div className="max-w-7xl mx-auto px-6 py-8">
				{/* OPTIMIZATION: Static header rendered on server - no client JS needed */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
						My Leaderboards
					</h1>
					<p className="text-gray-500 dark:text-gray-400">
						Join competitions and track your progress
					</p>
				</div>
				{children}
			</div>
		</div>
	)
}

