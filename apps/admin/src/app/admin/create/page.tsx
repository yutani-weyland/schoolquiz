'use client';

import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Accordion from '@radix-ui/react-accordion';
import { KpiCard } from '@/components/admin/KpiCard';
import { Calendar, Plus, Search, Target, Users, Clock } from 'lucide-react';

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

const mockRounds = [
  { id: '1', category: 'Geography', questions: 5, completed: true },
  { id: '2', category: 'Science', questions: 3, completed: false },
  { id: '3', category: 'History', questions: 0, completed: false },
  { id: '4', category: 'Math', questions: 0, completed: false },
  { id: '5', category: 'Literature', questions: 0, completed: false },
];

const mockSuggestions = [
  {
    id: '1',
    title: 'Australia Day Quiz',
    date: '2024-01-26',
    tags: ['australia', 'history', 'culture'],
    action: 'insert_blurb' as const
  },
  {
    id: '2',
    title: 'Most Requested: Space Exploration',
    date: '2024-01-20',
    tags: ['science', 'space', 'popular'],
    action: 'suggest_category' as const
  }
];

export default function CreatePage() {
  const [activeTab, setActiveTab] = useState('build');
  const [selectedWeek, setSelectedWeek] = useState('Week 25');
  const [targetDifficulty, setTargetDifficulty] = useState('Mixed');
  const [audience, setAudience] = useState('Primary');

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Plan & Create</h1>
        <p className="text-gray-600 dark:text-gray-400">Create your weekly quiz with smart suggestions and quality insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Planner Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Quiz Planner
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Week
                </label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Week 25</option>
                  <option>Week 26</option>
                  <option>Week 27</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Difficulty
                </label>
                <select
                  value={targetDifficulty}
                  onChange={(e) => setTargetDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Mixed</option>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Primary</option>
                  <option>Secondary</option>
                  <option>Mixed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Builder */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700">
                <Tabs.Trigger
                  value="build"
                  className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  Build
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="preview"
                  className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  Preview
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="schedule"
                  className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  Schedule
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="build" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quiz Rounds</h3>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {mockRounds.filter(r => r.completed).length}/5 completed
                      </div>
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(mockRounds.filter(r => r.completed).length / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <Accordion.Root type="multiple" className="space-y-2">
                    {mockRounds.map((round) => (
                      <Accordion.Item
                        key={round.id}
                        value={round.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <Accordion.Trigger className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${round.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className="font-medium text-gray-900 dark:text-white">{round.category}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">({round.questions}/5 questions)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              <Search className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content className="px-4 pb-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Round content would go here with questions and answers.
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    ))}
                  </Accordion.Root>
                </div>
              </Tabs.Content>

              <Tabs.Content value="preview" className="p-6">
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Preview functionality coming soon</p>
                </div>
              </Tabs.Content>

              <Tabs.Content value="schedule" className="p-6">
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Scheduling functionality coming soon</p>
                </div>
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </div>

        {/* Right Sidebar - Suggestions */}
        <div className="space-y-6">
          {/* AU Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              AU Events
            </h3>
            <div className="space-y-3">
              {mockSuggestions.map((event) => (
                <div key={event.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">{event.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{event.date}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {event.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Insert blurb →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Questions in Bank</span>
                <span className="font-medium text-gray-900 dark:text-white">1,247</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Categories Covered</span>
                <span className="font-medium text-gray-900 dark:text-white">23/25</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Avg Success Rate</span>
                <span className="font-medium text-gray-900 dark:text-white">74.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
