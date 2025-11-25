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
 * Usage:
 *   const user = await requireApiAuth();
 *   // user is guaranteed to be non-null here
 */
export async function requireApiAuth() {
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

