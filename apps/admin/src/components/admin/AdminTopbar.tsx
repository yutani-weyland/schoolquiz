'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { User, LogOut, Sun, Moon } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useTheme } from '@/contexts/ThemeContext'
import { Breadcrumbs } from './Breadcrumbs'
import { DraftIndicator } from './DraftIndicator'

// Simple page title mapping
const pageTitles: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/organisations': 'Organisations',
  '/admin/users': 'Users',
  '/admin/quizzes': 'Quizzes',
  '/admin/scheduling': 'Scheduling',
  '/admin/analytics/engagement': 'Analytics - Engagement',
  '/admin/analytics/learning': 'Analytics - Learning',
  '/admin/analytics/funnel': 'Analytics - Funnel',
  '/admin/billing': 'Billing',
  '/admin/support': 'Support',
  '/admin/system': 'System',
  '/admin/achievements': 'Achievements',
  '/admin/drafts': 'Drafts',
}

export function AdminTopbar() {
  const pathname = usePathname()
  const { isDark, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Prevent hydration mismatch by only showing theme-dependent content after mount
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Get page title from pathname
  const getPageTitle = () => {
    // Check exact matches first
    if (pageTitles[pathname || '']) {
      return pageTitles[pathname || '']
    }
    
    // Check for dynamic routes
    if (pathname?.startsWith('/admin/organisations/')) {
      return 'Organisation Details'
    }
    if (pathname?.startsWith('/admin/users/')) {
      return 'User Details'
    }
    if (pathname?.startsWith('/admin/quizzes/')) {
      return 'Quiz Details'
    }
    if (pathname?.startsWith('/admin/system/')) {
      return 'System Settings'
    }
    
    return 'Admin'
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="sticky top-0 z-40 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] backdrop-blur-sm bg-opacity-95">
      <div className="flex flex-col px-6 py-3">
        {/* Breadcrumbs */}
        <div className="mb-2">
          <Breadcrumbs />
        </div>
        
        {/* Page Title and Actions */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            {getPageTitle()}
          </h1>

          {/* User Menu - Reordered: Drafts, User, Theme, Sign Out */}
          <div className="flex items-center gap-2">
          {/* Draft Indicator */}
          <DraftIndicator type="all" showCount />

          {/* User Profile Button */}
          <Link
            href="/account"
            className="p-2.5 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80 hover:text-[hsl(var(--foreground))] border border-[hsl(var(--border))] transition-colors"
            title="Account settings"
          >
            <User className="w-4 h-4" />
          </Link>

          {/* Theme Toggle */}
          {mounted ? (
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80 hover:text-[hsl(var(--foreground))] border border-[hsl(var(--border))] transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          ) : (
            // Placeholder during SSR to prevent hydration mismatch
            <button
              className="p-2.5 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80 hover:text-[hsl(var(--foreground))] border border-[hsl(var(--border))] transition-colors"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              <Moon className="w-4 h-4" />
            </button>
          )}

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-xl border border-[hsl(var(--border))] transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}

