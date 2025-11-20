'use client';

import { useState, useEffect } from 'react';
import { fetchSubscription } from '@/lib/subscription-fetch';

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
        
        // Use shared fetch utility with automatic deduplication
        // Returns parsed JSON data directly (not Response object)
        const data = await fetchSubscription(userId, token);
        
        if (data) {
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

