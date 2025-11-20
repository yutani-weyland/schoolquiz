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
} from 'lucide-react'
import { DraftIndicator } from './DraftIndicator'

interface SidebarItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  section?: string
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
      { id: 'quizzes', label: 'Quizzes', href: '/admin/quizzes', icon: BookOpen },
      { id: 'drafts', label: 'Drafts', href: '/admin/drafts', icon: FileText },
      { id: 'achievements', label: 'Achievements', href: '/admin/achievements', icon: Trophy },
      { id: 'question-submissions', label: 'Question Submissions', href: '/admin/questions/submissions', icon: MessageSquare },
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

  // Check if any item in a section is active
  const isSectionActive = (section: SidebarSection) => {
    return section.items.some(item => {
      if (item.href === '/admin') {
        return pathname === '/admin'
      }
      return pathname?.startsWith(item.href)
    })
  }

  const SidebarItem = ({ item }: { item: SidebarItem }) => {
    const Icon = item.icon
    const isActive = item.href === '/admin'
      ? pathname === '/admin'
      : pathname?.startsWith(item.href)
    
    const content = (
      <Link
        href={item.href}
        className={`relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'} ${collapsed ? 'px-2 py-3' : 'px-3 py-2.5'} rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive 
            ? collapsed
              ? 'bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] border-l-4 border-[hsl(var(--primary))]'
              : 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border-l-4 border-[hsl(var(--primary))]'
            : collapsed
            ? 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] border-l-4 border-transparent'
            : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] border-l-4 border-transparent'
        }`}
      >
        <Icon className={`${collapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0 ${isActive ? 'text-[hsl(var(--primary))]' : ''}`} />
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
            {item.id === 'drafts' && (
              <DraftIndicator type="all" showCount linkToDrafts={false} />
            )}
          </div>
        )}
      </Link>
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
    <div className={`bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] transition-all duration-200 flex-shrink-0 ${
      collapsed ? 'w-20' : 'w-[280px]'
    }`}>
      <div className="sticky top-0 h-screen flex flex-col">
        {/* Header - matches top bar height */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] h-[60px]">
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
          {collapsed && (
            <button
              onClick={toggleCollapsed}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-xl hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-all duration-200"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
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

