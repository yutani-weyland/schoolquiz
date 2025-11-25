'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, ArrowLeft, Building2, Trophy, BookOpen, Mail, Calendar, Crown, UserCog, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, Badge, Button } from '@/components/admin/ui'
import { formatDate } from '@/lib/dateUtils'
import type { UserDetail } from './user-detail-server'

interface UserDetailClientProps {
  user: UserDetail
  userId: string
}

export function UserDetailClient({ user, userId }: UserDetailClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [currentUser, setCurrentUser] = useState(user)

  const handleImpersonate = async () => {
    if (!confirm(`Impersonate ${currentUser?.name || currentUser?.email}?`)) return

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
        // Update local state
        setCurrentUser(prev => ({ ...prev, platformRole: newRole }))
        // Optionally refetch to ensure consistency
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('Failed to update role')
    }
  }

  if (!currentUser) {
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
              {currentUser.name || 'No name'}
            </h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {currentUser.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {currentUser.platformRole && (
            <Badge variant="error" icon={UserCog}>
              {currentUser.platformRole.replace('_', ' ')}
            </Badge>
          )}
          <Badge variant={currentUser.tier === 'premium' ? 'info' : 'default'} icon={currentUser.tier === 'premium' ? Crown : undefined}>
            {currentUser.tier}
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
          <OverviewTab user={currentUser} onRoleChange={handleRoleChange} />
        </TabsContent>

        <TabsContent value="organisations" className="mt-6">
          <OrganisationsTab user={currentUser} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityTab user={currentUser} />
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <ReferralsTab user={currentUser} />
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
                    user.subscriptionStatus === 'PAST_DUE' ? 'error' : 'default'
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
                      <a
                        href={`/admin/organisation/${org.id}`}
                        className="text-sm font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                      >
                        {org.name}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          org.status === 'ACTIVE' ? 'success' :
                            org.status === 'TRIALING' ? 'warning' :
                              org.status === 'PAST_DUE' ? 'error' : 'default'
                        }
                      >
                        {org.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={`/admin/organisation/${org.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </a>
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
                      <a
                        href={`/admin/organisation/${member.organisation.id}`}
                        className="text-sm font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                      >
                        {member.organisation.name}
                      </a>
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
                      <a href={`/admin/organisation/${member.organisation.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </a>
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
            <a href={`/admin/users/${user.referrer.id}`}>
              <Button variant="ghost" size="sm">
                View User
              </Button>
            </a>
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
                      <a href={`/admin/users/${referral.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </a>
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

