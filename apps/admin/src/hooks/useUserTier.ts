'use client';

import { useState, useEffect } from 'react';

export type UserTier = 'basic' | 'premium';

/**
 * Hook to get current user's tier
 * Uses localStorage-based auth system (not NextAuth)
 */
export function useUserTier(): {
  tier: UserTier;
  isPremium: boolean;
  isBasic: boolean;
  isLoading: boolean;
} {
  const [tier, setTier] = useState<UserTier>('basic');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTier = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setTier('basic');
          setIsLoading(false);
          return;
        }

        // Get userId from localStorage (stored during signin)
        const userId = localStorage.getItem('userId');
        
        // Fetch user subscription/tier from API
        const headers: HeadersInit = { Authorization: `Bearer ${token}` };
        if (userId) {
          headers['X-User-Id'] = userId;
        }
        
        const response = await fetch('/api/user/subscription', {
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          // Determine tier: premium if status is ACTIVE, TRIALING, or FREE_TRIAL
          // OR if tier field exists and is "premium"
          const premiumStatuses = ['ACTIVE', 'TRIALING', 'FREE_TRIAL'];
          const isPremium = 
            data.tier === 'premium' ||
            premiumStatuses.includes(data.status) ||
            (data.freeTrialUntil && new Date(data.freeTrialUntil) > new Date());
          
          setTier(isPremium ? 'premium' : 'basic');
        } else {
          // Default to basic if API call fails
          setTier('basic');
        }
      } catch (error) {
        console.error('Failed to fetch user tier:', error);
        setTier('basic');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTier();
  }, []);

  return {
    tier,
    isPremium: tier === 'premium',
    isBasic: tier === 'basic',
    isLoading,
  };
}

