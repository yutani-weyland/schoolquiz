'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { User, ArrowLeft, Building2, Trophy, BookOpen, Mail, Calendar, Crown, UserCog, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, Badge, Button } from '@/components/admin/ui'
import { formatDate } from '@/lib/dateUtils'

interface UserDetail {
  id: string
  name?: string | null
  email: string
  phone?: string | null
  tier: string
  platformRole?: string | null
  subscriptionStatus: string
  subscriptionPlan?: string | null
  subscriptionEndsAt?: string | null
  emailVerified: boolean
  phoneVerified: boolean
  referralCode?: string | null
  referredBy?: string | null
  referralCount?: number
  freeTrialUntil?: string | null
  lastLoginAt?: string | null
  createdAt: string
  organisationMembers: Array<{
    id: string
    role: string
    status: string
    organisation: {
      id: string
      name: string
      status: string
    }
    createdAt: string
  }>
  createdOrganisations: Array<{
    id: string
    name: string
    status: string
  }>
  quizCompletions: Array<{
    id: string
    completedAt: string
    quiz: {
      id: string
      slug: string
      title: string
    }
    score?: number
    totalQuestions?: number
  }>
  achievements: Array<{
    id: string
    unlockedAt: string
    achievement: {
      id: string
      name: string
      rarity: string
    }
  }>
  referrer?: {
    id: string
    name?: string | null
    email: string
    referralCode?: string | null
  } | null
  referrals: Array<{
    id: string
    name?: string | null
    email: string
    createdAt: string
  }>
  _count: {
    organisationMembers: number
    quizCompletions: number
    achievements: number
    referrals: number
    createdOrganisations: number
  }
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchUser = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      let response: Response
      try {
        response = await fetch(`/api/admin/users/${userId}`)
      } catch (fetchError: any) {
        // Network error (e.g., CORS, connection refused, etc.)
        console.error('Network error fetching user:', fetchError)
        setError('Failed to connect to server. Please check your connection and try again.')
        setIsLoading(false)
        return
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Expected JSON but got:', contentType)
        console.error('Response status:', response.status)
        try {
          const text = await response.text()
          console.error('Response body:', text)
        } catch (textError) {
          console.error('Could not read response body:', textError)
        }
        setError(`Server returned ${response.status}. Expected JSON but got ${contentType || 'unknown'}.`)
        setIsLoading(false)
        return
      }
      
