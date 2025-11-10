'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { 
  Users, 
  Building2, 
  Trophy, 
  Settings,
  Plus,
  Mail,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { DataTable } from '@/components/data-table';

// Mock data for prototyping
const mockOrganisation = {
  id: 'org-1',
  name: "St Augustine's College",
  emailDomain: 'staug.nsw.edu.au',
  maxSeats: 30,
  plan: 'ORG_ANNUAL',
  status: 'ACTIVE',
  currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  gracePeriodEnd: null,
  owner: {
    id: 'user-1',
    name: 'John Smith',
    email: 'john.smith@staug.nsw.edu.au',
  },
};

const mockSeats = {
  total: 30,
  used: 23,
  available: 7,
};

const mockMembers = [
  {
    id: 'member-1',
    user: { id: 'user-1', name: 'John Smith', email: 'john.smith@staug.nsw.edu.au' },
    role: 'OWNER',
    status: 'ACTIVE',
    seatAssignedAt: new Date('2024-01-15'),
    seatReleasedAt: null,
  },
  {
    id: 'member-2',
    user: { id: 'user-2', name: 'Sarah Johnson', email: 'sarah.j@staug.nsw.edu.au' },
    role: 'ADMIN',
    status: 'ACTIVE',
    seatAssignedAt: new Date('2024-01-20'),
    seatReleasedAt: null,
  },
  {
    id: 'member-3',
    user: { id: 'user-3', name: 'Michael Chen', email: 'michael.chen@staug.nsw.edu.au' },
    role: 'TEACHER',
    status: 'ACTIVE',
    seatAssignedAt: new Date('2024-02-01'),
    seatReleasedAt: null,
  },
  {
    id: 'member-4',
    user: { id: 'user-4', name: 'Emma Wilson', email: 'emma.wilson@staug.nsw.edu.au' },
    role: 'TEACHER',
    status: 'PENDING',
    seatAssignedAt: null,
    seatReleasedAt: null,
  },
];

const mockGroups = [
  {
    id: 'group-1',
    name: 'House Brennan',
    type: 'HOUSE',
    description: 'Brennan House members',
    members: [{ member: { id: 'member-1', user: { name: 'John Smith' } } }],
    creator: { id: 'user-1', name: 'John Smith', email: 'john.smith@staug.nsw.edu.au' },
  },
  {
    id: 'group-2',
    name: 'Maths Faculty',
    type: 'FACULTY',
    description: 'Mathematics department',
    members: [{ member: { id: 'member-2', user: { name: 'Sarah Johnson' } } }],
    creator: { id: 'user-2', name: 'Sarah Johnson', email: 'sarah.j@staug.nsw.edu.au' },
  },
];

const mockLeaderboards = [
  {
    id: 'lb-1',
    name: 'School Championship',
    description: 'All-school competition for the year',
    visibility: 'ORG_WIDE',
    members: [{ id: 'lm-1', userId: 'user-1' }, { id: 'lm-2', userId: 'user-2' }],
    creator: { id: 'user-1', name: 'John Smith', email: 'john.smith@staug.nsw.edu.au' },
  },
  {
    id: 'lb-2',
    name: 'House Brennan Competition',
    description: 'House-based leaderboard',
    visibility: 'GROUP',
    organisationGroup: { id: 'group-1', name: 'House Brennan', type: 'HOUSE' },
    members: [{ id: 'lm-3', userId: 'user-1' }],
    creator: { id: 'user-1', name: 'John Smith', email: 'john.smith@staug.nsw.edu.au' },
  },
];

