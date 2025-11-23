'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Trophy, Users, Plus, Search, X, Copy, Mail, Calendar, Edit2, Trash2, LogOut, UserX } from 'lucide-react'
import { useUserTier } from '@/hooks/useUserTier'
import { useUserAccess } from '@/contexts/UserAccessContext'
import { UpgradeModal } from '@/components/premium/UpgradeModal'
import { SiteHeader } from '@/components/SiteHeader'
import { Footer } from '@/components/Footer'

// Dynamic import for DnD Kit components - loads only when needed (saves ~100KB)
const DraggableLeaguesList = dynamic(() => import('./DraggableLeaguesList').then(mod => ({ default: mod.DraggableLeaguesList })), {
  loading: () => (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
      ))}
    </div>
  ),
  ssr: false, // DnD Kit doesn't work with SSR
})

interface League {
  id: string
  name: string
  description: string | null
  inviteCode: string
  createdByUserId: string
  color?: string
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showKickModal, setShowKickModal] = useState(false)
  const [memberToKick, setMemberToKick] = useState<{ id: string; name: string } | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [leagueColor, setLeagueColor] = useState('#3B82F6')
  const [inviting, setInviting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [kicking, setKicking] = useState(false)

  // Save league order to localStorage
  const saveLeagueOrder = useCallback((newOrder: League[]) => {
    if (typeof window !== 'undefined') {
      const order = newOrder.map(l => l.id)
      localStorage.setItem('league-order', JSON.stringify(order))
    }
  }, [])


  // Mock data for prototype
  const getMockLeagues = (): League[] => {
    const userId = localStorage.getItem('userId') || 'user-1'
    return [
      {
        id: 'league-1',
        name: 'School Champions',
        description: 'Our school league - compete with classmates!',
        inviteCode: 'SCHOOL2024',
        createdByUserId: userId,
        creator: {
          id: userId,
          name: userName || 'You',
          email: 'you@example.com'
        },
        members: [
          {
            id: 'member-1',
            userId: userId,
            joinedAt: new Date().toISOString(),
            user: {
              id: userId,
              name: userName || 'You',
              email: 'you@example.com',
              teamName: null
            }
          },
          {
            id: 'member-2',
            userId: 'user-2',
            joinedAt: new Date(Date.now() - 86400000).toISOString(),
            user: {
              id: 'user-2',
              name: 'Alex',
              email: 'alex@example.com',
              teamName: 'TEAM ALEX'
            }
          },
          {
            id: 'member-3',
            userId: 'user-3',
            joinedAt: new Date(Date.now() - 172800000).toISOString(),
            user: {
              id: 'user-3',
              name: 'Sam',
              email: 'sam@example.com',
              teamName: null
            }
          }
        ],
        _count: {
          members: 3
        }
      }
    ]
  }

  const getMockStats = (leagueId: string, quizSlug: string | null) => {
    const userId = localStorage.getItem('userId') || 'user-1'
    const quizSlugs = ['12', '11', '10']

    const mockStats: LeagueStats[] = [
      {
        id: 'stat-1',
        userId: userId,
        quizSlug: quizSlug,
        score: quizSlug ? 85 : null,
        totalQuestions: quizSlug ? 20 : null,
        totalCorrectAnswers: 245,
        bestStreak: 12,
        currentStreak: 5,
        quizzesPlayed: 15,
        user: {
          id: userId,
          name: userName || 'You',
          teamName: null
        }
      },
      {
        id: 'stat-2',
        userId: 'user-2',
        quizSlug: quizSlug,
        score: quizSlug ? 78 : null,
        totalQuestions: quizSlug ? 20 : null,
        totalCorrectAnswers: 198,
        bestStreak: 8,
        currentStreak: 3,
        quizzesPlayed: 12,
        user: {
          id: 'user-2',
          name: 'Alex',
          teamName: 'TEAM ALEX'
        }
      },
      {
        id: 'stat-3',
        userId: 'user-3',
        quizSlug: quizSlug,
        score: quizSlug ? 92 : null,
        totalQuestions: quizSlug ? 20 : null,
        totalCorrectAnswers: 267,
        bestStreak: 15,
        currentStreak: 7,
        quizzesPlayed: 18,
        user: {
          id: 'user-3',
          name: 'Sam',
          teamName: null
        }
      }
    ]

    // Sort by score (if quiz selected) or total correct answers
    return {
      stats: quizSlug ? mockStats.sort((a, b) => (b.score || 0) - (a.score || 0)) : mockStats,
      quizSlugs,
      overallStats: mockStats.sort((a, b) => b.totalCorrectAnswers - a.totalCorrectAnswers)
    }
  }

  useEffect(() => {
    if (isPremium) {
      // Use mock data for prototype
      const mockLeagues = getMockLeagues()
      setLeagues(mockLeagues)
      if (mockLeagues.length > 0 && !selectedLeague) {
        setSelectedLeague(mockLeagues[0])
      }
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [isPremium])

  useEffect(() => {
    if (selectedLeague) {
      // Use mock data for prototype
      const mockStats = getMockStats(selectedLeague.id, selectedQuiz)
      setLeagueStats(mockStats)
    }
  }, [selectedLeague, selectedQuiz])

  const handleCreateLeague = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)

    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get('name') as string
      const description = formData.get('description') as string
      const userId = localStorage.getItem('userId') || 'user-1'

      // Create mock league for prototype
      const newLeague: League = {
        id: `league-${Date.now()}`,
        name,
        description: description || null,
        inviteCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
        createdByUserId: userId,
        color: leagueColor,
        creator: {
          id: userId,
          name: userName || 'You',
          email: 'you@example.com'
        },
        members: [
          {
            id: `member-${Date.now()}`,
            userId: userId,
            joinedAt: new Date().toISOString(),
            user: {
              id: userId,
              name: userName || 'You',
              email: 'you@example.com',
              teamName: null
            }
          }
        ],
        _count: {
          members: 1
        }
      }

      setLeagues([newLeague, ...leagues])
      setSelectedLeague(newLeague)
      setShowCreateModal(false)
      setLeagueColor('#3B82F6') // Reset to default
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
      // Mock invite for prototype - just show success message
      // In a real implementation, this would send an API request
      setTimeout(() => {
        alert(`Successfully invited ${inviteEmail} (Prototype - no actual invite sent)`)
        setInviteEmail('')
        setShowInviteModal(false)
        setInviting(false)
      }, 500)
    } catch (error) {
      console.error('Error inviting user:', error)
      alert('Failed to invite user')
      setInviting(false)
    }
  }

  const handleEditLeague = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedLeague) return

    setEditing(true)

    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get('name') as string
      const description = formData.get('description') as string

      // Update league in local state for prototype
      const updatedLeagues = leagues.map(league =>
        league.id === selectedLeague.id
          ? { ...league, name, description: description || null, color: leagueColor }
          : league
      )

      setLeagues(updatedLeagues)
      setSelectedLeague({ ...selectedLeague, name, description: description || null, color: leagueColor })
      setShowEditModal(false)
      e.currentTarget.reset()
    } catch (error) {
      console.error('Error editing league:', error)
      alert('Failed to edit league')
    } finally {
      setEditing(false)
    }
  }

  const handleDeleteLeague = async () => {
    if (!selectedLeague) return

    setDeleting(true)

    try {
      // Remove league from local state for prototype
      const updatedLeagues = leagues.filter(league => league.id !== selectedLeague.id)
      setLeagues(updatedLeagues)

      // Select first league if available, otherwise clear selection
      if (updatedLeagues.length > 0) {
        setSelectedLeague(updatedLeagues[0])
      } else {
        setSelectedLeague(null)
        setLeagueStats(null)
      }

      setShowDeleteModal(false)
    } catch (error) {
      console.error('Error deleting league:', error)
      alert('Failed to delete league')
    } finally {
      setDeleting(false)
    }
  }

  const isCreator = (league: League) => {
    const userId = localStorage.getItem('userId')
    return league.createdByUserId === userId
  }

  const isMember = (league: League) => {
    const userId = localStorage.getItem('userId')
    return league.members.some(member => member.userId === userId)
  }

  const handleLeaveLeague = async () => {
    if (!selectedLeague) return

    setLeaving(true)

    try {
      const userId = localStorage.getItem('userId')

      // Remove user from league members for prototype
      const updatedLeagues = leagues.map(league => {
        if (league.id === selectedLeague.id) {
          return {
            ...league,
            members: league.members.filter(member => member.userId !== userId),
            _count: {
              members: league.members.filter(member => member.userId !== userId).length
            }
          }
        }
        return league
      })

      setLeagues(updatedLeagues)

      // Select first league if available, otherwise clear selection
      const updatedLeague = updatedLeagues.find(l => l.id === selectedLeague.id)
      if (updatedLeague && updatedLeague.members.length > 0) {
        setSelectedLeague(updatedLeague)
      } else {
        const otherLeagues = updatedLeagues.filter(l => l.id !== selectedLeague.id)
        if (otherLeagues.length > 0) {
          setSelectedLeague(otherLeagues[0])
        } else {
          setSelectedLeague(null)
          setLeagueStats(null)
        }
      }

      setShowLeaveModal(false)
    } catch (error) {
      console.error('Error leaving league:', error)
      alert('Failed to leave league')
    } finally {
      setLeaving(false)
    }
  }

  const handleKickMember = async () => {
    if (!selectedLeague || !memberToKick) return

    setKicking(true)

    try {
      // Remove member from league for prototype
      const updatedLeagues = leagues.map(league => {
        if (league.id === selectedLeague.id) {
          return {
            ...league,
            members: league.members.filter(member => member.userId !== memberToKick.id),
            _count: {
              members: league.members.filter(member => member.userId !== memberToKick.id).length
            }
          }
        }
        return league
      })

      setLeagues(updatedLeagues)
      setSelectedLeague(updatedLeagues.find(l => l.id === selectedLeague.id) || null)
      setShowKickModal(false)
      setMemberToKick(null)
    } catch (error) {
      console.error('Error kicking member:', error)
      alert('Failed to kick member')
    } finally {
      setKicking(false)
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
        <main className="min-h-screen bg-white dark:bg-[#0F1419] text-gray-900 dark:text-white pt-32 pb-16 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto text-center py-16">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Private Leagues</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Private leagues are only available to premium subscribers.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="inline-flex items-center justify-center h-12 px-6 bg-[#3B82F6] text-white rounded-full font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
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
        <main className="min-h-screen bg-white dark:bg-[#0F1419] text-gray-900 dark:text-white pt-32 pb-16 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto text-center py-16">
            <div className="text-gray-500 dark:text-gray-400">Loading leagues...</div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Helper function to darken a color for hover states
  const darkenColor = (color: string, percent: number = 10): string => {
    const num = parseInt(color.replace('#', ''), 16)
    const r = Math.max(0, (num >> 16) - percent * 2.55)
    const g = Math.max(0, ((num >> 8) & 0x00FF) - percent * 2.55)
    const b = Math.max(0, (num & 0x0000FF) - percent * 2.55)
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  // Get the league color, defaulting to blue
  const leagueAccentColor = selectedLeague?.color || '#3B82F6'
  const leagueHoverColor = darkenColor(leagueAccentColor, 10)

  const currentStats = selectedQuiz
    ? leagueStats?.stats || []
    : leagueStats?.overallStats || []

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white dark:bg-[#0F1419] text-gray-900 dark:text-white pt-24 sm:pt-32 pb-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Private Leagues</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">Invite friends to your league and try to beat them</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Leagues List */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Leagues</h2>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
                      className="font-medium transition-colors"
                      style={{ color: leagueAccentColor }}
                      onMouseEnter={(e) => e.currentTarget.style.color = leagueHoverColor}
                      onMouseLeave={(e) => e.currentTarget.style.color = leagueAccentColor}
                    >
                      Create your first league
                    </button>
                  </div>
                ) : (
                  <DraggableLeaguesList
                    leagues={leagues}
                    selectedLeague={selectedLeague}
                    onSelectLeague={(league) => {
                      setSelectedLeague(league)
                      setSelectedQuiz(null)
                    }}
                    onReorderLeagues={(newOrder) => {
                      setLeagues(newOrder)
                      saveLeagueOrder(newOrder)
                    }}
                    leagueAccentColor={leagueAccentColor}
                  />
                )}
              </div>
            </div>

            {/* League Details */}
            <div className="lg:col-span-2 space-y-6">
              {selectedLeague ? (
                <>
                  {/* League Header */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{selectedLeague.name}</h2>
                        {selectedLeague.description && (
                          <p className="text-gray-600 dark:text-gray-400">{selectedLeague.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isCreator(selectedLeague) && (
                          <>
                            <button
                              onClick={() => {
                                setLeagueColor(selectedLeague?.color || '#3B82F6')
                                setShowEditModal(true)
                              }}
                              className="inline-flex items-center justify-center gap-2 h-10 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:ring-offset-2"
                              title="Edit league"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(true)}
                              className="inline-flex items-center justify-center gap-2 h-10 px-4 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-full font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-600 focus:ring-offset-2"
                              title="Delete league"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!isCreator(selectedLeague) && isMember(selectedLeague) && (
                          <button
                            onClick={() => setShowLeaveModal(true)}
                            className="inline-flex items-center justify-center gap-2 h-10 px-4 border border-orange-300 dark:border-orange-600 text-orange-600 dark:text-orange-400 rounded-full font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-600 focus:ring-offset-2"
                            title="Leave league"
                          >
                            <LogOut className="w-4 h-4" />
                            Leave
                          </button>
                        )}
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="inline-flex items-center justify-center gap-2 h-10 px-4 text-white rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                          style={{
                            backgroundColor: leagueAccentColor
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = leagueHoverColor}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = leagueAccentColor}
                          onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${leagueAccentColor}`}
                          onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                        >
                          <Mail className="w-4 h-4" />
                          Invite
                        </button>
                      </div>
                    </div>

                    {/* Invite Code */}
                    <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Invite code:</span>
                      <code className="flex-1 font-mono text-gray-900 dark:text-white font-semibold">{selectedLeague.inviteCode}</code>
                      <button
                        onClick={() => copyInviteCode(selectedLeague.inviteCode)}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        aria-label="Copy invite code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Members ({selectedLeague.members.length})</h3>
                    <div className="space-y-2">
                      {selectedLeague.members.map((member) => {
                        const isYou = member.userId === localStorage.getItem('userId')
                        const isCreatorMember = member.userId === selectedLeague.createdByUserId
                        return (
                          <div
                            key={member.id}
                            className={`flex items-center justify-between p-3 rounded-xl ${isYou
                              ? 'border'
                              : 'bg-gray-50 dark:bg-gray-700/50'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-semibold text-sm" style={{ backgroundColor: leagueAccentColor }}>
                                {displayName(member.user).charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {displayName(member.user)} {isYou && '(You)'} {isCreatorMember && !isYou && '(Creator)'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            {isCreator(selectedLeague) && !isYou && (
                              <button
                                onClick={() => {
                                  setMemberToKick({
                                    id: member.userId,
                                    name: displayName(member.user)
                                  })
                                  setShowKickModal(true)
                                }}
                                className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                                title="Kick member"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Quiz Selector */}
                  {leagueStats && leagueStats.quizSlugs.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedQuiz(null)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedQuiz === null
                            ? 'text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          style={selectedQuiz === null ? { backgroundColor: leagueAccentColor } : {}}
                        >
                          Overall
                        </button>
                        {leagueStats.quizSlugs.map((slug) => (
                          <button
                            key={slug}
                            onClick={() => setSelectedQuiz(slug)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedQuiz === slug
                              ? 'text-white shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                            style={selectedQuiz === slug ? { backgroundColor: leagueAccentColor } : {}}
                          >
                            Quiz #{slug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leaderboard */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                        {selectedQuiz ? `Quiz #${selectedQuiz} Results` : 'Overall Leaderboard'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedQuiz
                          ? 'Ranked by score for this quiz'
                          : 'Ranked by total correct answers across all quizzes'}
                      </p>
                    </div>

                    {currentStats.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No stats yet. Start playing quizzes to see rankings!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Header Row */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700">
                          <div className="col-span-1 text-center">Rank</div>
                          <div className="col-span-2">Player</div>
                          {selectedQuiz ? (
                            <>
                              <div className="col-span-2 text-right">Score</div>
                              <div className="col-span-2 text-right">Accuracy</div>
                              <div className="col-span-5"></div>
                            </>
                          ) : (
                            <>
                              <div className="col-span-2 text-right">Correct</div>
                              <div className="col-span-2 text-right">Quizzes</div>
                              <div className="col-span-3 text-right">Avg Score</div>
                            </>
                          )}
                        </div>

                        {/* Leaderboard Rows */}
                        {currentStats.map((stat, index) => {
                          const isYou = stat.user.id === localStorage.getItem('userId')
                          const rank = index + 1
                          const accuracy = selectedQuiz && stat.totalQuestions
                            ? Math.round((stat.score || 0) / stat.totalQuestions * 100)
                            : null

                          return (
                            <div
                              key={stat.id}
                              className={`grid grid-cols-12 gap-4 items-center px-4 py-3.5 rounded-xl transition-all ${isYou
                                ? 'text-white shadow-md'
                                : 'bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                                }`}
                              style={isYou ? { backgroundColor: leagueAccentColor } : {}}
                            >
                              {/* Rank */}
                              <div className="col-span-1 flex items-center justify-center">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm tabular-nums ${isYou
                                  ? 'bg-white/20 text-white'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                  }`}>
                                  {rank}
                                </div>
                              </div>

                              {/* Player Name */}
                              <div className="col-span-3 md:col-span-2 flex items-center">
                                <div className="min-w-0">
                                  <div className="font-semibold truncate">
                                    {displayName(stat.user)}
                                  </div>
                                  {isYou && (
                                    <div className={`text-xs mt-0.5 ${isYou ? 'opacity-90' : 'text-gray-500 dark:text-gray-400'}`}>
                                      You
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Stats */}
                              {selectedQuiz ? (
                                <>
                                  {/* Score */}
                                  <div className="col-span-4 md:col-span-2 text-right">
                                    <div className="font-bold text-lg md:text-xl tabular-nums">
                                      {stat.score || 0}
                                      <span className="text-sm font-normal opacity-70 ml-1.5">
                                        / {stat.totalQuestions || 0}
                                      </span>
                                    </div>
                                    <div className={`text-xs mt-1 font-medium uppercase tracking-wide ${isYou ? 'opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
                                      score
                                    </div>
                                  </div>

                                  {/* Accuracy */}
                                  <div className="col-span-4 md:col-span-2 text-right">
                                    <div className="font-bold text-lg md:text-xl tabular-nums">
                                      {accuracy !== null ? `${accuracy}%` : '—'}
                                    </div>
                                    <div className={`text-xs mt-1 font-medium uppercase tracking-wide ${isYou ? 'opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
                                      accuracy
                                    </div>
                                  </div>

                                  <div className="col-span-4 hidden md:block"></div>
                                </>
                              ) : (
                                <>
                                  {/* Total Correct */}
                                  <div className="col-span-2 md:col-span-2 text-right">
                                    <div className="font-bold text-lg md:text-xl tabular-nums">
                                      {stat.totalCorrectAnswers.toLocaleString()}
                                    </div>
                                    <div className={`text-xs mt-1 font-medium uppercase tracking-wide ${isYou ? 'opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
                                      correct
                                    </div>
                                  </div>

                                  {/* Quizzes Played */}
                                  <div className="col-span-2 md:col-span-2 text-right">
                                    <div className="font-bold text-lg md:text-xl tabular-nums">
                                      {stat.quizzesPlayed}
                                    </div>
                                    <div className={`text-xs mt-1 font-medium uppercase tracking-wide ${isYou ? 'opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
                                      quizzes
                                    </div>
                                  </div>

                                  {/* Average Score */}
                                  <div className="col-span-2 md:col-span-3 text-right">
                                    <div className="font-bold text-lg md:text-xl tabular-nums">
                                      {stat.quizzesPlayed > 0
                                        ? (stat.totalCorrectAnswers / stat.quizzesPlayed).toFixed(1)
                                        : '0.0'}
                                      <span className="text-sm font-normal opacity-70 ml-1.5">
                                        / 25
                                      </span>
                                    </div>
                                    <div className={`text-xs mt-1 font-medium uppercase tracking-wide ${isYou ? 'opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
                                      avg per quiz
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 shadow-sm">
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
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create League</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
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
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${leagueColor}`}
                      onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                      placeholder="e.g., Team Awesome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Description (optional)</label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent resize-none transition-all"
                      placeholder="Describe your league..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-white">League Color</label>
                    <div className="grid grid-cols-8 gap-2">
                      {[
                        '#3B82F6', // Blue
                        '#8B5CF6', // Purple
                        '#10B981', // Emerald
                        '#F59E0B', // Amber
                        '#EF4444', // Red
                        '#EC4899', // Pink
                        '#06B6D4', // Cyan
                        '#84CC16', // Lime
                        '#6366F1', // Indigo
                        '#F97316', // Orange
                        '#14B8A6', // Teal
                        '#A855F7', // Violet
                        '#22C55E', // Green
                        '#EAB308', // Yellow
                        '#F43F5E', // Rose
                        '#0EA5E9', // Sky
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setLeagueColor(color)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${leagueColor === color
                            ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2'
                            : 'border-gray-200 dark:border-gray-600 hover:scale-105'
                            }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex-1 inline-flex items-center justify-center h-11 px-4 bg-[#3B82F6] text-white rounded-full font-medium hover:bg-[#2563EB] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
                    >
                      {creating ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 h-11 inline-flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit League Modal */}
        {showEditModal && selectedLeague && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit League</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditLeague}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">League Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={selectedLeague.name}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${leagueColor}`}
                      onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                      placeholder="e.g., Team Awesome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Description (optional)</label>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={selectedLeague.description || ''}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-all"
                      style={{ '--tw-ring-color': leagueColor } as React.CSSProperties}
                      onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${leagueColor}`}
                      onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                      placeholder="Describe your league..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-white">League Color</label>
                    <div className="grid grid-cols-8 gap-2">
                      {[
                        '#3B82F6', // Blue
                        '#8B5CF6', // Purple
                        '#10B981', // Emerald
                        '#F59E0B', // Amber
                        '#EF4444', // Red
                        '#EC4899', // Pink
                        '#06B6D4', // Cyan
                        '#84CC16', // Lime
                        '#6366F1', // Indigo
                        '#F97316', // Orange
                        '#14B8A6', // Teal
                        '#A855F7', // Violet
                        '#22C55E', // Green
                        '#EAB308', // Yellow
                        '#F43F5E', // Rose
                        '#0EA5E9', // Sky
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setLeagueColor(color)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${leagueColor === color
                            ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2'
                            : 'border-gray-200 dark:border-gray-600 hover:scale-105'
                            }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={editing}
                      className="flex-1 inline-flex items-center justify-center h-11 px-4 text-white rounded-full font-medium transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: leagueColor,
                        '--tw-ring-color': leagueColor,
                      } as React.CSSProperties}
                      onMouseEnter={(e) => {
                        if (!editing) {
                          e.currentTarget.style.backgroundColor = darkenColor(leagueColor, 10)
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!editing) {
                          e.currentTarget.style.backgroundColor = leagueColor
                        }
                      }}
                    >
                      {editing ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 h-11 inline-flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedLeague && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete League</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{selectedLeague.name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleDeleteLeague}
                    disabled={deleting}
                    className="flex-1 inline-flex items-center justify-center h-11 px-4 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                  >
                    {deleting ? 'Deleting...' : 'Delete League'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 h-11 inline-flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Leave League Modal */}
        {showLeaveModal && selectedLeague && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Leave League</h3>
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to leave <span className="font-semibold text-gray-900 dark:text-white">{selectedLeague.name}</span>? You can rejoin later using the invite code.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleLeaveLeague}
                    disabled={leaving}
                    className="flex-1 inline-flex items-center justify-center h-11 px-4 bg-orange-600 text-white rounded-full font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2"
                  >
                    {leaving ? 'Leaving...' : 'Leave League'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(false)}
                    className="px-4 h-11 inline-flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Kick Member Modal */}
        {showKickModal && selectedLeague && memberToKick && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Kick Member</h3>
                <button
                  onClick={() => {
                    setShowKickModal(false)
                    setMemberToKick(null)
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to kick <span className="font-semibold text-gray-900 dark:text-white">{memberToKick.name}</span> from <span className="font-semibold text-gray-900 dark:text-white">{selectedLeague.name}</span>? They can rejoin using the invite code.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleKickMember}
                    disabled={kicking}
                    className="flex-1 inline-flex items-center justify-center h-11 px-4 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                  >
                    {kicking ? 'Kicking...' : 'Kick Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowKickModal(false)
                      setMemberToKick(null)
                    }}
                    className="px-4 h-11 inline-flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && selectedLeague && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Invite Friend</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
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
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${leagueColor}`}
                      onBlur={(e) => e.currentTarget.style.boxShadow = ''}
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
                      className="flex-1 inline-flex items-center justify-center h-11 px-4 bg-[#3B82F6] text-white rounded-full font-medium hover:bg-[#2563EB] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
                    >
                      {inviting ? 'Inviting...' : 'Invite'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="px-4 h-11 inline-flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:ring-offset-2"
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

