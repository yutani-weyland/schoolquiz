'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Users, Send, Check, Search, Loader2, ChevronLeft, ChevronRight, KeyRound, ChevronDown, ChevronUp } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAvailableOrgLeagues, createLeagueRequest, type OrganisationLeague } from '@/lib/leagues-fetch'
import { useDebounce } from '@/hooks/useDebounce'

interface OrganisationLeaguesSectionProps {
  organisationName?: string
  onJoinByCode?: () => void
}

export function OrganisationLeaguesSection({ organisationName, onJoinByCode }: OrganisationLeaguesSectionProps) {
  const queryClient = useQueryClient()
  const [requestingLeagueId, setRequestingLeagueId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)
  const debouncedSearch = useDebounce(searchInput, 300)
  const limit = 10

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['available-org-leagues', debouncedSearch, page],
    queryFn: () => fetchAvailableOrgLeagues(debouncedSearch, page, limit),
    staleTime: 30 * 1000,
    enabled: !!organisationName,
  })

  const availableLeagues = data?.leagues || []
  const pagination = data?.pagination || { page: 1, limit, total: 0, totalPages: 0 }

  const requestMutation = useMutation({
    mutationFn: createLeagueRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-org-leagues'] })
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
      setRequestingLeagueId(null)
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : 'Failed to send request')
      setRequestingLeagueId(null)
    },
  })

  const handleRequest = async (leagueId: string) => {
    setRequestingLeagueId(leagueId)
    requestMutation.mutate(leagueId)
  }

  // Hide component if:
  // 1. No organisation name (user not part of org)
  // 2. After loading, if there are no leagues available
  if (!organisationName) {
    return null
  }

  // After loading completes, if there are no leagues, hide the section
  if (!isLoading && pagination.total === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-4"
    >
      {/* Compact Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-blue-100/50 dark:hover:bg-blue-900/10 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {organisationName} Leagues
          </h3>
          {pagination.total > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-200 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">
              {pagination.total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isExpanded && pagination.total > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Click to browse
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Compact Search Input */}
              <div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search leagues..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Scrollable Leagues List */}
              <div className="max-h-[400px] overflow-y-auto pr-1 space-y-2">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-white dark:bg-gray-800/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    {availableLeagues.map((league: OrganisationLeague) => (
                    <div
                      key={league.id}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          {/* Color indicator */}
                          {league.color && (
                            <div
                              className="w-3 h-3 rounded-full shrink-0 border border-gray-300 dark:border-gray-600"
                              style={{ backgroundColor: league.color }}
                              title={`League color: ${league.color}`}
                            />
                          )}
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {league.name}
                          </h4>
                          {league.hasPendingRequest && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{league._count.members}</span>
                          </div>
                          <span className="truncate">Created by {league.creator.profile?.displayName || league.creator.name || league.creator.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Join by Code Button */}
                        {onJoinByCode && (
                          <button
                            onClick={onJoinByCode}
                            disabled={league.hasPendingRequest || requestingLeagueId === league.id}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            title="Join with invite code"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span className="hidden sm:inline">Code</span>
                          </button>
                        )}
                        {/* Request to Join Button */}
                        <button
                          onClick={() => handleRequest(league.id)}
                          disabled={league.hasPendingRequest || requestingLeagueId === league.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                          style={{
                            backgroundColor: league.hasPendingRequest
                              ? 'transparent'
                              : '#3B82F6',
                            color: league.hasPendingRequest ? '#6B7280' : 'white',
                            border: league.hasPendingRequest ? '1px solid #E5E7EB' : 'none',
                          }}
                        >
                          {requestingLeagueId === league.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span className="hidden sm:inline">Sending...</span>
                            </>
                          ) : league.hasPendingRequest ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span className="hidden sm:inline">Requested</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              <span className="hidden sm:inline">Request</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    ))}
                    
                    {/* Empty State - only show if searching (not when no leagues at all) */}
                    {availableLeagues.length === 0 && debouncedSearch && (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No leagues found matching "{debouncedSearch}"
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Showing {availableLeagues.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
                    {Math.min(page * limit, pagination.total)} of {pagination.total} leagues
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoading}
                      className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    <div className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                      Page {page} of {pagination.totalPages}
                    </div>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages || isLoading}
                      className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

