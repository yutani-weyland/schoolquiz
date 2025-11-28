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
  FileText,
} from 'lucide-react';
import { DraftIndicator } from './DraftIndicator';

import { usePermission } from '@/hooks/usePermission';
import { type Action, type Resource } from '@/lib/permissions';

type Section = 'overview' | 'management' | 'content' | 'operations';

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section: Section;
  permission?: { action: Action; resource: Resource };
}

const sidebarItems: SidebarItem[] = [
  { id: 'overview', label: 'Overview', href: '/admin', icon: Home, section: 'overview' },
  { id: 'organisations', label: 'Organisations', href: '/admin/organisations', icon: Building2, section: 'management', permission: { action: 'read', resource: 'organisation' } },
  { id: 'users', label: 'Users', href: '/admin/users', icon: Users, section: 'management', permission: { action: 'read', resource: 'user' } },
  { id: 'quizzes', label: 'Quizzes', href: '/admin/quizzes', icon: BookOpen, section: 'content', permission: { action: 'read', resource: 'quiz' } },
  { id: 'drafts', label: 'Drafts', href: '/admin/drafts', icon: FileText, section: 'content', permission: { action: 'create', resource: 'quiz' } },
  { id: 'achievements', label: 'Achievements', href: '/admin/achievements', icon: Target, section: 'content', permission: { action: 'manage', resource: 'quiz' } },
  { id: 'question-submissions', label: "People's Round Submissions", href: '/admin/questions/submissions', icon: MessageSquare, section: 'content', permission: { action: 'manage', resource: 'quiz' } },
  { id: 'scheduling', label: 'Scheduling', href: '/admin/scheduling', icon: Calendar, section: 'operations', permission: { action: 'manage', resource: 'quiz' } },
  { id: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: BarChart3, section: 'operations', permission: { action: 'read', resource: 'analytics' } },
  { id: 'billing', label: 'Billing', href: '/admin/billing', icon: CreditCard, section: 'operations', permission: { action: 'read', resource: 'billing' } },
  { id: 'support', label: 'Support', href: '/admin/support', icon: HelpCircle, section: 'operations', permission: { action: 'read', resource: 'system' } },
  { id: 'system', label: 'System', href: '/admin/system', icon: Settings, section: 'operations', permission: { action: 'manage', resource: 'system' } },
];

const sectionLabels: Record<Section, string> = {
  overview: '',
  management: 'Management',
  content: 'Content',
  operations: 'Operations',
};

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

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [environment, setEnvironment] = useState<'DEV' | 'STAGE' | 'PROD' | null>(null);
  const pathname = usePathname();
  const { can } = usePermission();

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      setCollapsed(JSON.parse(saved));
    }
    // Get environment
    setEnvironment(getEnvironment());
  }, []);

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed));
  };

  // Filter items based on permissions
  const visibleItems = sidebarItems.filter(item => {
    if (!item.permission) return true; // Always show if no permission required (e.g. Overview)
    return can(item.permission.action, item.permission.resource);
  });

  // Group items by section
  const groupedItems = visibleItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<Section, SidebarItem[]>);

  // Check if any item in a section is active
  const isSectionActive = (section: Section) => {
    return groupedItems[section]?.some(item => {
      if (item.href === '/admin') {
        return pathname === '/admin';
      }
      return pathname?.startsWith(item.href);
    }) || false;
  };

  const SidebarItem = ({ item }: { item: SidebarItem }) => {
    const Icon = item.icon;
    const isActive = item.href === '/admin'
      ? pathname === '/admin'
      : pathname?.startsWith(item.href);

    const content = (
      <Link
        href={item.href}
        className={`relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
          ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
          : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
          }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="break-words">{item.label}</span>
            {item.id === 'drafts' && (
              <DraftIndicator type="all" showCount linkToDrafts={false} />
            )}
          </div>
        )}
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

  const SectionHeader = ({ section }: { section: Section }) => {
    if (section === 'overview' || !sectionLabels[section]) return null;
    const isActive = isSectionActive(section);

    return (
      <div className={`px-3 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider ${isActive ? 'text-[hsl(var(--foreground))]' : ''
        }`}>
        {sectionLabels[section]}
      </div>
    );
  };

  return (
    <div className={`bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] transition-all duration-200 ${collapsed ? 'w-20' : 'w-[280px]'
      }`}>
      <div className="sticky top-0 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          {!collapsed ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="text-lg font-semibold text-[hsl(var(--foreground))]">
                The School Quiz Admin
              </div>
              {environment && (
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${environment === 'DEV'
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
            <div className="text-lg font-semibold text-[hsl(var(--foreground))] mx-auto">
              SQ
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            className="p-2 rounded-xl hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-all duration-200"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-4">
            {/* Overview (ungrouped) */}
            {groupedItems.overview && groupedItems.overview.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}

            {/* Management */}
            {groupedItems.management && groupedItems.management.length > 0 && (
              <div className="space-y-1">
                <SectionHeader section="management" />
                {groupedItems.management.map((item) => (
                  <SidebarItem key={item.id} item={item} />
                ))}
              </div>
            )}

            {/* Content */}
            {groupedItems.content && groupedItems.content.length > 0 && (
              <div className="space-y-1">
                <SectionHeader section="content" />
                {groupedItems.content.map((item) => (
                  <SidebarItem key={item.id} item={item} />
                ))}
              </div>
            )}

            {/* Operations */}
            {groupedItems.operations && groupedItems.operations.length > 0 && (
              <div className="space-y-1">
                <SectionHeader section="operations" />
                {groupedItems.operations.map((item) => (
                  <SidebarItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}