import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, Treemap, Cell } from 'recharts';

// Compact KPI Sparkline Card Component
interface SparklineCardProps {
  title: string;
  value: string | number;
  trend: number;
  trendLabel: string;
  data: number[];
  color: string;
  icon?: React.ReactNode;
}

export function SparklineCard({ title, value, trend, trendLabel, data, color, icon }: SparklineCardProps) {
  const trendColor = trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const trendIcon = trend >= 0 ? '↑' : '↓';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
        </div>
        <span className={`text-xs font-medium ${trendColor}`}>
          {trendIcon} {Math.abs(trend)}%
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</div>
      <div className="h-8 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.map((value, index) => ({ value, index }))}>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fill={color} 
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{trendLabel}</div>
    </div>
  );
}

// Top Categories Leaderboard Component
interface CategoryPerformance {
  rank: number;
  category: string;
  quizzes: number;
  avgSuccessRate: number;
  engagement: number;
  trend: number[];
}

interface CategoryLeaderboardProps {
  data: CategoryPerformance[];
}

export function CategoryLeaderboard({ data }: CategoryLeaderboardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Categories</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
              By Success Rate
            </button>
            <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
              By Engagement
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quizzes</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Success Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Engagement</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item) => (
              <tr key={item.category} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">#{item.rank}</span>
                    {item.rank === 1 && <span className="ml-2 text-yellow-500">👑</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.category}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.quizzes}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.avgSuccessRate}%</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.engagement.toLocaleString()} plays</span>
                </td>
                <td className="px-4 py-3">
                  <div className="h-6 w-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={item.trend.map((value, index) => ({ value, index }))}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Content Quality Heatmap Component
interface HeatmapData {
  category: string;
  difficulty: string;
  successRate: number;
  questionCount: number;
}

interface QualityHeatmapProps {
  data: HeatmapData[];
}

export function QualityHeatmap({ data }: QualityHeatmapProps) {
  const difficulties = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
  const categories = [...new Set(data.map(d => d.category))];

  const getHeatmapColor = (successRate: number) => {
    if (successRate >= 80) return '#10B981'; // Green
    if (successRate >= 60) return '#F59E0B'; // Yellow
    if (successRate >= 40) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getHeatmapEmoji = (successRate: number) => {
    if (successRate >= 80) return '🟩';
    if (successRate >= 60) return '🟨';
    if (successRate >= 40) return '🟧';
    return '🟥';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Content Quality Heatmap</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Success rate by category and difficulty</p>
      </div>
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2">Category</th>
                {difficulties.map(difficulty => (
                  <th key={difficulty} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2">
                    {difficulty}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {categories.map(category => (
                <tr key={category}>
                  <td className="py-2 text-sm font-medium text-gray-900 dark:text-white">{category}</td>
                  {difficulties.map(difficulty => {
                    const cellData = data.find(d => d.category === category && d.difficulty === difficulty);
                    const successRate = cellData?.successRate || 0;
                    const questionCount = cellData?.questionCount || 0;
                    
                    return (
                      <td key={difficulty} className="py-2 text-center">
                        <div 
                          className="inline-flex items-center justify-center w-16 h-8 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: getHeatmapColor(successRate) }}
                          title={`${successRate}% success rate (${questionCount} questions)`}
                        >
                          {successRate > 0 ? `${successRate}%` : '-'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>80%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>60-79%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>40-59%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>&lt;40%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Question Lifecycle Funnel Component
interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

interface LifecycleFunnelProps {
  data: FunnelStage[];
}

export function LifecycleFunnel({ data }: LifecycleFunnelProps) {
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Question Lifecycle</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Flow from draft to published</p>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {data.map((stage, index) => {
            const width = (stage.count / maxCount) * 100;
            
            return (
              <div key={stage.stage} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stage.stage}
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <div 
                      className="h-8 rounded transition-all duration-500 ease-out"
                      style={{ 
                        width: `${width}%`,
                        backgroundColor: stage.color,
                        opacity: 0.8
                      }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                      {stage.count} ({stage.percentage}%)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Question Bank Coverage Treemap Component
interface TreemapData {
  name: string;
  size: number;
  children?: TreemapData[];
  [key: string]: any;
}

interface QuestionBankTreemapProps {
  data: TreemapData[];
}

export function QuestionBankTreemap({ data }: QuestionBankTreemapProps) {
  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Question Bank Coverage</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Distribution by subject and category</p>
      </div>
      <div className="p-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey="size"
              aspectRatio={4/3}
              stroke="#fff"
              fill="#8884d8"
            >
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value} questions`,
                  props.payload.name
                ]}
              />
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Upcoming Events Widget Component
interface Event {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  suggestedQuizCount: number;
}

interface UpcomingEventsProps {
  events: Event[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Events</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Inspiration for next week's quizzes</p>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</span>
                  <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                    {event.category}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{event.date}</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{event.description}</div>
              </div>
              <button className="ml-3 px-3 py-1 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors">
                Add to Quiz
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            View all events →
          </button>
        </div>
      </div>
    </div>
  );
}
