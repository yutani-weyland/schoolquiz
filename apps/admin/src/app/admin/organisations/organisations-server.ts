/**
 * Server-side function to fetch organisations
 * Reuses logic from API route but can be called directly from server components
 */

import { prisma } from '@schoolquiz/db'

import { CACHE_TTL, CACHE_TAGS, createCacheKey } from '@/lib/cache-config'
import { unstable_cache } from 'next/cache'

interface Organisation {
  id: string
  name: string
  emailDomain?: string | null
  status: string
  plan: string
  maxSeats: number
  currentPeriodEnd?: string | null
  owner: {
    id: string
    name?: string | null
    email: string
  } | null
  _count: {
    members: number
    groups: number
  }
  createdAt: string
}

interface GetOrganisationsParams {
  search?: string
  status?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Internal function to fetch organisations from database
 */
async function getOrganisationsInternal(params: GetOrganisationsParams) {
  const {
    search = '',
    status = '',
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { emailDomain: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (status) {
    where.status = status
  }

  // Build orderBy clause
  const orderBy: any = {}
  switch (sortBy) {
    case 'name':
      orderBy.name = sortOrder
      break
    case 'status':
      orderBy.status = sortOrder
      break
    case 'plan':
      orderBy.plan = sortOrder
      break
    case 'members':
      orderBy.createdAt = sortOrder === 'asc' ? 'asc' : 'desc'
      break
    case 'createdAt':
    default:
      orderBy.createdAt = sortOrder === 'asc' ? 'asc' : 'desc'
      break
  }

  // Fetch organisations from database
  let [organisations, total] = await Promise.all([
    prisma.organisation.findMany({
      where,
      skip: sortBy === 'members' ? 0 : skip,
      take: sortBy === 'members' ? undefined : limit,
      orderBy,
      select: {
        id: true,
        name: true,
        emailDomain: true,
        ownerUserId: true,
        maxSeats: true,
        plan: true,
        status: true,
        currentPeriodEnd: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            groups: true,
          },
        },
      },
    }),
    prisma.organisation.count({ where }),
  ])

  // If sorting by members, sort and paginate manually
  if (sortBy === 'members') {
    organisations.sort((a, b) => {
      const aCount = a._count.members
      const bCount = b._count.members
      return sortOrder === 'asc' ? aCount - bCount : bCount - aCount
    })
    organisations = organisations.slice(skip, skip + limit)
  }

  // Transform to match expected format
  const formattedOrganisations: Organisation[] = organisations.map(org => ({
    id: org.id,
    name: org.name,
    emailDomain: org.emailDomain,
    status: org.status,
    plan: org.plan,
    maxSeats: org.maxSeats,
    currentPeriodEnd: org.currentPeriodEnd?.toISOString() || null,
    owner: org.owner ? {
      id: org.owner.id,
      name: org.owner.name,
      email: org.owner.email,
    } : null,
    _count: {
      members: org._count.members,
      groups: org._count.groups,
    },
    createdAt: org.createdAt.toISOString(),
  }))

  return {
    organisations: formattedOrganisations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Fetch organisations - cached for performance
 * Only cache non-search queries (search results should be fresh)
 */
export async function getOrganisations(params: GetOrganisationsParams) {
  // Don't cache search/filter queries (always fresh)
  if (params.search || params.status) {
    return getOrganisationsInternal(params)
  }

  // Cache list queries
  return unstable_cache(
    () => getOrganisationsInternal(params),
    createCacheKey('organisations', {
      page: params.page?.toString() || '1',
      limit: params.limit?.toString() || '50',
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc',
    }),
    {
      revalidate: CACHE_TTL.LIST,
      tags: [CACHE_TAGS.ORGANISATIONS],
    }
  )()
}


