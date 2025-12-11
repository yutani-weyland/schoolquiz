'use client';

import { useState, useEffect } from 'react';
import { TeamSelector } from './TeamSelector';
import { useTeams } from '@/hooks/useTeams';
import { useUserAccess } from '@/contexts/UserAccessContext';

interface TeamSelectorWrapperProps {
  variant?: 'inline' | 'centered';
  tone?: 'white' | 'black';
  onTeamChange?: (teamId: string | null) => void;
}

/**
 * Wrapper component that manages team selection state
 * Can be used in server components by wrapping client logic
 */
export function TeamSelectorWrapper({ 
  variant = 'centered',
  tone = 'black',
  onTeamChange: externalOnTeamChange,
}: TeamSelectorWrapperProps) {
  const { teams, isLoading } = useTeams();
  const { isPremium } = useUserAccess();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Load selected team from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedTeamId');
      if (saved === 'null') {
        // User explicitly selected "(no team)"
        setSelectedTeamId(null);
      } else if (saved && teams.some(t => t.id === saved)) {
        setSelectedTeamId(saved);
      }
    }
  }, [teams]);

  // Save to localStorage when selection changes
  const handleTeamChange = (teamId: string | null) => {
    setSelectedTeamId(teamId);
    if (typeof window !== 'undefined') {
      if (teamId === null) {
        // Store 'null' as string to indicate explicit "(no team)" selection
        localStorage.setItem('selectedTeamId', 'null');
      } else if (teamId) {
        localStorage.setItem('selectedTeamId', teamId);
      } else {
        localStorage.removeItem('selectedTeamId');
      }
    }
    // Call external handler if provided
    if (externalOnTeamChange) {
      externalOnTeamChange(teamId);
    }
  };

  // Don't show if not premium
  if (!isPremium) {
    return null;
  }

  return (
    <TeamSelector
      selectedTeamId={selectedTeamId}
      onTeamChange={handleTeamChange}
      tone={tone}
      variant={variant}
      allowNoTeam={true}
    />
  );
}
