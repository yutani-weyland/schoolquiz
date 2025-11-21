'use client'

import { useState, useEffect, useRef } from 'react'
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
        href: '#', // Parent items with children don't navigate
        icon: BookOpen,
        children: [
          { id: 'quiz-browser', label: 'Quiz Browser', href: '/admin/quizzes', icon: BookOpen },
          { id: 'quiz-builder', label: 'Quiz Builder', href: '/admin/quizzes/builder', icon: Wand2 },
          { id: 'drafts', label: 'Drafts', href: '/admin/drafts', icon: FileText },
        ]
      },
      { 
        id: 'questions', 
        label: 'Questions', 
        href: '#', // Parent items with children don't navigate
        icon: Database,
        children: [
          { id: 'question-browser', label: 'Question Browser', href: '/admin/questions/bank', icon: Database },
          { id: 'question-builder', label: 'Question Builder', href: '/admin/questions/create', icon: Plus },
        ]
      },
      { 
        id: 'rounds', 
        label: 'Rounds', 
        href: '#', // Parent items with children don't navigate - only expand/collapse
        icon: Layers,
        children: [
          { id: 'round-browser', label: 'Round Browser', href: '/admin/rounds', icon: Layers },
          { id: 'round-creator', label: 'Round Creator', href: '/admin/rounds/create', icon: Plus },
        ]
      },
      { 
        id: 'achievements', 
        label: 'Achievements', 
        href: '#', // Parent items with children don't navigate - only expand/collapse
        icon: Trophy,
        children: [
          { id: 'achievement-browser', label: 'Achievement Browser', href: '/admin/achievements', icon: Trophy },
          { id: 'achievement-builder', label: 'Achievement Builder', href: '/admin/achievements?create=true', icon: Plus },
        ]
      },
      { id: 'question-submissions', label: "Peoples' Round", href: '/admin/questions/submissions', icon: MessageSquare },
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

export function AdminSidebar() {
  const [isHovered, setIsHovered] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isExpanded = isHovered || isPinned

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isPinned) {
        setIsHovered(false)
      }
    }, 150)
  }

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const togglePinned = () => {
    setIsPinned(prev => {
      const newPinned = !prev
      if (!newPinned) {
        setIsHovered(false)
      }
      return newPinned
    })
  }

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

  const isItemActive = (item: SidebarItem): boolean => {
    // Only mark as active if this exact item matches, not if it has active children
    // Parent items with children should not be highlighted when a child is active
    if (item.href === '/admin') {
      return pathname === '/admin'
    }
    // For items with children, they should never be marked as active (they're just expandable containers)
    if (item.children && item.children.length > 0) {
      return false
    }
    // For leaf items, use exact match only to prevent sibling routes from both being highlighted
    // This ensures only one item is active at a time (e.g., /admin/quizzes vs /admin/quizzes/builder)
    if (!pathname || !item.href) return false
    
    // Exact match only - this prevents /admin/quizzes from matching when on /admin/quizzes/builder
    return pathname === item.href
  }

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
    const isItemExpanded = expandedItems.has(item.id)
    const hasChildren = item.children && item.children.length > 0

    // Unified styling for both collapsed and expanded states
    const baseClasses = `flex items-center h-10 rounded-md transition-colors ${
      isActive
        ? 'bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]'
        : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
    }`

    // Always use same padding (px-3) so icons stay in exact same position when expanding
    // If item has children, make it a button that only expands/collapses (no navigation)
    // Otherwise, make it a link that navigates
    const itemContent = (
      <div
        className={`${baseClasses} ${
          isExpanded 
            ? 'px-3 gap-3' 
            : 'px-0 justify-center'
        }`}
        style={isExpanded && level > 0 ? { paddingLeft: `${12 + level * 16}px` } : undefined}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[hsl(var(--primary))]' : ''}`} />
        {isExpanded && (
          <>
            {hasChildren ? (
              // Parent item with children - button that expands/collapses only
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleExpanded(item.id)
                }}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
                {isItemExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[hsl(var(--muted-foreground))] ml-auto flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))] ml-auto flex-shrink-0" />
                )}
              </button>
            ) : (
              // Regular item without children - link that navigates
              <Link
                href={item.href}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
                {(item.id === 'drafts' || item.href === '/admin/drafts') && (
                  <DraftIndicator type="all" showCount linkToDrafts={false} />
                )}
              </Link>
            )}
          </>
        )}
      </div>
    )

    if (!isExpanded) {
      // Collapsed state - show tooltip
      // If has children, clicking should expand (but sidebar needs to be expanded first)
      // For now, just show tooltip
      return (
        <Tooltip.Provider delayDuration={0}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              {hasChildren ? (
                <div className={baseClasses + ' px-0 justify-center cursor-pointer'}>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[hsl(var(--primary))]' : ''}`} />
                </div>
              ) : (
                <Link href={item.href} className={baseClasses + ' px-0 justify-center'}>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[hsl(var(--primary))]' : ''}`} />
                </Link>
              )}
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-[hsl(var(--popover))] text-[hsl(var(--popover-foreground))] border border-[hsl(var(--border))] text-xs px-2 py-1.5 rounded-md shadow-lg z-[100]"
                side="right"
                sideOffset={8}
              >
                {item.label}
                <Tooltip.Arrow className="fill-[hsl(var(--popover))]" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      )
    }

    // Expanded state - show children if expanded
    return (
      <div>
        {itemContent}
        {hasChildren && isItemExpanded && (
          <div className="ml-3 mt-1 space-y-1 pb-1">
            {item.children?.map((child) => (
              <SidebarItem key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const SectionHeader = ({ section }: { section: SidebarSection }) => {
    // Section headers removed - separator lines are sufficient to distinguish groups
    return null
  }

  return (
    <div
      ref={sidebarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed left-0 top-[60px] h-[calc(100vh-60px)] bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] transition-all duration-200 ease-out z-50 ${
        isExpanded ? 'w-[280px] shadow-xl' : 'w-[60px]'
      }`}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className="py-3">
            {sidebarSections.map((section, sectionIndex) => {
              return (
                <div key={section.id}>
                  {/* Separator line between sections (except before first section) */}
                  {sectionIndex > 0 && (
                    <div className={`h-px bg-[hsl(var(--border))] mx-3 my-3`} />
                  )}
                  <div className={`space-y-1 ${isExpanded ? 'px-2' : 'px-0'}`}>
                    {section.items.map((item) => (
                      <SidebarItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
