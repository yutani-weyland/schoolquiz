'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Trash2, Edit2, Building2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { League } from '@/lib/leagues-fetch'

interface ManageLeagueModalProps {
  isOpen: boolean
  onClose: () => void
  league: League | null
  isLoading?: boolean
  onUpdate: (id: string, data: { name: string; description: string; color: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  updating: boolean
  deleting: boolean
  userOrg: { id: string; name: string } | null
}

const LEAGUE_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#84CC16',
  '#6366F1', '#F97316', '#14B8A6', '#A855F7',
  '#22C55E', '#EAB308', '#F43F5E', '#0EA5E9',
]

export function ManageLeagueModal({
  isOpen,
  onClose,
  league,
  isLoading = false,
  onUpdate,
  onDelete,
  updating,
  deleting,
  userOrg
}: ManageLeagueModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (league) {
      setName(league.name)
      setDescription(league.description || '')
      setColor(league.color || '#3B82F6')
    }
  }, [league])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!league || !name.trim()) return
    await onUpdate(league.id, { name: name.trim(), description: description.trim(), color })
  }

  const handleDelete = async () => {
    if (!league) return
    await onDelete(league.id)
    setShowDeleteConfirm(false)
  }

  const handleClose = () => {
    if (!updating && !deleting) {
      setShowDeleteConfirm(false)
      onClose()
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
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 relative">
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
                      Manage League
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {league.name}
                    </p>
                  </div>
                  {isLoading && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" title="Loading..." />
                  )}
                </div>
                <button
                  onClick={handleClose}
                  disabled={updating || deleting || isLoading}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {showDeleteConfirm ? (
                /* Delete Confirmation */
                <div className="p-6 space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                      <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Delete League?
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Are you sure you want to delete <span className="font-semibold">{league.name}</span>? This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="px-4 h-11 inline-flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit Form */
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Organisation Info */}
                  {userOrg && league.organisationId === userOrg.id && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
                          Associated with {userOrg.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      League Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g., Team Awesome"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      style={{ '--tw-ring-color': color } as React.CSSProperties}
                      disabled={updating}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Describe your league..."
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all"
                      style={{ '--tw-ring-color': color } as React.CSSProperties}
                      disabled={updating}
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                      League Color
                    </label>
                    <div className="grid grid-cols-8 gap-2">
                      {LEAGUE_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          disabled={updating}
                          className={`w-10 h-10 rounded-xl border-2 transition-all ${
                            color === c
                              ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2'
                              : 'border-gray-200 dark:border-gray-600 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c }}
                          aria-label={`Select color ${c}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={updating || !name.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                      style={{ backgroundColor: color }}
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={updating || deleting}
                      className="px-4 h-11 inline-flex items-center justify-center border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={updating}
                      className="px-4 h-11 inline-flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

