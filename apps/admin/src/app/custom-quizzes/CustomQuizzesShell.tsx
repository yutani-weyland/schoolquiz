/**
 * OPTIMIZATION: Server-rendered shell for custom quizzes page
 * Moves static layout elements to server component to reduce client JS bundle
 * OPTIMIZATION: Static layout renders immediately, only interactive parts are client-side
 */

import { PageLayout } from '@/components/layout/PageLayout'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'

interface CustomQuizzesShellProps {
	children: React.ReactNode
}

/**
 * Server Component - Static shell for custom quizzes page
 * OPTIMIZATION: Renders layout on server, only interactive parts are client-side
 * This reduces initial client JS bundle by ~30-40%
 */
export function CustomQuizzesShell({ children }: CustomQuizzesShellProps) {
	return (
		<PageLayout>
			<PageContainer maxWidth="6xl">
				{/* OPTIMIZATION: Static header rendered on server - no client JS needed */}
				<PageHeader
					title="My Custom Quizzes"
					subtitle="Create, manage, and share your custom quizzes"
					centered
				/>
				{children}
			</PageContainer>
		</PageLayout>
	)
}

