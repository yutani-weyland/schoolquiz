'use client'

import { SpeculationRules } from '@/components/SpeculationRules'
import { usePathname } from 'next/navigation'
import { useUserAccess } from '@/contexts/UserAccessContext'

/**
 * Site-wide speculation rules for prerendering common navigation links.
 * 
 * This prerenders frequently accessed pages based on the current route and user tier:
 * - On /quizzes: prerender quiz intro pages and account pages
 * - On /account: prerender quizzes and achievements
 * - On /achievements: prerender quizzes and account
 * - On landing page: prerender quizzes and sign-in
 * - Tier-specific: Premium users get custom-quizzes, leagues, stats
 */
export function SiteSpeculationRules() {
  const pathname = usePathname()
  const { tier, isPremium, isFree, isVisitor } = useUserAccess()
  
  // Base URLs that are always relevant
  const baseUrls = [
    '/quizzes',
    '/account',
    '/achievements',
  ]

  // Tier-specific URLs
  const tierUrls: string[] = []
  
  if (isPremium) {
    // Premium users have access to custom quizzes, leagues, and stats
    tierUrls.push(
      '/custom-quizzes',
      '/leagues',
      '/stats',
    )
  }

  // Context-specific URLs based on current page
  let contextUrls: string[] = []
  
  if (pathname === '/') {
    // Landing page - prerender common entry points
    contextUrls = [
      '/quizzes',
      '/sign-in',
      '/sign-up',
    ]
  } else if (pathname?.startsWith('/quizzes')) {
    // Quiz pages - prerender account and achievements
    contextUrls = [
      '/account',
      '/achievements',
    ]
    if (isPremium) {
      contextUrls.push('/stats', '/custom-quizzes', '/leagues')
    }
  } else if (pathname === '/account') {
    // Account page - prerender quizzes and achievements
    contextUrls = [
      '/quizzes',
      '/achievements',
    ]
    if (isPremium) {
      contextUrls.push('/stats', '/custom-quizzes', '/leagues')
    }
  } else if (pathname === '/achievements') {
    // Achievements page - prerender quizzes and account
    contextUrls = [
      '/quizzes',
      '/account',
    ]
    if (isPremium) {
      contextUrls.push('/stats')
    }
  } else if (pathname === '/custom-quizzes' && isPremium) {
    // Custom quizzes page - prerender related premium pages
    contextUrls = [
      '/quizzes',
      '/leagues',
      '/stats',
    ]
  } else if (pathname === '/leagues' && isPremium) {
    // Leagues page - prerender related premium pages
    contextUrls = [
      '/quizzes',
      '/custom-quizzes',
      '/stats',
    ]
  } else if (pathname === '/stats' && isPremium) {
    // Stats page - prerender related premium pages
    contextUrls = [
      '/quizzes',
      '/custom-quizzes',
      '/leagues',
    ]
  }

  const allUrls = [...baseUrls, ...tierUrls, ...contextUrls].filter(
    (url, index, self) => self.indexOf(url) === index // Remove duplicates
  )

  return (
    <SpeculationRules 
      urls={allUrls}
      eagerness="conservative" // Conservative to avoid wasting bandwidth
    />
  )
}

