'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Users, Plus, Search, X, Copy, Mail, Calendar } from 'lucide-react'
import { useUserTier } from '@/hooks/useUserTier'
import { useUserAccess } from '@/contexts/UserAccessContext'
import { UpgradeModal } from '@/components/premium/UpgradeModal'
import { SiteHeader } from '@/components/SiteHeader'
import { Footer } from '@/components/Footer'

interface League {
  id: string
  name: string
  description: string | null
  inviteCode: string
  createdByUserId: string
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
  _count: {
    members: number
  }
}

interface LeagueStats {
  id: string
  userId: string
  quizSlug: string | null
  score: number | null
  totalQuestions: number | null
  totalCorrectAnswers: number
  bestStreak: number
  currentStreak: number
  quizzesPlayed: number
  user: {
    id: string
    name: string | null
    teamName: string | null
  }
}

export default function LeaguesPage() {
  const { tier, isPremium } = useUserTier()
  const { userName } = useUserAccess()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null)
  const [leagueStats, setLeagueStats] = useState<{
    stats: LeagueStats[]
    quizSlugs: string[]
    overallStats: LeagueStats[]
  } | null>(null)
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (isPremium) {
      fetchLeagues()
    } else {
      setLoading(false)
    }
  }, [isPremium])

  useEffect(() => {
    if (selectedLeague) {
      fetchLeagueStats(selectedLeague.id)
    }
  }, [selectedLeague, selectedQuiz])

  const fetchLeagues = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const userId = localStorage.getItem('userId')
      
      if (!token || !userId) {
        setLoading(false)
        return
      }
      
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'X-User-Id': userId,
      }

      let res: Response
      try {
        res = await fetch('/api/private-leagues', { headers })
      } catch (fetchError: any) {
        console.error('Network error fetching leagues:', fetchError?.message || fetchError)
        setLeagues([])
        setLoading(false)
        return
      }
      
      if (!res.ok) {
        let errorData: any = {}
        try {
          const text = await res.text()
          errorData = text ? JSON.parse(text) : { error: `HTTP ${res.status}: ${res.statusText}` }
        } catch (e) {
          errorData = { error: `HTTP ${res.status}: ${res.statusText}` }
        }
        
        // Log error with all details
        const errorInfo = {
          status: res.status,
          statusText: res.statusText,
          error: errorData.error || 'Unknown error',
          details: errorData.details || errorData
        }
        console.error('Error fetching leagues:', errorInfo)
        
        // If database configuration/migration is needed, show helpful message
        if (res.status === 503) {
          const errorMsg = errorData.error || ''
          if (errorMsg.includes('DATABASE_URL') || errorMsg.includes('configuration')) {
            console.warn('Database configuration required:', errorMsg)
          } else if (errorMsg.includes('migration')) {
            console.warn('Database migration required:', errorMsg)
          }
          setLeagues([])
        } else if (res.status === 401 || res.status === 403) {
          // User not authorized - might not be premium
          setLeagues([])
        } else {
          // Other errors - log but don't show alert
          console.error('API Error:', errorData.error || errorData.details || errorData)
        }
        setLeagues([])
        setLoading(false)
        return
      }
      
      let data: any
      try {
        data = await res.json()
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        setLeagues([])
        setLoading(false)
        return
      }
      
      setLeagues(data.leagues || [])
      
      // Select first league if available
      if (data.leagues && data.leagues.length > 0 && !selectedLeague) {
        setSelectedLeague(data.leagues[0])
      }
    } catch (error: any) {
      // Catch any other unexpected errors
      console.error('Unexpected error fetching leagues:', error?.message || error)
      setLeagues([])
    } finally {
      setLoading(false)
    }
  }

  const fetchLeagueStats = async (leagueId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const userId = localStorage.getItem('userId')
      const headers: HeadersInit = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      if (userId) headers['X-User-Id'] = userId

      const url = `/api/private-leagues/${leagueId}/stats${selectedQuiz ? `?quizSlug=${selectedQuiz}` : ''}`
      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setLeagueStats(data)
    } catch (error) {
      console.error('Error fetching league stats:', error)
    }
  }

  const handleCreateLeague = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get('name') as string
      const description = formData.get('description') as string

      const token = localStorage.getItem('authToken')
      const userId = localStorage.getItem('userId')
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) headers['Authorization'] = `Bearer ${token}`
      if (userId) headers['X-User-Id'] = userId

      const res = await fetch('/api/private-leagues', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, description }),
      })

      if (!res.ok) {
        const error = await res.json()
        const errorMessage = error.error || 'Failed to create league'
        const details = error.details ? `\n\nDetails: ${error.details}` : ''
        
        // Check if it's a database configuration or migration error
        if (res.status === 503) {
          if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('configuration')) {
            alert(`Database configuration required. Please set DATABASE_URL environment variable.${details}`)
          } else if (errorMessage.includes('migration')) {
            alert(`Database migration required. Please run: npx prisma migrate dev${details}`)
          } else {
            alert(`${errorMessage}${details}`)
          }
        } else {
          alert(`${errorMessage}${details}`)
        }
        return
      }

      const data = await res.json()
      setLeagues([data.league, ...leagues])
      setSelectedLeague(data.league)
      setShowCreateModal(false)
      e.currentTarget.reset()
    } catch (error) {
      console.error('Error creating league:', error)
      alert('Failed to create league')
    } finally {
      setCreating(false)
    }
  }

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedLeague) return
    
    setInviting(true)
    
    try {
      const token = localStorage.getItem('authToken')
      const userId = localStorage.getItem('userId')
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) headers['Authorization'] = `Bearer ${token}`
      if (userId) headers['X-User-Id'] = userId

      const res = await fetch(`/api/private-leagues/${selectedLeague.id}/invite`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: inviteEmail }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to invite user')
        return
      }

      alert(`Successfully invited ${inviteEmail}`)
      setInviteEmail('')
      setShowInviteModal(false)
      fetchLeagues() // Refresh to show new member
    } catch (error) {
      console.error('Error inviting user:', error)
      alert('Failed to invite user')
    } finally {
      setInviting(false)
    }
  }

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      alert('Invite code copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const displayName = (user: { id: string; name: string | null; email?: string; teamName: string | null }) => {
    if (user.teamName) return user.teamName.toUpperCase()
    if (user.name) return user.name.toUpperCase()
    if (user.email) return user.email.split('@')[0].toUpperCase()
    return `User ${user.id.slice(0, 8)}`
  }

  if (!isPremium) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white pt-32 pb-16 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto text-center py-16">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Private Leagues</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Private leagues are only available to premium subscribers.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Upgrade to Premium
            </button>
          </div>
          <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
        </main>
        <Footer />
      </>
    )
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white pt-32 pb-16 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto text-center py-16">
            <div className="text-gray-500 dark:text-gray-400">Loading leagues...</div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const currentStats = selectedQuiz 
    ? leagueStats?.stats || []
    : leagueStats?.overallStats || []

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white pt-24 sm:pt-32 pb-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Private Leagues</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">Invite friends to your league and try to beat them</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Leagues List */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Your Leagues</h2>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Create league"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {leagues.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="mb-4">No leagues yet</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="text-gray-900 dark:text-white underline"
                    >
                      Create your first league
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leagues.map((league) => (
                      <button
                        key={league.id}
                        onClick={() => {
                          setSelectedLeague(league)
                          setSelectedQuiz(null)
                        }}
                        className={`w-full text-left p-4 rounded-lg transition-colors ${
                          selectedLeague?.id === league.id
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="font-medium mb-1">{league.name}</div>
                        <div className="text-sm opacity-75">
                          {league._count.members} member{league._count.members !== 1 ? 's' : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* League Details */}
            <div className="lg:col-span-2 space-y-6">
              {selectedLeague ? (
                <>
                  {/* League Header */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-3xl font-bold mb-2">{selectedLeague.name}</h2>
                        {selectedLeague.description && (
                          <p className="text-gray-600 dark:text-gray-400">{selectedLeague.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        Invite
                      </button>
                    </div>

                    {/* Invite Code */}
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Invite code:</span>
                      <code className="flex-1 font-mono text-gray-900 dark:text-white">{selectedLeague.inviteCode}</code>
                      <button
                        onClick={() => copyInviteCode(selectedLeague.inviteCode)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Copy invite code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quiz Selector */}
                  {leagueStats && leagueStats.quizSlugs.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedQuiz(null)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            selectedQuiz === null
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          Overall
                        </button>
                        {leagueStats.quizSlugs.map((slug) => (
                          <button
                            key={slug}
                            onClick={() => setSelectedQuiz(slug)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              selectedQuiz === slug
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            Quiz #{slug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leaderboard */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-2xl font-bold mb-6">
                      {selectedQuiz ? `Quiz #${selectedQuiz} Leaderboard` : 'Overall Leaderboard'}
                    </h3>

                    {currentStats.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No stats yet. Start playing quizzes to see rankings!
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {currentStats.map((stat, index) => {
                          const isYou = stat.user.id === localStorage.getItem('userId')
                          return (
                            <div
                              key={stat.id}
                              className={`flex items-center justify-between p-4 rounded-lg ${
                                isYou
                                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                  : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-8 text-center font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {displayName(stat.user)} {isYou && '(YOU)'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                {selectedQuiz ? (
                                  <div className="text-right">
                                    <div className="font-bold text-lg">{stat.score || 0}</div>
                                    <div className="text-xs opacity-75">
                                      / {stat.totalQuestions || 0}
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="text-right">
                                      <div className="text-sm opacity-75">Total Correct</div>
                                      <div className="font-bold">{stat.totalCorrectAnswers}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm opacity-75">Best Streak</div>
                                      <div className="font-bold">{stat.bestStreak}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm opacity-75">Current Streak</div>
                                      <div className="font-bold">{stat.currentStreak}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm opacity-75">Quizzes</div>
                                      <div className="font-bold">{stat.quizzesPlayed}</div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a league to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create League Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Create League</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateLeague}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">League Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                      placeholder="e.g., Team Awesome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Description (optional)</label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
                      placeholder="Describe your league..."
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {creating ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && selectedLeague && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Invite Friend</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleInvite}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Email Address</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                      placeholder="friend@example.com"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Only premium users can be invited
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={inviting}
                      className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {inviting ? 'Inviting...' : 'Invite'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>
      <Footer />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  )
}

