'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContentCard } from '@/components/layout/ContentCard'
import { Spinner } from '@/components/ui/spinner'
import { Gift, Users, TrendingUp, CheckCircle2, Clock, XCircle } from 'lucide-react'

interface Referral {
  id: string
  referrerId: string
  referredUserId: string
  referralCode: string
  status: 'PENDING' | 'REWARDED'
  rewardGrantedAt: string | null
  referrerRewarded: boolean
  referredRewarded: boolean
  createdAt: string
  referrer: {
    id: string
    email: string
    name: string | null
  }
  referredUser: {
    id: string
    email: string
    name: string | null
    tier: string
    subscriptionStatus: string
  }
}

interface ReferralStats {
  totalReferrals: number
  pendingReferrals: number
  rewardedReferrals: number
  totalFreeMonthsGranted: number
}

export default function AdminReferralsPage() {
  const { data: session } = useSession()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchReferrals()
    }
  }, [session])

  const fetchReferrals = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!session?.user?.id) {
        setError('Not authenticated')
        return
      }

      const response = await fetch('/api/admin/referrals', {
        credentials: 'include', // Send session cookie
      })

      if (!response.ok) {
        throw new Error('Failed to fetch referrals')
      }

      const data = await response.json()
      setReferrals(data.referrals || [])
      setStats(data.stats || null)
    } catch (err: any) {
      setError(err.message || 'Failed to load referrals')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'REWARDED':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <PageContainer maxWidth="6xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <Spinner className="size-8" />
          </div>
        </PageContainer>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <PageContainer maxWidth="6xl">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </PageContainer>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <PageContainer maxWidth="6xl">
        <PageHeader
          title="Referral System"
          subtitle="Track referrals and free months granted"
        />

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <ContentCard padding="lg" rounded="xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Referrals</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalReferrals}
                  </p>
                </div>
              </div>
            </ContentCard>

            <ContentCard padding="lg" rounded="xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.pendingReferrals}
                  </p>
                </div>
              </div>
            </ContentCard>

            <ContentCard padding="lg" rounded="xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rewarded</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.rewardedReferrals}
                  </p>
                </div>
              </div>
            </ContentCard>

            <ContentCard padding="lg" rounded="xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Free Months</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalFreeMonthsGranted}
                  </p>
                </div>
              </div>
            </ContentCard>
          </div>
        )}

        {/* Referrals Table */}
        <ContentCard padding="xl" rounded="3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Referrals</h2>
            <button
              onClick={fetchReferrals}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Refresh
            </button>
          </div>

          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No referrals yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Referrer
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Referred User
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Referred User Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Rewards
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr
                      key={referral.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(referral.status)}
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {referral.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {referral.referrer.name || 'No name'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {referral.referrer.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {referral.referredUser.name || 'No name'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {referral.referredUser.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              referral.referredUser.tier === 'premium' ||
                              referral.referredUser.subscriptionStatus === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {referral.referredUser.tier === 'premium' ||
                            referral.referredUser.subscriptionStatus === 'ACTIVE'
                              ? 'Premium'
                              : 'Basic'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {referral.referredUser.subscriptionStatus}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {referral.referrerRewarded && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Referrer ✓
                            </span>
                          )}
                          {referral.referredRewarded && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Referred ✓
                            </span>
                          )}
                          {!referral.referrerRewarded && !referral.referredRewarded && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {formatDate(referral.createdAt)}
                          </p>
                          {referral.rewardGrantedAt && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Rewarded: {formatDate(referral.rewardGrantedAt)}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ContentCard>
      </PageContainer>
    </PageLayout>
  )
}

