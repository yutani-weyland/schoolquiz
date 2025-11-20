'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { storage, getAuthToken, getUserId, getUserName, getUserEmail, getUserTier } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { fetchSubscription } from '@/lib/subscription-fetch';

export type AccessTier = 'visitor' | 'free' | 'premium';

interface UserAccessContextType {
  tier: AccessTier;
  isVisitor: boolean;
  isFree: boolean;
  isPremium: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
}

const UserAccessContext = createContext<UserAccessContextType | undefined>(undefined);

interface UserAccessProviderProps {
  children: ReactNode;
}

export function UserAccessProvider({ children }: UserAccessProviderProps) {
  const [tier, setTier] = useState<AccessTier>('visitor');
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const determineTier = async () => {
      // Set a timeout to ensure isLoading is always set to false, even if API hangs
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 2000); // Max 2 seconds to determine tier

      try {
        // Check if user is logged in
        const token = getAuthToken();
        const storedUserId = getUserId();
        const storedUserName = getUserName();
        const storedUserEmail = getUserEmail();

        if (!token || !storedUserId) {
          // Visitor (not logged in)
          clearTimeout(timeoutId);
          setTier('visitor');
          setUserId(null);
          setUserName(null);
          setUserEmail(null);
          setIsLoading(false);
          return;
        }

        setUserId(storedUserId);
        setUserName(storedUserName);
        setUserEmail(storedUserEmail);

        // Get stored tier from localStorage first (from sign-in response) - use immediately
        const storedTier = getUserTier();
        console.log('[UserAccessContext] Stored tier from localStorage:', storedTier);
        console.log('[UserAccessContext] Token:', token ? 'exists' : 'missing');
        console.log('[UserAccessContext] UserId:', storedUserId);
        
        if (storedTier === 'premium' || storedTier === 'basic') {
          // Set tier immediately from localStorage for instant UI update
          const tierToSet = storedTier === 'premium' ? 'premium' : 'free';
          console.log('[UserAccessContext] Setting tier immediately to:', tierToSet);
          clearTimeout(timeoutId);
          setTier(tierToSet);
          setIsLoading(false);
          
          // Then try to refresh from API in the background (non-blocking)
          // Use shared fetch utility with automatic deduplication
          // Returns parsed JSON data directly (not Response object)
          fetchSubscription(storedUserId, token)
            .then((data) => {
              if (data) {
                const premiumStatuses = ['ACTIVE', 'TRIALING', 'FREE_TRIAL'];
                const isPremium = 
                  data.tier === 'premium' ||
                  premiumStatuses.includes(data.status) ||
                  (data.freeTrialUntil && new Date(data.freeTrialUntil) > new Date());
                
                const determinedTier = isPremium ? 'premium' : 'free';
                setTier(determinedTier);
                storage.set('userTier', determinedTier === 'premium' ? 'premium' : 'basic');
              }
            })
            .catch((error) => {
              // Silently fail - we already have tier from localStorage
              logger.debug('Failed to refresh subscription from API:', error);
            });
          
          return; // Early return - we've set the tier from localStorage
        }

        // No stored tier - fetch from API with timeout
        try {
          // Use shared fetch utility with automatic deduplication
          // Returns parsed JSON data directly (not Response object)
          // Add timeout to prevent hanging
          const fetchPromise = fetchSubscription(storedUserId, token);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Subscription fetch timeout')), 1500)
          );
          
          const data = await Promise.race([fetchPromise, timeoutPromise]) as any;
          
          clearTimeout(timeoutId);
          
          if (data) {
            // Determine tier: premium if status is ACTIVE, TRIALING, or FREE_TRIAL
            // OR if tier field exists and is "premium"
            const premiumStatuses = ['ACTIVE', 'TRIALING', 'FREE_TRIAL'];
            const isPremium = 
              data.tier === 'premium' ||
              premiumStatuses.includes(data.status) ||
              (data.freeTrialUntil && new Date(data.freeTrialUntil) > new Date());
            
            const determinedTier = isPremium ? 'premium' : 'free';
            setTier(determinedTier);
            // Store tier in localStorage for future use
            storage.set('userTier', determinedTier === 'premium' ? 'premium' : 'basic');
          }
        } catch (error) {
          clearTimeout(timeoutId);
          logger.error('Failed to fetch subscription:', error);
          // API failed - default to free if logged in, visitor if not
          if (token && storedUserId) {
            setTier('free');
            storage.set('userTier', 'basic');
          } else {
            setTier('visitor');
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        logger.error('Failed to determine tier:', error);
        setTier('visitor');
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    determineTier();

    // Listen for auth changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' || e.key === 'userId') {
        determineTier();
      }
    };

    // Listen for custom auth events from same window (e.g., after login)
    const handleAuthChange = () => {
      determineTier();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<UserAccessContextType>(() => {
    const computed = {
      tier,
      isVisitor: tier === 'visitor',
      isFree: tier === 'free',
      isPremium: tier === 'premium',
      isLoggedIn: tier !== 'visitor',
      isLoading,
      userId,
      userName,
      userEmail,
    };
    console.log('[UserAccessContext] Computed value:', computed);
    return computed;
  }, [tier, isLoading, userId, userName, userEmail]);

  return (
    <UserAccessContext.Provider value={value}>
      {children}
    </UserAccessContext.Provider>
  );
}

export function useUserAccess(): UserAccessContextType {
  const context = useContext(UserAccessContext);
  if (context === undefined) {
    throw new Error('useUserAccess must be used within a UserAccessProvider');
  }
  return context;
}

// Helper hooks for convenience
export function useTier() {
  const { tier } = useUserAccess();
  return tier;
}

export function hasAccess(userTier: AccessTier, requiredTier: AccessTier): boolean {
  const tierOrder: Record<AccessTier, number> = {
    visitor: 0,
    free: 1,
    premium: 2,
  };
  return tierOrder[userTier] >= tierOrder[requiredTier];
}

