'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContentCard } from '@/components/layout/ContentCard';
import { Calendar, Lock, Users, Globe, Edit, TrendingUp, Trophy, Target, Award, Palette } from 'lucide-react';
import { StreakCalendar } from '@/components/profile/StreakCalendar';
import { AchievementsShowcase } from '@/components/profile/AchievementsShowcase';
import { PerformanceChart, StrengthAreasChart } from '@/components/profile/AnalyticsCharts';
import { PrivateLeaguesAnalytics } from '@/components/profile/PrivateLeaguesAnalytics';
import { ProfileCustomizeTab } from '@/components/profile/ProfileCustomizeTab';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getDistributedColors } from '@/lib/colors';
import { textOn } from '@/lib/contrast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Generate random bright colors for stat cards
const statCardColors = getDistributedColors(3);

interface ProfileData {
  id: string;
  name: string | null;
  teamName: string | null;
  profileVisibility: string;
  profileColorScheme?: string;
  avatar?: string;
  subscriptionStatus?: string;
  createdAt: string;
  achievements: Array<{
    id: string;
    achievementKey: string;
    quizSlug: string | null;
    metadata: string | null;
    unlockedAt: string;
  }>;
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastQuizDate: string | null;
    streakStartDate: string | null;
  };
  recentCompletions: Array<{
    quizSlug: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
    timeSeconds: number | null;
  }>;
  analytics?: {
    strengthAreas: Array<{ category: string; score: number; total: number }>;
    performanceOverTime: Array<{ date: string; score: number; quizSlug: string }>;
    averageScore: number;
    totalQuizzes: number;
  };
  isOwnProfile: boolean;
}

// Avatar display helper
function getAvatarEmoji(avatarId?: string) {
  // If avatar is already an emoji, return it
  if (avatarId && /^[\p{Emoji}]$/u.test(avatarId)) {
    return avatarId;
  }
  // Otherwise return default
  return '👤';
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = String(params?.userId || '');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('achievements');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/profile/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Failed to load profile');
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setProfile(data);
        
        // Check premium status
        if (data.subscriptionStatus) {
          const premiumStatuses = ['ACTIVE', 'TRIALING', 'FREE_TRIAL'];
          setIsPremium(premiumStatuses.includes(data.subscriptionStatus));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const handleProfileUpdate = async () => {
    // Refetch profile after update
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/profile/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen pt-24">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !profile) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen pt-24">
          <div className="text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {error || 'Profile not found'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {error === 'Profile is private' || error === 'Profile is only visible to league members'
                ? 'This profile is not publicly visible.'
                : 'Unable to load this profile.'}
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const colorScheme = profile.profileColorScheme || 'blue';
  const avatarEmoji = getAvatarEmoji(profile.avatar);
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    pink: 'from-pink-500 to-pink-600',
  };
  const gradient = colorClasses[colorScheme] || colorClasses.blue;

  return (
    <PageLayout>
      <PageContainer maxWidth="6xl">
        {/* Bold Header - Matching Quizzes Page Style */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center mb-16"
        >
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="relative">
              <motion.div 
                className={`w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-5xl md:text-6xl shadow-2xl`}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {avatarEmoji}
              </motion.div>
              {profile.isOwnProfile && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/account?tab=account"
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all border-2 border-gray-200 dark:border-gray-700"
                    title="Edit profile"
                  >
                    <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </Link>
                </motion.div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white">
                  {profile.name || 'Anonymous User'}
                </h1>
                {profile.subscriptionStatus && ['ACTIVE', 'TRIALING', 'FREE_TRIAL'].includes(profile.subscriptionStatus) && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-full shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                    Premium
                  </motion.span>
                )}
              </div>
              {profile.teamName && (
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 font-medium">
                  {profile.teamName}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs - Larger and More Prominent */}
        <div className="flex justify-center mb-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center">
              <TabsList className="bg-gray-100 dark:bg-gray-800 inline-flex h-12 items-center justify-center rounded-full p-1.5 shadow-lg">
              <TabsTrigger value="achievements" className="rounded-full px-5 py-2.5 text-sm md:text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  <span>Achievements</span>
                </div>
              </TabsTrigger>
              {profile.analytics && (
                <TabsTrigger value="analytics" className="rounded-full px-5 py-2.5 text-sm md:text-base font-semibold">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Analytics</span>
                  </div>
                </TabsTrigger>
              )}
              <TabsTrigger value="activity" className="rounded-full px-5 py-2.5 text-sm md:text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  <span>Activity</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="leagues" className="rounded-full px-5 py-2.5 text-sm md:text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span>Private Leagues</span>
                </div>
              </TabsTrigger>
              {profile.isOwnProfile && isPremium && (
                <TabsTrigger value="customize" className="rounded-full px-5 py-2.5 text-sm md:text-base font-semibold">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    <span>Customize</span>
                  </div>
                </TabsTrigger>
              )}
              </TabsList>
            </div>

            <TabsContent value="achievements" className="mt-10">
              <ContentCard padding="xl" rounded="3xl" hoverAnimation={false}>
                <AchievementsShowcase
                  achievements={profile.achievements}
                  colorScheme={colorScheme}
                  isOwnProfile={profile.isOwnProfile}
                  isPremium={isPremium}
                  onUpdate={handleProfileUpdate}
                />
              </ContentCard>
            </TabsContent>

            {profile.analytics && (
              <TabsContent value="analytics" className="mt-10">
                <div className="space-y-8">
                  <ContentCard padding="xl" rounded="3xl" delay={0}>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Performance Over Time</h3>
                    <PerformanceChart data={profile.analytics.performanceOverTime} colorScheme={colorScheme} />
                  </ContentCard>
                  <ContentCard padding="xl" rounded="3xl" delay={0.1}>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Strength Areas</h3>
                    <StrengthAreasChart data={profile.analytics.strengthAreas} colorScheme={colorScheme} />
                  </ContentCard>
                </div>
              </TabsContent>
            )}

            <TabsContent value="activity" className="mt-10">
              <ContentCard padding="xl" rounded="3xl">
                <StreakCalendar
                  streak={profile.streak}
                  recentCompletions={profile.recentCompletions}
                  colorScheme={colorScheme}
                />
              </ContentCard>
            </TabsContent>

            <TabsContent value="leagues" className="mt-10">
              <ContentCard padding="xl" rounded="3xl">
                <PrivateLeaguesAnalytics
                  userId={profile.id}
                  colorScheme={colorScheme}
                />
              </ContentCard>
            </TabsContent>

            {profile.isOwnProfile && isPremium && (
              <TabsContent value="customize" className="mt-10">
                <ContentCard padding="xl" rounded="3xl">
                  <ProfileCustomizeTab
                    profile={{
                      id: profile.id,
                      name: profile.name,
                      teamName: profile.teamName,
                      profileVisibility: profile.profileVisibility,
                      profileColorScheme: profile.profileColorScheme,
                      avatar: profile.avatar,
                    }}
                    onUpdate={handleProfileUpdate}
                  />
                </ContentCard>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </PageContainer>
    </PageLayout>
  );
}
