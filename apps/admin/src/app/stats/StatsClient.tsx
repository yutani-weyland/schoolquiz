'use client'

import { Suspense, use, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { TeamSelector } from '@/components/quiz/TeamSelector';
import { useTeams } from '@/hooks/useTeams';
// SummaryStats and StreakCards use Framer Motion but are critical for first paint
// Keep them loaded but consider lazy loading if bundle size becomes an issue
import { SummaryStats } from '@/components/stats/SummaryStats';
import { StreakCards } from '@/components/stats/StreakCards';

// Phase 3: Lazy load heavy libraries (Framer Motion, Recharts)
// These components are loaded only when needed, reducing initial bundle size by ~150KB+
const CategoryPerformance = dynamic(
    () => import('@/components/stats/CategoryPerformance').then(mod => ({ default: mod.CategoryPerformance })),
    {
        ssr: false, // Client-only (uses Recharts + Framer Motion)
        loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
    }
);

const StreakOverview = dynamic(
    () => import('@/components/stats/StreakOverview').then(mod => ({ default: mod.StreakOverview })),
    {
        ssr: false, // Client-only (uses Framer Motion)
        loading: () => <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
    }
);

const PerformanceChart = dynamic(
    () => import('@/components/stats/PerformanceChart').then(mod => ({ default: mod.PerformanceChart })),
    {
        ssr: false, // Client-only (uses Recharts + Framer Motion)
        loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
    }
);

const RecentAchievements = dynamic(
    () => import('@/components/stats/RecentAchievements').then(mod => ({ default: mod.RecentAchievements })),
    {
        ssr: false, // Client-only (uses Framer Motion + React Query)
        loading: () => <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
    }
);

interface StatsData {
    summary: {
        averageScore: number;
        totalQuestionsAttempted: number;
        totalQuizzesPlayed: number;
        totalCorrectAnswers: number;
        perfectScores: number;
    };
    streaks: {
        currentQuestionStreak: number;
        bestQuestionStreak: number;
        currentQuizStreak: number;
        bestQuizStreak: number;
    };
    categories: {
        strongest: Array<{ name: string; percentage: number; correct: number; total: number; quizzes: number }>;
        weakest: Array<{ name: string; percentage: number; correct: number; total: number; quizzes: number }>;
        all: Array<{ name: string; percentage: number; correct: number; total: number; quizzes: number }>;
    };
    weeklyStreak: Array<{ week: string; date: string; completed: boolean; completedAt?: string; quizSlug?: string | null }>;
    performanceOverTime: Array<{ date: string; score: number; quizSlug: string }>;
    comparisons: {
        public: {
            averageScore: number;
            totalUsers: number;
        };
        leagues: Array<{
            leagueId: string;
            leagueName: string;
            userAverage: number;
            leagueAverage: number;
            userRank: number;
            totalMembers: number;
        }>;
    };
    seasonStats: {
        quizzesPlayed: number;
        perfectScores: number;
        averageScore: number;
        longestStreakWeeks: number;
        currentStreakWeeks: number;
    } | null;
}

interface StatsClientProps {
    initialCriticalData?: Pick<StatsData, 'summary' | 'streaks' | 'categories' | 'weeklyStreak'> | null;
    deferredDataPromise?: Promise<Pick<StatsData, 'performanceOverTime' | 'comparisons' | 'seasonStats'> | null>;
    isPremium: boolean;
    // Legacy prop for backward compatibility
    initialData?: StatsData | null;
}

// Fetch function for React Query
// Note: This is called from a client component, so we use session cookie
async function fetchStats(teamId?: string | null): Promise<StatsData> {
    // If teamId is null, explicitly pass it to get personal stats (no team)
    // If teamId is undefined, don't pass it (all stats)
    // If teamId is a string, pass it to get that team's stats
    const url = teamId === null
        ? '/api/stats?teamId=null'
        : teamId
            ? `/api/stats?teamId=${encodeURIComponent(teamId)}`
            : '/api/stats'
    const response = await fetch(url, {
        credentials: 'include', // Send session cookie
    });

    if (!response.ok) {
        // For prototyping, return empty stats instead of throwing error
        if (response.status === 500 || response.status === 503) {
            console.warn('Stats API returned error, using empty stats for prototyping');
            return {
                summary: {
                    averageScore: 0,
                    totalQuestionsAttempted: 0,
                    totalQuizzesPlayed: 0,
                    totalCorrectAnswers: 0,
                    perfectScores: 0,
                },
                streaks: {
                    currentQuestionStreak: 0,
                    bestQuestionStreak: 0,
                    currentQuizStreak: 0,
                    bestQuizStreak: 0,
                },
                categories: {
                    strongest: [],
                    weakest: [],
                    all: [],
                },
                weeklyStreak: [],
                performanceOverTime: [],
                comparisons: {
                    public: {
                        averageScore: 0,
                        totalUsers: 0,
                    },
                    leagues: [],
                },
                seasonStats: null,
            };
        }

        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || `Failed to fetch stats: ${response.status}`;
        throw new Error(errorMessage);
    }

    return response.json();
}

// Component for deferred data (performance chart)
function DeferredStats({
    deferredDataPromise,
    userAverage
}: {
    deferredDataPromise: Promise<Pick<StatsData, 'performanceOverTime' | 'comparisons' | 'seasonStats'> | null>;
    userAverage: number;
}) {
    const deferredData = use(deferredDataPromise);

    if (!deferredData) return null;

    return (
        <>
            {/* Performance Over Time */}
            {deferredData.performanceOverTime && deferredData.performanceOverTime.length > 0 && (
                <PerformanceChart data={deferredData.performanceOverTime} />
            )}
        </>
    );
}

// Component for deferred achievements (loads after everything else)
function DeferredAchievements() {
    // Wait a bit to ensure critical stats are rendered first
    // This component will only render after Suspense resolves
    return <RecentAchievements />;
}

export function StatsClient({ initialCriticalData, deferredDataPromise, isPremium, initialData }: StatsClientProps) {
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
    const { teams, isLoading: teamsLoading } = useTeams()

    // Load selected team from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && isPremium) {
            const stored = localStorage.getItem('selectedTeamId')
            // Check if user explicitly selected "(no team)" - stored as 'null' string
            if (stored === 'null') {
                setSelectedTeamId(null)
            } else if (stored) {
                setSelectedTeamId(stored)
            } else if (teams.length > 0 && !teamsLoading) {
                // Auto-select default team if no team is selected and user hasn't explicitly chosen "(no team)"
                const defaultTeam = teams.find(t => t.isDefault) || teams[0]
                if (defaultTeam) {
                    setSelectedTeamId(defaultTeam.id)
                }
            }
        }
    }, [isPremium, teams, teamsLoading])

    // Store selected team in localStorage when it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (selectedTeamId === null) {
                // Store 'null' as string to indicate explicit "(no team)" selection
                localStorage.setItem('selectedTeamId', 'null')
            } else if (selectedTeamId) {
                localStorage.setItem('selectedTeamId', selectedTeamId)
            } else {
                localStorage.removeItem('selectedTeamId')
            }
        }
    }, [selectedTeamId])

    // Fetch stats with React Query (refetches when team changes)
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['stats', selectedTeamId],
        queryFn: () => fetchStats(selectedTeamId),
        enabled: true, // Always fetch (initial data is just for first paint)
        staleTime: 30000, // Consider data fresh for 30 seconds
        initialData: initialData || undefined, // Use initial data if available
    })

    // Use critical data for first paint (fast), then use React Query data
    const criticalStats = statsData || initialCriticalData || (initialData ? {
        summary: initialData.summary,
        streaks: initialData.streaks,
        categories: initialData.categories,
        weeklyStreak: initialData.weeklyStreak,
    } : null);

    // Legacy support: if only initialData is provided, use it
    const stats = statsData || initialData || (criticalStats ? {
        ...criticalStats,
        performanceOverTime: [],
        comparisons: { public: { averageScore: 0, totalUsers: 0 }, leagues: [] },
        seasonStats: null,
    } : null);

    if (!criticalStats || statsLoading) {
        return (
            <>
                <SiteHeader />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Loading stats...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!stats) return null;

    return (
        <>
            <SiteHeader />
            <main className="min-h-screen bg-white dark:bg-[#0F1419] text-gray-900 dark:text-white pt-24 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-visible">
                <div className="max-w-7xl mx-auto overflow-visible">
                    {/* Header */}
                    <div className="text-center mb-8 sm:mb-12">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4">Your Stats</h1>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4 mb-4">Track your progress, analyze your performance, and see how you compare</p>

                        {/* Team Selector - Premium Users Only */}
                        {isPremium && !teamsLoading && (
                            <div className="flex justify-center mt-4">
                                <TeamSelector
                                    selectedTeamId={selectedTeamId}
                                    onTeamChange={setSelectedTeamId}
                                    tone="black"
                                    allowNoTeam={true}
                                />
                            </div>
                        )}
                    </div>

                    {/* Summary Stats - Critical for first paint */}
                    <SummaryStats summary={stats.summary} />

                    {/* Streak Cards - Critical for first paint */}
                    <StreakCards streaks={stats.streaks} />

                    {/* Category Performance - Lazy loaded (Recharts + Framer Motion) */}
                    <Suspense fallback={
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
                            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                        </div>
                    }>
                        <CategoryPerformance
                            strongest={stats.categories.strongest}
                            weakest={stats.categories.weakest}
                        />
                    </Suspense>

                    {/* Weekly Streak Overview - Lazy loaded (Framer Motion) */}
                    <Suspense fallback={
                        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse mb-8" />
                    }>
                        <StreakOverview weeklyStreak={stats.weeklyStreak} />
                    </Suspense>

                    {/* Deferred Data (Performance Chart) - Loads after first paint */}
                    {stats.performanceOverTime && stats.performanceOverTime.length > 0 && (
                        <PerformanceChart data={stats.performanceOverTime} />
                    )}

                    {/* Recent Achievements & In Progress - Loads last, after everything else */}
                    <Suspense fallback={
                        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                    }>
                        <DeferredAchievements />
                    </Suspense>
                </div>
            </main>
            <Footer />
        </>
    );
}
