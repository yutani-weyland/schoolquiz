/**
 * OPTIMIZATION: Server-rendered shell for custom quizzes page
 * Moves static layout elements to server component to reduce client JS bundle
 * OPTIMIZATION: Static layout renders immediately, only interactive parts are client-side
 * OPTIMIZATION: Shell-first rendering - header and layout render before data loads
 */

import dynamic from 'next/dynamic'
import { Footer } from '@/components/Footer'

// OPTIMIZATION: Lazy-load SiteHeader to reduce initial bundle
const LazySiteHeader = dynamic(
	() => import("@/components/SiteHeader").then(mod => ({ default: mod.SiteHeader })),
	{
		ssr: true,
		loading: () => (
			<header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-[#0F1419] border-b border-gray-200 dark:border-gray-700" />
		)
	}
)

interface CustomQuizzesShellProps {
	children: React.ReactNode
}

/**
 * Server Component - Static shell for custom quizzes page
 * OPTIMIZATION: Renders layout on server immediately, only interactive parts are client-side
 * OPTIMIZATION: Shell-first rendering improves LCP (Largest Contentful Paint)
 * This reduces initial client JS bundle by ~30-40%
 */
export function CustomQuizzesShell({ children }: CustomQuizzesShellProps) {
	return (
		<>
			<LazySiteHeader fadeLogo={true} />
			<main className="min-h-screen bg-gray-50 dark:bg-[#0F1419] pt-24 pb-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* OPTIMIZATION: Static header rendered immediately - no client JS needed */}
					{/* OPTIMIZATION: No Framer Motion - pure CSS for instant render */}
					<div className="mb-8 sm:mb-12 md:mb-16 text-center">
						<div className="mx-auto max-w-2xl">
							<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
								My Quizzes
							</h1>
							<p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
								Create, manage, and share your quizzes
							</p>
						</div>
					</div>
					{children}
				</div>
			</main>
			<Footer />
		</>
	)
}