      let data: any
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError)
        setError('Server returned invalid JSON response.')
        setIsLoading(false)
        return
      }
      
      if (response.ok) {
        if (data.user) {
          setUser(data.user)
        } else {
          console.error('API returned success but no user data:', data)
          setError('User data not found in response.')
        }
      } else {
        console.error('API error:', data)
        console.error('Error message:', data?.error || 'Unknown error')
        console.error('Error details:', data?.details || 'No details provided')
        setError(data?.error || `Failed to load user (${response.status})`)
      }
    } catch (error: any) {
      console.error('Unexpected error fetching user:', error)
      setError(error?.message || 'An unexpected error occurred while loading user.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImpersonate = async () => {
    if (!confirm(`Impersonate ${user?.name || user?.email}?`)) return

    try {
      const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        alert(`Impersonation session created for ${data.targetUser.email}`)
      }
    } catch (error) {
      console.error('Failed to impersonate user:', error)
      alert('Failed to create impersonation session')
    }
  }

  const handleRoleChange = async (newRole: string | null) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformRole: newRole }),
      })
      if (response.ok) {
        await fetchUser()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('Failed to update role')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
            <div className="h-4 w-96 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
          </div>
        </div>

        {/* Profile header skeleton */}
        <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 bg-[hsl(var(--muted))] animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-48 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
              <div className="h-4 w-64 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-20 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
                <div className="h-6 w-20 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-[hsl(var(--card))] rounded-2xl p-4 border border-[hsl(var(--border))]"
            >
              <div className="h-4 w-24 bg-[hsl(var(--muted))] animate-pulse rounded-md mb-2" />
              <div className="h-8 w-16 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
            </div>
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-[hsl(var(--border))] pb-2">
              <div className="h-9 w-32 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
              <div className="h-9 w-32 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 w-full bg-[hsl(var(--muted))] animate-pulse rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <p className="text-[hsl(var(--destructive))] mb-2">Error loading user</p>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mb-4">{error}</p>
        <Button onClick={() => fetchUser()}>
          Retry
        </Button>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="text-center py-12">
        <p className="text-[hsl(var(--muted-foreground))]">User not found</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
              {user.name || 'No name'}
            </h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user.platformRole && (
            <Badge variant="danger" icon={UserCog}>
              {user.platformRole.replace('_', ' ')}
            </Badge>
          )}
          <Badge variant={user.tier === 'premium' ? 'info' : 'default'} icon={user.tier === 'premium' ? Crown : undefined}>
            {user.tier}
          </Badge>
          <Button onClick={handleImpersonate} variant="primary" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Impersonate
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex border-b border-[hsl(var(--border))] mb-6 bg-transparent p-0 h-auto">
          <TabsTrigger
            value="overview"
            className="px-4 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))] rounded-none !bg-transparent data-[state=active]:!bg-transparent"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="organisations"
            className="px-4 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))] rounded-none !bg-transparent data-[state=active]:!bg-transparent"
          >
            Organisations
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="px-4 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))] rounded-none !bg-transparent data-[state=active]:!bg-transparent"
          >
            Activity
          </TabsTrigger>
          <TabsTrigger
            value="referrals"
            className="px-4 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))] rounded-none !bg-transparent data-[state=active]:!bg-transparent"
          >
            Referrals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab user={user} onRoleChange={handleRoleChange} />
        </TabsContent>

        <TabsContent value="organisations" className="mt-6">
          <OrganisationsTab user={user} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityTab user={user} />
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <ReferralsTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTab({ user, onRoleChange }: { user: UserDetail; onRoleChange: (newRole: string | null) => void }) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Organisations</p>
              <p className="mt-2 text-3xl font-bold text-[hsl(var(--foreground))]">
                {user._count.organisationMembers}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Quiz Completions</p>
              <p className="mt-2 text-3xl font-bold text-[hsl(var(--foreground))]">
                {user._count.quizCompletions}
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Achievements</p>
              <p className="mt-2 text-3xl font-bold text-[hsl(var(--foreground))]">
                {user._count.achievements}
              </p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Referrals</p>
              <p className="mt-2 text-3xl font-bold text-[hsl(var(--foreground))]">
                {user._count.referrals}
              </p>
            </div>
            <User className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Account Information */}
      <Card>
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-6">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Email</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">{user.email}</p>
              {user.emailVerified && (
                <Badge variant="success" icon={CheckCircle2} className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
          </div>
          
          {user.phone && (
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Phone</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{user.phone}</p>
                {user.phoneVerified && (
                  <Badge variant="success" icon={CheckCircle2} className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">Platform Role</p>
            <Select
              value={user.platformRole || 'none'}
              onValueChange={(value) => onRoleChange(value === 'none' ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="PLATFORM_ADMIN">Platform Admin</SelectItem>
                <SelectItem value="ORG_ADMIN">Org Admin</SelectItem>
                <SelectItem value="TEACHER">Teacher</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="PARENT">Parent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Subscription Status</p>
            <Badge 
              variant={
                user.subscriptionStatus === 'ACTIVE' ? 'success' :
                user.subscriptionStatus === 'TRIALING' ? 'warning' :
                user.subscriptionStatus === 'PAST_DUE' ? 'danger' : 'default'
              }
            >
              {user.subscriptionStatus}
            </Badge>
          </div>
          
          {user.subscriptionPlan && (
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Subscription Plan</p>
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">{user.subscriptionPlan}</p>
            </div>
          )}
          
          {user.subscriptionEndsAt && (
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Subscription Ends</p>
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                {formatDate(user.subscriptionEndsAt)}
              </p>
            </div>
          )}
          
          {user.referralCode && (
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Referral Code</p>
              <p className="text-sm font-medium text-[hsl(var(--foreground))] font-mono">
                {user.referralCode}
              </p>
            </div>
          )}
          
          {user.referralCount !== undefined && user.referralCount > 0 && (
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Successful Referrals</p>
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                {user.referralCount}
              </p>
            </div>
          )}
          
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Last Login</p>
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">
              {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Joined</p>
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">
              {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function OrganisationsTab({ user }: { user: UserDetail }) {
  return (
    <div className="space-y-6">
      {/* Owned Organisations */}
      {user.createdOrganisations.length > 0 && (
        <Card padding="none">
          <div className="p-6 border-b border-[hsl(var(--border))]">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
              Owned Organisations ({user.createdOrganisations.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(var(--muted))]/30 border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {user.createdOrganisations.map((org) => (
                  <tr key={org.id} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => window.location.href = `/admin/organisations/${org.id}`}
                        className="text-sm font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                      >
                        {org.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          org.status === 'ACTIVE' ? 'success' :
                          org.status === 'TRIALING' ? 'warning' :
                          org.status === 'PAST_DUE' ? 'danger' : 'default'
                        }
                      >
                        {org.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/admin/organisations/${org.id}`}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Member Organisations */}
      <Card padding="none">
        <div className="p-6 border-b border-[hsl(var(--border))]">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
            Member Organisations ({user.organisationMembers.length})
          </h3>
        </div>
        {user.organisationMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No organisations</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(var(--muted))]/30 border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Organisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {user.organisationMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => window.location.href = `/admin/organisations/${member.organisation.id}`}
                        className="text-sm font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                      >
                        {member.organisation.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          member.role === 'OWNER' ? 'info' :
                          member.role === 'ADMIN' ? 'default' : 'default'
                        }
                      >
                        {member.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={member.status === 'ACTIVE' ? 'success' : 'default'}
                      >
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/admin/organisations/${member.organisation.id}`}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function ActivityTab({ user }: { user: UserDetail }) {
  return (
    <div className="space-y-6">
      {/* Recent Quiz Completions */}
      <Card padding="none">
        <div className="p-6 border-b border-[hsl(var(--border))]">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
            Recent Quiz Completions ({user.quizCompletions.length})
          </h3>
        </div>
        {user.quizCompletions.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No quiz completions</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(var(--muted))]/30 border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {user.quizCompletions.map((completion) => (
                  <tr key={completion.id} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {completion.quiz.title || completion.quiz.slug}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {completion.score !== undefined && completion.totalQuestions !== undefined ? (
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {completion.score}/{completion.totalQuestions}
                        </span>
                      ) : (
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                      {formatDate(completion.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Recent Achievements */}
      <Card padding="none">
        <div className="p-6 border-b border-[hsl(var(--border))]">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
            Recent Achievements ({user.achievements.length})
          </h3>
        </div>
        {user.achievements.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No achievements</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(var(--muted))]/30 border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Achievement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Rarity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Unlocked
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {user.achievements.map((achievement) => (
                  <tr key={achievement.id} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {achievement.achievement.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          achievement.achievement.rarity === 'legendary' ? 'warning' :
                          achievement.achievement.rarity === 'epic' ? 'info' :
                          achievement.achievement.rarity === 'rare' ? 'default' : 'default'
                        }
                      >
                        {achievement.achievement.rarity}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                      {formatDate(achievement.unlockedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function ReferralsTab({ user }: { user: UserDetail }) {
  return (
    <div className="space-y-6">
      {/* User's Referral Code */}
      {user.referralCode && (
        <Card>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Referral Code</h3>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">This user's referral code</p>
              <p className="text-2xl font-mono font-bold text-[hsl(var(--foreground))] bg-[hsl(var(--muted))] px-4 py-2 rounded-xl inline-block">
                {user.referralCode}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Successful Referrals</p>
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
                {user.referralCount || 0}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Referrer Info */}
      {user.referrer && (
        <Card>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Referred By</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                {user.referrer.name || 'No name'}
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {user.referrer.email}
              </p>
              {user.referrer.referralCode && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 font-mono">
                  Code: {user.referrer.referralCode}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = `/admin/users/${user.referrer!.id}`}
            >
              View User
            </Button>
          </div>
        </Card>
      )}

      {/* Referrals */}
      <Card padding="none">
        <div className="p-6 border-b border-[hsl(var(--border))]">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
            Referrals ({user.referrals.length})
          </h3>
        </div>
        {user.referrals.length === 0 ? (
          <div className="p-12 text-center">
            <User className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No referrals</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(var(--muted))]/30 border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {user.referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {referral.name || 'No name'}
                        </p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          {referral.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                      {formatDate(referral.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/admin/users/${referral.id}`}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
