'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, X, CheckCircle, XCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchLeagueRequests, respondToRequest, type LeagueRequest } from '@/lib/leagues-fetch'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { motion, AnimatePresence } from 'framer-motion'

export function LeagueRequestsNotification() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['league-requests'],
    queryFn: fetchLeagueRequests,
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  })

  const respondMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'approve' | 'reject' }) =>
      respondToRequest(requestId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['league-requests'] })
      queryClient.invalidateQueries({ queryKey: ['private-leagues'] })
    },
  })

  const pendingCount = requests.length

  if (pendingCount === 0) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          title={`${pendingCount} league join request${pendingCount > 1 ? 's' : ''}`}
        >
          <Mail className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 max-h-[500px] overflow-hidden p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Join Requests ({pendingCount})
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                Loading...
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No pending requests
              </div>
            ) : (
              <AnimatePresence>
                {requests.map((request: LeagueRequest) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3 mb-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                  >
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {request.user.name || request.user.email}
                        </span>
                        {request.user.teamName && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                            {request.user.teamName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Wants to join <span className="font-medium">{request.league.name}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          respondMutation.mutate({ requestId: request.id, action: 'approve' })
                        }}
                        disabled={respondMutation.isPending}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 bg-green-600 text-white rounded-full text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          respondMutation.mutate({ requestId: request.id, action: 'reject' })
                        }}
                        disabled={respondMutation.isPending}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 bg-red-600 text-white rounded-full text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
          
          {requests.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <a
                href="/leagues"
                className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                onClick={() => setIsOpen(false)}
              >
                View all in Leagues
              </a>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

