import { getServerSession } from 'next-auth';
import { authOptions } from '@schoolquiz/auth';

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
 * Get current user from session
 * Returns null if not authenticated or database unavailable
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
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
}

/**
 * Require authentication or throw error
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

