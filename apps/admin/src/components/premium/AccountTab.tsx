'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, User, Building, Loader2, Check, Trash2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AccountTabProps {
  isPremium: boolean;
}

export function AccountTab({ isPremium }: AccountTabProps) {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    teamName: '',
  });
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setProfile({
            name: data.name || '',
            email: data.email || '',
            teamName: data.teamName || '',
          });
          setTeamNameInput(data.teamName || '');
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveTeamName = async () => {
    if (!teamNameInput.trim()) {
      setError('Team name cannot be empty');
      return;
    }

    if (teamNameInput.length > 50) {
      setError('Team name must be 50 characters or less');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamName: teamNameInput.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update team name');
      }

      const data = await response.json();
      setProfile({ ...profile, teamName: data.teamName });
      setIsEditingTeamName(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save team name');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      // Clear local storage and redirect
      localStorage.clear();
      sessionStorage.clear();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Display Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Display Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={profile.name}
            readOnly
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Display name cannot be changed
        </p>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            value={profile.email}
            readOnly
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Email cannot be changed
        </p>
      </div>

      {/* Team Name - Premium Only */}
      {isPremium && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Building className="w-4 h-4" />
            Team Name
          </label>
          {isEditingTeamName ? (
            <div className="space-y-3">
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={teamNameInput}
                  onChange={(e) => {
                    setTeamNameInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., Year 7 Maths, House Brennan"
                  maxLength={50}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full text-red-600 dark:text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
              <div className="flex gap-2">
                <motion.button
                  onClick={handleSaveTeamName}
                  disabled={isSaving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-3 px-6 rounded-full transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save
                    </>
                  )}
                </motion.button>
                <motion.button
                  onClick={() => {
                    setTeamNameInput(profile.teamName || '');
                    setIsEditingTeamName(false);
                    setError(null);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={profile.teamName || 'Not set'}
                  readOnly
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <motion.button
                onClick={() => setIsEditingTeamName(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-full transition-all"
              >
                Edit
              </motion.button>
            </div>
          )}
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full text-green-600 dark:text-green-400 text-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Team name updated successfully
            </motion.div>
          )}
        </div>
      )}

      {/* Delete Account Section */}
      <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-800">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Delete Account
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <motion.button
              onClick={() => setShowDeleteConfirm(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-full font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </motion.button>
          ) : (
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                    Are you sure?
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    This will permanently delete your account, quiz history, achievements, and all associated data. This action cannot be undone.
                  </p>
                </div>
              </motion.div>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full text-red-600 dark:text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
              <div className="flex gap-2">
                <motion.button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Yes, Delete Account
                    </>
                  )}
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setError(null);
                  }}
                  disabled={isDeleting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

