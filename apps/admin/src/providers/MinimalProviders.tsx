'use client'

/**
 * MinimalProviders - Lightweight providers for marketing/landing pages
 * 
 * This provides ONLY what's strictly necessary for the landing page:
 * - ThemeProvider (for dark mode toggle in header)
 * 
 * It deliberately EXCLUDES:
 * - SessionProviderWrapper (not needed for initial landing render)
 * - ReactQueryProvider (no data fetching needed initially)
 * - UserAccessProvider (checks session, not needed for static content)
 * 
 * This dramatically reduces the JS bundle for the landing page.
 */

import { ReactNode } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'

interface MinimalProvidersProps {
  children: ReactNode
}

export function MinimalProviders({ children }: MinimalProvidersProps) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}
