/**
 * OPTIMIZATION: Server-rendered shell for quizzes page
 * Moves static layout elements to server component to reduce client JS bundle
 * NOTE: SiteHeader is still a client component (needs interactivity)
 * but moving layout wrapper to server reduces the client JS bundle
 */

import dynamic from 'next/dynamic'
import { Footer } from "@/components/Footer"
import { getSession } from '@/lib/auth'

interface QuizzesShellProps {
  children: React.ReactNode
}

// OPTIMIZATION: Lazy load SiteHeader to prevent blocking initial render
// SiteHeader uses useSession() and useUserAccess() which may make API calls
// Loading it asynchronously allows the page title (LCP element) to render first
const LazySiteHeader = dynamic(
  () => import("@/components/SiteHeader").then(mod => ({ default: mod.SiteHeader })),
  { 
    ssr: true, // Still SSR, but loads after initial shell
    loading: () => (
      // Placeholder header to prevent layout shift
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-[#0F1419] border-b border-gray-200 dark:border-gray-700" />
    )
  }
)

/**
 * Server Component - Static shell for quizzes page
 * OPTIMIZATION: Renders header and layout immediately without waiting for data
 * This improves LCP by showing header + title instantly
 * Fetches session to render correct greeting from the start (no client-side update needed)
 */
export async function QuizzesShell({ children }: QuizzesShellProps) {
  // Fetch session to get user name for greeting
  // This is cached via getSession() so it won't cause duplicate fetches
  const session = await getSession()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || null
  const isLoggedIn = !!session?.user

  // Render correct greeting from the start - no client-side update needed
  const greeting = isLoggedIn && userName 
    ? `G'day ${userName}!`
    : 'Your Quizzes'

  return (
    <>
      <LazySiteHeader fadeLogo={true} />
      <main className="min-h-screen pt-24 pb-0">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-6 lg:px-8 xl:px-12">
          {/* Page Title - Rendered with correct greeting from server */}
          {/* OPTIMIZATION: This is likely the LCP element - render it correctly from the start */}
          <div className="text-center mb-8">
            <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-4 min-h-[1.2em] flex items-center justify-center">
              <h1 className="w-full">{greeting}</h1>
            </div>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              Browse weekly quizzes
            </p>
          </div>
          {children}
        </div>
      </main>
      <Footer />
    </>
  )
}

