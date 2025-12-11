'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Star, 
  Loader2, 
  Check, 
  X,
  AlertCircle,
  Palette
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  color: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  quizCount: number;
}

export function TeamsTab() {
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Create team state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#3B82F6');
  const [isCreating, setIsCreating] = useState(false);
  
  // Edit team state
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamColor, setEditTeamColor] = useState('#3B82F6');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Delete team state
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchTeams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/teams', {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch teams');
      }

      const data = await response.json();
      setTeams(data.teams || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchTeams();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status, session]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setError('Team name is required');
      return;
    }

    if (newTeamName.length > 50) {
      setError('Team name must be 50 characters or less');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/user/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newTeamName.trim(),
          color: newTeamColor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create team');
      }

      const data = await response.json();
      setTeams([...teams, data]);
      setNewTeamName('');
      setNewTeamColor('#3B82F6');
      setShowCreateForm(false);
      setSuccess(`Team "${data.name}" created successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (team: Team) => {
    setEditingTeamId(team.id);
    setEditTeamName(team.name);
    setEditTeamColor(team.color || '#3B82F6');
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setEditTeamName('');
    setEditTeamColor('#3B82F6');
  };

  const handleUpdateTeam = async (teamId: string) => {
    if (!editTeamName.trim()) {
      setError('Team name is required');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editTeamName.trim(),
          color: editTeamColor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update team');
      }

      const data = await response.json();
      setTeams(teams.map(t => t.id === teamId ? data : t));
      setEditingTeamId(null);
      setSuccess(`Team "${data.name}" updated successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update team');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSetDefault = async (teamId: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/user/teams/${teamId}/set-default`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set default team');
      }

      const data = await response.json();
      setTeams(teams.map(t => ({
        ...t,
        isDefault: t.id === teamId ? true : false,
      })));
      setSuccess(`Team "${data.name}" set as default!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to set default team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    setDeletingTeamId(teamId);
    setError(null);

    try {
      const response = await fetch(`/api/user/teams/${teamId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete team');
      }

      const deletedTeam = teams.find(t => t.id === teamId);
      setTeams(teams.filter(t => t.id !== teamId));
      setShowDeleteConfirm(null);
      setSuccess(`Team "${deletedTeam?.name}" deleted successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete team');
    } finally {
      setDeletingTeamId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const maxTeams = 10;
  const canCreateMore = teams.length < maxTeams;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Teams</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create and manage teams for different classes
          </p>
        </div>
        {canCreateMore && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Team</span>
          </button>
        )}
      </div>

      {/* Team Limit Info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {teams.length} of {maxTeams} teams
        </span>
        {!canCreateMore && (
          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Maximum teams reached
          </span>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-800 dark:text-green-200"
        >
          <Check className="w-5 h-5" />
          <span>{success}</span>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-800 dark:text-red-200"
        >
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Create Team Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Year 7A, Period 3"
                  maxLength={50}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isCreating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newTeamColor}
                    onChange={(e) => setNewTeamColor(e.target.value)}
                    className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                    disabled={isCreating}
                  />
                  <input
                    type="text"
                    value={newTeamColor}
                    onChange={(e) => setNewTeamColor(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isCreating}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTeam}
                  disabled={isCreating || !newTeamName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Create Team
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTeamName('');
                    setNewTeamColor('#3B82F6');
                    setError(null);
                  }}
                  disabled={isCreating}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teams List */}
      {teams.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No teams yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Create your first team to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              {editingTeamId === team.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                      maxLength={50}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={editTeamColor}
                      onChange={(e) => setEditTeamColor(e.target.value)}
                      className="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      disabled={isUpdating}
                    />
                    <input
                      type="text"
                      value={editTeamColor}
                      onChange={(e) => setEditTeamColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateTeam(team.id)}
                      disabled={isUpdating || !editTeamName.trim()}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isUpdating}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {team.color && (
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-gray-200 dark:border-gray-700"
                        style={{ backgroundColor: team.color }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {team.name}
                        </h3>
                        {team.isDefault && (
                          <span className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 fill-current" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {team.quizCount} quiz{team.quizCount !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!team.isDefault && (
                      <button
                        onClick={() => handleSetDefault(team.id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Set as default"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleStartEdit(team)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit team"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(team.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Confirmation */}
              {showDeleteConfirm === team.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                    Are you sure you want to delete "{team.name}"? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      disabled={deletingTeamId === team.id}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      {deletingTeamId === team.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      disabled={deletingTeamId === team.id}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
