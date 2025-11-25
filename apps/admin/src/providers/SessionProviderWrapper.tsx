'use client'

/**
 * SessionProvider Wrapper
 * 
 * NextAuth's SessionProvider must be a client component.
 * This wrapper allows us to use it in the server component layout.
 */

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface SessionProviderWrapperProps {
  children: ReactNode
}

export function SessionProviderWrapper({ children }: SessionProviderWrapperProps) {
  return (
    <SessionProvider
      // Disable automatic refetching to prevent errors on page load
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  )
}

