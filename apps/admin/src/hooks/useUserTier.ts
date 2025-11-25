'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export type UserTier = 'basic' | 'premium';

/**
 * Hook to get current user's tier
 * Uses NextAuth session (which queries the database)
 */
export function useUserTier(): {
  tier: UserTier;
  isPremium: boolean;
  isBasic: boolean;
  isLoading: boolean;
} {
  const { data: session, status } = useSession();
  const [tier, setTier] = useState<UserTier>('basic');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Session is loading
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    // Not authenticated
    if (status === 'unauthenticated' || !session?.user) {
      setTier('basic');
      setIsLoading(false);
      return;
    }

    // Get tier from NextAuth session (which comes from database query in session callback)
    // The session callback already queries the database, so we trust it as the source of truth
    const sessionTier = (session.user as any)?.tier;
    
    if (sessionTier === 'premium' || sessionTier === 'basic') {
      const determinedTier = sessionTier === 'premium' ? 'premium' : 'basic';
      setTier(determinedTier);
      setIsLoading(false);
      // No need to make additional API calls - session callback already queries the database
    } else {
      // Session doesn't have tier - default to basic
      setTier('basic');
      setIsLoading(false);
    }
  }, [session, status]);

  return {
    tier,
    isPremium: tier === 'premium',
    isBasic: tier === 'basic',
    isLoading,
  };
}

