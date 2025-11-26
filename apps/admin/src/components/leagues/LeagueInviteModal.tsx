'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, KeyRound, Building2, Users, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

interface LeagueInviteModalProps {
  isOpen: boolean
  onClose: () => void
  league: { id: string; name: string; inviteCode: string; color?: string } | null
  isLoading?: boolean
  userOrg: { id: string; name: string } | null
  orgMembers: any[]
  loadingOrgMembers: boolean
  onInviteByEmail: (email: string) => Promise<void>
  onInviteOrgMembers: (memberIds: string[]) => Promise<void>
  inviting: boolean
}

export function LeagueInviteModal({
  isOpen,
  onClose,
  league,
  isLoading = false,
  userOrg,
  orgMembers,
  loadingOrgMembers,
  onInviteByEmail,
  onInviteOrgMembers,
  inviting
}: LeagueInviteModalProps) {
  const [mode, setMode] = useState<'org' | 'email' | 'code'>('org')
  const [email, setEmail] = useState('')
  const [search, setSearch] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
  const debouncedSearch = useDebounce(search, 200)

  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setSearch('')
      setSelectedMemberIds(new Set())
      setMode(userOrg ? 'org' : 'email')
    }
  }, [isOpen, userOrg])

  // OPTIMIZATION: Simplified filtering - no profile relation needed (already optimized in API)
  const filteredMembers = useMemo(() => {
    if (!debouncedSearch.trim()) return orgMembers
    const searchLower = debouncedSearch.toLowerCase()
    return orgMembers.filter((m: any) => {
      const name = m.user?.name || ''
      const email = m.user?.email || ''
      const teamName = m.user?.teamName || ''
      return name.toLowerCase().includes(searchLower) || 
             email.toLowerCase().includes(searchLower) || 
             teamName.toLowerCase().includes(searchLower)
    })
  }, [orgMembers, debouncedSearch])

  const handleToggleMember = useCallback((memberId: string) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedMemberIds.size === filteredMembers.length) {
      setSelectedMemberIds(new Set())
    } else {
      setSelectedMemberIds(new Set(filteredMembers.map((m: any) => m.user?.id).filter(Boolean)))
    }
  }, [filteredMembers, selectedMemberIds.size])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'email' && email.trim()) {
      await onInviteByEmail(email.trim())
    } else if (mode === 'org' && selectedMemberIds.size > 0) {
      await onInviteOrgMembers(Array.from(selectedMemberIds))
    }
  }

  const copyInviteCode = async () => {
    if (league?.inviteCode) {
      await navigator.clipboard.writeText(league.inviteCode)
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
              {isLoading && (
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
                      Invite to {league.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Share this league with others
                    </p>
                  </div>
                  {isLoading && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" title="Loading..." />
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 px-6 pt-4 border-b border-gray-200 dark:border-gray-700">
                {userOrg && orgMembers.length > 0 && (
                  <button
                    onClick={() => setMode('org')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                      mode === 'org'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4 inline-block mr-2" />
                    {userOrg.name}
                  </button>
                )}
                <button
                  onClick={() => setMode('email')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    mode === 'email'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Mail className="w-4 h-4 inline-block mr-2" />
                  Email
                </button>
                <button
                  onClick={() => setMode('code')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    mode === 'code'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <KeyRound className="w-4 h-4 inline-block mr-2" />
                  Invite Code
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                {mode === 'code' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Share this code
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-lg font-semibold text-gray-900 dark:text-white tracking-wider">
                          {league.inviteCode}
                        </div>
                        <button
                          type="button"
                          onClick={copyInviteCode}
                          className="px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Anyone with this code can join your league
                      </p>
                    </div>
                  </div>
                ) : mode === 'org' ? (
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search members..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Select All */}
                    {filteredMembers.length > 0 && (
                      <label className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.size > 0 && selectedMemberIds.size === filteredMembers.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Select All ({selectedMemberIds.size} selected)
                        </span>
                      </label>
                    )}

                    {/* Member List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {loadingOrgMembers ? (
                        <div className="text-center py-8">
                          <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-gray-400" />
                          <p className="text-sm text-gray-500">Loading members...</p>
                        </div>
                      ) : filteredMembers.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm text-gray-500">No members found</p>
                        </div>
                      ) : (
                        filteredMembers.map((member: any) => {
                          const isSelected = selectedMemberIds.has(member.user?.id)
                          const displayName = member.user?.profile?.displayName || member.user?.teamName || member.user?.name || member.user?.email
                          return (
                            <label
                              key={member.id}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleMember(member.user?.id)}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {displayName}
                                </div>
                                {member.user?.email && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {member.user.email}
                                  </div>
                                )}
                              </div>
                            </label>
                          )
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="friend@example.com"
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}
              </form>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                {mode !== 'code' && (
                  <button
                    onClick={handleSubmit}
                    disabled={
                      inviting ||
                      (mode === 'email' && !email.trim()) ||
                      (mode === 'org' && selectedMemberIds.size === 0)
                    }
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={league.color ? { backgroundColor: league.color } : {}}
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Inviting...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        {mode === 'org' ? `Invite ${selectedMemberIds.size} Member${selectedMemberIds.size !== 1 ? 's' : ''}` : 'Send Invite'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

