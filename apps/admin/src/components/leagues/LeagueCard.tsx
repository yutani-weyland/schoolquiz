'use client'

import { motion } from 'framer-motion'
import { Users, Crown, UserPlus, Settings, Building2, X, ExternalLink, Trash2 } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import type { League } from '@/lib/leagues-fetch'
import { getLeagueInitials, getLeagueColor } from '@/lib/colors'
import { textOn } from '@/lib/contrast'

interface LeagueCardProps {
  league: League
  isCreator: boolean
  currentUserId: string | null
  onInvite: (leagueId: string) => void
  onManage: (leagueId: string) => void
  onViewMembers: (leagueId: string) => void
  onLeaveLeague?: (leagueId: string) => void
  onDelete?: (leagueId: string) => void
  index: number
}

export function LeagueCard({ 
  league, 
  isCreator, 
  currentUserId,
  onInvite,
  onManage,
  onViewMembers,
  onLeaveLeague,
  onDelete,
  index 
}: LeagueCardProps) {
  const memberCount = league.members?.length ?? league._count?.members ?? 0
  const teamCount = league.teams?.length ?? league._count?.teams ?? 0
  
  // Generate initials and color for the league
  const initials = getLeagueInitials(league.name)
  const leagueColor = getLeagueColor(league.id || league.name, league.color)
  const textColor = textOn(leagueColor)
  const isLightText = textColor === 'white'

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay: index * 0.02,
        ease: 'easeOut',
      }}
      className="group"
    >
      <motion.div
        className="relative flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all duration-200 cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900 w-full"
        onClick={() => onViewMembers(league.id)}
        whileHover={{ 
          y: -1,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Left: Colored circle with initials */}
        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ 
              backgroundColor: leagueColor,
              color: isLightText ? '#FFFFFF' : '#0F172A'
            }}
          >
            {initials}
          </div>

          {/* Middle: Name + Member count */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                {league.name}
              </h3>
              {isCreator && (
                <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
              )}
              {league.organisation && (
                <Tooltip.Provider delayDuration={100}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <div className="flex-shrink-0 cursor-help" onClick={(e) => e.stopPropagation()}>
                        <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors" />
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="z-50 rounded-lg bg-slate-900 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-white shadow-xl border border-slate-700 whitespace-nowrap"
                        side="top"
                        sideOffset={5}
                      >
                        {league.organisation.name}
                        <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
              </div>
              {teamCount > 0 && (
                <span className="text-slate-400 dark:text-slate-500">•</span>
              )}
              {teamCount > 0 && (
                <span>{teamCount} {teamCount === 1 ? 'team' : 'teams'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action icons (fade in on hover) */}
        <div 
          className="flex items-center gap-2 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip.Provider delayDuration={100}>
            {/* View League - Most common action, placed first */}
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewMembers(league.id)
                  }}
                  className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                  aria-label="View league"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="z-50 rounded-lg bg-slate-900 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-white shadow-xl border border-slate-700 whitespace-nowrap"
                  side="top"
                  sideOffset={5}
                >
                  View league
                  <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            {/* Invite Users */}
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onInvite(league.id)
                  }}
                  className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  aria-label="Invite users to league"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="z-50 rounded-lg bg-slate-900 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-white shadow-xl border border-slate-700 whitespace-nowrap"
                  side="top"
                  sideOffset={5}
                >
                  Invite users
                  <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            {/* Manage (creator) or Leave (member) */}
            {isCreator ? (
              <>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onManage(league.id)
                      }}
                      className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      aria-label="Manage league"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="z-50 rounded-lg bg-slate-900 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-white shadow-xl border border-slate-700 whitespace-nowrap"
                      side="top"
                      sideOffset={5}
                    >
                      Manage league
                      <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>

                {/* Delete League - Only for creators */}
                {onDelete && (
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Are you sure you want to delete "${league.name}"? This action cannot be undone.`)) {
                            onDelete(league.id)
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                        aria-label="Delete league"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="z-50 rounded-lg bg-slate-900 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-white shadow-xl border border-slate-700 whitespace-nowrap"
                        side="top"
                        sideOffset={5}
                      >
                        Delete league
                        <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                )}
              </>
            ) : onLeaveLeague && (
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onLeaveLeague(league.id)
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                    aria-label="Leave league"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="z-50 rounded-lg bg-slate-900 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-white shadow-xl border border-slate-700 whitespace-nowrap"
                    side="top"
                    sideOffset={5}
                  >
                    Leave league
                    <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            )}
          </Tooltip.Provider>
        </div>
      </motion.div>
    </motion.div>
  )
}

