/**
 * Server-side function to fetch organisation details
 * Reuses logic from API route but can be called directly from server components
 */

import { prisma } from '@schoolquiz/db'
import { unstable_cache } from 'next/cache'
import { CACHE_TTL, CACHE_TAGS, createCacheKey } from '@/lib/cache-config'
import { requirePlatformAdmin } from '@/lib/admin-auth'

export interface OrganisationDetail {
  id: string
  name: string
  emailDomain?: string | null
  status: string
  plan: string
  maxSeats: number
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  gracePeriodEnd?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  owner: {
    id: string
    name?: string | null
    email: string
  }
  members: Array<{
    id: string
    role: string
    status: string
    user: {
      id: string
      name?: string | null
      email: string
      tier: string
    }
    createdAt: string
  }>
  groups: Array<{
    id: string
    name: string
    type: string
    _count: {
      members: number
    }
    createdAt: string
  }>
  activity: Array<{
    id: string
    type: string
    description: string
    user: {
      id: string
      name?: string | null
      email: string
    }
    createdAt: string
  }>
  _count: {
    members: number
    groups: number
    leaderboards: number
  }
  createdAt: string
}

async function getOrganisationDetailInternal(organisationId: string): Promise<OrganisationDetail | null> {
  try {
    const organisation = await prisma.organisation.findUnique({
      where: { id: organisationId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                tier: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        groups: {
          where: { deletedAt: null },
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        leaderboards: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        activity: {
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: {
          select: {
            members: true,
            groups: true,
            leaderboards: true,
          },
        },
      },
    })

    if (!organisation) {
      return null
    }

    // Transform to match expected format
    return {
      id: organisation.id,
      name: organisation.name,
      emailDomain: organisation.emailDomain,
      status: organisation.status,
      plan: organisation.plan,
      maxSeats: organisation.maxSeats,
      currentPeriodStart: organisation.currentPeriodStart?.toISOString() || null,
      currentPeriodEnd: organisation.currentPeriodEnd?.toISOString() || null,
      gracePeriodEnd: organisation.gracePeriodEnd?.toISOString() || null,
      stripeCustomerId: organisation.stripeCustomerId,
      stripeSubscriptionId: organisation.stripeSubscriptionId,
      owner: {
        id: organisation.owner.id,
        name: organisation.owner.name,
        email: organisation.owner.email,
      },
      members: organisation.members.map(m => ({
        id: m.id,
        role: m.role,
        status: m.status,
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          tier: m.user.tier,
        },
        createdAt: m.createdAt.toISOString(),
      })),
      groups: organisation.groups.map(g => ({
        id: g.id,
        name: g.name,
        type: g.type,
        _count: {
          members: g._count.members,
        },
        createdAt: g.createdAt.toISOString(),
      })),
      activity: organisation.activity.map(a => {
        // Construct description from metadata or type
        let description = `${a.type} activity`
        if (a.metadata && typeof a.metadata === 'object') {
          const meta = a.metadata as any
          if (meta.description) {
            description = meta.description
          } else if (meta.message) {
            description = meta.message
          }
        }
        return {
          id: a.id,
          type: a.type,
          description,
          user: {
            id: a.actor.id,
            name: a.actor.name,
            email: a.actor.email,
          },
          createdAt: a.createdAt.toISOString(),
        }
      }),
      _count: {
        members: organisation._count.members,
        groups: organisation._count.groups,
        leaderboards: organisation._count.leaderboards,
      },
      createdAt: organisation.createdAt.toISOString(),
    }
  } catch (error: any) {
    console.error('Error fetching organisation detail:', error)
    // Return null if organisation not found or other error
    if (error.code === 'P2025') {
      return null
    }
    throw error
  }
}

export async function getOrganisationDetail(organisationId: string): Promise<OrganisationDetail | null> {
  // Check if current user is admin (to bypass cache for admin view)
  let isAdmin = false
  try {
    await requirePlatformAdmin()
    isAdmin = true
  } catch (error) {
    // Not an admin, or DB error in dev, proceed with caching
  }

  if (isAdmin) {
    // Admins always get fresh data
    return getOrganisationDetailInternal(organisationId)
  } else {
    // Non-admins get cached data
    return unstable_cache(
      async () => getOrganisationDetailInternal(organisationId),
      createCacheKey('organisation-detail', { id: organisationId }),
      {
        revalidate: CACHE_TTL.DETAIL, // Use same TTL as user detail
        tags: [CACHE_TAGS.ORGANISATIONS, `organisation-${organisationId}`],
      }
    )()
  }
}

