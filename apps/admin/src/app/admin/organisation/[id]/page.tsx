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
import { Spinner } from '@/components/ui/spinner';
import { DataTable } from '@/components/data-table';
import { Card, Badge, Button, PageHeader, Input, Select, Textarea } from '@/components/admin/ui';

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
        <div className="text-[hsl(var(--muted-foreground))]">Loading...</div>
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
    const statusMap: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
      ACTIVE: 'success',
      TRIALING: 'info',
      PAST_DUE: 'warning',
      EXPIRED: 'error',
      CANCELLED: 'default',
    };
    const iconMap: Record<string, typeof CheckCircle2> = {
      ACTIVE: CheckCircle2,
      TRIALING: Clock,
      PAST_DUE: AlertCircle,
      EXPIRED: XCircle,
      CANCELLED: XCircle,
    };
    return {
      variant: statusMap[status] || 'default',
      icon: iconMap[status] || XCircle,
      label: status === 'TRIALING' ? 'Trialing' : status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' '),
    };
  };

  const statusBadge = getStatusBadge(organisation.status);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title={organisation.name}
        description={organisation.emailDomain || undefined}
      />

      {/* Status Banner */}
      {(organisation.status === 'PAST_DUE' || organisation.status === 'EXPIRED' || organisation.status === 'CANCELLED') && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
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
        <Tabs.List className="flex border-b border-[hsl(var(--border))] mb-6">
          <Tabs.Trigger
            value="overview"
            className="px-4 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))]"
          >
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger
            value="members"
            className="px-4 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))]"
          >
            Members
          </Tabs.Trigger>
          <Tabs.Trigger
            value="groups"
            className="px-4 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))]"
          >
            Groups
          </Tabs.Trigger>
          <Tabs.Trigger
            value="leaderboards"
            className="px-4 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))]"
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
        >
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Licence Usage</h3>
              <Users className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            </div>
            <div className="text-2xl font-bold text-[hsl(var(--foreground))]">
              {seats?.used || 0} / {seats?.total || 0}
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              {seats?.available || 0} seats available
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Subscription Status</h3>
              <StatusIcon className="w-5 h-5" />
            </div>
            <Badge variant={statusBadge.variant} icon={StatusIcon}>
              {statusBadge.label}
            </Badge>
            {organisation.currentPeriodEnd && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                {organisation.status === 'ACTIVE' || organisation.status === 'TRIALING' 
                  ? `Renews ${new Date(organisation.currentPeriodEnd).toLocaleDateString()}`
                  : `Expired ${new Date(organisation.currentPeriodEnd).toLocaleDateString()}`
                }
              </p>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Plan</h3>
              <Building2 className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            </div>
            <div className="text-2xl font-bold text-[hsl(var(--foreground))]">
              {organisation.plan.replace('_', ' ')}
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              {organisation.plan.includes('ANNUAL') ? 'Annual billing' : organisation.plan.includes('MONTHLY') ? 'Monthly billing' : 'Individual'}
            </p>
          </Card>
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
    return <div className="text-[hsl(var(--muted-foreground))]">Loading members...</div>;
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
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Members</h2>
        <Button onClick={() => setShowInviteModal(true)}>
          <Plus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <DataTable
          data={tableData}
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'email', label: 'Email', sortable: true },
            { key: 'role', label: 'Role', sortable: true },
            { key: 'status', label: 'Status', sortable: true },
            { key: 'seatAssigned', label: 'Seat Assigned', sortable: true },
          ]}
        />
      </Card>

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
    return <div className="text-[hsl(var(--muted-foreground))]">Loading groups...</div>;
  }

  const currentGroup = selectedGroup ? groups.find(g => g.id === selectedGroup) : null;
  const groupMembers = currentGroup?.members || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Groups</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Create Group
        </Button>
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
            >
              <Card className="cursor-pointer hover:border-[hsl(var(--primary))] transition-colors" padding="sm">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[hsl(var(--foreground))]">{group.name}</h3>
                  <Badge variant="default">
                    {group.type}
                  </Badge>
                </div>
                {group.description && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">{group.description}</p>
                )}
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {group.members?.length || 0} members
                </p>
              </Card>
            </motion.div>
          ))}
          {groups.length === 0 && (
            <div className="col-span-full text-center py-12 text-[hsl(var(--muted-foreground))]">
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
        className="text-sm text-[hsl(var(--primary))] hover:underline"
      >
        ← Back to groups
      </button>

      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-1">{group.name}</h3>
            <Badge variant="default">
              {group.type}
            </Badge>
          </div>
          <Button onClick={() => setShowAddMemberModal(true)} size="sm">
            <Plus className="w-4 h-4" />
            Add Members
          </Button>
        </div>

        {group.description && (
          <p className="text-[hsl(var(--muted-foreground))] mb-4">{group.description}</p>
        )}

        <div>
          <h4 className="font-medium text-[hsl(var(--foreground))] mb-3">Members ({groupMembers.length})</h4>
          {groupMembers.length === 0 ? (
            <p className="text-[hsl(var(--muted-foreground))]">No members yet</p>
          ) : (
            <div className="space-y-2">
              {groupMembers.map((gm: any) => (
                <div
                  key={gm.member.id}
                  className="flex items-center justify-between p-3 bg-[hsl(var(--muted))] rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[hsl(var(--foreground))]">
                      {gm.member.user?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
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
      </Card>

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
        className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Create Group</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="HOUSE">House</option>
            <option value="FACULTY">Faculty</option>
            <option value="YEAR_GROUP">Year Group</option>
            <option value="CUSTOM">Custom</option>
          </Select>
          <Textarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading && <Spinner className="size-4 mr-2" />}
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
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
        className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Add Members</h3>
        {members.length === 0 ? (
          <p className="text-[hsl(var(--muted-foreground))]">All members are already in this group</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => onAdd(member.id)}
                className="w-full text-left p-3 bg-[hsl(var(--muted))] rounded-lg hover:bg-[hsl(var(--muted))]/80 transition-colors"
              >
                <p className="font-medium text-[hsl(var(--foreground))]">{member.user?.name || 'Unknown'}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{member.user?.email || 'Unknown'}</p>
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
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
    return <div className="text-[hsl(var(--muted-foreground))]">Loading leaderboards...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Leaderboards</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Create Leaderboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {leaderboards.map((leaderboard) => (
          <motion.div
            key={leaderboard.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-1">{leaderboard.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="info">
                      {leaderboard.visibility === 'ORG_WIDE' ? 'Org-wide' : leaderboard.visibility === 'GROUP' ? 'Group' : 'Ad-hoc'}
                    </Badge>
                    {leaderboard.organisationGroup && (
                      <Badge variant="default">
                        {leaderboard.organisationGroup.name}
                      </Badge>
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
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">{leaderboard.description}</p>
              )}
              <div className="flex items-center justify-between text-sm text-[hsl(var(--muted-foreground))]">
                <span>{leaderboard.members?.length || 0} members</span>
                <span>Created by {leaderboard.creator?.name || 'Unknown'}</span>
              </div>
            </Card>
          </motion.div>
        ))}
        {leaderboards.length === 0 && (
          <div className="col-span-full text-center py-12 text-[hsl(var(--muted-foreground))]">
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
        className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Create Leaderboard</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <Select
            label="Visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="ORG_WIDE">Organisation-wide</option>
            <option value="GROUP">Group-based</option>
          </Select>
          {visibility === 'GROUP' && (
            <Select
              label="Group"
              value={organisationGroupId}
              onChange={(e) => setOrganisationGroupId(e.target.value)}
              required
            >
              <option value="">Select a group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading && <Spinner className="size-4 mr-2" />}
              {loading ? 'Creating...' : 'Create Leaderboard'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}


function InviteMemberModal({ organisationId, onClose }: { organisationId: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('TEACHER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seats, setSeats] = useState<{ total: number; used: number; available: number } | null>(null);
  const [loadingSeats, setLoadingSeats] = useState(true);

  useEffect(() => {
    fetchSeats();
  }, []);

  const fetchSeats = async () => {
    try {
      const res = await fetch(`/api/organisation/${organisationId}`);
      if (res.ok) {
        const data = await res.json();
        setSeats(data.seats);
      }
    } catch (error) {
      console.error('Error fetching seats:', error);
    } finally {
      setLoadingSeats(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/organisation/${organisationId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to invite member');
      }
      // Success - close modal and refresh will happen via onClose callback
      onClose();
    } catch (error: any) {
      console.error('Error inviting member:', error);
      setError(error.message || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  // Check if role requires a seat (OWNER doesn't)
  const requiresSeat = role !== 'OWNER';
  const canInvite = !requiresSeat || !seats || seats.available > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Invite Member</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seat availability info */}
          {!loadingSeats && seats && (
            <div className={`p-3 rounded-lg border ${
              seats.available > 0 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            }`}>
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${
                  seats.available > 0 
                    ? 'text-blue-900 dark:text-blue-100' 
                    : 'text-amber-900 dark:text-amber-100'
                }`}>
                  Available Seats:
                </span>
                <span className={`font-semibold ${
                  seats.available > 0 
                    ? 'text-blue-900 dark:text-blue-100' 
                    : 'text-amber-900 dark:text-amber-100'
                }`}>
                  {seats.available} of {seats.total || '∞'} remaining
                </span>
              </div>
              {seats.available === 0 && requiresSeat && (
                <p className="text-xs mt-1 text-amber-700 dark:text-amber-300">
                  No seats available. Only OWNER role can be invited without a seat.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            required
          />
          <Select
            label="Role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setError('');
            }}
          >
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN">Admin</option>
            <option value="BILLING_ADMIN">Billing Admin</option>
          </Select>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !canInvite}
            >
              {loading && <Spinner className="size-4 mr-2" />}
              {loading ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}


