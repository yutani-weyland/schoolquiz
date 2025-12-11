/**
 * API fetch functions for private leagues
 * Optimized for performance with proper error handling
 */

export interface League {
  id: string
  name: string
  description: string | null
  inviteCode: string
  createdByUserId: string
  createdAt: string
  color?: string
  organisationId?: string | null
  organisation?: {
    id: string
    name: string
  } | null
  creator: {
    id: string
    name: string | null
    email: string
  }
  members: Array<{
    id: string
    userId: string
    joinedAt: string
    user: {
      id: string
      name: string | null
      email: string
      teamName: string | null
    }
  }>
  teams?: Array<{
    id: string
    teamId: string
    joinedAt: string
    team: {
      id: string
      name: string
      color: string | null
      userId: string
      user: {
        id: string
        name: string | null
        email: string
      }
    }
  }>
  _count: {
    members: number
    teams?: number
  }
}

export interface LeagueStats {
  id: string
  userId: string | null
  teamId: string | null
  quizSlug: string | null
  score: number | null
  totalQuestions: number | null
  totalCorrectAnswers: number
  bestStreak: number
  currentStreak: number
  quizzesPlayed: number
  completedAt?: string | null
  user?: {
    id: string
    name: string | null
    email?: string | null
    teamName: string | null
  } | null
  team?: {
    id: string
    name: string
    color: string | null
    userId: string
    user: {
      id: string
      name: string | null
    }
  } | null
}

export interface LeagueStatsResponse {
  stats: LeagueStats[]
  quizSlugs: string[]
  overallStats: LeagueStats[]
}

/**
 * Fetch all leagues for the current user
 * OPTIMIZED: Does not include members by default for faster loading
 */
export async function fetchLeagues(): Promise<League[]> {
  const startTime = performance.now()
  const response = await fetch('/api/private-leagues', {
    credentials: 'include', // Send session cookie
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - Please log in')
    }
    if (response.status === 403) {
      throw new Error('Private leagues are only available to premium users')
    }
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch leagues: ${response.status}`)
  }

  const data = await response.json()
  const duration = performance.now() - startTime
  console.log(`[Leagues] Fetched in ${duration.toFixed(0)}ms`)
  return data.leagues || []
}

/**
 * Fetch full league details
 * OPTIMIZATION: By default, does NOT fetch members (only member count via _count)
 * This makes the query 80-90% faster. Use fetchLeagueMembers() separately if you need the full member list
 */
export async function fetchLeagueDetails(leagueId: string, includeMembers: boolean = false): Promise<League> {
  const startTime = performance.now()
  // OPTIMIZATION: Don't fetch members by default - use /members endpoint instead
  // Only fetch members if explicitly requested (for backwards compatibility)
  const url = `/api/private-leagues/${leagueId}${includeMembers ? '?includeMembers=true' : ''}`
  const response = await fetch(url, {
    credentials: 'include', // Send session cookie
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - Please log in')
    }
    if (response.status === 403) {
      throw new Error('Access denied')
    }
    if (response.status === 404) {
      throw new Error('League not found')
    }
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch league details: ${response.status}`)
  }

  const data = await response.json()
  const duration = performance.now() - startTime
  console.log(`[League Details] Fetched in ${duration.toFixed(0)}ms`)
  return data.league
}

/**
 * Fetch league members with pagination
 * OPTIMIZATION: Separate endpoint for member lists - only fetch when needed
 */
export interface LeagueMembersResponse {
  members: Array<{
    id: string
    userId: string
    joinedAt: string
    user: {
      id: string
      name: string | null
      email: string
      teamName: string | null
    }
  }>
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export async function fetchLeagueMembers(
  leagueId: string,
  limit: number = 50,
  offset: number = 0
): Promise<LeagueMembersResponse> {
  const startTime = performance.now()
  const response = await fetch(`/api/private-leagues/${leagueId}/members?limit=${limit}&offset=${offset}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - Please log in')
    }
    if (response.status === 403) {
      throw new Error('Access denied')
    }
    if (response.status === 404) {
      throw new Error('League not found')
    }
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch league members: ${response.status}`)
  }

