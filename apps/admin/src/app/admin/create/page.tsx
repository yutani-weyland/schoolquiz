'use client';

import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Accordion from '@radix-ui/react-accordion';
import { KpiCard } from '@/components/admin/KpiCard';
import { Calendar, Plus, Search, Target, Users, Clock } from 'lucide-react';
import { PageHeader, Card, Select, Button } from '@/components/admin/ui';

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
    <div className="space-y-6">
      <PageHeader
        title="Plan & Create"
        description="Create your weekly quiz with smart suggestions and quality insights"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Planner Card */}
          <Card>
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Quiz Planner
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
              >
                <option>Week 25</option>
                <option>Week 26</option>
                <option>Week 27</option>
              </Select>
              <Select
                label="Target Difficulty"
                value={targetDifficulty}
                onChange={(e) => setTargetDifficulty(e.target.value)}
              >
                <option>Mixed</option>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </Select>
              <Select
                label="Audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                <option>Primary</option>
                <option>Secondary</option>
                <option>Mixed</option>
              </Select>
            </div>
          </Card>

          {/* Builder */}
          <Card className="p-0">
            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List className="flex border-b border-[hsl(var(--border))]">
                <Tabs.Trigger
                  value="build"
                  className="px-4 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))]"
                >
                  Build
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="preview"
                  className="px-4 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))]"
                >
                  Preview
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="schedule"
                  className="px-4 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))]"
                >
                  Schedule
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="build" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Quiz Rounds</h3>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">
                        {mockRounds.filter(r => r.completed).length}/5 completed
                      </div>
                      <div className="w-32 bg-[hsl(var(--muted))] rounded-full h-2">
                        <div 
                          className="bg-[hsl(var(--primary))] h-2 rounded-full transition-all duration-300"
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
                        className="border border-[hsl(var(--border))] rounded-lg"
                      >
                        <Accordion.Trigger className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-[hsl(var(--muted))] rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${round.completed ? 'bg-green-500' : 'bg-[hsl(var(--muted-foreground))]'}`} />
                            <span className="font-medium text-[hsl(var(--foreground))]">{round.category}</span>
                            <span className="text-sm text-[hsl(var(--muted-foreground))]">({round.questions}/5 questions)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                              <Search className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content className="px-4 pb-4">
                          <div className="text-sm text-[hsl(var(--muted-foreground))]">
                            Round content would go here with questions and answers.
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    ))}
                  </Accordion.Root>
                </div>
              </Tabs.Content>

              <Tabs.Content value="preview" className="p-6">
                <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Preview functionality coming soon</p>
                </div>
              </Tabs.Content>

              <Tabs.Content value="schedule" className="p-6">
                <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Scheduling functionality coming soon</p>
                </div>
              </Tabs.Content>
            </Tabs.Root>
          </Card>
        </div>

        {/* Right Sidebar - Suggestions */}
        <div className="space-y-6">
          {/* AU Events */}
          <Card padding="sm">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              AU Events
            </h3>
            <div className="space-y-3">
              {mockSuggestions.map((event) => (
                <div key={event.id} className="p-3 border border-[hsl(var(--border))] rounded-lg">
                  <div className="font-medium text-[hsl(var(--foreground))] text-sm">{event.title}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{event.date}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {event.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className="mt-2 text-xs text-[hsl(var(--primary))] hover:underline">
                    Insert blurb →
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card padding="sm">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Questions in Bank</span>
                <span className="font-medium text-[hsl(var(--foreground))]">1,247</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Categories Covered</span>
                <span className="font-medium text-[hsl(var(--foreground))]">23/25</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Avg Success Rate</span>
                <span className="font-medium text-[hsl(var(--foreground))]">74.5%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
