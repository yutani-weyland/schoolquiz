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
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive 
            ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/20 text-blue-700 dark:text-blue-300 shadow-[0_1px_3px_rgba(59,130,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(59,130,246,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)]' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-800/50 dark:hover:to-gray-800/30 hover:shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)]'
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
                className="bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg"
                side="right"
              >
                {item.label}
                <Tooltip.Arrow className="fill-slate-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      );
    }

    return content;
  };

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