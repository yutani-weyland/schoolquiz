import { prisma } from './client';
import { OrganisationMemberRole, OrganisationMemberStatus } from '@prisma/client';

export type Permission = 
  | 'org:view'
  | 'org:settings'
  | 'org:members:invite'
  | 'org:members:remove'
  | 'org:members:update_role'
  | 'org:seats:manage'
  | 'org:billing:view'
  | 'org:billing:manage'
  | 'org:groups:create'
  | 'org:groups:manage'
  | 'org:leaderboards:create'
  | 'org:leaderboards:manage'
  | 'leaderboards:create_ad_hoc';

export interface OrganisationContext {
  organisationId: string;
  userId: string;
  role: OrganisationMemberRole;
  status: OrganisationMemberStatus;
  organisationStatus: string;
  currentPeriodEnd: Date | null;
  gracePeriodEnd: Date | null;
}

/**
 * Get organisation membership context for a user
 */
export async function getOrganisationContext(
  organisationId: string,
  userId: string
): Promise<OrganisationContext | null> {
  const member = await prisma.organisationMember.findUnique({
    where: {
      organisationId_userId: {
        organisationId,
        userId,
      },
    },
    include: {
      organisation: true,
    },
  });

  if (!member || member.deletedAt) {
    return null;
  }

  return {
    organisationId: member.organisationId,
    userId: member.userId,
    role: member.role,
    status: member.status,
    organisationStatus: member.organisation.status,
    currentPeriodEnd: member.organisation.currentPeriodEnd,
    gracePeriodEnd: member.organisation.gracePeriodEnd,
  };
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  context: OrganisationContext | null,
  permission: Permission
): boolean {
  if (!context) {
    return false;
  }

  // Check subscription status - expired orgs have limited permissions
  if (!isSubscriptionActive(context)) {
    // Only allow read-only permissions for expired orgs
    return permission === 'org:view' || permission === 'org:billing:view';
  }

  // Check member status
  if (context.status !== OrganisationMemberStatus.ACTIVE) {
    return false;
  }

  // Role-based permissions
  const rolePermissions: Record<OrganisationMemberRole, Permission[]> = {
    [OrganisationMemberRole.OWNER]: [
      'org:view',
      'org:settings',
      'org:members:invite',
      'org:members:remove',
      'org:members:update_role',
      'org:seats:manage',
      'org:billing:view',
      'org:billing:manage',
      'org:groups:create',
      'org:groups:manage',
      'org:leaderboards:create',
      'org:leaderboards:manage',
      'leaderboards:create_ad_hoc',
    ],
    [OrganisationMemberRole.ADMIN]: [
      'org:view',
      'org:members:invite',
      'org:members:remove',
      'org:members:update_role',
      'org:groups:create',
      'org:groups:manage',
      'org:leaderboards:create',
      'org:leaderboards:manage',
      'leaderboards:create_ad_hoc',
    ],
    [OrganisationMemberRole.TEACHER]: [
      'org:view',
      'leaderboards:create_ad_hoc',
    ],
    [OrganisationMemberRole.BILLING_ADMIN]: [
      'org:view',
      'org:billing:view',
    ],
  };

  return rolePermissions[context.role]?.includes(permission) ?? false;
}

/**
 * Check if organisation subscription is active
 */
export function isSubscriptionActive(context: OrganisationContext): boolean {
  const { organisationStatus, currentPeriodEnd, gracePeriodEnd } = context;
  
  if (organisationStatus === 'ACTIVE' || organisationStatus === 'TRIALING') {
    return true;
  }

  // Check grace period
  if (organisationStatus === 'PAST_DUE' || organisationStatus === 'EXPIRED') {
    if (gracePeriodEnd && new Date() < gracePeriodEnd) {
      return true; // Still in grace period
    }
  }

  return false;
}

/**
 * Check if user can perform write operations
 */
export function canWrite(context: OrganisationContext | null): boolean {
  if (!context) return false;
  return isSubscriptionActive(context) && context.status === OrganisationMemberStatus.ACTIVE;
}

/**
 * Get available seats count for an organisation
 */
export async function getAvailableSeats(organisationId: string): Promise<{
  total: number;
  used: number;
  available: number;
}> {
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: { maxSeats: true },
  });

  if (!org) {
    return { total: 0, used: 0, available: 0 };
  }

  const used = await prisma.organisationMember.count({
    where: {
      organisationId,
      status: OrganisationMemberStatus.ACTIVE,
      seatAssignedAt: { not: null },
      seatReleasedAt: null,
      deletedAt: null,
    },
  });

  return {
    total: org.maxSeats,
    used,
    available: Math.max(0, org.maxSeats - used),
  };
}

/**
 * Require permission or throw error
 */
export function requirePermission(
  context: OrganisationContext | null,
  permission: Permission
): void {
  if (!hasPermission(context, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