function getStatusBadge(status: string) {
  const badges = {
    ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle2 },
    TRIALING: { label: 'Trialing', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', icon: Clock },
    PAST_DUE: { label: 'Past Due', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400', icon: AlertCircle },
    EXPIRED: { label: 'Expired', className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', icon: XCircle },
    CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: XCircle },
  };
  return badges[status as keyof typeof badges] || badges.EXPIRED;
}

export default function OrganisationAdminPage() {
  const params = useParams();
  const organisationId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateLeaderboardModal, setShowCreateLeaderboardModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [leaderboards, setLeaderboards] = useState(mockLeaderboards);

  const statusBadge = getStatusBadge(mockOrganisation.status);
  const StatusIcon = statusBadge.icon;

  const handleCreateLeaderboard = (newLeaderboard: typeof mockLeaderboards[0]) => {
    setLeaderboards([...leaderboards, newLeaderboard]);
    setShowCreateLeaderboardModal(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {mockOrganisation.name}
          </h1>
          {mockOrganisation.emailDomain && (
            <p className="text-gray-500 dark:text-gray-400">
              {mockOrganisation.emailDomain}
            </p>
          )}
        </div>

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <Tabs.Trigger
              value="overview"
              className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400"
            >
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger
              value="members"
              className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400"
            >
              Members
            </Tabs.Trigger>
            <Tabs.Trigger
              value="groups"
              className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400"
            >
              Groups
            </Tabs.Trigger>
            <Tabs.Trigger
              value="leaderboards"
              className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400"
            >
              Leaderboards
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="overview">
            <OverviewTab organisation={mockOrganisation} seats={mockSeats} />
          </Tabs.Content>

          <Tabs.Content value="members">
            <MembersTab 
              members={mockMembers}
              onInvite={() => setShowInviteModal(true)}
            />
          </Tabs.Content>

          <Tabs.Content value="groups">
            <GroupsTab 
              groups={mockGroups}
              members={mockMembers}
              selectedGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
              onCreateGroup={() => setShowCreateGroupModal(true)}
            />
          </Tabs.Content>

          <Tabs.Content value="leaderboards">
            <LeaderboardsTab 
              leaderboards={leaderboards}
              groups={mockGroups}
              onCreateLeaderboard={() => setShowCreateLeaderboardModal(true)}
              onDeleteLeaderboard={(id) => setLeaderboards(leaderboards.filter(lb => lb.id !== id))}
            />
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Modals */}
      {showInviteModal && (
        <InviteMemberModal onClose={() => setShowInviteModal(false)} />
      )}
      {showCreateGroupModal && (
        <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} />
      )}
      {showCreateLeaderboardModal && (
        <CreateLeaderboardModal 
          groups={mockGroups}
          onCreate={(leaderboard) => handleCreateLeaderboard(leaderboard)}
          onClose={() => setShowCreateLeaderboardModal(false)} 
        />
      )}
    </div>
  );
}

