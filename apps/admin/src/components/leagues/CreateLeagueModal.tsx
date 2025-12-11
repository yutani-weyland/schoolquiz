'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Building2, Info, Users, UserPlus, Users2, ChevronDown, Check } from 'lucide-react'
import { useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useTeams } from '@/hooks/useTeams'

interface CreateLeagueModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: { name: string; description: string; color: string; organisationId?: string | null; teamIds?: string[] }) => Promise<void>
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
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [teamsExpanded, setTeamsExpanded] = useState(false)
  const { teams, isLoading: teamsLoading } = useTeams()
  const hasTeams = teams.length > 0

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeamIds(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await onCreate({ 
      name: name.trim(), 
      description: description.trim(), 
      color,
      organisationId: showToOrganisation && userOrg ? userOrg.id : null,
      teamIds: selectedTeamIds.length > 0 ? selectedTeamIds : undefined
    })
    setName('')
    setDescription('')
    setColor('#3B82F6')
    setShowToOrganisation(false)
    setSelectedTeamIds([])
  }

  const handleClose = () => {
    if (!creating) {
      setName('')
      setDescription('')
      setColor('#3B82F6')
      setSelectedTeamIds([])
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
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-[420px] w-full border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="flex items-center justify-between pt-8 px-6 pb-6 border-b border-gray-200 dark:border-gray-700">
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
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Organisation Visibility Toggle */}
                {userOrg && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            Associate with {userOrg.name}
                          </span>
                          <Tooltip.Provider delayDuration={100}>
                            <Tooltip.Root>
                              <Tooltip.Trigger asChild>
                                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 cursor-help" />
                              </Tooltip.Trigger>
                              <Tooltip.Portal>
                                <Tooltip.Content
                                  className="z-50 max-w-xs rounded-lg bg-black/95 backdrop-blur-sm px-3 py-2 text-xs font-medium text-white shadow-xl border border-white/10"
                                  side="top"
                                  sideOffset={5}
                                >
                                  When enabled, organisation members can discover and request to join this league. When disabled, only people with the invite code can join.
                                  <Tooltip.Arrow className="fill-black/95" />
                                </Tooltip.Content>
                              </Tooltip.Portal>
                            </Tooltip.Root>
                          </Tooltip.Provider>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {showToOrganisation 
                            ? `Organisation members can browse and request to join`
                            : `Keep private - only invite code access`}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showToOrganisation}
                          onChange={(e) => setShowToOrganisation(e.target.checked)}
                          disabled={creating}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 disabled:opacity-50"></div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Details Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Details</h4>
                  
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
                </div>

                {/* Team Selection - Collapsible */}
                {hasTeams && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setTeamsExpanded(!teamsExpanded)}
                      className="w-full flex items-center justify-between p-0 text-left"
                      disabled={creating}
                    >
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Teams
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">(optional)</span>
                        <Tooltip.Provider delayDuration={100}>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <Info className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 cursor-help" />
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className="z-50 max-w-xs rounded-lg bg-black/95 backdrop-blur-sm px-3 py-2 text-xs font-medium text-white shadow-xl border border-white/10"
                                side="top"
                                sideOffset={5}
                              >
                                Add your own teams now. You can add other users' teams later.
                                <Tooltip.Arrow className="fill-black/95" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                          teamsExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    <AnimatePresence>
                      {teamsExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 space-y-2 max-h-48 overflow-y-auto">
                            {teams.map((team) => (
                              <label
                                key={team.id}
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedTeamIds.includes(team.id)}
                                  onChange={() => handleTeamToggle(team.id)}
                                  disabled={creating}
                                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                />
                                <div className="flex-1 flex items-center gap-2">
                                  {team.color && (
                                    <div
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: team.color }}
                                    />
                                  )}
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {team.name}
                                  </span>
                                  {team.isDefault && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      (Default)
                                    </span>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                          {selectedTeamIds.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {selectedTeamIds.length} team{selectedTeamIds.length > 1 ? 's' : ''} selected
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Compact Invite Info Banner */}
                <div className="flex items-start gap-2 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    You can invite members after creating your league.
                  </p>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    League Colour
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Choose a colour for visibility on leaderboards
                  </p>
                  <div className="grid grid-cols-8 gap-2.5">
                    {LEAGUE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        disabled={creating}
                        className={`relative w-10 h-10 rounded-xl border-2 transition-all ${
                          color === c
                            ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2'
                            : 'border-gray-200 dark:border-gray-600 hover:scale-105 hover:shadow-md'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Select color ${c}`}
                      >
                        {color === c && (
                          <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-sm" />
                        )}
                      </button>
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
                    className="px-4 h-11 inline-flex items-center justify-center text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
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

