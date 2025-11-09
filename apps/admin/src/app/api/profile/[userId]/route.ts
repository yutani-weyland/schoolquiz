import { NextRequest, NextResponse } from 'next/server';
import { client } from '@schoolquiz/db';

// Mock profile data for andrew@example.com
const ANDREW_USER_ID = 'user-andrew-123';
const MOCK_ANDREW_PROFILE = {
  id: ANDREW_USER_ID,
  name: 'Andrew',
  teamName: 'Quiz Masters',
  profileVisibility: 'PUBLIC',
  profileColorScheme: 'blue',
  avatar: '👤',
  createdAt: new Date('2024-01-01'),
  achievements: [
    {
      id: 'ach-1',
      achievementKey: 'hail_caesar',
      quizSlug: '280',
      metadata: null,
      unlockedAt: new Date('2024-01-22T14:25:00'),
    },
    {
      id: 'ach-2',
      achievementKey: 'the_hook',
      quizSlug: '281',
      metadata: null,
      unlockedAt: new Date('2024-01-29T11:35:00'),
    },
    {
      id: 'ach-3',
      achievementKey: 'ace',
      quizSlug: '282',
      metadata: null,
      unlockedAt: new Date('2024-02-05T16:50:00'),
    },
    {
      id: 'ach-4',
      achievementKey: 'unstoppable',
      quizSlug: '282',
      metadata: null,
      unlockedAt: new Date('2024-02-05T16:55:00'),
    },
    {
      id: 'ach-5',
      achievementKey: 'flashback',
      quizSlug: '279',
      metadata: null,
      unlockedAt: new Date('2024-02-10T09:15:00'),
    },
  ],
  streak: {
    currentStreak: 3,
    longestStreak: 5,
    lastQuizDate: new Date('2024-02-05'),
    streakStartDate: new Date('2024-01-22'),
  },
  recentCompletions: [
    {
      quizSlug: '282',
      score: 23,
      totalQuestions: 25,
      completedAt: new Date('2024-02-05T16:45:00'),
      timeSeconds: 720, // 12 minutes
    },
    {
      quizSlug: '281',
      score: 21,
      totalQuestions: 25,
      completedAt: new Date('2024-01-29T11:30:00'),
      timeSeconds: 850, // 14 minutes
    },
    {
      quizSlug: '280',
      score: 24,
      totalQuestions: 25,
      completedAt: new Date('2024-01-22T14:20:00'),
      timeSeconds: 680, // 11 minutes
    },
    {
      quizSlug: '279',
      score: 25,
      totalQuestions: 25,
      completedAt: new Date('2024-01-15T10:40:00'),
      timeSeconds: 550, // 9 minutes (speed demon!)
    },
  ],
  analytics: {
    strengthAreas: [
      { category: 'Geography', score: 18, total: 20 },
      { category: 'Science', score: 16, total: 20 },
      { category: 'History', score: 14, total: 20 },
      { category: 'Literature', score: 12, total: 20 },
      { category: 'Math', score: 10, total: 20 },
    ],
    performanceOverTime: [
      { date: '2024-01-15', score: 25, quizSlug: '279' },
      { date: '2024-01-22', score: 24, quizSlug: '280' },
      { date: '2024-01-29', score: 21, quizSlug: '281' },
      { date: '2024-02-05', score: 23, quizSlug: '282' },
    ],
    averageScore: 23.25,
    totalQuizzes: 4,
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // Get current user ID from token (simplified - in production, verify JWT)
    // For now, we'll check if viewing own profile
    const currentUserId = token || null; // In production, decode JWT to get user ID
    
    // Return mock data for Andrew's profile
    if (userId === ANDREW_USER_ID) {
      const isOwnProfile = currentUserId === ANDREW_USER_ID;
      
      // Check subscription status for mock user
      const mockSubscriptionStatus = 'ACTIVE'; // Mock premium user
      
      return NextResponse.json({
        id: MOCK_ANDREW_PROFILE.id,
        name: MOCK_ANDREW_PROFILE.name,
        teamName: MOCK_ANDREW_PROFILE.teamName,
        profileVisibility: MOCK_ANDREW_PROFILE.profileVisibility,
        profileColorScheme: MOCK_ANDREW_PROFILE.profileColorScheme,
        avatar: MOCK_ANDREW_PROFILE.avatar,
        subscriptionStatus: mockSubscriptionStatus,
        createdAt: MOCK_ANDREW_PROFILE.createdAt.toISOString(),
        achievements: MOCK_ANDREW_PROFILE.achievements.map((a) => ({
          id: a.id,
          achievementKey: a.achievementKey,
          quizSlug: a.quizSlug,
          metadata: a.metadata,
          unlockedAt: a.unlockedAt.toISOString(),
        })),
        streak: {
          currentStreak: MOCK_ANDREW_PROFILE.streak.currentStreak,
          longestStreak: MOCK_ANDREW_PROFILE.streak.longestStreak,
          lastQuizDate: MOCK_ANDREW_PROFILE.streak.lastQuizDate.toISOString(),
          streakStartDate: MOCK_ANDREW_PROFILE.streak.streakStartDate.toISOString(),
        },
        recentCompletions: MOCK_ANDREW_PROFILE.recentCompletions.map((c) => ({
          quizSlug: c.quizSlug,
          score: c.score,
          totalQuestions: c.totalQuestions,
          completedAt: c.completedAt.toISOString(),
          timeSeconds: c.timeSeconds,
        })),
        analytics: MOCK_ANDREW_PROFILE.analytics,
        isOwnProfile,
      });
    }
    
    // For other users, try to fetch from database
    // Fetch user profile
    const user = await client.user.findUnique({
      where: { id: userId },
      include: {
        achievements: {
          orderBy: { unlockedAt: 'desc' },
        },
        streaks: true,
        quizCompletions: {
          orderBy: { completedAt: 'desc' },
          take: 10, // Recent 10 completions
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Privacy check
    const isOwnProfile = currentUserId === userId;
    const profileVisibility = user.profileVisibility || 'PUBLIC';

    if (!isOwnProfile) {
      if (profileVisibility === 'PRIVATE') {
        return NextResponse.json(
          { error: 'Profile is private' },
          { status: 403 }
        );
      }

      if (profileVisibility === 'LEAGUES_ONLY') {
        // Check if current user is in any shared private leagues
        if (!currentUserId) {
          return NextResponse.json(
            { error: 'Profile is only visible to league members' },
            { status: 403 }
          );
        }

        // Check if users share any leaderboards
        const sharedLeaderboards = await client.leaderboardMember.findFirst({
          where: {
            AND: [
              { userId: currentUserId },
              {
                leaderboard: {
                  members: {
                    some: {
                      userId: userId,
                    },
                  },
                },
              },
            ],
          },
        });

        if (!sharedLeaderboards) {
          return NextResponse.json(
            { error: 'Profile is only visible to league members' },
            { status: 403 }
          );
        }
      }
    }

    // Return public profile data
    return NextResponse.json({
      id: user.id,
      name: user.name,
      teamName: user.teamName,
      profileVisibility: user.profileVisibility,
      profileColorScheme: user.profileColorScheme,
      avatar: user.avatar,
      subscriptionStatus: user.subscriptionStatus,
      createdAt: user.createdAt,
      achievements: user.achievements.map((a) => ({
        id: a.id,
        achievementKey: a.achievementKey,
        quizSlug: a.quizSlug,
        metadata: a.metadata,
        unlockedAt: a.unlockedAt,
      })),
      streak: user.streaks[0] ? {
        currentStreak: user.streaks[0].currentStreak,
        longestStreak: user.streaks[0].longestStreak,
        lastQuizDate: user.streaks[0].lastQuizDate,
        streakStartDate: user.streaks[0].streakStartDate,
      } : {
        currentStreak: 0,
        longestStreak: 0,
        lastQuizDate: null,
        streakStartDate: null,
      },
      recentCompletions: user.quizCompletions.map((c) => ({
        quizSlug: c.quizSlug,
        score: c.score,
        totalQuestions: c.totalQuestions,
        completedAt: c.completedAt,
        timeSeconds: c.timeSeconds,
      })),
      isOwnProfile,
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    );
  }
}

