/**
 * API Route Authentication Utilities
 * 
 * This module provides authentication helpers for API routes.
 * All API routes should use these functions instead of checking Authorization headers directly.
 * 
 * Uses NextAuth's auth() function to get the current session.
 */

import { auth } from '@schoolquiz/auth';
import { getCurrentUser, requireAuth } from './auth';
import { UnauthorizedError } from './api-error';

/**
 * Get the current authenticated user from NextAuth session
 * Returns null if not authenticated
 * 
 * This is the primary function for API routes to check authentication.
 * It uses NextAuth's session cookie, not Authorization headers.
 */
export async function getApiUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  
  return await getCurrentUser();
}

/**
 * Require authentication in API routes
 * Throws UnauthorizedError if not authenticated
 * 
 * OPTIMIZATION: Uses session data first (fast), only queries DB if needed
 * 
 * Usage:
 *   const user = await requireApiAuth();
 *   // user is guaranteed to be non-null here
 */
export async function requireApiAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError('Authentication required');
  }
  
  // OPTIMIZATION: Use session data if available (session callback already queries DB)
  // This avoids duplicate database queries for tier/subscription checks
  const sessionUser = session.user as any;
  if (sessionUser.tier && sessionUser.id) {
    // Session has tier data - return lightweight user object
    // Use tier directly from session (already calculated)
    const tier = sessionUser.tier === 'premium' ? 'premium' : 'basic';
    
    return {
      id: sessionUser.id,
      email: sessionUser.email || '',
      name: sessionUser.name || null,
      tier,
      subscriptionStatus: sessionUser.subscriptionStatus || null,
      freeTrialUntil: sessionUser.freeTrialUntil ? new Date(sessionUser.freeTrialUntil) : null,
      platformRole: sessionUser.platformRole || null,
    } as any;
  }
  
  // Fallback: Session doesn't have tier, query database
  // This should rarely happen if session callback is working correctly
  const user = await requireAuth();
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }
  return user;
}

/**
 * Get user ID from NextAuth session
 * Returns null if not authenticated
 */
export async function getApiUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

/**
 * Require user ID from NextAuth session
 * Throws UnauthorizedError if not authenticated
 */
export async function requireApiUserId(): Promise<string> {
  const userId = await getApiUserId();
  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }
  return userId;
}

