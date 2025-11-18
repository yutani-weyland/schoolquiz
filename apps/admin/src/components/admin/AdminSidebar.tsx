'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Tooltip from '@radix-ui/react-tooltip'
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
  Plus,
} from 'lucide-react'

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
      { id: 'create-question', label: 'Create Question/Round', href: '/admin/questions/create', icon: Plus },
      { id: 'question-submissions', label: 'Question Submissions', href: '/admin/questions/submissions', icon: MessageSquare },
      { id: 'achievements', label: 'Achievements', href: '/admin/achievements', icon: Trophy },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 'scheduling', label: 'Scheduling', href: '/admin/scheduling', icon: Calendar },
      { id: 'analytics', label: 'Analytics', href: '/admin/analytics/engagement', icon: BarChart3 },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    items: [
      { id: 'billing', label: 'Billing', href: '/admin/billing', icon: CreditCard },
      { id: 'support', label: 'Support', href: '/admin/support', icon: HelpCircle },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'system', label: 'System Settings', href: '/admin/system', icon: Settings },
    ],
  },
]

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed')
    if (saved) {
      setCollapsed(JSON.parse(saved))
    }
  }, [])

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(newCollapsed))
  }

  const SidebarItem = ({ item }: { item: SidebarItem }) => {
    const Icon = item.icon
    const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
    
    const content = (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive 
            ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/20 text-blue-700 dark:text-blue-300 shadow-[0_1px_3px_rgba(59,130,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(59,130,246,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)]' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-800/50 dark:hover:to-gray-800/30 hover:shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)]'
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>}
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
                className="bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg z-50"
                side="right"
              >
                {item.label}
                <Tooltip.Arrow className="fill-slate-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      )
    }

    return content
  }

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 border-r border-gray-200/50 dark:border-gray-700/50 transition-all duration-200 ${
      collapsed ? 'w-16' : 'w-60'
    }`}>
      <div className="sticky top-0 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900">
          {!collapsed && (
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              Admin
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all duration-200"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-6">
            {sidebarSections.map((section) => (
              <div key={section.id} className="space-y-2">
                {section.label && !collapsed && (
                  <div className="px-3 py-1.5">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {section.label}
                    </h3>
                  </div>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <SidebarItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

