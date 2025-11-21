'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { User, LogOut, Sun, Moon, Search, Command, HelpCircle, Settings, Mail } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useTheme } from '@/contexts/ThemeContext'
import { DraftIndicator } from './DraftIndicator'
import { NotificationsBell } from './NotificationsBell'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { getUserName, getUserEmail } from '@/lib/storage'

export function AdminTopbar() {
  const pathname = usePathname()
  const { isDark, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Prevent hydration mismatch by only showing theme-dependent content after mount
  useEffect(() => {
    setMounted(true)
    // Get user info from localStorage only on client side
    if (typeof window !== 'undefined') {
      setUserName(getUserName())
      setUserEmail(getUserEmail())
    }
  }, [])

  // Open command palette on search input focus or click
  const handleSearchClick = () => {
    // Trigger Cmd+K to open command palette
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    })
    window.dispatchEvent(event)
  }

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        handleSearchClick()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="sticky top-0 z-40 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] backdrop-blur-sm bg-opacity-95 h-[60px] flex items-center flex-shrink-0">
      <div className="flex items-center justify-between px-6 py-3 gap-4 w-full">
        {/* Logo - Left side */}
        <div className="flex-1 flex items-center">
          <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-lg font-semibold text-[hsl(var(--foreground))] hidden sm:inline">
              The School Quiz
            </span>
          </Link>
        </div>

        {/* Global Search - Centered */}
        <button
          onClick={handleSearchClick}
          className="hidden md:flex max-w-md items-center gap-3 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))]/50 hover:bg-[hsl(var(--input))] transition-all duration-200 text-left"
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-sm">Search organisations, users, quizzes…</span>
          <div className="flex items-center gap-1 text-xs">
            <kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] border border-[hsl(var(--border))] font-mono">
              ⌘
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] border border-[hsl(var(--border))] font-mono">
              K
            </kbd>
          </div>
        </button>

        {/* Right-side cluster */}
        <div className="flex-1 flex justify-end">
          <div className="flex items-center gap-2">
          {/* Draft Indicator */}
          <DraftIndicator type="all" showCount />

          {/* Notifications */}
          <NotificationsBell />

          {/* User Profile Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-2.5 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80 hover:text-[hsl(var(--foreground))] border border-[hsl(var(--border))] transition-colors"
                title={userName ? `${userName} - Account menu` : "Account menu"}
              >
                <User className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-2"
              sideOffset={8}
              align="end"
            >
              {/* User Info Section */}
              <div className="px-3 py-2.5 border-b border-[hsl(var(--border))] mb-1">
                {userName && (
                  <div className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                    {userName}
                  </div>
                )}
                {userEmail && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-[hsl(var(--muted-foreground))] truncate">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{userEmail}</span>
                  </div>
                )}
                {!userName && !userEmail && (
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">
                    Not signed in
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <Link
                href="/account"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <Settings className="w-4 h-4" />
                Account Settings
              </Link>
              
              <div className="h-px bg-[hsl(var(--border))] my-1" />
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </PopoverContent>
          </Popover>

          {/* Help/Support */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-2.5 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80 hover:text-[hsl(var(--foreground))] border border-[hsl(var(--border))] transition-colors"
                title="Help & Support"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 p-2"
              sideOffset={8}
              align="end"
            >
              <Link
                href="/admin/support"
                className="block px-3 py-2 rounded-lg text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
              >
                Support Tickets
              </Link>
              <a
                href="https://docs.theschoolquiz.com.au"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 rounded-lg text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
              >
                Documentation
              </a>
              <div className="h-px bg-[hsl(var(--border))] my-1" />
              <div className="px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
                <div className="font-medium mb-1">Keyboard Shortcuts</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Open search</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] border border-[hsl(var(--border))] font-mono text-[10px]">
                      ⌘K
                    </kbd>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Theme Toggle */}
          {mounted ? (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleTheme()
              }}
              className="p-2.5 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80 hover:text-[hsl(var(--foreground))] border border-[hsl(var(--border))] transition-colors cursor-pointer"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              type="button"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          ) : (
            // Placeholder during SSR to prevent hydration mismatch
            <button
              className="p-2.5 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80 hover:text-[hsl(var(--foreground))] border border-[hsl(var(--border))] transition-colors cursor-pointer"
              title="Toggle theme"
              aria-label="Toggle theme"
              type="button"
              disabled
            >
              <Moon className="w-4 h-4" />
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

