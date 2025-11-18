'use client'

import { usePathname } from 'next/navigation'
import { User, LogOut, Sun, Moon } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useTheme } from '@/contexts/ThemeContext'

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
}

export function AdminTopbar() {
  const pathname = usePathname()
  const { isDark, toggleTheme } = useTheme()
  
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
    <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {getPageTitle()}
        </h1>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50 text-gray-600 dark:text-gray-400 hover:from-gray-100 hover:to-gray-200/50 dark:hover:from-gray-700 dark:hover:to-gray-700/50 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-gray-200/60 dark:border-gray-800/60"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-br hover:from-white hover:to-gray-50/50 dark:hover:from-gray-800 dark:hover:to-gray-800/50 rounded-xl transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-gray-200/60 dark:border-gray-800/60"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
          <button
            className="p-2.5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50 text-gray-600 dark:text-gray-400 hover:from-gray-100 hover:to-gray-200/50 dark:hover:from-gray-700 dark:hover:to-gray-700/50 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-gray-200/60 dark:border-gray-800/60"
            title="User menu"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

