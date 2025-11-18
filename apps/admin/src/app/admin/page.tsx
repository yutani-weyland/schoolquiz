import { Building2, Users, BookOpen } from 'lucide-react'

/**
 * Admin Overview Page
 * Displays key statistics and overview of the platform
 */
export default async function AdminOverviewPage() {
  // TODO: Fetch real statistics from database
  // For Phase 0, we'll use placeholder data

  const stats = [
    {
      title: 'Active Orgs (30d)',
      value: '4',
      icon: Building2,
      description: 'Organisations active in the last 30 days',
    },
    {
      title: 'Active Teachers (30d)',
      value: '6',
      icon: Users,
      description: 'Teachers active in the last 30 days',
    },
    {
      title: 'Quiz Attempts (30d)',
      value: '205',
      icon: BookOpen,
      description: 'Total quiz attempts in the last 30 days',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Admin Overview
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Platform statistics and key metrics
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className="group relative bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {stat.title}
                  </p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {stat.description}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 rounded-xl shadow-[inset_0_1px_0_0_rgba(59,130,246,0.1),0_1px_2px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_0_rgba(59,130,246,0.2),0_1px_2px_0_rgba(0,0,0,0.3)] group-hover:shadow-[inset_0_1px_0_0_rgba(59,130,246,0.15),0_2px_4px_0_rgba(0,0,0,0.1)] dark:group-hover:shadow-[inset_0_1px_0_0_rgba(59,130,246,0.25),0_2px_4px_0_rgba(0,0,0,0.4)] transition-all">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Placeholder for future content */}
      <div className="bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800 dark:to-gray-800/30 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Additional overview content will be added in later phases.
        </p>
      </div>
    </div>
  )
}

