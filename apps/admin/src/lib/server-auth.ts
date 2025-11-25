/**
 * Server-side authentication utilities
 * 
 * @deprecated This file uses custom cookie-based auth. 
 * Use lib/auth.ts instead, which uses NextAuth's getServerSession().
 * 
 * Migration guide:
 * - getServerAuthUser() -> getCurrentUser() from lib/auth.ts
 * - getAuthTokenFromCookies() -> getSession() from lib/auth.ts
 * - requireAuth() -> requireAuth() from lib/auth.ts
 * 
 * This file is kept for backward compatibility during migration.
 * Will be removed in Phase 7 cleanup.
 */

import { cookies } from 'next/headers'
import { prisma } from '@schoolquiz/db'

export interface ServerAuthUser {
  userId: string
  email: string
  name: string | null
  tier: string | null
  platformRole: string | null
}

/**
 * Get auth token from cookies
 * Checks multiple cookie names for compatibility
 */
export async function getAuthTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  
  // Check multiple cookie names (compatibility with different auth systems)
  const token = 
    cookieStore.get('authToken')?.value ||
    cookieStore.get('next-auth.session-token')?.value ||
    cookieStore.get('__Secure-next-auth.session-token')?.value ||
    null

  return token
}

/**
 * Get authenticated user from cookies
 * Returns null if not authenticated or user not found
 */
export async function getServerAuthUser(): Promise<ServerAuthUser | null> {
  try {
    const token = await getAuthTokenFromCookies()
    
    if (!token) {
      return null
    }

    // Try to get userId from a separate cookie first (more reliable)
    const cookieStore = await cookies()
    let userId = cookieStore.get('userId')?.value
    
    // If not in cookie, try to extract from token (format: mock-token-{userId}-{timestamp})
    if (!userId) {
      const userIdMatch = token.match(/mock-token-([^-]+)-/)
      if (userIdMatch) {
        userId = userIdMatch[1]
      }
    }
    
    if (!userId) {
      return null
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        platformRole: true,
      },
    })

    if (!user) {
      return null
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      platformRole: user.platformRole,
    }
  } catch (error) {
    console.error('[server-auth] Error getting user from cookies:', error)
    return null
  }
}

/**
 * Require authentication - throws error or redirects if not authenticated
 * Use in Server Components or Server Actions
 */
export async function requireAuth(): Promise<ServerAuthUser> {
  const user = await getServerAuthUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

