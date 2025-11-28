/**
 * Command Palette (Cmd+K)
 * Quick navigation and actions
 */

'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SpeculationRules } from '@/components/SpeculationRules'
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
    organisations: Array<{ id: string; name: string }>
    users: Array<{ id: string; name: string; email: string }>
  }>({ quizzes: [], achievements: [], organisations: [], users: [] })
  const [isSearching, setIsSearching] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const searchCacheRef = useRef<Map<string, typeof searchResults>>(new Map())

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

  // Search for quizzes, achievements, organisations, and users when typing
  // Only search database for longer, specific queries to avoid unnecessary API calls
  useEffect(() => {
    const query = search.trim()
    const queryLower = query.toLowerCase()
    
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Common navigation/action keywords that shouldn't trigger database searches
    // These match commands that should show instantly
    const commonKeywords = [
      'new', 'create', 'add', 'go', 'to', 'nav', 'page', 'home', 'dashboard',
      'quiz', 'quizzes', 'achievement', 'achievements',
      'analytics', 'stats', 'billing', 'support', 'system', 'settings',
      'scheduling', 'schedule', 'calendar', 'draft', 'drafts', 'people',
      'submission', 'submissions', 'help', 'ticket', 'tickets'
    ]
    
    // Check if query matches common keywords (exact match, starts with, or is a prefix)
    const isCommonKeyword = commonKeywords.some(keyword => 
      queryLower === keyword || 
      queryLower.startsWith(keyword) ||
      keyword.startsWith(queryLower)
    )
    
    // Special handling for user/org searches - allow 3+ chars for these
    // Check if query starts with user/org prefixes or is clearly searching for them
    const isUserOrOrgSearch = 
      queryLower.startsWith('user:') ||
      queryLower.startsWith('org:') ||
      queryLower.startsWith('organisation:') ||
      queryLower.startsWith('organization:') ||
      (query.length >= 3 && (
        queryLower.includes('@') || // Email search
        queryLower.match(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i) // Email pattern
      ))
    
    // Only search database if:
    // 1. Query is 3+ characters for user/org searches, OR 4+ for general searches
    // 2. AND it doesn't match common navigation keywords (unless it's a user/org search)
    // This ensures "new", "quiz", etc. show instant results, but "john" or "acme" search users/orgs
    const shouldSearchDatabase = (
      (isUserOrOrgSearch && query.length >= 3) ||
      (query.length >= 4 && !isCommonKeyword)
    )
    
    if (shouldSearchDatabase) {
      // Extract actual search term if using prefixes (user:, org:, etc.)
      let actualQuery = query
      let searchTypes: string[] = ['quizzes', 'achievements', 'organisations', 'users']
      
      if (queryLower.startsWith('user:')) {
        actualQuery = query.slice(5).trim()
        searchTypes = ['users']
      } else if (queryLower.startsWith('org:') || queryLower.startsWith('organisation:') || queryLower.startsWith('organization:')) {
        actualQuery = query.replace(/^(org|organisation|organization):/i, '').trim()
        searchTypes = ['organisations']
      }
      
      // Don't search if prefix was used but no actual query
      if (actualQuery.length < 2) {
        setSearchResults({ quizzes: [], achievements: [], organisations: [], users: [] })
        setIsSearching(false)
        return
      }
      
      // Check cache first
      const cached = searchCacheRef.current.get(actualQuery)
      if (cached) {
        // Filter cached results by search type if using prefix
        const filteredResults = {
          quizzes: searchTypes.includes('quizzes') ? cached.quizzes : [],
          achievements: searchTypes.includes('achievements') ? cached.achievements : [],
          organisations: searchTypes.includes('organisations') ? cached.organisations : [],
          users: searchTypes.includes('users') ? cached.users : [],
        }
        setSearchResults(filteredResults)
        setIsSearching(false)
        return
      }
      
      setIsSearching(true)
      
      // Create new AbortController for this request
      const abortController = new AbortController()
      abortControllerRef.current = abortController
      
      // Reduced debounce since we're using a faster unified endpoint
      const timeoutId = setTimeout(() => {
        const searchParam = encodeURIComponent(actualQuery)
        
        // Use optimized unified search endpoint - much faster!
        // Single request instead of 4 separate requests
        // Only fetches minimal fields (id, name/title, email) - no counts, no relations
        const typesParam = searchTypes.join(',')
        fetch(`/api/admin/search?q=${searchParam}&types=${typesParam}&limit=5`, {
          signal: abortController.signal,
          // Add cache headers for better performance
          cache: 'no-store', // Always fresh results
        })
          .then((res) => res.json())
          .then((data) => {
            // Only update if request wasn't aborted
            if (!abortController.signal.aborted) {
              const mergedResults = {
                quizzes: data.quizzes || [],
                achievements: data.achievements || [],
                organisations: data.organisations || [],
                users: data.users || [],
              }
              
              // Cache results (limit cache size to 20 entries)
              if (searchCacheRef.current.size >= 20) {
                const firstKey = searchCacheRef.current.keys().next().value
                searchCacheRef.current.delete(firstKey)
              }
              searchCacheRef.current.set(actualQuery, mergedResults)
              
              setSearchResults(mergedResults)
              setIsSearching(false)
            }
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              setIsSearching(false)
            }
          })
      }, 250) // Reduced debounce - unified endpoint is much faster

      return () => {
        clearTimeout(timeoutId)
        abortController.abort()
      }
    } else {
      // Clear database results for short/common queries - show only navigation commands
      setSearchResults({ quizzes: [], achievements: [], organisations: [], users: [] })
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

    // Organisation results
    searchResults.organisations.forEach((org: any) => {
      results.push({
        id: `org-${org.id}`,
        label: org.name,
        keywords: [org.name.toLowerCase(), 'organisation', 'organization', 'org'],
        icon: Building2,
        action: () => {
          router.push(`/admin/organisations/${org.id}`)
          setIsOpen(false)
        },
        category: 'navigation',
        url: `/admin/organisations/${org.id}`,
      })
    })

    // User results - show with email for clarity
    searchResults.users.forEach((user: any) => {
      const displayName = user.name || user.email || 'Unknown User'
      const displayLabel = user.name && user.email 
        ? `${user.name} (${user.email})`
        : displayName
      
      results.push({
        id: `user-${user.id}`,
        label: displayLabel,
        keywords: [
          user.name?.toLowerCase() || '', 
          user.email?.toLowerCase() || '', 
          'user',
          'users'
        ],
        icon: Users,
        action: () => {
          router.push(`/admin/users/${user.id}`)
          setIsOpen(false)
        },
        category: 'navigation',
        url: `/admin/users/${user.id}`,
      })
    })

    return results
  }, [searchResults, router])

  // All commands (search results prioritized when searching)
  const allCommands = useMemo(() => {
    if (search.trim().length >= 2 && searchResultCommands.length > 0) {
      // When searching with database results, prioritize search results
      return [...searchResultCommands, ...createCommands, ...navigationCommands]
    }
    // For short queries or no database results, prioritize navigation/action commands
    return [...recentCommands, ...createCommands, ...navigationCommands]
  }, [recentCommands, createCommands, navigationCommands, searchResultCommands, search])

  // Filtered commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) {
      // Show recent + create + navigation when no search
      return [...recentCommands, ...createCommands, ...navigationCommands]
    }

    const query = search.toLowerCase().trim()
    
    // Always filter navigation/action commands by keywords for instant results
    const filteredNavCommands = navigationCommands.filter((cmd) => {
      const labelMatch = cmd.label.toLowerCase().includes(query)
      const keywordMatch = cmd.keywords.some((kw) => kw.includes(query))
      return labelMatch || keywordMatch
    })
    
    const filteredCreateCommands = createCommands.filter((cmd) => {
      const labelMatch = cmd.label.toLowerCase().includes(query)
      const keywordMatch = cmd.keywords.some((kw) => kw.includes(query))
      return labelMatch || keywordMatch
    })
    
    const filteredRecentCommands = recentCommands.filter((cmd) => {
      const labelMatch = cmd.label.toLowerCase().includes(query)
      const keywordMatch = cmd.keywords.some((kw) => kw.includes(query))
      return labelMatch || keywordMatch
    })

    // If we have database search results, show them first, then filtered commands
    if (searchResultCommands.length > 0) {
      return [...searchResultCommands, ...filteredCreateCommands, ...filteredNavCommands]
    }

    // Otherwise show filtered navigation/action commands (instant, no database query)
    return [...filteredRecentCommands, ...filteredCreateCommands, ...filteredNavCommands]
  }, [search, searchResultCommands, recentCommands, createCommands, navigationCommands])

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

  // Prerender top search results (limit to top 5 to avoid excessive prerendering)
  const topResultUrls = useMemo(() => {
    if (!isOpen || filteredCommands.length === 0) return []
    
    return filteredCommands
      .slice(0, 5) // Top 5 results
      .map(cmd => cmd.url)
      .filter((url): url is string => !!url && typeof url === 'string')
  }, [isOpen, filteredCommands])

  if (!isOpen) return null

  return (
    <>
      {/* Prerender top command palette results */}
      {isOpen && topResultUrls.length > 0 && (
        <SpeculationRules 
          urls={topResultUrls}
          eagerness="moderate" // Prerender on hover + after 2s of mouse inactivity
        />
      )}
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
                const newValue = e.target.value
                setSearch(newValue)
                // Reset selection when search changes
                setSelectedIndex(0)
              }}
              placeholder="Search commands, users, organisations, quizzes..."
              className="w-full pl-10 pr-10 py-3 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))] text-lg"
              autoFocus
              autoComplete="off"
              spellCheck="false"
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
    </>
  )
}

