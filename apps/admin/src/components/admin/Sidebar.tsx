'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  Home,
  Building2,
  Users,
  BookOpen,
  Calendar,
  BarChart3,
  CreditCard,
  HelpCircle,
  Settings,
  Target,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

const sidebarItems = [
  { id: 'overview', label: 'Overview', href: '/admin', icon: Home, section: 'main' as const },
  { id: 'organisations', label: 'Organisations', href: '/admin/organisations', icon: Building2, section: 'main' as const },
  { id: 'users', label: 'Users', href: '/admin/users', icon: Users, section: 'main' as const },
  { id: 'quizzes', label: 'Quizzes', href: '/admin/quizzes', icon: BookOpen, section: 'main' as const },
  { id: 'scheduling', label: 'Scheduling', href: '/admin/scheduling', icon: Calendar, section: 'main' as const },
  { id: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: BarChart3, section: 'main' as const },
  { id: 'billing', label: 'Billing', href: '/admin/billing', icon: CreditCard, section: 'main' as const },
  { id: 'support', label: 'Support', href: '/admin/support', icon: HelpCircle, section: 'main' as const },
  { id: 'system', label: 'System', href: '/admin/system', icon: Settings, section: 'main' as const },
  { id: 'achievements', label: 'Achievements', href: '/admin/achievements', icon: Target, section: 'main' as const },
  { id: 'question-submissions', label: 'Question Submissions', href: '/admin/questions/submissions', icon: MessageSquare, section: 'main' as const },
];

const sectionLabels = {
  main: '',
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed));
  };

  const groupedItems = sidebarItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof sidebarItems>);

  const SidebarItem = ({ item }: { item: typeof sidebarItems[0] }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    
    const content = (
      <Link
        href={item.href}
        className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive 
            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' 
            : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span className="break-words">{item.label}</span>}
      </Link>
    );

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
      );
    }

    return content;
  };

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
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}