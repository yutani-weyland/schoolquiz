'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
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
  const { data: session, status: sessionStatus } = useSession(); // NextAuth session
  const [tier, setTier] = useState<AccessTier>('visitor');
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Refs to prevent duplicate fetches and track state
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const lastSessionUserIdRef = useRef<string | null>(null);
  const lastSessionTierRef = useRef<string | undefined>(undefined);
  const lastSessionStatusRef = useRef<string>('loading');

  // Extract stable values from session to avoid unnecessary re-renders
  const sessionUserId = session?.user?.id || null;
  const sessionTier = (session?.user as any)?.tier;
  const sessionUserName = session?.user?.name || null;
  const sessionUserEmail = session?.user?.email || null;

  useEffect(() => {
    const determineTier = async () => {
      // Don't run if session is still loading
      if (sessionStatus === 'loading') {
        logger.debug('Session still loading, waiting...');
        return;
      }
      
      // Prevent rapid successive calls (debounce: max once per 2 seconds)
      const now = Date.now();
      if (isFetchingRef.current || (now - lastFetchTimeRef.current < 2000)) {
        logger.debug('Debouncing - too soon since last fetch');
        return;
      }
      
      // Only re-fetch if userId or tier actually changed, or if session just finished loading
      const userIdChanged = sessionUserId !== lastSessionUserIdRef.current;
      const tierChanged = sessionTier !== lastSessionTierRef.current;
      const sessionStatusChanged = sessionStatus !== lastSessionStatusRef.current;
      const sessionJustLoaded = sessionStatus === 'authenticated' && lastSessionStatusRef.current === 'loading';
      
      if (!userIdChanged && !tierChanged && !sessionStatusChanged && !sessionJustLoaded && sessionStatus === 'authenticated') {
        logger.debug('Skipping tier determination - no changes detected');
        return;
      }
      
      // Update refs before running
      lastSessionStatusRef.current = sessionStatus;
      
      logger.debug('Running tier determination', {
        userIdChanged,
        tierChanged,
        sessionStatusChanged,
        sessionJustLoaded,
      });
      
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      if (sessionUserId) {
        lastSessionUserIdRef.current = sessionUserId;
      }
      lastSessionTierRef.current = sessionTier;
      
      // Set a timeout to ensure isLoading is always set to false, even if API hangs
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
        isFetchingRef.current = false;
      }, 2000); // Max 2 seconds to determine tier

      try {
        // Check NextAuth session first (primary auth system)
        const isNextAuthLoggedIn = sessionStatus === 'authenticated' && !!session;
        
        // Fallback: Check localStorage for legacy auth (backward compatibility)
        const token = getAuthToken();
        const storedUserId = getUserId();
        const storedUserName = getUserName();
        const storedUserEmail = getUserEmail();
        const isLegacyLoggedIn = !!(token && storedUserId);

        // Determine if user is logged in (NextAuth or legacy)
        const isLoggedIn = isNextAuthLoggedIn || isLegacyLoggedIn;

        if (!isLoggedIn) {
          // Visitor (not logged in)
          clearTimeout(timeoutId);
          setTier('visitor');
          setUserId(null);
          setUserName(null);
          setUserEmail(null);
          setIsLoading(false);
          return;
        }

        // Set user data from NextAuth session (preferred) or localStorage (fallback)
        if (isNextAuthLoggedIn && sessionUserId) {
          setUserId(sessionUserId);
          setUserName(sessionUserName);
          setUserEmail(sessionUserEmail);
        } else if (isLegacyLoggedIn) {
          setUserId(storedUserId);
          setUserName(storedUserName);
          setUserEmail(storedUserEmail);
        }

        // Get tier from NextAuth session first (if available)
        // The session callback already queries the database, so this is the source of truth
        if (sessionTier === 'premium' || sessionTier === 'basic') {
          const tierToSet = sessionTier === 'premium' ? 'premium' : 'free';
          logger.debug('Using tier from session', { tier: tierToSet });
          clearTimeout(timeoutId);
          setTier(tierToSet);
          setIsLoading(false);
          isFetchingRef.current = false;
          return; // Early return - session is the source of truth, no API call needed
        }

        // If session doesn't have tier but user is logged in, fetch from API
        // This handles cases where session hasn't been refreshed yet
        if (isLoggedIn && sessionUserId) {
          logger.debug('Session tier not available, fetching from API', { sessionUserId });
          try {
            const subscriptionResponse = await fetch('/api/user/subscription', {
              credentials: 'include', // Send session cookie
            });

            if (subscriptionResponse.ok) {
              const subscriptionData = await subscriptionResponse.json();
              const isPremium = subscriptionData.tier === 'premium';
              const tierToSet = isPremium ? 'premium' : 'free';
              logger.debug('Got tier from API', { tier: tierToSet });
              clearTimeout(timeoutId);
              setTier(tierToSet);
              setIsLoading(false);
              isFetchingRef.current = false;
              return;
            } else {
              const errorText = await subscriptionResponse.text();
              logger.warn('Subscription API returned non-OK status', { 
                status: subscriptionResponse.status, 
                error: errorText 
              });
            }
          } catch (apiError) {
            logger.error('Failed to fetch subscription from API', apiError);
            // Fall through to localStorage/fallback
          }
        }

        // Fallback: Get stored tier from localStorage (for legacy compatibility)
        const storedTier = getUserTier();
        if (storedTier === 'premium' || storedTier === 'basic') {
          // Set tier immediately from localStorage for instant UI update
          const tierToSet = storedTier === 'premium' ? 'premium' : 'free';
          clearTimeout(timeoutId);
          setTier(tierToSet);
          setIsLoading(false);
          isFetchingRef.current = false;
          // No API call needed - localStorage is sufficient fallback
          return;
        }

        // No tier in session, API, or localStorage - default to free if logged in
        clearTimeout(timeoutId);
        if (isLoggedIn) {
          setTier('free');
        } else {
          setTier('visitor');
        }
        setIsLoading(false);
        isFetchingRef.current = false;
      } catch (error) {
        clearTimeout(timeoutId);
        logger.error('Failed to determine tier:', error);
        setTier('visitor');
        isFetchingRef.current = false;
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
        isFetchingRef.current = false;
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
  }, [sessionStatus, sessionUserId, sessionTier, sessionUserName, sessionUserEmail]); // Only re-run when actual values change, not object reference

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
    // Only log when tier actually changes (not on every render)
    if (tier !== 'visitor' || isLoading === false) {
      logger.debug('User access computed', { tier, isLoggedIn: computed.isLoggedIn });
    }
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

