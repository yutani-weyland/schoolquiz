'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, KeyRound, Loader2, AlertCircle, Users } from 'lucide-react'
import { useState } from 'react'
import { useTeams } from '@/hooks/useTeams'

interface JoinByCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onJoin: (code: string, teamId?: string) => Promise<void>
  joining: boolean
}

export function JoinByCodeModal({
  isOpen,
  onClose,
  onJoin,
  joining
}: JoinByCodeModalProps) {
  const [code, setCode] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const { teams, isLoading: teamsLoading } = useTeams()
  const hasTeams = teams.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedCode) {
      setError('Please enter an invite code')
      return
    }
    if (trimmedCode.length !== 8) {
      setError('Invite code must be 8 characters')
      return
    }
    try {
      await onJoin(trimmedCode, selectedTeamId || undefined)
      setCode('')
      setSelectedTeamId('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join league')
    }
  }

  const handleClose = () => {
    if (!joining) {
      setCode('')
      setSelectedTeamId('')
      setError(null)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Join League
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Enter the invite code to join
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={joining}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    <KeyRound className="w-4 h-4 inline-block mr-2" />
                    Invite Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
                      setCode(value)
                      setError(null)
                    }}
                    placeholder="ABCD1234"
                    required
                    maxLength={8}
                    disabled={joining}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-mono text-lg tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Enter the 8-character invite code
                  </p>
                </div>

                {/* Team Selection */}
                {hasTeams && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      <Users className="w-4 h-4 inline-block mr-2" />
                      Join with Team (Optional)
                    </label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      disabled={joining || teamsLoading}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    >
                      <option value="">Join as myself (individual)</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name} {team.isDefault && '(Default)'}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Select a team to join with, or join as yourself. Your display name will be used if joining individually.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={joining || !code.trim() || code.length !== 8}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join League'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={joining}
                    className="px-4 h-11 inline-flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}







