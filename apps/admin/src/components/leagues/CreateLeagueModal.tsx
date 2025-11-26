'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Building2 } from 'lucide-react'
import { useState } from 'react'

interface CreateLeagueModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: { name: string; description: string; color: string; organisationId?: string | null }) => Promise<void>
  creating: boolean
  userOrg: { id: string; name: string } | null
}

const LEAGUE_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#84CC16',
  '#6366F1', '#F97316', '#14B8A6', '#A855F7',
  '#22C55E', '#EAB308', '#F43F5E', '#0EA5E9',
]

export function CreateLeagueModal({
  isOpen,
  onClose,
  onCreate,
  creating,
  userOrg
}: CreateLeagueModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [showToOrganisation, setShowToOrganisation] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await onCreate({ 
      name: name.trim(), 
      description: description.trim(), 
      color,
      organisationId: showToOrganisation && userOrg ? userOrg.id : null
    })
    setName('')
    setDescription('')
    setColor('#3B82F6')
    setShowToOrganisation(false)
  }

  const handleClose = () => {
    if (!creating) {
      setName('')
      setDescription('')
      setColor('#3B82F6')
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
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create League
                </h3>
                <button
                  onClick={handleClose}
                  disabled={creating}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Organisation Visibility Toggle */}
                {userOrg && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showToOrganisation}
                        onChange={(e) => setShowToOrganisation(e.target.checked)}
                        disabled={creating}
                        className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Show to {userOrg.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Organisation members will be able to see and request to join this league
                        </p>
                      </div>
                    </label>
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
                    disabled={creating}
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
                    disabled={creating}
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
                        disabled={creating}
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
                    disabled={creating || !name.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    style={{ backgroundColor: color }}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create League'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={creating}
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

