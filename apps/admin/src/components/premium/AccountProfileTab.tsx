'use client';

import React, { useState, useEffect } from 'react';
import { IconUser, IconMail, IconBuilding, IconCheck, IconX, IconWorld, IconUsers, IconLock, IconEdit } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentCard } from '@/components/layout/ContentCard';
import { ReferralProgress } from './ReferralProgress';
import { useUserTier } from '@/hooks/useUserTier';

interface UserProfile {
  name: string;
  email: string;
  teamName: string;
  organisationName?: string;
  profileVisibility?: string;
  avatar?: string;
}

export function AccountProfileTab() {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Andrew',
    email: 'andrew@example.com',
    teamName: '',
    organisationName: undefined,
    profileVisibility: 'PUBLIC',
    avatar: '👤',
  });
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [profileVisibility, setProfileVisibility] = useState<string>('PUBLIC');
  const [avatar, setAvatar] = useState<string>('👤');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { isBasic, tier } = useUserTier();
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    // Fetch user profile on mount
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setTeamNameInput(data.teamName || '');
          setProfileVisibility(data.profileVisibility || 'PUBLIC');
          setAvatar(data.avatar || '👤');
          setUserId(data.id);
        }

        // Check premium status
        const subscriptionResponse = await fetch('/api/user/subscription', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          const premiumStatuses = ['ACTIVE', 'TRIALING', 'FREE_TRIAL'];
          setIsPremium(premiumStatuses.includes(subscriptionData.status));
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
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

  const handleSavePrivacy = async () => {
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
        body: JSON.stringify({ profileVisibility }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update privacy settings');
      }

      const data = await response.json();
      setProfile({ ...profile, profileVisibility: data.profileVisibility });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAvatar = async (newAvatar: string) => {
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
        body: JSON.stringify({ avatar: newAvatar }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update avatar');
      }

      const data = await response.json();
      setProfile({ ...profile, avatar: data.avatar });
      setAvatar(newAvatar);
      setShowEmojiPicker(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save avatar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setTeamNameInput(profile.teamName || '');
    setIsEditingTeamName(false);
    setError(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
          Account & Profile
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Manage your account settings and profile information
        </p>
      </motion.div>

      {/* Referral Progress - Basic Users Only */}
      {isBasic && (
        <ContentCard padding="xl" rounded="3xl" delay={0.05}>
          <ReferralProgress userId={userId} />
        </ContentCard>
      )}

      {/* Profile Card */}
      <ContentCard padding="xl" rounded="3xl" delay={0.1}>
        <div className="space-y-8">
          {/* Profile Picture - Clickable */}
          <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <motion.button
              onClick={() => setShowEmojiPicker(true)}
              className="relative group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-6xl shadow-xl border-4 border-white dark:border-gray-800 transition-all group-hover:shadow-2xl">
                {avatar || '👤'}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  Change
                </span>
              </div>
            </motion.button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {profile.name || 'User'}
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Click avatar to change emoji
              </p>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <IconUser className="w-4 h-4" />
              Display Name
            </label>
            <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white text-base">
              {profile.name || 'Not set'}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <IconMail className="w-4 h-4" />
              Email Address
            </label>
            <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white text-base">
              {profile.email}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Email cannot be changed
            </p>
          </div>

          {/* Team Name - Premium Feature */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <IconBuilding className="w-4 h-4" />
              Team Name
              <span className="text-xs text-blue-600 dark:text-blue-400 font-normal">(Premium)</span>
            </label>
            {isEditingTeamName ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={teamNameInput}
                  onChange={(e) => {
                    setTeamNameInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., Year 7 Maths, House Brennan"
                  maxLength={50}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-base"
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 px-2">{error}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveTeamName}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <IconCheck className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <IconX className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1 px-5 py-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white text-base">
                  {profile.teamName || (
                    <span className="text-gray-400 dark:text-gray-500 italic">
                      No team name set
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setTeamNameInput(profile.teamName || '');
                    setIsEditingTeamName(true);
                    setError(null);
                  }}
                  className="px-6 py-3.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2"
                >
                  <IconEdit className="w-4 h-4" />
                  {profile.teamName ? 'Edit' : 'Set Team Name'}
                </button>
              </div>
            )}
            {saveSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400 px-2 flex items-center gap-2">
                <IconCheck className="w-4 h-4" />
                Team name saved successfully
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
              Your team name appears in leaderboards and competitions. This is a premium feature.
            </p>
          </div>

          {/* Organisation Name (if available) */}
          {profile.organisationName && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <IconBuilding className="w-4 h-4" />
                Organisation
              </label>
              <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white text-base">
                {profile.organisationName}
              </div>
            </div>
          )}
        </div>
      </ContentCard>

      {/* Appearance Settings Card */}
      <ContentCard padding="xl" rounded="3xl" delay={0.2}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Profile Avatar
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Choose an emoji to represent your profile
            </p>
          </div>

          {/* Avatar Selector */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Click on your avatar above to change your profile emoji, or use the button below.
            </p>
            <button
              onClick={() => setShowEmojiPicker(true)}
              className="w-full px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:border-blue-600 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-3"
            >
              <span className="text-3xl">{avatar || '👤'}</span>
              <span className="text-base font-semibold">Change Avatar Emoji</span>
            </button>
          </div>

          {avatar !== profile.avatar && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleSaveAvatar(avatar)}
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <IconCheck className="w-4 h-4" />
                    Save Avatar
                  </>
                )}
              </button>
            </div>
          )}

          {saveSuccess && avatar === profile.avatar && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <IconCheck className="w-4 h-4" />
              Avatar saved successfully
            </p>
          )}
        </div>
      </ContentCard>

      {/* Privacy Settings Card */}
      <ContentCard padding="xl" rounded="3xl" delay={0.3}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Profile Privacy
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Control who can view your profile, achievements, and streaks
            </p>
          </div>

          <div className="space-y-4">
          <label className="flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
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
                <IconWorld className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span className="font-semibold text-gray-900 dark:text-white">Public</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Anyone can view your profile, achievements, and streaks
              </p>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
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
                <IconUsers className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span className="font-semibold text-gray-900 dark:text-white">League Members Only</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Only people in your private leagues can view your profile
              </p>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
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
                <IconLock className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span className="font-semibold text-gray-900 dark:text-white">Private</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Only you can view your profile
              </p>
            </div>
          </label>

          {profileVisibility !== profile.profileVisibility && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSavePrivacy}
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <IconCheck className="w-4 h-4" />
                    Save Privacy Settings
                  </>
                )}
              </button>
            </div>
          )}

          {saveSuccess && profileVisibility === profile.profileVisibility && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <IconCheck className="w-4 h-4" />
              Privacy settings saved successfully
            </p>
          )}
          </div>
        </div>
      </ContentCard>

      {/* Emoji Picker Modal */}
      <AnimatePresence>
        {showEmojiPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowEmojiPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div 
                className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl max-w-md w-full p-6 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Choose Profile Emoji
                  </h3>
                  <motion.button
                    onClick={() => setShowEmojiPicker(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </motion.button>
                </div>
                
                {/* Current Avatar Display */}
                <div className="flex items-center justify-center mb-6">
                  <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-6xl shadow-lg border-4 border-gray-200 dark:border-gray-700">
                    {avatar || '👤'}
                  </div>
                </div>
                
                {/* Emoji Input */}
                <div className="mb-4">
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
                    placeholder="Type or paste any emoji..."
                    maxLength={2}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-3xl text-center"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Type or paste any emoji
                  </p>
                </div>
                
                {/* Quick Emoji Suggestions */}
                <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 text-center">Quick picks:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['👤', '🎓', '🧑‍🏫', '🎯', '⭐', '🔥', '💡', '📚', '👑', '🏆', '🎖️', '💎', '🌟', '⚡', '🚀', '🎨', '🎮', '🎵', '🎬', '🏀', '⚽', '🎾', '🏐', '🎸', '🎹'].map((emoji) => (
                      <motion.button
                        key={emoji}
                        onClick={() => setAvatar(emoji)}
                        className={`
                          w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 
                          flex items-center justify-center text-2xl transition-all duration-200
                          ${avatar === emoji 
                            ? 'ring-2 ring-blue-500 scale-110 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                            : 'hover:scale-105 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }
                        `}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        title="Click to select"
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveAvatar(avatar)}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <IconCheck className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