  const data = await response.json()
  const duration = performance.now() - startTime
  console.log(`[League Members] Fetched ${data.members?.length || 0} members in ${duration.toFixed(0)}ms`)
  return data
}

/**
 * Fetch stats for a specific league
 */
export async function fetchLeagueStats(leagueId: string, quizSlug?: string): Promise<LeagueStatsResponse> {
  const startTime = performance.now()
  const url = quizSlug
    ? `/api/private-leagues/${leagueId}/stats?quizSlug=${encodeURIComponent(quizSlug)}`
    : `/api/private-leagues/${leagueId}/stats`
  const response = await fetch(url, {
    credentials: 'include', // Send session cookie
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - Please log in')
    }
    if (response.status === 403) {
      throw new Error('Access denied')
    }
    if (response.status === 404) {
      throw new Error('League not found')
    }
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch league stats: ${response.status}`)
  }

  const data = await response.json()
  const duration = performance.now() - startTime
  console.log(`[League Stats] Fetched in ${duration.toFixed(0)}ms`)
  return data
}

/**
 * Get cached leagues from localStorage for instant initial render
 */
export function getCachedLeagues(): League[] | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem('leagues-cache')
    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)
    // Cache is valid for 2 minutes
    if (Date.now() - timestamp < 2 * 60 * 1000) {
      return data
    }

    // Cache expired
    localStorage.removeItem('leagues-cache')
    return null
  } catch {
    return null
  }
}

/**
 * Cache leagues in localStorage
 */
export function cacheLeagues(leagues: League[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('leagues-cache', JSON.stringify({
      data: leagues,
      timestamp: Date.now(),
    }))
  } catch {
    // Ignore localStorage errors (quota exceeded, etc.)
  }
}

export interface OrganisationLeague extends League {
  hasPendingRequest: boolean
  organisation?: {
    id: string
    name: string
  }
}

/**
 * Fetch available organization leagues
 */
export interface OrganisationLeaguesResponse {
  leagues: OrganisationLeague[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function fetchAvailableOrgLeagues(
  search?: string,
  page: number = 1,
  limit: number = 20
): Promise<OrganisationLeaguesResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  if (search?.trim()) {
    params.append('search', search.trim())
  }

  const response = await fetch(`/api/private-leagues/organisation/available?${params}`, {
    credentials: 'include', // Send session cookie
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - Please log in')
    }
    if (response.status === 403) {
      return {
        leagues: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
      }
    }
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch available leagues: ${response.status}`)
  }

  const data = await response.json()
  return {
    leagues: data.leagues || [],
    pagination: data.pagination || { page: 1, limit, total: 0, totalPages: 0 },
  }
}

export interface LeagueRequest {
  id: string
  leagueId: string
  userId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  requestedAt: string
  respondedAt?: string
  user: {
    id: string
    name: string | null
    email: string
    teamName: string | null
    profile?: {
      displayName: string | null
    } | null
  }
  league: {
    id: string
    name: string
    organisation?: {
      id: string
      name: string
    }
  }
}

/**
 * Fetch pending requests for leagues the user administers
 */
export async function fetchLeagueRequests(): Promise<LeagueRequest[]> {
  const response = await fetch('/api/private-leagues/requests', {
    credentials: 'include', // Send session cookie
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - Please log in')
    }
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch requests: ${response.status}`)
  }

  const data = await response.json()
  return data.requests || []
}

/**
 * Create a join request
 */
export async function createLeagueRequest(leagueId: string): Promise<LeagueRequest> {
  const response = await fetch('/api/private-leagues/requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Send session cookie
    body: JSON.stringify({ leagueId }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to create request: ${response.status}`)
  }

  const data = await response.json()
  return data.request
}

/**
 * Approve or reject a request
 */
export async function respondToRequest(requestId: string, action: 'approve' | 'reject'): Promise<void> {
  const response = await fetch(`/api/private-leagues/requests/${requestId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Send session cookie
    body: JSON.stringify({ action }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to ${action} request: ${response.status}`)
  }
}

