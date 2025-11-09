'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Save, Check, Sparkles, Globe, Users, Lock } from 'lucide-react';

interface ProfileCustomizeTabProps {
  profile: {
    id: string;
    name: string | null;
    teamName: string | null;
    profileVisibility: string;
    profileColorScheme?: string;
    avatar?: string;
  };
  onUpdate: () => void;
}


export function ProfileCustomizeTab({ profile, onUpdate }: ProfileCustomizeTabProps) {
  const [profileColorScheme, setProfileColorScheme] = useState<string>(profile.profileColorScheme || 'blue');
  const [avatar, setAvatar] = useState<string>(profile.avatar || '👤');
  const [teamName, setTeamName] = useState<string>(profile.teamName || '');
  const [profileVisibility, setProfileVisibility] = useState<string>(profile.profileVisibility || 'PUBLIC');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
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
        body: JSON.stringify({
          profileColorScheme,
          avatar,
          teamName: teamName.trim(),
          profileVisibility,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onUpdate(); // Refresh profile data
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = 
    profileColorScheme !== (profile.profileColorScheme || 'blue') ||
    avatar !== (profile.avatar || '👤') ||
    teamName !== (profile.teamName || '') ||
    profileVisibility !== (profile.profileVisibility || 'PUBLIC');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
            Customize Profile
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Personalize your profile appearance and settings
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-full shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            Premium
          </span>
        </div>
      </div>

      {/* Color Scheme */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Color Scheme
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose a color theme for your profile
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {['blue', 'purple', 'green', 'orange', 'red', 'pink'].map((color) => {
            const colorClasses: Record<string, string> = {
              blue: 'bg-blue-500',
              purple: 'bg-purple-500',
              green: 'bg-green-500',
              orange: 'bg-orange-500',
              red: 'bg-red-500',
              pink: 'bg-pink-500',
            };
            return (
              <button
                key={color}
                onClick={() => setProfileColorScheme(color)}
                className={`
                  w-14 h-14 rounded-2xl ${colorClasses[color]} transition-all duration-200
                  ${profileColorScheme === color 
                    ? 'ring-4 ring-offset-2 ring-blue-500 scale-110 shadow-lg' 
                    : 'hover:scale-105 hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
                  }
                `}
                title={color.charAt(0).toUpperCase() + color.slice(1)}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Avatar - Emoji Picker */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Profile Emoji
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose any emoji to represent you
        </p>
        <div className="flex items-center gap-4">
          {/* Current Avatar Display */}
          <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-4xl border-2 border-gray-200 dark:border-gray-700">
            {avatar || '👤'}
          </div>
          
          {/* Emoji Input */}
          <div className="flex-1">
            <input
              type="text"
              value={avatar}
              onChange={(e) => {
                const value = e.target.value;
                // Allow single emoji or empty
                if (value === '' || /^[\p{Emoji}]$/u.test(value)) {
                  setAvatar(value);
                }
              }}
              placeholder="Choose an emoji..."
              maxLength={2}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-2xl text-center"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Type or paste any emoji
            </p>
          </div>
        </div>
        
        {/* Quick Emoji Suggestions */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Quick picks:</p>
          <div className="flex flex-wrap gap-2">
            {['👤', '🎓', '🧑‍🏫', '🎯', '⭐', '🔥', '💡', '📚', '👑', '🏆', '🎖️', '💎', '🌟', '⚡', '🚀', '🎨', '🎮', '🎵', '🎬', '🏀', '⚽', '🎾', '🏐', '🎸', '🎹'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => setAvatar(emoji)}
                className={`
                  w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 
                  flex items-center justify-center text-xl transition-all duration-200
                  ${avatar === emoji 
                    ? 'ring-2 ring-blue-500 scale-110 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                    : 'hover:scale-105 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
                title="Click to select"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Team Name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Team Name
        </h3>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="e.g., Year 7 Maths, House Brennan"
          maxLength={50}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Your team name appears in leaderboards and competitions
        </p>
      </motion.div>

      {/* Profile Visibility */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Profile Visibility
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Control who can view your profile, achievements, and streaks
        </p>
        <div className="space-y-3">
          <label className="flex items-start gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            style={{
              borderColor: profileVisibility === 'PUBLIC' ? '#2563eb' : 'transparent',
              backgroundColor: profileVisibility === 'PUBLIC' ? 'rgba(37, 99, 235, 0.05)' : undefined,
            }}
          >
            <input
              type="radio"
              name="profileVisibility"
              value="PUBLIC"
              checked={profileVisibility === 'PUBLIC'}
              onChange={(e) => setProfileVisibility(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span className="font-semibold text-gray-900 dark:text-white">Public</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Anyone can view your profile, achievements, and streaks
              </p>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            style={{
              borderColor: profileVisibility === 'LEAGUES_ONLY' ? '#2563eb' : 'transparent',
              backgroundColor: profileVisibility === 'LEAGUES_ONLY' ? 'rgba(37, 99, 235, 0.05)' : undefined,
            }}
          >
            <input
              type="radio"
              name="profileVisibility"
              value="LEAGUES_ONLY"
              checked={profileVisibility === 'LEAGUES_ONLY'}
              onChange={(e) => setProfileVisibility(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span className="font-semibold text-gray-900 dark:text-white">League Members Only</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Only people in your private leagues can view your profile
              </p>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            style={{
              borderColor: profileVisibility === 'PRIVATE' ? '#2563eb' : 'transparent',
              backgroundColor: profileVisibility === 'PRIVATE' ? 'rgba(37, 99, 235, 0.05)' : undefined,
            }}
          >
            <input
              type="radio"
              name="profileVisibility"
              value="PRIVATE"
              checked={profileVisibility === 'PRIVATE'}
              onChange={(e) => setProfileVisibility(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span className="font-semibold text-gray-900 dark:text-white">Private</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Only you can view your profile
              </p>
            </div>
          </label>
        </div>
      </motion.div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              {saveSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Changes saved successfully
                </p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

