'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  Calendar, 
  Database, 
  FileText, 
  BarChart3, 
  Search, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  BookOpen,
  Lightbulb,
  Target
} from 'lucide-react';

const sidebarItems = [
  // Make
  { id: 'create', label: 'Plan & Create', href: '/admin/create', icon: Calendar, section: 'make' as const },
  { id: 'questions', label: 'Question Bank', href: '/admin/questions', icon: Database, section: 'make' as const },
  { id: 'templates', label: 'Templates', href: '/admin/templates', icon: FileText, section: 'make' as const },
  
  // Manage
  { id: 'quizzes', label: 'Quizzes', href: '/admin/quizzes', icon: BookOpen, section: 'manage' as const },
  { id: 'explore', label: 'Explore (AU events)', href: '/admin/explore', icon: Search, section: 'manage' as const },
  
  // Improve
  { id: 'insights', label: 'Insights', href: '/admin/insights', icon: BarChart3, section: 'improve' as const },
  { id: 'question-quality', label: 'Question Quality', href: '/admin/questions/analytics', icon: Target, section: 'improve' as const },
  { id: 'teacher-engagement', label: 'Teacher Engagement', href: '/admin/teachers/engagement', icon: Users, section: 'improve' as const },
  
  // System
  { id: 'achievements', label: 'Achievements', href: '/admin/achievements', icon: Target, section: 'system' as const },
  { id: 'settings', label: 'Settings', href: '/admin/settings', icon: Settings, section: 'system' as const },
];

const sectionLabels = {
  make: 'Make',
  manage: 'Manage', 
  improve: 'Improve',
  system: 'System'
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
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive 
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-2 border-blue-500' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
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
    <div className={`bg-slate-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 ${
      collapsed ? 'w-16' : 'w-60'
    }`}>
      <div className="sticky top-0 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && (
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              The School Quiz
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section} className="mb-6">
              {!collapsed && (
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {sectionLabels[section as keyof typeof sectionLabels]}
                </div>
              )}
              <div className="space-y-1">
                {items.map((item) => (
                  <SidebarItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}