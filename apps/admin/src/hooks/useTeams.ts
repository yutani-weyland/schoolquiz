import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Team {
  id: string;
  name: string;
  color: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  quizCount: number;
}

interface UseTeamsResult {
  teams: Team[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch and cache user's teams
 * Uses React Query for caching and deduplication
 */
export function useTeams(): UseTeamsResult {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-teams'],
    queryFn: async () => {
      const response = await fetch('/api/user/teams', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 403) {
          // Not premium - return empty array
          return { teams: [], count: 0, maxTeams: 10 };
        }
        throw new Error('Failed to fetch teams');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  return {
    teams: data?.teams || [],
    isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch();
    },
  };
}
