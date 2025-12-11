'use client'

import { SpeculationRules } from '@/components/SpeculationRules'

/**
 * Admin-specific speculation rules for prerendering admin navigation links.
 * 
 * This prerenders the most commonly accessed admin pages when users hover
 * over sidebar links, making navigation feel instant.
 * 
 * Priority order:
 * 1. Overview (most visited)
 * 2. Content management (quizzes, questions, rounds, achievements)
 * 3. Management (organisations, users)
 * 4. Operations (analytics, billing, support, system)
 */
export function AdminSpeculationRules() {
  // Admin pages ordered by likely navigation frequency
  const adminUrls = [
    // Overview - most visited
    '/admin',
    
    // Content management - high frequency
    '/admin/quizzes',
    '/admin/quizzes/builder',
    '/admin/drafts',
    '/admin/questions/bank',
    '/admin/questions/create',
    '/admin/rounds',
    '/admin/rounds/create',
    '/admin/achievements',
    
    // Management - medium frequency
    '/admin/organisations',
    '/admin/users',
    
    // Operations - lower frequency but still important
    '/admin/analytics',
    '/admin/billing',
    '/admin/support',
    '/admin/system',
    '/admin/scheduling',
    '/admin/questions/submissions',
  ]

  return (
    <SpeculationRules 
      urls={adminUrls}
      eagerness="conservative" // Only prerender on hover/focus to save resources
    />
  )
}







