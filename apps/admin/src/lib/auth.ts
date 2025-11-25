/**
 * Unified Authentication Utilities
 * 
 * This is the SINGLE SOURCE OF TRUTH for authentication in the app.
 * All server-side auth should use these functions.
 * 
 * Uses NextAuth's getServerSession() for all authentication.
 * 
 * @deprecated Use these functions instead:
 * - lib/server-auth.ts -> use getSession() or getCurrentUser()
 * - lib/auth-helpers.ts -> use getSession() or requireAuth()
 */

import { auth } from '@schoolquiz/auth';
import { cache } from 'react';

/**
 * Get Prisma client with error handling
 * Returns null if database is not available
 */
async function getPrismaClient() {
  // Check if DATABASE_URL is set before importing Prisma
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
    return null;
  }

  try {
    // Lazy import to avoid initialization errors
    const { prisma } = await import('@schoolquiz/db');
    return prisma;
  } catch (error) {
    // If Prisma fails to initialize, return null
    console.warn('Prisma client not available:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Get NextAuth session
 * Returns null if not authenticated
 * 
 * Wrapped in cache() to prevent duplicate fetches in the same render pass
 * 
 * In v5, we use auth() instead of getServerSession()
 */
export const getSession = cache(async function getSession() {
  return await auth();
});

/**
 * Get current user from session
 * Returns null if not authenticated or database unavailable
 * 
 * Uses NextAuth session to get user ID, then fetches full user data from database.
 * 
 * Wrapped in cache() to prevent duplicate fetches in the same render pass
 * This is especially important when called multiple times in one route
 */
export const getCurrentUser = cache(async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  const prisma = await getPrismaClient();
  if (!prisma) {
    // Database not available - return null in development
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }
    throw new Error('Database not available');
  }

  try {
    // Try to get User first (new model), fallback to Teacher (legacy)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user) {
      return user;
    }

    // Fallback: check if Teacher exists and create User if needed
    const teacher = await prisma.teacher.findUnique({
      where: { id: session.user.id },
    });

    if (teacher) {
      // Create User from Teacher (migration path)
      return await prisma.user.upsert({
        where: { email: teacher.email },
        create: {
          id: teacher.id,
          email: teacher.email,
          name: teacher.name,
          lastLoginAt: teacher.lastLoginAt,
        },
        update: {
          name: teacher.name,
          lastLoginAt: teacher.lastLoginAt,
        },
      });
    }
  } catch (error) {
    // If database query fails, return null in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Database query failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
    throw error;
  }

  return null;
});

/**
 * Require authentication or throw error
 * Returns the session if authenticated
 * 
 * Also cached to prevent duplicate session checks
 */
export const requireSession = cache(async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
});

/**
 * Require authentication or throw error
 * Returns the user from database if authenticated
 * 
 * Also cached to prevent duplicate session checks
 */
export const requireAuth = cache(async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
});

/**
 * Require specific platform role
 * Throws error if user doesn't have the required role
 */
export async function requireRole(role: string) {
  const session = await requireSession();
  if (session.user.platformRole !== role) {
    throw new Error(`Access denied. Required role: ${role}`);
  }
  return session;
}

