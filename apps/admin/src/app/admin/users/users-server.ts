/**
 * Server-side function to fetch users
 * Reuses logic from API route but can be called directly from server components
 */

import { prisma } from '@schoolquiz/db'
import { dummyUsers } from '@/lib/dummy-data'
import { CACHE_TTL, CACHE_TAGS, createCacheKey } from '@/lib/cache-config'
import { unstable_cache } from 'next/cache'

interface User {
  id: string
  email: string
  name?: string | null
  tier: string
  platformRole?: string | null
  subscriptionStatus: string
  subscriptionPlan?: string | null
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
  _count: {
    organisations: number
  }
}

interface GetUsersParams {
  search?: string
  tier?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Internal function to fetch users from database
 */
async function getUsersInternal(params: GetUsersParams) {
  const {
    search = '',
    tier = '',
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params

  const skip = (page - 1) * limit

  try {
    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (tier) {
      where.tier = tier
    }

    // Build orderBy clause
    const orderBy: any = {}
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder
        break
      case 'email':
        orderBy.email = sortOrder
        break
      case 'tier':
        orderBy.tier = sortOrder
        break
      case 'lastLoginAt':
        orderBy.lastLoginAt = sortOrder === 'asc' ? 'asc' : 'desc'
        break
      case 'createdAt':
      default:
        orderBy.createdAt = sortOrder === 'asc' ? 'asc' : 'desc'
        break
    }

    // Fetch users from database
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          name: true,
          tier: true,
          platformRole: true,
          subscriptionStatus: true,
          subscriptionPlan: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              organisationMembers: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])
    
    // Transform to match expected format
    const formattedUsers: User[] = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      platformRole: user.platformRole,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      _count: {
        organisations: user._count.organisationMembers,
      },
    }))

    return {
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (dbError: any) {
    console.error('Database query failed, using dummy data:', dbError.message)
    
    // Fallback to dummy data
    let filtered = [...dummyUsers]
    
    if (search) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (tier) {
      filtered = filtered.filter(user => user.tier === tier)
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || a.email
          bValue = b.name || b.email
          break
        case 'email':
          aValue = a.email
          bValue = b.email
          break
        case 'tier':
          aValue = a.tier
          bValue = b.tier
          break
        case 'lastLoginAt':
          aValue = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0
          bValue = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0
          break
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
      }
      
      if (aValue === bValue) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1
      
      const comparison = typeof aValue === 'string' 
        ? aValue.localeCompare(bValue)
        : aValue - bValue
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    const total = filtered.length
    const users = filtered.slice(skip, skip + limit)

    return {
      users: users as User[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}

/**
 * Fetch users - cached for performance
 * Only cache non-search queries (search results should be fresh)
 */
export async function getUsers(params: GetUsersParams) {
  // Don't cache search/filter queries (always fresh)
  if (params.search || params.tier) {
    return getUsersInternal(params)
  }

  // Cache list queries
  return unstable_cache(
    () => getUsersInternal(params),
    createCacheKey('users', {
      page: params.page?.toString() || '1',
      limit: params.limit?.toString() || '50',
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc',
    }),
    {
      revalidate: CACHE_TTL.LIST,
      tags: [CACHE_TAGS.USERS],
    }
  )()
}

