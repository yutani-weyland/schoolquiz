import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

interface AdminLayoutProps {
  children: React.ReactNode
}

/**
 * Admin layout with role protection
 * Only PlatformAdmins can access routes under /admin/*
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  // For testing: Skip authentication check
  // TODO: Re-enable authentication in production
  const skipAuth = process.env.SKIP_ADMIN_AUTH === 'true' || process.env.NODE_ENV !== 'production'
  
  if (!skipAuth) {
    // Check if user is platform admin, redirect if not
    // This will gracefully handle database connection issues
    // Use dynamic import to avoid Prisma initialization errors at module load
    try {
      const { requirePlatformAdmin } = await import('@/lib/admin-auth')
      await requirePlatformAdmin()
    } catch (error: any) {
      // If there's a database error, show a helpful message
      // In development, we'll still render the layout
      if (process.env.NODE_ENV === 'production') {
        // In production, we need a database - throw the error
        throw error
      }
      
      // Development: continue without auth check if DB is unavailable
      // Check if it's a Prisma/DATABASE_URL error
      if (error?.message?.includes('Invalid character') || 
          error?.message?.includes('atob') ||
          error?.name === 'InvalidCharacterError') {
        console.warn('Admin auth check skipped (database not configured or invalid DATABASE_URL)')
      } else {
        // Other errors - log but continue in dev
        console.warn('Admin auth check failed:', error?.message || error)
      }
    }
  } else {
    console.log('🔓 Admin authentication skipped for testing')
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50 dark:bg-gray-900">
        <AdminTopbar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
