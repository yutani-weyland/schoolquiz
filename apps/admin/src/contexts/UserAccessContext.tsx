'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
      try {
        // Check if user is logged in
        const token = localStorage.getItem('authToken');
        const storedUserId = localStorage.getItem('userId');
        const storedUserName = localStorage.getItem('userName');
        const storedUserEmail = localStorage.getItem('userEmail');

        if (!token || !storedUserId) {
          // Visitor (not logged in)
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

        // Fetch subscription/tier info
        try {
          const headers: HeadersInit = { Authorization: `Bearer ${token}` };
          if (storedUserId) {
            headers['X-User-Id'] = storedUserId;
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
            
            setTier(isPremium ? 'premium' : 'free');
          } else {
            // Logged in but no subscription info - default to free
            setTier('free');
          }
        } catch (error) {
          console.error('Failed to fetch subscription:', error);
          // Logged in but API failed - default to free
          setTier('free');
        }
      } catch (error) {
        console.error('Failed to determine tier:', error);
        setTier('visitor');
      } finally {
        setIsLoading(false);
      }
    };

    determineTier();

    // Listen for auth changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' || e.key === 'userId') {
        determineTier();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value: UserAccessContextType = {
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

