'use client';

import { KpiCard } from '@/components/admin/KpiCard';
import { Heatmap } from '@/components/admin/Heatmap';
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

// Mock data
const mockKpis = [
  {
    label: 'Active Quizzes',
    value: 38,
    delta: 6.2,
    hint: '7d',
    spark: [32, 33, 34, 35, 36, 37, 38]
  },
  {
    label: 'Question Bank Health',
    value: '91%',
    delta: 3.1,
    hint: 'published/total',
    spark: [88, 89, 89.5, 90, 90.5, 91]
  },
  {
    label: 'Avg Success Rate',
    value: '74.5%',
    delta: -1.2,
    hint: '28d global',
    ci: { lo: 72.1, hi: 76.9 },
    n: 1247,
    spark: [75.7, 75.5, 75.2, 74.8, 74.6, 74.5]
  },
  {
    label: 'Weekly Completions',
    value: 1847,
    delta: 12.3,
    hint: '7d',
    spark: [1600, 1650, 1700, 1750, 1800, 1847]
  },
  {
    label: 'Risk Rate',
    value: '2.1%',
    delta: -0.8,
    hint: 'SR<50% & n≥100',
    spark: [3.2, 3.0, 2.8, 2.5, 2.3, 2.1]
  },
  {
    label: 'Coverage Gaps',
    value: 3,
    delta: -2,
    hint: '<3 published Qs in 60d',
    spark: [8, 7, 6, 5, 4, 3]
  }
];

const mockHeatmapData = [
  {
    id: 'Geography',
    data: [
      { x: 'Easy', y: 85 },
      { x: 'Medium', y: 78 },
      { x: 'Hard', y: 65 },
      { x: 'Expert', y: 52 },
      { x: 'Master', y: 41 }
    ]
  },
  {
    id: 'Science',
    data: [
      { x: 'Easy', y: 82 },
      { x: 'Medium', y: 75 },
      { x: 'Hard', y: 68 },
      { x: 'Expert', y: 58 },
      { x: 'Master', y: 45 }
    ]
  },
  {
    id: 'History',
    data: [
      { x: 'Easy', y: 88 },
      { x: 'Medium', y: 81 },
      { x: 'Hard', y: 72 },
      { x: 'Expert', y: 61 },
      { x: 'Master', y: 48 }
    ]
  },
  {
    id: 'Math',
    data: [
      { x: 'Easy', y: 79 },
      { x: 'Medium', y: 71 },
      { x: 'Hard', y: 63 },
      { x: 'Expert', y: 54 },
      { x: 'Master', y: 42 }
    ]
  },
  {
    id: 'Literature',
    data: [
      { x: 'Easy', y: 86 },
      { x: 'Medium', y: 79 },
      { x: 'Hard', y: 69 },
      { x: 'Expert', y: 57 },
      { x: 'Master', y: 44 }
    ]
  }
];

const mockCategoryLeaderboard = [
  { category: 'Geography', quizzes: 45, exposures: 1247, weightedSr: 78.5, trend: 2.1, freshnessDays: 12 },
  { category: 'Science', quizzes: 38, exposures: 1089, weightedSr: 75.2, trend: -0.8, freshnessDays: 8 },
  { category: 'History', quizzes: 42, exposures: 1156, weightedSr: 77.8, trend: 1.5, freshnessDays: 15 },
  { category: 'Math', quizzes: 35, exposures: 987, weightedSr: 72.1, trend: -1.2, freshnessDays: 6 },
  { category: 'Literature', quizzes: 31, exposures: 892, weightedSr: 74.6, trend: 0.9, freshnessDays: 18 }
];

export default function InsightsPage() {
  const handleHeatmapClick = (category: string, difficulty: string) => {
    console.log(`Clicked: ${category} - ${difficulty}`);
    // TODO: Navigate to Question Bank with filters
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Insights
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Decision-grade KPIs and performance analytics</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {mockKpis.map((kpi, index) => (
          <KpiCard
            key={index}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            hint={kpi.hint}
            spark={kpi.spark}
            ci={kpi.ci}
            n={kpi.n}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Success Rate Heatmap */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Success Rate Heatmap
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Category × Difficulty
            </div>
          </div>
          <Heatmap data={mockHeatmapData} onCellClick={handleHeatmapClick} />
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Click any cell to filter Question Bank by category and difficulty
          </div>
        </div>

        {/* Category Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Category Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">Category</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">Quizzes</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">Exposures</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">Weighted SR</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">Trend</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">Freshness</th>
                </tr>
              </thead>
              <tbody>
                {mockCategoryLeaderboard.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">{row.category}</td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400 text-right">{row.quizzes}</td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400 text-right">{row.exposures.toLocaleString()}</td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400 text-right">{row.weightedSr.toFixed(1)}%</td>
                    <td className="py-3 px-2 text-sm text-right">
                      <span className={`flex items-center justify-end gap-1 ${
                        row.trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                        row.trend < 0 ? 'text-rose-600 dark:text-rose-400' : 
                        'text-gray-500 dark:text-gray-400'
                      }`}>
                        {row.trend > 0 ? '▲' : row.trend < 0 ? '▼' : '•'} {Math.abs(row.trend).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400 text-right">{row.freshnessDays}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Risk Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Risk Alerts
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div>
              <div className="font-medium text-amber-800 dark:text-amber-200">Low Success Rate Questions</div>
              <div className="text-sm text-amber-700 dark:text-amber-300">3 questions with SR &lt; 50% and n ≥ 100</div>
            </div>
            <button className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-sm rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50">
              Review
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div>
              <div className="font-medium text-blue-800 dark:text-blue-200">Coverage Gaps</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">3 categories with &lt; 3 published questions in 60d</div>
            </div>
            <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50">
              Fill Gaps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