function OverviewTab({ organisation, seats }: { organisation: typeof mockOrganisation; seats: typeof mockSeats }) {
  const statusBadge = getStatusBadge(organisation.status);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Licence Usage</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {seats.used} / {seats.total}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {seats.available} seats available
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription Status</h3>
            <StatusIcon className={`w-5 h-5 ${statusBadge.className.split(' ')[1]}`} />
          </div>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
            {statusBadge.label}
          </div>
          {organisation.currentPeriodEnd && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Renews {organisation.currentPeriodEnd.toLocaleDateString()}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan</h3>
            <Building2 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {organisation.plan.replace('_', ' ')}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Annual billing
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function MembersTab({ members, onInvite }: { members: typeof mockMembers; onInvite: () => void }) {
  const tableData = members.map(member => ({
    id: member.id,
    name: member.user.name,
    email: member.user.email,
    role: member.role,
    status: member.status,
    seatAssigned: member.seatAssignedAt ? 'Yes' : 'No',
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Members</h2>
        <button
          onClick={onInvite}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <DataTable
          data={tableData}
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'email', label: 'Email', sortable: true },
            { key: 'role', label: 'Role', sortable: true },
            { key: 'status', label: 'Status', sortable: true },
            { key: 'seatAssigned', label: 'Seat', sortable: true },
          ]}
        />
      </div>
    </div>
  );
}

function GroupsTab({ 
  groups, 
  members, 
  selectedGroup, 
  onSelectGroup, 
  onCreateGroup 
}: { 
  groups: typeof mockGroups; 
  members: typeof mockMembers;
  selectedGroup: string | null;
  onSelectGroup: (id: string | null) => void;
  onCreateGroup: () => void;
}) {
  const currentGroup = selectedGroup ? groups.find(g => g.id === selectedGroup) : null;

  if (selectedGroup && currentGroup) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => onSelectGroup(null)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to groups
        </button>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{currentGroup.name}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{currentGroup.description}</p>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Members ({currentGroup.members.length})</h4>
            {currentGroup.members.map((gm: any) => (
              <div key={gm.member.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-2">
                <p className="font-medium text-gray-900 dark:text-white">{gm.member.user.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Groups</h2>
        <button
          onClick={onCreateGroup}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelectGroup(group.id)}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:border-blue-500 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                {group.type}
              </span>
            </div>
            {group.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{group.description}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {group.members.length} members
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardsTab({ 
  leaderboards, 
  groups, 
  onCreateLeaderboard,
  onDeleteLeaderboard 
}: { 
  leaderboards: typeof mockLeaderboards; 
  groups: typeof mockGroups;
  onCreateLeaderboard: () => void;
  onDeleteLeaderboard: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Leaderboards</h2>
        <button
          onClick={onCreateLeaderboard}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Leaderboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {leaderboards.map((leaderboard) => (
          <motion.div
            key={leaderboard.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{leaderboard.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                    {leaderboard.visibility === 'ORG_WIDE' ? 'Org-wide' : 'Group'}
                  </span>
                  {leaderboard.organisationGroup && (
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      {leaderboard.organisationGroup.name}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this leaderboard?')) {
                    onDeleteLeaderboard(leaderboard.id);
                  }
                }}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                title="Delete leaderboard"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            {leaderboard.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{leaderboard.description}</p>
            )}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{leaderboard.members.length} members</span>
              <span>Created by {leaderboard.creator.name}</span>
            </div>
          </motion.div>
        ))}
        {leaderboards.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            No leaderboards yet. Create your first leaderboard to start competitions.
          </div>
        )}
      </div>
    </div>
  );
}

function InviteMemberModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invite Member</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="teacher@staug.nsw.edu.au"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Teacher</option>
              <option>Admin</option>
              <option>Billing Admin</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium"
            >
              Send Invite
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Group</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              placeholder="House Murray"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>House</option>
              <option>Faculty</option>
              <option>Year Group</option>
              <option>Custom</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium"
            >
              Create Group
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CreateLeaderboardModal({ 
  groups, 
  onCreate, 
  onClose 
}: { 
  groups: typeof mockGroups; 
  onCreate: (leaderboard: typeof mockLeaderboards[0]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'ORG_WIDE' | 'GROUP'>('ORG_WIDE');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    const newLeaderboard: typeof mockLeaderboards[0] = {
      id: `lb-${Date.now()}`,
      name,
      description: description || '',
      visibility,
      organisationGroup: visibility === 'GROUP' && selectedGroup
        ? { id: selectedGroup.id, name: selectedGroup.name, type: selectedGroup.type }
        : undefined,
      members: [],
      creator: { id: 'user-1', name: 'John Smith', email: 'john.smith@staug.nsw.edu.au' },
    };

    onCreate(newLeaderboard);
    setName('');
    setDescription('');
    setVisibility('ORG_WIDE');
    setSelectedGroupId('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Leaderboard</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="School Championship"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="All-school competition for the year"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => {
                setVisibility(e.target.value as 'ORG_WIDE' | 'GROUP');
                if (e.target.value === 'ORG_WIDE') setSelectedGroupId('');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="ORG_WIDE">Organisation-wide</option>
              <option value="GROUP">Group-based</option>
            </select>
          </div>
          {visibility === 'GROUP' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Group
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required={visibility === 'GROUP'}
              >
                <option value="">Select a group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium"
            >
              Create Leaderboard
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

