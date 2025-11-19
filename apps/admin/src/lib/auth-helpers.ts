/**
 * Authentication helpers for API routes
 * 
 * TODO: Replace with real authentication when auth system is implemented
 * This currently uses a placeholder approach that can be easily swapped
 * for real session/auth token validation.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@schoolquiz/db';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string;
}

/**
 * Get the authenticated user from the request
 * 
 * Currently uses a placeholder approach:
 * - Checks for X-User-Id header (for development/testing)
 * - Falls back to finding the first teacher (for development)
 * 
 * TODO: Replace with real session/token validation
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Option 1: Check for user ID in header (for development/testing)
    const userIdFromHeader = request.headers.get('X-User-Id');
    if (userIdFromHeader) {
      const user = await prisma.teacher.findUnique({
        where: { id: userIdFromHeader },
        include: { school: true },
      });
      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'teacher',
          schoolId: user.schoolId,
        };
      }
    }

    // Option 2: Check for auth token in Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // TODO: Validate token and extract user ID
      // For now, this is a placeholder
    }

    // Option 3: Fallback to default teacher (for development only)
    // TODO: Remove this fallback when real auth is implemented
    const defaultTeacher = await prisma.teacher.findFirst({
      include: { school: true },
    });
    if (defaultTeacher) {
      return {
        id: defaultTeacher.id,
        email: defaultTeacher.email,
        name: defaultTeacher.name,
        role: defaultTeacher.role || 'teacher',
        schoolId: defaultTeacher.schoolId,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Require authentication - throws error if user is not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'admin' || user.role === 'PlatformAdmin';
}

/**
 * Require admin role - throws error if user is not admin
 */
export async function requireAdmin(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);
  if (!isAdmin(user)) {
    throw new Error('Admin access required');
  }
  return user;
}

