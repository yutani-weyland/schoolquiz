import { prisma } from './client';
import { OrganisationActivityType } from '@prisma/client';

/**
 * Log organisation activity
 */
export async function logOrganisationActivity(
  organisationId: string,
  userId: string,
  type: OrganisationActivityType,
  metadata?: Record<string, any>
): Promise<void> {
  await prisma.organisationActivity.create({
    data: {
      organisationId,
      userId,
      type,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

