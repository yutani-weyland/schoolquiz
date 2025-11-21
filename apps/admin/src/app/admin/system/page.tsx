'use client'

import Link from 'next/link'
import { Settings, Flag, FileText, Server, Database, Activity, ArrowRight } from 'lucide-react'
import { Card, PageHeader } from '@/components/admin/ui'

export default function SystemPage() {
  const systemSections = [
    {
      id: 'feature-flags',
      title: 'Feature Flags',
      description: 'Manage feature flags and enable/disable features for specific organisations',
      href: '/admin/system/feature-flags',
      icon: Flag,
      color: 'blue',
    },
    {
      id: 'audit-log',
      title: 'Audit Log',
      description: 'View system audit logs and track all administrative actions',
      href: '/admin/system/audit-log',
      icon: FileText,
      color: 'green',
    },
  ]

  const systemStats = [
    { label: 'Database Status', value: 'Healthy', status: 'success' },
    { label: 'API Status', value: 'Operational', status: 'success' },
    { label: 'Cache Status', value: 'Connected', status: 'success' },
    { label: 'Queue Status', value: 'Running', status: 'success' },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        icon: 'text-[hsl(var(--primary))]',
        hover: 'hover:from-blue-50 hover:to-blue-100/50 dark:hover:from-blue-900/30 dark:hover:to-blue-900/20',
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/30',
        icon: 'text-green-600 dark:text-green-400',
        hover: 'hover:from-green-50 hover:to-green-100/50 dark:hover:from-green-900/30 dark:hover:to-green-900/20',
      },
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System"
        description="System configuration, feature flags, and audit logs"
      />

      {/* System Status */}
      <Card>
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-500" />
          System Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {systemStats.map((stat) => (
            <div
              key={stat.label}
              className="p-4 bg-[hsl(var(--muted))] rounded-xl border border-[hsl(var(--border))]"
            >
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{stat.label}</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stat.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* System Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systemSections.map((section) => {
          const Icon = section.icon
          const colors = getColorClasses(section.color)
          
          return (
            <Link key={section.id} href={section.href}>
              <Card className="group hover:border-[hsl(var(--primary))] transition-all duration-200 cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${colors.bg} rounded-xl`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <ArrowRight className="w-5 h-5 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors" />
                </div>
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                  {section.title}
                </h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {section.description}
                </p>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Links */}
      <Card>
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemSections.map((section) => {
            const Icon = section.icon
            return (
              <Link
                key={section.id}
                href={section.href}
                className="flex items-center gap-3 p-4 bg-[hsl(var(--muted))] rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/80 transition-all duration-200"
              >
                <Icon className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                  {section.title}
                </span>
                <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] ml-auto" />
              </Link>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

