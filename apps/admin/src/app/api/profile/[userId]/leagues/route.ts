import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';

// Mock league performance data for Andrew
const ANDREW_USER_ID = 'user-andrew-123';
const MOCK_LEAGUE_DATA = {
  leagues: [
    {
      leaderboardId: 'league-1',
      leaderboardName: 'Year 7 Maths Champions',
      leaderboardType: 'GROUP',
      organisationName: 'St. Augustine\'s College',
      groupName: 'Year 7',
      userRank: 3,
      totalMembers: 24,
      userAverageScore: 87.5,
      leagueAverageScore: 72.3,
      userTotalQuizzes: 8,
      leagueTotalQuizzes: 192,
      performanceOverTime: [
        { date: '2024-01-15', userScore: 85, leagueAverage: 70, quizSlug: '279' },
        { date: '2024-01-22', userScore: 88, leagueAverage: 72, quizSlug: '280' },
        { date: '2024-01-29', userScore: 84, leagueAverage: 71, quizSlug: '281' },
        { date: '2024-02-05', userScore: 92, leagueAverage: 75, quizSlug: '282' },
      ],
    },
    {
      leaderboardId: 'league-2',
      leaderboardName: 'School Quiz Masters',
      leaderboardType: 'ORG_WIDE',
      organisationName: 'St. Augustine\'s College',
      userRank: 1,
      totalMembers: 156,
      userAverageScore: 91.2,
      leagueAverageScore: 68.5,
      userTotalQuizzes: 8,
      leagueTotalQuizzes: 1248,
      performanceOverTime: [
        { date: '2024-01-15', userScore: 100, leagueAverage: 65, quizSlug: '279' },
        { date: '2024-01-22', userScore: 96, leagueAverage: 68, quizSlug: '280' },
        { date: '2024-01-29', userScore: 84, leagueAverage: 70, quizSlug: '281' },
        { date: '2024-02-05', userScore: 92, leagueAverage: 71, quizSlug: '282' },
      ],
    },
    {
      leaderboardId: 'league-3',
      leaderboardName: 'Cross-School Challenge',
      leaderboardType: 'AD_HOC',
      userRank: 7,
      totalMembers: 45,
      userAverageScore: 82.3,
      leagueAverageScore: 79.1,
      userTotalQuizzes: 6,
      leagueTotalQuizzes: 270,
      performanceOverTime: [
        { date: '2024-01-22', userScore: 88, leagueAverage: 78, quizSlug: '280' },
        { date: '2024-01-29', userScore: 80, leagueAverage: 79, quizSlug: '281' },
        { date: '2024-02-05', userScore: 79, leagueAverage: 80, quizSlug: '282' },
      ],
    },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Return mock data for Andrew's profile
    if (userId === ANDREW_USER_ID) {
      return NextResponse.json(MOCK_LEAGUE_DATA);
    }

    // For other users, fetch from database
    // Get user's leaderboard memberships
    const leaderboardMemberships = await prisma.leaderboardMember.findMany({
      where: {
        userId: userId,
        leftAt: null,
      },
      include: {
        leaderboard: {
          include: {
            organisation: {
              select: {
                id: true,
                name: true,
              },
            },
            organisationGroup: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            members: {
              where: {
                leftAt: null,
              },
            },
          },
        },
      },
    });

    // Get user's quiz completions
    const userCompletions = await prisma.quizCompletion.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    // Calculate performance for each league
    // Optimize: Fetch all completions once instead of per-league (N+1 fix)
    const allMemberUserIds = new Set<string>()
    leaderboardMemberships.forEach(membership => {
      membership.leaderboard.members.forEach(m => allMemberUserIds.add(m.userId))
    })
    
    // Fetch all completions in one query
    const allCompletions = await prisma.quizCompletion.findMany({
      where: {
        userId: { in: Array.from(allMemberUserIds) },
      },
    })
    
    // Group completions by userId for efficient lookup
    const completionsByUserId = new Map<string, typeof allCompletions>()
    allCompletions.forEach(completion => {
      if (!completionsByUserId.has(completion.userId)) {
        completionsByUserId.set(completion.userId, [])
      }
      completionsByUserId.get(completion.userId)!.push(completion)
    })
    
    const leagues = await Promise.all(
      leaderboardMemberships.map(async (membership) => {
        const leaderboard = membership.leaderboard;
        
        // Get all members' completions for this leaderboard (from pre-fetched data)
        const memberUserIds = leaderboard.members.map(m => m.userId);
        const leagueCompletions = allCompletions.filter(c => memberUserIds.includes(c.userId))

        // Calculate user's average
        const userScores = userCompletions.map(c => (c.score / c.totalQuestions) * 100);
        const userAverage = userScores.length > 0
          ? userScores.reduce((sum, score) => sum + score, 0) / userScores.length
          : 0;

        // Calculate league average (using pre-fetched completions)
        const leagueScores = leagueCompletions.map(c => (c.score / c.totalQuestions) * 100);
        const leagueAverage = leagueScores.length > 0
          ? leagueScores.reduce((sum, score) => sum + score, 0) / leagueScores.length
          : 0;

        // Calculate rank (simplified - would need proper ranking logic)
        const userTotalScore = userCompletions.reduce((sum, c) => sum + c.score, 0);
        const memberScores = memberUserIds.map(memberId => {
          const memberCompletions = completionsByUserId.get(memberId) || []
          return memberCompletions.reduce((sum, c) => sum + c.score, 0);
        });
        const sortedScores = memberScores.sort((a, b) => b - a);
        const rank = sortedScores.findIndex(score => score <= userTotalScore) + 1;

        // Performance over time
        const performanceOverTime = userCompletions.map(completion => {
          const completionDate = completion.completedAt.toISOString().split('T')[0];
          const sameDateCompletions = leagueCompletions.filter(
            c => c.completedAt.toISOString().split('T')[0] === completionDate
          );
          const leagueAvg = sameDateCompletions.length > 0
            ? (sameDateCompletions.reduce((sum, c) => sum + (c.score / c.totalQuestions) * 100, 0) / sameDateCompletions.length)
            : 0;

          return {
            date: completionDate,
            userScore: (completion.score / completion.totalQuestions) * 100,
            leagueAverage: leagueAvg,
            quizSlug: completion.quizSlug,
          };
        });

        return {
          leaderboardId: leaderboard.id,
          leaderboardName: leaderboard.name,
          leaderboardType: leaderboard.visibility,
          organisationName: leaderboard.organisation?.name,
          groupName: leaderboard.organisationGroup?.name,
          userRank: rank,
          totalMembers: leaderboard.members.length,
          userAverageScore: userAverage,
          leagueAverageScore: leagueAverage,
          userTotalQuizzes: userCompletions.length,
          leagueTotalQuizzes: allCompletions.length,
          performanceOverTime: performanceOverTime.slice(-10), // Last 10 quizzes
        };
      })
    );

    return NextResponse.json({ leagues });
  } catch (error: any) {
    console.error('Error fetching league performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch league performance', details: error.message },
      { status: 500 }
    );
  }
}

