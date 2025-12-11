'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Settings, Info, User, Users } from 'lucide-react';
import { useTeams } from '@/hooks/useTeams';
import { useRouter } from 'next/navigation';
import { useUserAccess } from '@/contexts/UserAccessContext';
import * as Tooltip from '@radix-ui/react-tooltip';

interface TeamSelectorProps {
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
  tone?: 'white' | 'black';
  variant?: 'inline' | 'centered'; // New variant prop for different placements
  allowNoTeam?: boolean; // Allow selecting "(no team)" option
  showDividers?: boolean; // Show subtle divider lines above/below
}

export function TeamSelector({ 
  selectedTeamId, 
  onTeamChange, 
  tone = 'black',
  variant = 'centered',
  allowNoTeam = false,
  showDividers = false,
}: TeamSelectorProps) {
  const { teams, isLoading } = useTeams();
  const { userName } = useUserAccess();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasExplicitlySelectedNoTeam, setHasExplicitlySelectedNoTeam] = useState(false);
  const router = useRouter();

  // Auto-select default team if no team is selected (only if user hasn't explicitly selected "no team")
  useEffect(() => {
    if (!isLoading && !selectedTeamId && teams.length > 0 && !hasExplicitlySelectedNoTeam && !allowNoTeam) {
      const defaultTeam = teams.find(t => t.isDefault) || teams[0];
      if (defaultTeam) {
        onTeamChange(defaultTeam.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, selectedTeamId, teams.length, hasExplicitlySelectedNoTeam, allowNoTeam]);

  const selectedTeam = selectedTeamId ? teams.find(t => t.id === selectedTeamId) : null;
  const displayName = userName || 'You';
  
  // Track if user has seen the helper text (for first-time users)
  const [showHelper, setShowHelper] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('teamSelectorHelperSeen');
    }
    return true;
  });
  
  const hideHelper = () => {
    setShowHelper(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('teamSelectorHelperSeen', 'true');
    }
  };

  // Debug: Log teams data
  useEffect(() => {
    if (!isLoading) {
      console.log('[TeamSelector] Teams loaded:', { 
        teamsCount: teams.length, 
        teams: teams.map(t => ({ id: t.id, name: t.name })),
        selectedTeamId,
        allowNoTeam
      });
    }
  }, [isLoading, teams, selectedTeamId, allowNoTeam]);

  // Don't show if no teams and noTeam not allowed
  if (!isLoading && teams.length === 0 && !allowNoTeam) {
    return null;
  }

  // Inline variant styling (for under greeting)
  const isInline = variant === 'inline';
  
  // Button styling - lighter, more interactive for inline variant with subtle border
  const buttonClass = isInline
    ? tone === 'white'
      ? 'bg-white hover:bg-gray-50 border border-white/30 text-gray-900 shadow-sm hover:shadow-md'
      : 'bg-white hover:bg-gray-50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-sm hover:shadow-md dark:bg-gray-800 dark:hover:bg-gray-700'
    : tone === 'white'
      ? 'bg-white text-gray-900'
      : 'bg-gray-900 text-white';

  const containerClass = isInline 
    ? 'flex flex-col gap-1 relative items-center' 
    : 'relative w-full max-w-[200px]';

  return (
    <div className={containerClass}>
      {/* Optional divider above */}
      {showDividers && (
        <div 
          className={`w-full mb-4 ${
            tone === 'white' ? 'border-t border-white/20' : 'border-t border-gray-300/30 dark:border-gray-600/30'
          }`}
        />
      )}
      
      {/* Label with info tooltip - only show for inline variant */}
      {isInline && (
        <>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-medium ${
              tone === 'white' ? 'text-white/90' : 'text-gray-700 dark:text-gray-300'
            }`}>
              Playing as:
            </span>
            <Tooltip.Provider delayDuration={200}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="focus:outline-none"
                  >
                    <Info className={`w-3.5 h-3.5 ${
                      tone === 'white' ? 'text-white/70 hover:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    } transition-colors cursor-help`} />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="z-50 max-w-xs rounded-lg bg-gray-900 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-white shadow-xl border border-white/10"
                    side="top"
                    sideOffset={8}
                  >
                    Your score and leaderboard position will apply to the selected team.
                    <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
          {/* Helper text for first-time users - shown BEFORE dropdown */}
          {showHelper && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-xs mb-0.5 ${
                tone === 'white' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Your score goes to this team.
            </motion.p>
          )}
        </>
      )}

      {/* Loading skeleton */}
      {isLoading ? (
        <div className={`h-9 w-32 rounded-xl animate-pulse ${
          isInline 
            ? tone === 'white' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
            : tone === 'white' ? 'bg-white/20' : 'bg-gray-900/20'
        }`} />
      ) : (
        <>
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2.5 rounded-xl font-medium cursor-pointer whitespace-nowrap transition-all ${buttonClass}`}
            style={{
              paddingTop: isInline ? '0.625rem' : 'clamp(0.375rem, min(0.625rem, 1.5vh), 0.625rem)',
              paddingBottom: isInline ? '0.625rem' : 'clamp(0.375rem, min(0.625rem, 1.5vh), 0.625rem)',
              paddingLeft: isInline ? '0.875rem' : 'clamp(0.75rem, min(1rem, 2vw), 1rem)',
              paddingRight: isInline ? '0.75rem' : 'clamp(0.75rem, min(1rem, 2vw), 1rem)',
              fontSize: isInline ? '0.875rem' : 'clamp(0.6875rem, min(0.75rem, 1.5vh), 0.75rem)',
            }}
            whileHover={{ 
              scale: isInline ? 1.02 : 1.05,
              transition: { 
                type: "spring",
                stiffness: 500,
                damping: 20,
                mass: 0.5
              }
            }}
            transition={{
              type: "spring",
              stiffness: 600,
              damping: 25,
              mass: 0.3
            }}
            whileTap={{ 
              scale: 0.98,
              transition: { 
                type: "spring",
                stiffness: 500,
                damping: 30
              }
            }}
            aria-label="Select team"
            aria-expanded={isOpen}
          >
            {selectedTeamId === null && allowNoTeam ? (
              <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                <User className="w-2.5 h-2.5 text-gray-600 dark:text-gray-300" />
              </div>
            ) : selectedTeam && selectedTeam.color ? (
              <div
                className="rounded-full flex-shrink-0 border border-white/20 dark:border-gray-700/50"
                style={{ 
                  width: '16px', 
                  height: '16px',
                  backgroundColor: selectedTeam.color 
                }}
              />
            ) : null}
            <span className="truncate font-medium">
              {selectedTeamId === null && allowNoTeam 
                ? `${displayName} — No team`
                : selectedTeam?.name || 'Select team'}
            </span>
            <ChevronDown 
              className={`flex-shrink-0 transition-transform ${
                isInline ? 'w-4 h-4' : 'w-3 h-3'
              }`}
              style={{ 
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          </motion.button>

          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 z-[99]"
                />
                
                {/* Dropdown */}
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                    duration: 0.16,
                  }}
                  className={`absolute ${isInline ? 'left-0' : 'left-0 right-0'} top-full mt-2 z-[100] rounded-xl shadow-lg overflow-hidden border ${
                    tone === 'white'
                      ? 'bg-white text-gray-900 border-gray-200'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700'
                  }`}
                  style={{
                    boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.15)',
                    minWidth: isInline ? '220px' : '100%',
                    maxHeight: 'min(300px, 60vh)',
                  }}
                >
                  {/* Header microcopy */}
                  <div className="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Your score and leaderboard position will apply to this team.
                    </p>
                  </div>

                  <div className="py-1 overflow-y-auto" style={{ maxHeight: 'min(300px, 60vh)' }}>
                    {/* (No Team) option - shown first if allowNoTeam is true */}
                    {allowNoTeam && (
                      <div className="px-1 py-1">
                        <motion.button
                          onClick={() => {
                            onTeamChange(null);
                            setHasExplicitlySelectedNoTeam(true);
                            setIsOpen(false);
                            hideHelper(); // Hide helper after first use
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            selectedTeamId === null
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                            <User className="w-2.5 h-2.5 text-gray-600 dark:text-gray-300" />
                          </div>
                          <span className="flex-1 text-left text-sm font-medium">
                            {displayName} — No team
                          </span>
                          {selectedTeamId === null && (
                            <Check className="w-4 h-4 flex-shrink-0 text-primary" />
                          )}
                        </motion.button>
                      </div>
                    )}

                    {/* Team list */}
                    {teams.length === 0 ? (
                      <div className="px-4 py-6 space-y-4">
                        <div className="text-center space-y-2">
                          <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            No teams set up yet
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                            Set up separate class teams to track scores and compare performance across different classes.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            router.push('/account?tab=teams');
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          Set up teams
                        </button>
                      </div>
                    ) : (
                      <div className={`px-1 py-1 ${allowNoTeam && teams.length > 0 ? 'border-t border-gray-100 dark:border-gray-700 pt-1' : ''}`}>
                        {teams.map((team) => {
                        const isSelected = team.id === selectedTeamId;
                        return (
                          <motion.button
                            key={team.id}
                            onClick={() => {
                              onTeamChange(team.id);
                              setHasExplicitlySelectedNoTeam(false);
                              setIsOpen(false);
                              hideHelper(); // Hide helper after first use
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                              isSelected 
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            {team.color && (
                              <div
                                className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-200/50 dark:border-gray-700/50"
                                style={{ backgroundColor: team.color }}
                              />
                            )}
                            <span className="flex-1 text-left text-sm font-medium">
                              {team.name}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 flex-shrink-0 text-primary" />
                            )}
                          </motion.button>
                        );
                      })}
                      </div>
                    )}

                    {/* Divider - only show if there are teams */}
                    {teams.length > 0 && (
                      <>
                        <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                        {/* Manage teams link */}
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            router.push('/account?tab=teams');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm text-gray-600 dark:text-gray-400"
                        >
                          <Settings className="w-4 h-4" />
                          <span className="flex-1 text-left font-medium">Manage teams</span>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
      
      {/* Optional divider below */}
      {showDividers && (
        <div 
          className={`w-full mt-4 ${
            tone === 'white' ? 'border-b border-white/20' : 'border-b border-gray-300/30 dark:border-gray-600/30'
          }`}
        />
      )}
    </div>
  );
}
