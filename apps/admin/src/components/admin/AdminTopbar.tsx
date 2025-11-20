'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { User, LogOut, Sun, Moon, Search, Command, HelpCircle } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useTheme } from '@/contexts/ThemeContext'
import { DraftIndicator } from './DraftIndicator'
import { NotificationsBell } from './NotificationsBell'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

export function AdminTopbar() {
  const pathname = usePathname()
  const { isDark, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Prevent hydration mismatch by only showing theme-dependent content after mount
  useEffect(() => {
    setMounted(true)
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
    <div className="sticky top-0 z-40 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] backdrop-blur-sm bg-opacity-95 h-[60px] flex items-center">
      <div className="flex items-center justify-between px-6 py-3 gap-4 w-full">
        {/* Global Search */}
        <button
          onClick={handleSearchClick}
          className="flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))]/50 hover:bg-[hsl(var(--input))] transition-all duration-200 text-left"
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
        <div className="flex items-center gap-2">
          {/* Draft Indicator */}
          <DraftIndicator type="all" showCount />

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

          {/* Notifications */}
          <NotificationsBell />

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
  )
}

