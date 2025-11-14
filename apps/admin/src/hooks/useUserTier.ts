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
        // Check localStorage first for immediate premium status
        const storedTier = localStorage.getItem('userTier');
        if (storedTier === 'premium') {
          setTier('premium');
          setIsLoading(false);
          // Still try to refresh from API in background, but don't block UI
        } else if (storedTier === 'basic') {
          setTier('basic');
          setIsLoading(false);
        }

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
          
          const determinedTier = isPremium ? 'premium' : 'basic';
          setTier(determinedTier);
          // Update localStorage to match API response
          localStorage.setItem('userTier', determinedTier);
        } else {
          // If API fails but we have localStorage, use that
          // Otherwise default to basic
          if (!storedTier) {
            setTier('basic');
          }
          // Don't override localStorage if API fails - trust localStorage
        }
      } catch (error) {
        console.error('Failed to fetch user tier:', error);
        // On error, trust localStorage if it exists
        const storedTier = localStorage.getItem('userTier');
        if (!storedTier) {
          setTier('basic');
        }
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

