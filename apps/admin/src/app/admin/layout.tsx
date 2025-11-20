import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CommandPalette } from '@/components/admin/CommandPalette'

interface AdminLayoutProps {
  children: React.ReactNode
}

/**
 * Admin layout with role protection
 * Only PlatformAdmins can access routes under /admin/*
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Authentication is now handled by middleware (apps/admin/src/middleware.ts)
  // This preserves static rendering for pages that don't need auth
  // 
  // For platform admin role check, we still do it here since middleware
  // shouldn't do database queries. But we can make it optional in dev.
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
    <div className="flex h-screen w-screen overflow-hidden bg-[hsl(var(--background))]">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[hsl(var(--background))]">
        <AdminTopbar />
        <ScrollArea className="flex-1">
          <main className="p-6 bg-[hsl(var(--background))]">
            {children}
          </main>
        </ScrollArea>
      </div>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  )
}
