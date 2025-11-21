'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Tooltip from '@radix-ui/react-tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  Calendar,
  BarChart3,
  CreditCard,
  HelpCircle,
  Settings,
  Trophy,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  FileText,
  Plus,
  ChevronDown,
  ChevronUp,
  Database,
  Layers,
  Wand2,
} from 'lucide-react'
import { DraftIndicator } from './DraftIndicator'

interface SidebarItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  section?: string
  children?: SidebarItem[]
}

interface SidebarSection {
  id: string
  label: string
  items: SidebarItem[]
}

const sidebarSections: SidebarSection[] = [
  {
    id: 'overview',
    label: '',
    items: [
      { id: 'overview', label: 'Overview', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    id: 'management',
    label: 'Management',
    items: [
      { id: 'organisations', label: 'Organisations', href: '/admin/organisations', icon: Building2 },
      { id: 'users', label: 'Users', href: '/admin/users', icon: Users },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    items: [
      { 
        id: 'quizzes', 
        label: 'Quizzes', 
        href: '/admin/quizzes', 
        icon: BookOpen,
        children: [
          { id: 'quiz-builder', label: 'Quiz Builder', href: '/admin/quizzes/builder', icon: Wand2 },
          { id: 'drafts', label: 'Drafts', href: '/admin/drafts', icon: FileText },
          { id: 'question-bank', label: 'Question Bank', href: '/admin/questions/bank', icon: Database },
          { id: 'round-creator', label: 'Round Creator', href: '/admin/rounds/create', icon: Layers },
        ]
      },
      { 
        id: 'achievements', 
        label: 'Achievements', 
        href: '/admin/achievements', 
        icon: Trophy,
        children: [
          { id: 'achievement-builder', label: 'Achievement Builder', href: '/admin/achievements?create=true', icon: Plus },
        ]
      },
      { id: 'question-submissions', label: "People's Round Submissions", href: '/admin/questions/submissions', icon: MessageSquare },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 'scheduling', label: 'Scheduling', href: '/admin/scheduling', icon: Calendar },
      { id: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { id: 'billing', label: 'Billing', href: '/admin/billing', icon: CreditCard },
      { id: 'support', label: 'Support', href: '/admin/support', icon: HelpCircle },
      { id: 'system', label: 'System', href: '/admin/system', icon: Settings },
    ],
  },
]

// Get environment from env vars
const getEnvironment = (): 'DEV' | 'STAGE' | 'PROD' | null => {
  if (typeof window === 'undefined') {
    // Server-side: check process.env
    const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV;
    if (env === 'development') return 'DEV';
    if (env === 'staging' || env === 'stage') return 'STAGE';
    return null; // Production - don't show badge
  }
  // Client-side: check window location or env
  const hostname = window.location.hostname;
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) return 'DEV';
  if (hostname.includes('staging') || hostname.includes('stage')) return 'STAGE';
  return null; // Production
};

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [environment, setEnvironment] = useState<'DEV' | 'STAGE' | 'PROD' | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const pathname = usePathname()

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed')
    if (saved) {
      setCollapsed(JSON.parse(saved))
    }
    // Get environment
    setEnvironment(getEnvironment())
  }, [])

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(newCollapsed))
  }

  // Check if any item in a section is active (including children)
  const isSectionActive = (section: SidebarSection) => {
    const checkItem = (item: SidebarItem): boolean => {
      if (item.href === '/admin') {
        return pathname === '/admin'
      }
      const isActive = pathname?.startsWith(item.href) || false
      const hasActiveChild = item.children?.some(checkItem) || false
      return isActive || hasActiveChild
    }
    return section.items.some(checkItem)
  }

  // Check if item or any of its children is active
  const isItemActive = (item: SidebarItem): boolean => {
    if (item.href === '/admin') {
      return pathname === '/admin'
    }
    const isActive = pathname?.startsWith(item.href) || false
    const hasActiveChild = item.children?.some(isItemActive) || false
    return isActive || hasActiveChild
  }

  // Toggle expanded state
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  // Auto-expand items with active children
  useEffect(() => {
    const checkItemActive = (item: SidebarItem): boolean => {
      if (item.href === '/admin') {
        return pathname === '/admin'
      }
      const isActive = pathname?.startsWith(item.href) || false
      const hasActiveChild = item.children?.some(checkItemActive) || false
      return isActive || hasActiveChild
    }

    const checkAndExpand = (items: SidebarItem[]) => {
      items.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(checkItemActive)
          if (hasActiveChild) {
            setExpandedItems(prev => new Set(prev).add(item.id))
          }
        }
      })
    }
    sidebarSections.forEach(section => checkAndExpand(section.items))
  }, [pathname])

  const SidebarItem = ({ item, level = 0 }: { item: SidebarItem; level?: number }) => {
    const Icon = item.icon
    const isActive = isItemActive(item)
    const isExpanded = expandedItems.has(item.id)
    const hasChildren = item.children && item.children.length > 0
    
    const itemContent = (
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[hsl(var(--primary))]' : ''}`} />
        {!collapsed && (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
              {(item.id === 'drafts' || item.href === '/admin/drafts') && (
                <DraftIndicator type="all" showCount linkToDrafts={false} />
              )}
            </div>
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleExpanded(item.id)
                }}
                className="p-0.5 hover:bg-[hsl(var(--muted))] rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                )}
              </button>
            )}
          </>
        )}
      </div>
    )

    const content = (
      <div>
        <Link
          href={item.href}
          className={`relative flex items-center ${collapsed ? 'justify-center' : ''} ${collapsed ? 'px-2 py-3' : 'px-3 py-2.5'} rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive 
              ? collapsed
                ? 'bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]'
                : 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
              : collapsed
              ? 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
          }`}
          style={!collapsed && level > 0 ? { paddingLeft: `${12 + level * 16}px` } : undefined}
        >
          {itemContent}
        </Link>
        {!collapsed && hasChildren && isExpanded && (
          <div className="ml-3 mt-1 space-y-1">
            {item.children?.map((child) => (
              <SidebarItem key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )

    if (collapsed) {
      return (
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              {content}
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content 
                className="bg-[hsl(var(--raised))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] text-xs px-2 py-1 rounded shadow-lg z-50"
                side="right"
              >
                {item.label}
                <Tooltip.Arrow className="fill-[hsl(var(--raised))]" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      )
    }

    return content
  }

  const SectionHeader = ({ section }: { section: SidebarSection }) => {
    if (!section.label || section.id === 'overview') return null
    if (collapsed) return null // Hide section headers when collapsed
    const isActive = isSectionActive(section)
    
    return (
      <div className={`px-3 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider ${
        isActive ? 'text-[hsl(var(--foreground))]' : ''
      }`}>
        {section.label}
      </div>
    )
  }

  return (
    <div className={`relative bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] transition-all duration-200 flex-shrink-0 ${
      collapsed ? 'w-20' : 'w-[280px]'
    }`}>
      {/* Expand tab - overlayed on border line, vertically aligned with logo, spanning both sides */}
      {collapsed && (
        <button
          onClick={toggleCollapsed}
          className="absolute right-0 top-[30px] -translate-y-1/2 translate-x-1/2 w-4 h-8 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-md hover:bg-[hsl(var(--muted))] transition-all duration-200 flex items-center justify-center group z-50 shadow-sm"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="w-2.5 h-2.5 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors" />
        </button>
      )}
      <div className="sticky top-0 h-screen flex flex-col">
        {/* Header - matches top bar height */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] h-[60px]">
          {!collapsed ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="text-lg font-semibold text-[hsl(var(--foreground))] whitespace-nowrap">
                SchoolQuiz Admin
              </div>
              {environment && (
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full flex-shrink-0 ${
                  environment === 'DEV' 
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : environment === 'STAGE'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {environment}
                </span>
              )}
            </div>
          ) : (
            <div className="text-xl font-bold text-[hsl(var(--primary))] leading-none mx-auto flex-1 text-center">
              SQ
            </div>
          )}
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              className="p-2 rounded-xl hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-all duration-200 flex-shrink-0"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className={collapsed ? 'space-y-2 p-2' : 'space-y-4 p-3'}>
            {sidebarSections.map((section, sectionIndex) => {
              // Overview section (ungrouped)
              if (!section.label || section.id === 'overview') {
                return (
                  <div key={section.id} className={collapsed ? 'space-y-2' : 'space-y-1'}>
                    {section.items.map((item) => (
                      <SidebarItem key={item.id} item={item} />
                    ))}
                    {collapsed && sectionIndex < sidebarSections.length - 1 && (
                      <div className="h-px bg-[hsl(var(--border))] mx-2 my-2" />
                    )}
                  </div>
                )
              }

              // Other sections with headers
              return (
                <div key={section.id} className={collapsed ? 'space-y-2' : 'space-y-1'}>
                  <SectionHeader section={section} />
                  {section.items.map((item) => (
                    <SidebarItem key={item.id} item={item} />
                  ))}
                  {collapsed && sectionIndex < sidebarSections.length - 1 && (
                    <div className="h-px bg-[hsl(var(--border))] mx-2 my-2" />
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

