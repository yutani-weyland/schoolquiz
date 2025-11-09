'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Building2, Search, Bell, BellOff } from 'lucide-react';
// Import springs directly - inline for demo
const springs = {
  micro: { type: "spring" as const, stiffness: 380, damping: 28, mass: 0.8 },
};

// Mock data for prototyping
const mockLeaderboards = {
  orgWide: [
    {
      id: 'lb-1',
      name: 'School Championship',
      description: 'All-school competition for the year',
      visibility: 'ORG_WIDE' as const,
      organisation: { id: 'org-1', name: "St Augustine's College" },
      members: [
        { id: 'lm-1', userId: 'user-1', leftAt: null, muted: false },
        { id: 'lm-2', userId: 'user-2', leftAt: null, muted: false },
      ],
    },
    {
      id: 'lb-2',
      name: 'Term 1 Challenge',
      description: 'First term competition',
      visibility: 'ORG_WIDE' as const,
      organisation: { id: 'org-1', name: "St Augustine's College" },
      members: [
        { id: 'lm-3', userId: 'user-1', leftAt: null, muted: true },
      ],
    },
  ],
  group: [
    {
      id: 'lb-3',
      name: 'House Brennan Competition',
      description: 'House-based leaderboard',
      visibility: 'GROUP' as const,
      organisation: { id: 'org-1', name: "St Augustine's College" },
      organisationGroup: { id: 'group-1', name: 'House Brennan', type: 'HOUSE' },
      members: [
        { id: 'lm-4', userId: 'user-1', leftAt: null, muted: false },
      ],
    },
  ],
  adHoc: [
    {
      id: 'lb-4',
      name: 'Maths Teachers Network',
      description: 'Cross-school maths teacher competition',
      visibility: 'AD_HOC' as const,
      creator: { id: 'user-2', name: 'Sarah Johnson', email: 'sarah@example.com' },
      members: [
        { id: 'lm-5', userId: 'user-1', leftAt: null, muted: false },
        { id: 'lm-6', userId: 'user-2', leftAt: null, muted: false },
      ],
    },
  ],
};

export default function MyLeaderboardsDemoPage() {
  const [filter, setFilter] = useState<'all' | 'orgWide' | 'group' | 'adHoc'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allLeaderboards = [
    ...mockLeaderboards.orgWide.map(lb => ({ ...lb, section: 'orgWide' as const })),
    ...mockLeaderboards.group.map(lb => ({ ...lb, section: 'group' as const })),
    ...mockLeaderboards.adHoc.map(lb => ({ ...lb, section: 'adHoc' as const })),
  ];

  const filteredLeaderboards = filter === 'all'
    ? allLeaderboards
    : allLeaderboards.filter(lb => lb.section === filter);

  const displayLeaderboards = searchQuery
    ? filteredLeaderboards.filter(lb => 
        lb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lb.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredLeaderboards;

  const isMember = (leaderboard: any) => {
    return leaderboard.members.some((m: any) => !m.leftAt);
  };

  const isMuted = (leaderboard: any) => {
    return leaderboard.members.some((m: any) => m.muted && !m.leftAt);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Leaderboards
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Join competitions and track your progress
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leaderboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'orgWide', 'group', 'adHoc'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {f === 'all' ? 'All' : f === 'orgWide' ? 'Org-wide' : f === 'group' ? 'Group' : 'Ad-hoc'}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboards List */}
        {displayLeaderboards.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No leaderboards match your search' : 'No leaderboards available'}
            </p>
          </div>
        ) : (
          <>
            {filter === 'all' && (
              <>
                {mockLeaderboards.orgWide.length > 0 && (
                  <SectionHeader title="Organisation-wide" count={mockLeaderboards.orgWide.length} icon={Building2} />
                )}
                {mockLeaderboards.group.length > 0 && (
                  <SectionHeader title="Group Leaderboards" count={mockLeaderboards.group.length} icon={Users} />
                )}
                {mockLeaderboards.adHoc.length > 0 && (
                  <SectionHeader title="Ad-hoc Leaderboards" count={mockLeaderboards.adHoc.length} icon={Trophy} />
                )}
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayLeaderboards.map((leaderboard) => {
                const member = isMember(leaderboard);
                const muted = isMuted(leaderboard);

                return (
                  <LeaderboardCard
                    key={leaderboard.id}
                    leaderboard={leaderboard}
                    isMember={member}
                    isMuted={muted}
                    onJoin={() => alert('Join clicked - would join leaderboard')}
                    onLeave={(mute) => alert(mute ? 'Muted' : 'Left leaderboard')}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LeaderboardCard({
  leaderboard,
  isMember,
  isMuted,
  onJoin,
  onLeave,
}: {
  leaderboard: any;
  isMember: boolean;
  isMuted: boolean;
  onJoin: () => void;
  onLeave: (mute: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-lg border ${
        isMuted
          ? 'border-gray-200 dark:border-gray-700 opacity-60'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-500'
      } p-6`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            {leaderboard.name}
            {isMuted && <BellOff className="w-4 h-4 text-gray-400" />}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
              {leaderboard.visibility === 'ORG_WIDE' ? 'Org-wide' : leaderboard.visibility === 'GROUP' ? 'Group' : 'Ad-hoc'}
            </span>
            {leaderboard.organisationGroup && (
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                {leaderboard.organisationGroup.name}
              </span>
            )}
            {leaderboard.organisation && (
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                {leaderboard.organisation.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {leaderboard.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {leaderboard.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {leaderboard.members.filter((m: any) => !m.leftAt).length} members
        </span>

        <div className="flex gap-2">
          {isMember ? (
            <>
              {leaderboard.visibility === 'ORG_WIDE' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onLeave(true)}
                  transition={springs.micro}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex items-center gap-1"
                >
                  {isMuted ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onLeave(false)}
                transition={springs.micro}
                className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              >
                Leave
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onJoin}
              transition={springs.micro}
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
            >
              Join
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SectionHeader({ title, count, icon: Icon }: { title: string; count: number; icon: any }) {
  return (
    <div className="flex items-center gap-2 mt-8 mb-4">
      <Icon className="w-5 h-5 text-gray-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      <span className="text-sm text-gray-500 dark:text-gray-400">({count})</span>
    </div>
  );
}

