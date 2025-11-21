/**
 * Command Palette (Cmd+K)
 * Quick navigation and actions
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Search,
  BookOpen,
  Target,
  Users,
  Building2,
  Plus,
  FileText,
  BarChart3,
  Settings,
  Calendar,
  CreditCard,
  HelpCircle,
  MessageSquare,
  Home,
  ArrowRight,
  Clock,
  X,
  Sparkles,
} from 'lucide-react'

interface Command {
  id: string
  label: string
  keywords: string[]
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  category: 'navigation' | 'create' | 'recent'
  url?: string
}

interface RecentItem {
  id: string
  label: string
  url: string
  type: 'quiz' | 'achievement' | 'user'
  lastEdited: Date
}

export function CommandPalette() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [searchResults, setSearchResults] = useState<{
    quizzes: Array<{ id: string; title: string }>
    achievements: Array<{ id: string; name: string }>
  }>({ quizzes: [], achievements: [] })
  const [isSearching, setIsSearching] = useState(false)

  // Load recent items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('command-palette-recent')
      if (stored) {
        const items = JSON.parse(stored).map((item: any) => ({
          ...item,
          lastEdited: new Date(item.lastEdited),
        }))
        setRecentItems(items.slice(0, 10)) // Last 10
      }
    } catch (error) {
      console.error('Error loading recent items:', error)
    }
  }, [])

  // Search for quizzes and achievements when typing
  useEffect(() => {
    if (search.trim().length >= 2) {
      setIsSearching(true)
      const timeoutId = setTimeout(() => {
        // Search quizzes
        fetch(`/api/admin/quizzes?search=${encodeURIComponent(search.trim())}&limit=5`)
          .then((res) => res.json())
          .then((data) => {
            setSearchResults((prev) => ({
              ...prev,
              quizzes: data.quizzes || [],
            }))
            setIsSearching(false)
          })
          .catch(() => setIsSearching(false))

        // Search achievements (filter client-side for now since API doesn't support search)
        fetch(`/api/admin/achievements`)
          .then((res) => res.json())
          .then((data) => {
            const allAchievements = data.achievements || []
            const query = search.trim().toLowerCase()
            const filtered = allAchievements
              .filter((a: any) => 
                a.name?.toLowerCase().includes(query) ||
                a.slug?.toLowerCase().includes(query) ||
                a.shortDescription?.toLowerCase().includes(query)
              )
              .slice(0, 5)
            setSearchResults((prev) => ({
              ...prev,
              achievements: filtered,
            }))
          })
          .catch(() => {})
      }, 300)

      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults({ quizzes: [], achievements: [] })
      setIsSearching(false)
    }
  }, [search])

  // Track page visits for recent items
  useEffect(() => {
    if (pathname?.startsWith('/admin/quizzes/') && pathname !== '/admin/quizzes' && pathname !== '/admin/quizzes/builder') {
      const quizId = pathname.split('/').pop()
      // Fetch quiz title for better label
      fetch(`/api/admin/quizzes/${quizId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.quiz) {
            trackRecentItem({
              id: quizId || '',
              label: data.quiz.title || 'Quiz',
              url: pathname,
              type: 'quiz',
              lastEdited: new Date(),
            })
          }
        })
        .catch(() => {
          // Fallback if fetch fails
          trackRecentItem({
            id: quizId || '',
            label: 'Quiz',
            url: pathname,
            type: 'quiz',
            lastEdited: new Date(),
          })
        })
    } else if (pathname?.startsWith('/admin/achievements') && pathname !== '/admin/achievements') {
      trackRecentItem({
        id: pathname.split('/').pop() || '',
        label: 'Achievement',
        url: pathname,
        type: 'achievement',
        lastEdited: new Date(),
      })
    }
  }, [pathname])

  const trackRecentItem = (item: RecentItem) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((i) => i.url !== item.url)
      const updated = [item, ...filtered].slice(0, 10)
      try {
        localStorage.setItem('command-palette-recent', JSON.stringify(updated))
      } catch (error) {
        console.error('Error saving recent items:', error)
      }
      return updated
    })
  }

  // Navigation commands
  const navigationCommands: Command[] = useMemo(
    () => [
      {
        id: 'overview',
        label: 'Go to Overview',
        keywords: ['home', 'dashboard', 'overview'],
        icon: Home,
        action: () => router.push('/admin'),
        category: 'navigation',
        url: '/admin',
      },
      {
        id: 'quizzes',
        label: 'Go to Quizzes',
        keywords: ['quizzes', 'quiz', 'questions'],
        icon: BookOpen,
        action: () => router.push('/admin/quizzes'),
        category: 'navigation',
        url: '/admin/quizzes',
      },
      {
        id: 'achievements',
        label: 'Go to Achievements',
        keywords: ['achievements', 'achievement', 'badges', 'rewards'],
        icon: Target,
        action: () => router.push('/admin/achievements'),
        category: 'navigation',
        url: '/admin/achievements',
      },
      {
        id: 'drafts',
        label: 'Go to Drafts',
        keywords: ['drafts', 'draft', 'unsaved'],
        icon: FileText,
        action: () => router.push('/admin/drafts'),
        category: 'navigation',
        url: '/admin/drafts',
      },
      {
        id: 'users',
        label: 'Go to Users',
        keywords: ['users', 'user', 'people', 'members'],
        icon: Users,
        action: () => router.push('/admin/users'),
        category: 'navigation',
        url: '/admin/users',
      },
      {
        id: 'organisations',
        label: 'Go to Organisations',
        keywords: ['organisations', 'organizations', 'orgs', 'teams'],
        icon: Building2,
        action: () => router.push('/admin/organisations'),
        category: 'navigation',
        url: '/admin/organisations',
      },
      {
        id: 'analytics',
        label: 'Go to Analytics',
        keywords: ['analytics', 'stats', 'statistics', 'metrics'],
        icon: BarChart3,
        action: () => router.push('/admin/analytics'),
        category: 'navigation',
        url: '/admin/analytics',
      },
      {
        id: 'scheduling',
        label: 'Go to Scheduling',
        keywords: ['scheduling', 'schedule', 'calendar', 'publish'],
        icon: Calendar,
        action: () => router.push('/admin/scheduling'),
        category: 'navigation',
        url: '/admin/scheduling',
      },
      {
        id: 'billing',
        label: 'Go to Billing',
        keywords: ['billing', 'payments', 'subscription'],
        icon: CreditCard,
        action: () => router.push('/admin/billing'),
        category: 'navigation',
        url: '/admin/billing',
      },
      {
        id: 'support',
        label: 'Go to Support',
        keywords: ['support', 'help', 'tickets'],
        icon: HelpCircle,
        action: () => router.push('/admin/support'),
        category: 'navigation',
        url: '/admin/support',
      },
      {
        id: 'system',
        label: 'Go to System',
        keywords: ['system', 'settings', 'config'],
        icon: Settings,
        action: () => router.push('/admin/system'),
        category: 'navigation',
        url: '/admin/system',
      },
      {
        id: 'question-submissions',
        label: "Go to People's Round Submissions",
        keywords: ['submissions', 'questions', 'submitted'],
        icon: MessageSquare,
        action: () => router.push('/admin/questions/submissions'),
        category: 'navigation',
        url: '/admin/questions/submissions',
      },
    ],
    [router]
  )

  // Create commands
  const createCommands: Command[] = useMemo(
    () => [
      {
        id: 'new-quiz',
        label: 'New Quiz',
        keywords: ['new', 'create', 'quiz', 'add'],
        icon: Plus,
        action: () => {
          router.push('/admin/quizzes/builder')
          setIsOpen(false)
        },
        category: 'create',
      },
      {
        id: 'new-achievement',
        label: 'New Achievement',
        keywords: ['new', 'create', 'achievement', 'badge', 'add'],
        icon: Plus,
        action: () => {
          router.push('/admin/achievements')
          setIsOpen(false)
        },
        category: 'create',
      },
    ],
    [router]
  )

  // Recent items as commands
  const recentCommands: Command[] = useMemo(
    () =>
      recentItems.map((item) => ({
        id: `recent-${item.id}`,
        label: item.label,
        keywords: [item.label.toLowerCase(), item.type],
        icon: item.type === 'quiz' ? BookOpen : Target,
        action: () => {
          router.push(item.url)
          setIsOpen(false)
        },
        category: 'recent' as const,
        url: item.url,
      })),
    [recentItems, router]
  )

  // Search result commands
  const searchResultCommands: Command[] = useMemo(() => {
    const results: Command[] = []

    // Quiz results
    searchResults.quizzes.forEach((quiz) => {
      results.push({
        id: `quiz-${quiz.id}`,
        label: quiz.title,
        keywords: [quiz.title.toLowerCase(), 'quiz'],
        icon: BookOpen,
        action: () => {
          router.push(`/admin/quizzes/builder?edit=${quiz.id}`)
          setIsOpen(false)
        },
        category: 'navigation',
        url: `/admin/quizzes/${quiz.id}`,
      })
    })

    // Achievement results
    searchResults.achievements.forEach((achievement) => {
      results.push({
        id: `achievement-${achievement.id}`,
        label: achievement.name,
        keywords: [achievement.name.toLowerCase(), 'achievement', 'badge'],
        icon: Target,
        action: () => {
          router.push(`/admin/achievements`)
          setIsOpen(false)
        },
        category: 'navigation',
      })
    })

    return results
  }, [searchResults, router])

  // All commands (search results prioritized when searching)
  const allCommands = useMemo(() => {
    if (search.trim().length >= 2) {
      // When searching, prioritize search results
      return [...searchResultCommands, ...createCommands, ...navigationCommands]
    }
    return [...recentCommands, ...createCommands, ...navigationCommands]
  }, [recentCommands, createCommands, navigationCommands, searchResultCommands, search])

  // Filtered commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) {
      // Show recent + create + navigation when no search
      return [...recentCommands, ...createCommands, ...navigationCommands]
    }

    // If we have search results, use those (already filtered by API)
    if (search.trim().length >= 2) {
      return allCommands
    }

    // Otherwise filter by keywords
    const query = search.toLowerCase().trim()
    return allCommands.filter((cmd) => {
      const labelMatch = cmd.label.toLowerCase().includes(query)
      const keywordMatch = cmd.keywords.some((kw) => kw.includes(query))
      return labelMatch || keywordMatch
    })
  }, [search, allCommands, recentCommands, createCommands, navigationCommands])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setSearch('')
        setSelectedIndex(0)
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearch('')
        setSelectedIndex(0)
      }

      // Arrow keys to navigate
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {
      recent: [],
      create: [],
      navigation: [],
    }

    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = []
      }
      groups[cmd.category].push(cmd)
    })

    return groups
  }, [filteredCommands])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh] p-4">
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-2xl max-w-2xl w-full max-h-[60vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="p-4 border-b border-[hsl(var(--border))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSelectedIndex(0)
              }}
              placeholder="Search commands, pages, or type a command..."
              className="w-full pl-10 pr-10 py-3 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))] text-lg"
              autoFocus
            />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </p>
        </div>

        {/* Command List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isSearching ? (
            <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
              <p>Searching...</p>
            </div>
          ) : filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
              <p className="text-xs mt-1">Try searching for "quiz", "achievement", or "new"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Recent Items */}
              {groupedCommands.recent.length > 0 && !search && (
                <div className="mb-4">
                  <div className="px-3 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Recent
                  </div>
                  {groupedCommands.recent.map((cmd, index) => {
                    const globalIndex = filteredCommands.indexOf(cmd)
                    const Icon = cmd.icon
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => cmd.action()}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          globalIndex === selectedIndex
                            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                            : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{cmd.label}</span>
                        <ArrowRight className="w-4 h-4 opacity-50" />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Create Actions */}
              {groupedCommands.create.length > 0 && (
                <div className={groupedCommands.recent.length > 0 && !search ? 'mb-4' : ''}>
                  <div className="px-3 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Create
                  </div>
                  {groupedCommands.create.map((cmd, index) => {
                    const globalIndex = filteredCommands.indexOf(cmd)
                    const Icon = cmd.icon
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => cmd.action()}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          globalIndex === selectedIndex
                            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                            : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{cmd.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Search Results */}
              {search.trim().length >= 2 && searchResultCommands.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center gap-2">
                    <Search className="w-3.5 h-3.5" />
                    Search Results
                  </div>
                  {searchResultCommands.map((cmd) => {
                    const globalIndex = filteredCommands.indexOf(cmd)
                    const Icon = cmd.icon
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => cmd.action()}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          globalIndex === selectedIndex
                            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                            : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{cmd.label}</span>
                        <ArrowRight className="w-4 h-4 opacity-50" />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Navigation */}
              {groupedCommands.navigation.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5" />
                    {search.trim().length >= 2 ? 'Pages' : 'Navigation'}
                  </div>
                  {groupedCommands.navigation.map((cmd, index) => {
                    const globalIndex = filteredCommands.indexOf(cmd)
                    const Icon = cmd.icon
                    const isActive = pathname === cmd.url
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => cmd.action()}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          globalIndex === selectedIndex
                            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                            : isActive
                            ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                            : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{cmd.label}</span>
                        {isActive && (
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">Current</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

