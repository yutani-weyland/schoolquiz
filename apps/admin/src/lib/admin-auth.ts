import { redirect } from 'next/navigation'

/**
 * Check if user is a platform admin
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  try {
    // Lazy import to avoid Prisma initialization errors
    const { prisma } = await import('@schoolquiz/db')
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { platformRole: true },
    })
    return user?.platformRole === 'PLATFORM_ADMIN'
  } catch (error) {
    // If database is unavailable, allow access in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Database unavailable for admin check, allowing access in development')
      return true
    }
    return false
  }
}

/**
 * Require platform admin access or redirect
 * Gracefully handles database connection issues
 */
export async function requirePlatformAdmin() {
  // Check if DATABASE_URL is set first
  const dbUrl = process.env.DATABASE_URL
  
  if (!dbUrl) {
    // No database configured - for development, allow access
    // In production, this should redirect to an error page
    if (process.env.NODE_ENV === 'production') {
      redirect('/')
    }
    // Development: allow access without DB check
    return null
  }

  try {
    // Lazy import to avoid Prisma initialization errors at module load time
    const { getCurrentUser } = await import('./auth')
    const user = await getCurrentUser()
    
    if (!user) {
      redirect('/sign-in?callbackUrl=/admin')
    }

    const isAdmin = await isPlatformAdmin(user.id)
    
    if (!isAdmin) {
      // Redirect to home or show 404
      redirect('/')
    }

    return user
  } catch (error: any) {
    // If database connection fails, handle gracefully
    // Check if it's a Prisma/DATABASE_URL error
    if (error?.message?.includes('Invalid character') || 
        error?.message?.includes('atob') ||
        error?.message?.includes('DATABASE_URL')) {
      console.warn('Database connection error in admin auth (likely invalid DATABASE_URL):', error.message)
      
      // In development, allow access without DB
      if (process.env.NODE_ENV !== 'production') {
        return null
      }
      
      // In production, redirect
      redirect('/')
    }
    
    // Other errors - rethrow
    console.error('Unexpected error in admin auth:', error)
    throw error
  }
}

