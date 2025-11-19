'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Building2, ArrowLeft, Users, Layers, CreditCard, Activity, Mail, Calendar, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface Organisation {
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

export default function AdminOrganisationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const organisationId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')
  const [organisation, setOrganisation] = useState<Organisation | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOrganisation()
  }, [organisationId])

  const fetchOrganisation = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/organisations/${organisationId}`)
      const data = await response.json()
      console.log('Organisation detail API response:', data)
      
      if (response.ok) {
        setOrganisation(data.organisation)
      } else {
        console.error('API error:', data)
      }
    } catch (error) {
      console.error('Failed to fetch organisation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
      TRIALING: { label: 'Trialing', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: Clock },
      PAST_DUE: { label: 'Past Due', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: AlertCircle },
      EXPIRED: { label: 'Expired', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
      CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: XCircle },
    }
    return badges[status as keyof typeof badges] || badges.EXPIRED
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!organisation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Organisation not found</p>
      </div>
    )
  }

  const statusBadge = getStatusBadge(organisation.status)
  const StatusIcon = statusBadge.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200/50 dark:hover:from-gray-700 dark:hover:to-gray-700/50 rounded-xl transition-all duration-200 hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)]"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {organisation.name}
            </h1>
            {organisation.emailDomain && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                @{organisation.emailDomain}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusBadge.className}`}>
            <StatusIcon className="w-4 h-4" />
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-1 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab organisation={organisation} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <MembersTab organisation={organisation} onUpdate={fetchOrganisation} />
        </TabsContent>

        <TabsContent value="classes" className="mt-6">
          <ClassesTab organisation={organisation} />
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <BillingTab organisation={organisation} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityTab organisation={organisation} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTab({ organisation }: { organisation: Organisation }) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Members</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {organisation._count.members}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {organisation.maxSeats > 0 ? `of ${organisation.maxSeats} seats` : 'Unlimited seats'}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Groups</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {organisation._count.groups}
              </p>
            </div>
            <Layers className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Leaderboards</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {organisation._count.leaderboards}
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Owner Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Owner</h3>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
            {(organisation.owner.name || organisation.owner.email)[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {organisation.owner.name || 'No name'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {organisation.owner.email}
            </p>
          </div>
        </div>
      </div>

      {/* Plan Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{organisation.plan}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{organisation.status}</p>
          </div>
          {organisation.currentPeriodEnd && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Period End</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {new Date(organisation.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {new Date(organisation.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MembersTab({ organisation, onUpdate }: { organisation: Organisation; onUpdate: () => void }) {
  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/organisations/${organisation.id}/members/${memberId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (response.ok) {
        onUpdate() // Refresh organisation data
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('Failed to update role')
    }
  }
  const getRoleBadge = (role: string) => {
    const styles = {
      OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      TEACHER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      BILLING_ADMIN: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[role as keyof typeof styles] || styles.TEACHER
      }`}>
        {role}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    return status === 'ACTIVE' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        {status}
      </span>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/50 to-white/30 dark:from-gray-900/30 dark:to-gray-800/20">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Members ({organisation.members.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
                <thead className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
                <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/50 dark:divide-gray-700/50">
            {organisation.members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {(member.user.name || member.user.email)[0].toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.user.name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {member.user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] text-sm"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="BILLING_ADMIN">Billing Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(member.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    member.user.tier === 'premium'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {member.user.tier}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(member.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ClassesTab({ organisation }: { organisation: Organisation }) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/50 to-white/30 dark:from-gray-900/30 dark:to-gray-800/20">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Groups/Classes ({organisation.groups.length})
        </h3>
      </div>
      {organisation.groups.length === 0 ? (
        <div className="p-12 text-center">
          <Layers className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No groups found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
                <thead className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
                <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {organisation.groups.map((group) => (
                <tr key={group.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {group.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {group.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {group._count.members}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(group.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function BillingTab({ organisation }: { organisation: Organisation }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{organisation.plan}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{organisation.status}</p>
          </div>
          {organisation.stripeCustomerId && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Stripe Customer ID</p>
              <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white break-all">
                {organisation.stripeCustomerId}
              </p>
            </div>
          )}
          {organisation.stripeSubscriptionId && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Stripe Subscription ID</p>
              <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white break-all">
                {organisation.stripeSubscriptionId}
              </p>
            </div>
          )}
          {organisation.currentPeriodStart && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Period Start</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {new Date(organisation.currentPeriodStart).toLocaleDateString()}
              </p>
            </div>
          )}
          {organisation.currentPeriodEnd && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Period End</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {new Date(organisation.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          )}
          {organisation.gracePeriodEnd && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Grace Period End</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {new Date(organisation.gracePeriodEnd).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Seats</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Used Seats</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {organisation._count.members} / {organisation.maxSeats || '∞'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: organisation.maxSeats > 0
                    ? `${Math.min((organisation._count.members / organisation.maxSeats) * 100, 100)}%`
                    : '0%',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityTab({ organisation }: { organisation: Organisation }) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/50 to-white/30 dark:from-gray-900/30 dark:to-gray-800/20">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
      </div>
      {organisation.activity.length === 0 ? (
        <div className="p-12 text-center">
          <Activity className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No activity found</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
          {organisation.activity.map((item) => (
            <div key={item.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.description}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {item.user.name || item.user.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {item.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

