'use client'

import { motion } from 'framer-motion'
import { Users, Crown, Mail, Settings, Copy, Check, KeyRound, Building2 } from 'lucide-react'
import { useState } from 'react'
import type { League } from '@/lib/leagues-fetch'

interface LeagueCardProps {
  league: League
  isCreator: boolean
  currentUserId: string | null
  onInvite: (leagueId: string) => void
  onManage: (leagueId: string) => void
  onViewMembers: (leagueId: string) => void
  index: number
}

export function LeagueCard({ 
  league, 
  isCreator, 
  currentUserId,
  onInvite,
  onManage,
  onViewMembers,
  index 
}: LeagueCardProps) {
  const [copied, setCopied] = useState(false)
  const memberCount = league.members?.length ?? league._count?.members ?? 0
  
  // Get first 3 members for preview (only if members are loaded)
  const previewMembers = (league.members && league.members.length > 0) 
    ? league.members.slice(0, 3) 
    : []
  const hasMoreMembers = memberCount > previewMembers.length
  const showMemberPreview = previewMembers.length > 0

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(league.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // OPTIMIZATION: Simplified displayName - only name is fetched from API
  const displayName = (user: { name: string | null }) => {
    return user.name || 'Unknown'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.03, // Reduced delay for faster perceived load
        ease: 'easeOut', // Simpler easing function
      }}
      className="group relative"
    >
      <div
        className="relative h-full rounded-2xl p-5 shadow-md transition-all duration-300 hover:shadow-lg cursor-pointer flex flex-col"
        style={{ backgroundColor: league.color || '#3B82F6' }}
        onClick={() => onViewMembers(league.id)}
      >
        {/* Creator Badge */}
        {isCreator && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
            <Crown className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-semibold text-white">Created</span>
          </div>
        )}

        {/* Organisation Badge */}
        {league.organisation && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
            <Building2 className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-medium text-white truncate max-w-[120px]">
              {league.organisation.name}
            </span>
          </div>
        )}

        <div className="flex-1 flex flex-col pt-6">
          {/* League Name */}
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
            {league.name}
          </h3>

          {/* Description */}
          {league.description && (
            <p className="text-white/90 text-sm mb-4 line-clamp-2">
              {league.description}
            </p>
          )}

          {/* Member Preview - Only show member avatars, no duplicate count */}
          {showMemberPreview && (
            <div className="mb-4 flex flex-wrap gap-2">
              {previewMembers.map((member) => {
                const name = displayName(member.user)
                const isYou = member.userId === currentUserId
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-1.5 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30"
                  >
                    <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-xs font-semibold text-white">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-white truncate max-w-[100px]">
                      {isYou ? 'You' : name}
                    </span>
                  </div>
                )
              })}
              {hasMoreMembers && (
                <div className="flex items-center px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <span className="text-xs font-medium text-white">
                    +{memberCount - previewMembers.length}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-auto pt-4 border-t border-white/20 flex items-center justify-between gap-2">
            {/* Invite Code */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                copyInviteCode()
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg border border-white/30 transition-colors"
              title="Copy invite code"
            >
              <KeyRound className="w-4 h-4 text-white" />
              <span className="text-xs font-mono font-semibold text-white">
                {league.inviteCode}
              </span>
              {copied && (
                <Check className="w-4 h-4 text-white" />
              )}
            </button>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onInvite(league.id)
                }}
                className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg border border-white/30 transition-colors"
                title="Invite members"
              >
                <Mail className="w-4 h-4 text-white" />
              </button>

              {/* Manage Button (Creator Only) */}
              {isCreator && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onManage(league.id)
                  }}
                  className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg border border-white/30 transition-colors"
                  title="Manage league"
                >
                  <Settings className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

