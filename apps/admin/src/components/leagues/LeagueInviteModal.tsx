'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, KeyRound, Building2, Users, Search, Copy, Check, Loader2 } from 'lucide-react'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import * as Tooltip from '@radix-ui/react-tooltip'

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
  const [email, setEmail] = useState('')
  const [search, setSearch] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const debouncedSearch = useDebounce(search, 200)

  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setSearch('')
      setSelectedMemberIds(new Set())
      setCopied(false)
    }
  }, [isOpen])

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

  const handleInviteByEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      await onInviteByEmail(email.trim())
      setEmail('')
    }
  }

  const handleInviteOrgMembers = async () => {
    if (selectedMemberIds.size > 0) {
      await onInviteOrgMembers(Array.from(selectedMemberIds))
      setSelectedMemberIds(new Set())
    }
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
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Invite to {league.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Share this league with others
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content - Three Sections */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Section 1: Invite Code */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Invite Code
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex-1 font-mono text-base font-semibold text-gray-900 dark:text-white">
                      {league.inviteCode}
                    </div>
                    <Tooltip.Provider delayDuration={100}>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <button
                            type="button"
                            onClick={copyInviteCode}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            )}
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="z-50 rounded-lg bg-black/95 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white shadow-xl border border-white/10 whitespace-nowrap"
                            side="top"
                            sideOffset={5}
                          >
                            Copy invite code
                            <Tooltip.Arrow className="fill-black/95" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Share this code with anyone you want to invite
                  </p>
                </div>

                {/* Section 2: Invite by Email */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Invite by Email
                    </h4>
                  </div>
                  <form onSubmit={handleInviteByEmail} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="friend@example.com"
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      disabled={inviting || !email.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={league.color ? { backgroundColor: league.color } : {}}
                    >
                      {inviting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Send'
                      )}
                    </button>
                  </form>
                </div>

                {/* Section 3: Discover Users from Organisation */}
                {userOrg && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Discover Users from {userOrg.name}
                      </h4>
                    </div>
                    
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search members..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
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
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {loadingOrgMembers ? (
                        <div className="text-center py-6">
                          <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-gray-400" />
                          <p className="text-xs text-gray-500">Loading members...</p>
                        </div>
                      ) : filteredMembers.length === 0 ? (
                        <div className="text-center py-6">
                          <Users className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                          <p className="text-xs text-gray-500">No members found</p>
                        </div>
                      ) : (
                        filteredMembers.map((member: any) => {
                          const isSelected = selectedMemberIds.has(member.user?.id)
                          const displayName = member.user?.profile?.displayName || member.user?.teamName || member.user?.name || member.user?.email
                          return (
                            <label
                              key={member.id}
                              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleMember(member.user?.id)}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {displayName}
                                </div>
                                {member.user?.email && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {member.user.email}
                                  </div>
                                )}
                              </div>
                            </label>
                          )
                        })
                      )}
                    </div>

                    {/* Invite Selected Button */}
                    {selectedMemberIds.size > 0 && (
                      <button
                        onClick={handleInviteOrgMembers}
                        disabled={inviting}
                        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                            Invite {selectedMemberIds.size} Member{selectedMemberIds.size !== 1 ? 's' : ''}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

