'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Tooltip from '@radix-ui/react-tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
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
  ChevronDown,
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
  const [openSections, setOpenSections] = useState<string[]>(['content', 'management'])
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
            ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' 
            : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
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

  return (
    <div className={`bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] transition-all duration-200 ${
      collapsed ? 'w-16' : 'w-60'
    }`}>
      <div className="sticky top-0 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          {!collapsed && (
            <div className="text-lg font-semibold text-[hsl(var(--foreground))]">
              Admin
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            className="p-2 rounded-xl hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-all duration-200"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-3">
          <Accordion
            type="multiple"
            value={collapsed ? [] : openSections}
            onValueChange={setOpenSections}
            className="w-full space-y-1"
          >
            {sidebarSections.map((section) => {
              // Overview section is always visible without collapsible
              if (!section.label || section.id === 'overview') {
                return (
                  <div key={section.id} className="space-y-1 mb-2">
                    {section.items.map((item) => (
                      <SidebarItem key={item.id} item={item} />
                    ))}
                  </div>
                )
              }

              // Other sections are collapsible
              return (
                <AccordionItem key={section.id} value={section.id} className="border-0">
                  <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-[hsl(var(--muted))] rounded-xl text-sm font-medium text-[hsl(var(--foreground))] data-[state=open]:bg-[hsl(var(--muted))]">
                    {!collapsed && <span>{section.label}</span>}
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-2 px-0">
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <SidebarItem key={item.id} item={item} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </ScrollArea>
      </div>
    </div>
  )
}

