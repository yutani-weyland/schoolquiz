'use client';

import { useState, useEffect } from 'react';
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

interface Organisation {
  id: string;
  name: string;
  emailDomain: string | null;
  maxSeats: number;
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
  gracePeriodEnd: Date | null;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

interface SeatInfo {
  total: number;
  used: number;
  available: number;
}

export default function OrganisationAdminPage() {
  const params = useParams();
  const organisationId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [seats, setSeats] = useState<SeatInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganisation();
  }, [organisationId]);

  const fetchOrganisation = async () => {
    try {
      const res = await fetch(`/api/organisation/${organisationId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setOrganisation(data.organisation);
      setSeats(data.seats);
    } catch (error) {
      console.error('Error fetching organisation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!organisation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Organisation not found</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle2 },
      TRIALING: { label: 'Trialing', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', icon: Clock },
      PAST_DUE: { label: 'Past Due', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400', icon: AlertCircle },
      EXPIRED: { label: 'Expired', className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', icon: XCircle },
      CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: XCircle },
    };
    return badges[status as keyof typeof badges] || badges.EXPIRED;
  };

  const statusBadge = getStatusBadge(organisation.status);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1419]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {organisation.name}
          </h1>
          {organisation.emailDomain && (
            <p className="text-gray-500 dark:text-gray-400">
              {organisation.emailDomain}
            </p>
          )}
        </div>

        {/* Status Banner */}
        {(organisation.status === 'PAST_DUE' || organisation.status === 'EXPIRED' || organisation.status === 'CANCELLED') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-200">
                  Subscription {organisation.status === 'EXPIRED' ? 'expired' : organisation.status.toLowerCase()}
                </p>
                {organisation.currentPeriodEnd && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Period ended: {new Date(organisation.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

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
            <OverviewTab organisation={organisation} seats={seats} />
          </Tabs.Content>

          <Tabs.Content value="members">
            <MembersTab organisationId={organisationId} />
          </Tabs.Content>

          <Tabs.Content value="groups">
            <GroupsTab organisationId={organisationId} />
          </Tabs.Content>

          <Tabs.Content value="leaderboards">
            <LeaderboardsTab organisationId={organisationId} />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}

function OverviewTab({ organisation, seats }: { organisation: Organisation; seats: SeatInfo | null }) {
  const statusBadge = getStatusBadge(organisation.status);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
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
            {seats?.used || 0} / {seats?.total || 0}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {seats?.available || 0} seats available
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
              {organisation.status === 'ACTIVE' || organisation.status === 'TRIALING' 
                ? `Renews ${new Date(organisation.currentPeriodEnd).toLocaleDateString()}`
                : `Expired ${new Date(organisation.currentPeriodEnd).toLocaleDateString()}`
              }
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
            {organisation.plan.includes('ANNUAL') ? 'Annual billing' : organisation.plan.includes('MONTHLY') ? 'Monthly billing' : 'Individual'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function MembersTab({ organisationId }: { organisationId: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [organisationId]);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/organisation/${organisationId}/members`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMembers(data.members);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading members...</div>;
  }

  // Flatten data for DataTable
  const tableData = members.map(member => ({
    id: member.id,
    name: member.user?.name || 'Unknown',
    email: member.user?.email || 'Unknown',
    role: member.role,
    status: member.status,
    seatAssigned: member.seatAssignedAt ? 'Yes' : 'No',
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Members</h2>
        <button
          onClick={() => setShowInviteModal(true)}
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

      {showInviteModal && (
        <InviteMemberModal
          organisationId={organisationId}
          onClose={() => {
            setShowInviteModal(false);
            fetchMembers();
          }}
        />
      )}
    </div>
  );
}

function GroupsTab({ organisationId }: { organisationId: string }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchMembers();
  }, [organisationId]);

  const fetchGroups = async () => {
    try {
      const res = await fetch(`/api/organisation/${organisationId}/groups`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/organisation/${organisationId}/members`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading groups...</div>;
  }

  const currentGroup = selectedGroup ? groups.find(g => g.id === selectedGroup) : null;
  const groupMembers = currentGroup?.members || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Groups</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      {selectedGroup ? (
        <GroupDetailView
          group={currentGroup!}
          members={members}
          groupMembers={groupMembers}
          onBack={() => setSelectedGroup(null)}
          onUpdate={fetchGroups}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedGroup(group.id)}
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
                {group.members?.length || 0} members
              </p>
            </motion.div>
          ))}
          {groups.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              No groups yet. Create your first group to organize members.
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateGroupModal
          organisationId={organisationId}
          onClose={() => {
            setShowCreateModal(false);
            fetchGroups();
          }}
        />
      )}
    </div>
  );
}

function GroupDetailView({
  group,
  members,
  groupMembers,
  onBack,
  onUpdate,
}: {
  group: any;
  members: any[];
  groupMembers: any[];
  onBack: () => void;
  onUpdate: () => void;
}) {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const groupMemberIds = new Set(groupMembers.map((gm: any) => gm.member.id));

  const handleAddMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/organisation/${group.organisationId}/groups/${group.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      if (!res.ok) throw new Error('Failed to add member');
      onUpdate();
      setShowAddMemberModal(false);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/organisation/${group.organisationId}/groups/${group.id}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove member');
      onUpdate();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  const availableMembers = members.filter(m => !groupMemberIds.has(m.id) && m.status === 'ACTIVE');

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        ← Back to groups
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{group.name}</h3>
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
              {group.type}
            </span>
          </div>
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Members
          </button>
        </div>

        {group.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">{group.description}</p>
        )}

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Members ({groupMembers.length})</h4>
          {groupMembers.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No members yet</p>
          ) : (
            <div className="space-y-2">
              {groupMembers.map((gm: any) => (
                <div
                  key={gm.member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {gm.member.user?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {gm.member.user?.email || 'Unknown'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(gm.member.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddMemberModal && (
        <AddMemberToGroupModal
          members={availableMembers}
          onAdd={handleAddMember}
          onClose={() => setShowAddMemberModal(false)}
        />
      )}
    </div>
  );
}

function CreateGroupModal({ organisationId, onClose }: { organisationId: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('CUSTOM');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/organisation/${organisationId}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, description }),
      });
      if (!res.ok) throw new Error('Failed to create');
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Group</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="HOUSE">House</option>
              <option value="FACULTY">Faculty</option>
              <option value="YEAR_GROUP">Year Group</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
            />
          </div>
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AddMemberToGroupModal({
  members,
  onAdd,
  onClose,
}: {
  members: any[];
  onAdd: (memberId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Members</h3>
        {members.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">All members are already in this group</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => onAdd(member.id)}
                className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-white">{member.user?.name || 'Unknown'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{member.user?.email || 'Unknown'}</p>
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function LeaderboardsTab({ organisationId }: { organisationId: string }) {
  const [leaderboards, setLeaderboards] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchLeaderboards();
    fetchGroups();
  }, [organisationId]);

  const fetchLeaderboards = async () => {
    try {
      const res = await fetch(`/api/organisation/${organisationId}/leaderboards`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLeaderboards(data.leaderboards || []);
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(`/api/organisation/${organisationId}/groups`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleDelete = async (leaderboardId: string) => {
    if (!confirm('Are you sure you want to delete this leaderboard?')) return;
    try {
      const res = await fetch(`/api/leaderboards/${leaderboardId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchLeaderboards();
    } catch (error) {
      console.error('Error deleting leaderboard:', error);
      alert('Failed to delete leaderboard');
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading leaderboards...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Leaderboards</h2>
        <button
          onClick={() => setShowCreateModal(true)}
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
                    {leaderboard.visibility === 'ORG_WIDE' ? 'Org-wide' : leaderboard.visibility === 'GROUP' ? 'Group' : 'Ad-hoc'}
                  </span>
                  {leaderboard.organisationGroup && (
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      {leaderboard.organisationGroup.name}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(leaderboard.id)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            {leaderboard.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{leaderboard.description}</p>
            )}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{leaderboard.members?.length || 0} members</span>
              <span>Created by {leaderboard.creator?.name || 'Unknown'}</span>
            </div>
          </motion.div>
        ))}
        {leaderboards.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            No leaderboards yet. Create your first leaderboard to start competitions.
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateLeaderboardModal
          organisationId={organisationId}
          groups={groups}
          onClose={() => {
            setShowCreateModal(false);
            fetchLeaderboards();
          }}
        />
      )}
    </div>
  );
}

function CreateLeaderboardModal({
  organisationId,
  groups,
  onClose,
}: {
  organisationId: string;
  groups: any[];
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('ORG_WIDE');
  const [organisationGroupId, setOrganisationGroupId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/organisation/${organisationId}/leaderboards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          visibility,
          organisationGroupId: visibility === 'GROUP' ? organisationGroupId : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create');
      onClose();
    } catch (error) {
      console.error('Error creating leaderboard:', error);
      alert('Failed to create leaderboard');
    } finally {
      setLoading(false);
    }
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
              onChange={(e) => setVisibility(e.target.value)}
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
                value={organisationGroupId}
                onChange={(e) => setOrganisationGroupId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Leaderboard'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

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

function InviteMemberModal({ organisationId, onClose }: { organisationId: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('TEACHER');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/organisation/${organisationId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) throw new Error('Failed to invite');
      onClose();
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invite Member</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="TEACHER">Teacher</option>
              <option value="ADMIN">Admin</option>
              <option value="BILLING_ADMIN">Billing Admin</option>
            </select>
          </div>
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}


