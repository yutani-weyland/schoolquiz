'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, User, Check, Loader2, AlertCircle, Users, Share2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAuthToken, getUserId } from '@/lib/storage'

interface PremiumUser {
  id: string
  name: string | null
  email: string
  tier: string
}

interface ShareQuizModalProps {
  quizId: string
  quizTitle: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  currentShares?: PremiumUser[]
  usage?: {
    quizzesShared: number
    quizzesSharedLimit: number
  }
}

export function ShareQuizModal({
  quizId,
  quizTitle,
  isOpen,
  onClose,
  onSuccess,
  currentShares = [],
  usage,
}: ShareQuizModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PremiumUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [isSearching, setIsSearching] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loadingShares, setLoadingShares] = useState(false)
  const [loadedShares, setLoadedShares] = useState<PremiumUser[]>(currentShares)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Load current shares when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCurrentShares()
      setSelectedUsers(new Set())
      setSearchQuery('')
      setSearchResults([])
      setError(null)
      setSuccess(false)
    }
  }, [isOpen, quizId])

  const loadCurrentShares = async () => {
    setLoadingShares(true)
    try {
      const token = getAuthToken()
      const userId = getUserId()

      if (!token || !userId) {
        setError('Not authenticated')
        return
      }

      const res = await fetch(`/api/premium/custom-quizzes/${quizId}/shares`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId,
        },
      })

      if (res.ok) {
        const data = await res.json()
        const shares = data.shares || []
        setLoadedShares(shares)
        setSelectedUsers(new Set(shares.map((u: PremiumUser) => u.id)))
      } else {
        // If endpoint doesn't exist yet, use prop
        setLoadedShares(currentShares)
        setSelectedUsers(new Set(currentShares.map(u => u.id)))
      }
    } catch (err: any) {
      console.error('Error loading shares:', err)
      // Fallback to prop
      setLoadedShares(currentShares)
      setSelectedUsers(new Set(currentShares.map(u => u.id)))
    } finally {
      setLoadingShares(false)
    }
  }

  // Search for premium users
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const token = getAuthToken()
        const userId = getUserId()

        if (!token || !userId) {
          setError('Not authenticated')
          return
        }

        const res = await fetch(`/api/premium/users/search?q=${encodeURIComponent(searchQuery)}&limit=20`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': userId,
          },
        })

        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.users || [])
        } else {
          const errorData = await res.json()
          setError(errorData.error || 'Failed to search users')
        }
      } catch (err: any) {
        console.error('Error searching users:', err)
        setError(err.message || 'Failed to search users')
      } finally {
        setIsSearching(false)
      }
    }, 300) // Debounce search

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const handleShare = async () => {
    if (selectedUsers.size === 0) {
      setError('Please select at least one user to share with')
      return
    }

    setIsSharing(true)
    setError(null)

    try {
      const token = getAuthToken()
      const userId = getUserId()

      if (!token || !userId) {
        throw new Error('Not authenticated')
      }

      // Determine which users to add and which to remove
      const currentShareIds = new Set(loadedShares.map(u => u.id))
      const selectedIds = Array.from(selectedUsers)
      const toAdd = selectedIds.filter(id => !currentShareIds.has(id))
      const toRemove = Array.from(currentShareIds).filter(id => !selectedUsers.has(id))

      // Add new shares
      if (toAdd.length > 0) {
        const res = await fetch(`/api/premium/custom-quizzes/${quizId}/share`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': userId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds: toAdd }),
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to share quiz')
        }
      }

      // Remove shares
      if (toRemove.length > 0) {
        const res = await fetch(`/api/premium/custom-quizzes/${quizId}/share?userIds=${toRemove.join(',')}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': userId,
          },
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to remove shares')
        }
      }

      setSuccess(true)
      // Reload shares
      await loadCurrentShares()
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1000)
    } catch (err: any) {
      console.error('Error sharing quiz:', err)
      setError(err.message || 'Failed to share quiz')
    } finally {
      setIsSharing(false)
    }
  }

  if (!isOpen) return null

  const remainingShares = usage ? usage.quizzesSharedLimit - usage.quizzesShared : 20
  const newSharesCount = Array.from(selectedUsers).filter(id => 
    !currentShares.some(u => u.id === id)
  ).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Share Quiz
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {quizTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Usage Info */}
        {usage && (
          <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                Monthly shares remaining:
              </span>
              <span className={`font-medium ${
                remainingShares <= 5 ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
                {remainingShares} / {usage.quizzesSharedLimit}
              </span>
            </div>
            {newSharesCount > 0 && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                This will use {newSharesCount} of your remaining shares
              </p>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-600 dark:text-green-400">
                Quiz shared successfully!
              </p>
            </div>
          )}

          {/* Current Shares */}
          {loadingShares ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : loadedShares.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currently Shared With ({loadedShares.length})
              </h3>
              <div className="space-y-2">
                {loadedShares.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || 'No name'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleUser(user.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedUsers.has(user.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {selectedUsers.has(user.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchQuery.length >= 2 && searchResults.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Results ({searchResults.length})
              </h3>
              <div className="space-y-2">
                {searchResults
                  .filter(user => !loadedShares.some(cs => cs.id === user.id))
                  .map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => toggleUser(user.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name || 'No name'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <button
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedUsers.has(user.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {selectedUsers.has(user.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No premium users found matching "{searchQuery}"
              </p>
            </div>
          )}

          {/* Empty State */}
          {!searchQuery && !loadingShares && loadedShares.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Search for premium users to share this quiz with
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isSharing}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing || selectedUsers.size === 0 || (usage && newSharesCount > remainingShares)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isSharing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share with {selectedUsers.size} {selectedUsers.size === 1 ? 'user' : 'users'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

