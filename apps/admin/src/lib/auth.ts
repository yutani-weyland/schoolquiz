import { getServerSession } from 'next-auth';
import { authOptions } from '@schoolquiz/auth';
import { prisma } from '@schoolquiz/db';

/**
 * Get current user from session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

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

