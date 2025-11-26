'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Crown, UserX, Mail, KeyRound, Copy, Check, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchLeagueMembers } from '@/lib/leagues-fetch'
import type { League } from '@/lib/leagues-fetch'

interface LeagueMembersModalProps {
  isOpen: boolean
  onClose: () => void
  league: League | null
  isLoading?: boolean
  currentUserId: string | null
  isCreator: boolean
  onKickMember: (userId: string, userName: string) => void
  onInvite: () => void
}

export function LeagueMembersModal({
  isOpen,
  onClose,
  league,
  isLoading: isLoadingLeague = false,
  currentUserId,
  isCreator,
  onKickMember,
  onInvite
}: LeagueMembersModalProps) {
  const [copied, setCopied] = useState(false)

  // OPTIMIZATION: Fetch members separately using optimized endpoint (only when modal is open)
  const { data: membersData, isLoading: loadingMembers, isFetching: fetchingMembers } = useQuery({
    queryKey: ['league-members', league?.id],
    queryFn: () => fetchLeagueMembers(league!.id, 100, 0), // Fetch up to 100 members
    enabled: isOpen && !!league?.id,
    staleTime: 10 * 1000, // Cache for 10 seconds
  })

  const members = membersData?.members || []
  const memberCount = membersData?.pagination?.total || league?._count?.members || 0
  const isInitialLoad = (loadingMembers && !membersData) || isLoadingLeague // True only on first load or when league is loading

  // OPTIMIZATION: Simplified displayName - only name is fetched from API
  const displayName = (user: { name: string | null }) => {
    return user.name || 'Unknown'
  }

  const copyInviteCode = async () => {
    if (league?.inviteCode) {
      await navigator.clipboard.writeText(league.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!league) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 relative">
              {/* Prominent Loading Overlay - shows when data is being fetched */}
              {isInitialLoad && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-50 rounded-3xl flex flex-col items-center justify-center"
                >
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Loading league data...
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This should only take a moment
                  </p>
                </motion.div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {league.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </div>
                  {fetchingMembers && !isInitialLoad && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" title="Refreshing..." />
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Invite Code Section */}
              <div className="px-6 pt-6">
                <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <KeyRound className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Invite Code
                    </div>
                    <div className="font-mono text-lg font-semibold text-gray-900 dark:text-white">
                      {league.inviteCode}
                    </div>
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Copy invite code"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loadingMembers ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 text-gray-400 dark:text-gray-500 animate-spin" />
                    <p className="text-gray-600 dark:text-gray-400">Loading members...</p>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No members yet</p>
                    <button
                      onClick={onInvite}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Invite Members
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => {
                      const isYou = member.userId === currentUserId
                      const isCreatorMember = member.userId === league.createdByUserId
                      const name = displayName(member.user)

                      return (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between p-4 rounded-xl border ${
                            isYou
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white text-sm"
                              style={{ backgroundColor: league.color || '#3B82F6' }}
                            >
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {name}
                                </span>
                                {isYou && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                    You
                                  </span>
                                )}
                                {isCreatorMember && !isYou && (
                                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                                    <Crown className="w-3 h-3" />
                                    Creator
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {isCreator && !isYou && (
                            <button
                              onClick={() => onKickMember(member.userId, name)}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                              title="Remove member"
                            >
                              <UserX className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={onInvite}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                  style={league.color ? { backgroundColor: league.color } : {}}
                >
                  <Mail className="w-4 h-4" />
                  Invite More
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

