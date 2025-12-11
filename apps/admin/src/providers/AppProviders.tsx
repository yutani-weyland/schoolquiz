'use client'

/**
 * AppProviders - Heavy providers wrapper for authenticated routes
 * 
 * This component bundles all the heavy providers needed by authenticated pages:
 * - SessionProviderWrapper (next-auth/react)
 * - ReactQueryProvider (@tanstack/react-query)  
 * - ThemeProvider
 * - UserAccessProvider
 * 
 * The landing page DOES NOT need these on initial render.
 * By isolating them here, we can lazy load them only when needed.
 */

import { ReactNode } from 'react'
import { ReactQueryProvider } from './ReactQueryProvider'
import { SessionProviderWrapper } from './SessionProviderWrapper'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { UserAccessProvider } from '@/contexts/UserAccessContext'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProviderWrapper>
      <ReactQueryProvider>
        <ThemeProvider>
          <UserAccessProvider>
            {children}
          </UserAccessProvider>
        </ThemeProvider>
      </ReactQueryProvider>
    </SessionProviderWrapper>
  )
}
