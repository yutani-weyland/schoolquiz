'use client'

import Link from 'next/link'
import { Settings, Flag, FileText, Server, Database, Activity, ArrowRight } from 'lucide-react'

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
        icon: 'text-blue-600 dark:text-blue-400',
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-500" />
          System
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          System configuration, feature flags, and audit logs
        </p>
      </div>

      {/* System Status */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-500" />
          System Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {systemStats.map((stat) => (
            <div
              key={stat.label}
              className="p-4 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/30 dark:to-gray-800/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stat.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                <p className="text-sm font-medium text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systemSections.map((section) => {
          const Icon = section.icon
          const colors = getColorClasses(section.color)
          
          return (
            <Link
              key={section.id}
              href={section.href}
              className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 ${colors.bg} rounded-xl`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {section.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {section.description}
              </p>
            </Link>
          )
        })}
      </div>

      {/* Quick Links */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemSections.map((section) => {
            const Icon = section.icon
            return (
              <Link
                key={section.id}
                href={section.href}
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/30 dark:to-gray-800/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200"
              >
                <Icon className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {section.title}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

