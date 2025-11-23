'use client'

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { SummaryStats } from '@/components/stats/SummaryStats';
import { CategoryPerformance } from '@/components/stats/CategoryPerformance';
import { StreakOverview } from '@/components/stats/StreakOverview';
import { StreakCards } from '@/components/stats/StreakCards';
import { PerformanceChart } from '@/components/stats/PerformanceChart';
import { ComparisonCharts } from '@/components/stats/ComparisonCharts';
import { RecentAchievements } from '@/components/stats/RecentAchievements';

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
    initialData?: StatsData | null;
    isPremium: boolean;
}

// Fetch function for React Query
async function fetchStats(): Promise<StatsData> {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    const response = await fetch('/api/stats', {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(userId ? { 'X-User-Id': userId } : {}),
        },
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

export function StatsClient({ initialData, isPremium }: StatsClientProps) {
    // Use React Query with initial data from server
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['stats'],
        queryFn: fetchStats,
        initialData: initialData || undefined,
        enabled: isPremium,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        retry: 1,
    });

    if (isLoading) {
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

    if (error) {
        return (
            <>
                <SiteHeader />
                <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-700 p-8 shadow-sm">
                        <div className="text-center mb-4">
                            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                                Error Loading Stats
                            </h2>
                            <p className="text-red-600 dark:text-red-400 mb-4">{error.message}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!stats) {
        return (
            <>
                <SiteHeader />
                <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
                        <p className="text-gray-600 dark:text-gray-400">No stats available yet. Start playing quizzes to see your stats!</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <SiteHeader />
            <main className="min-h-screen bg-white dark:bg-[#0F1419] text-gray-900 dark:text-white pt-24 sm:pt-32 pb-16 px-4 sm:px-8 overflow-visible">
                <div className="max-w-6xl mx-auto overflow-visible">
                    {/* Header */}
                    <div className="text-center mb-8 sm:mb-12">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4">Your Stats</h1>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4">Track your progress, analyze your performance, and see how you compare</p>
                    </div>

                    {/* Summary Stats */}
                    <SummaryStats summary={stats.summary} />

                    {/* Recent Achievements & In Progress */}
                    <RecentAchievements />

                    {/* Streak Cards */}
                    <StreakCards streaks={stats.streaks} />

                    {/* Performance Over Time */}
                    {stats.performanceOverTime.length > 0 && (
                        <PerformanceChart data={stats.performanceOverTime} />
                    )}

                    {/* Category Performance */}
                    <CategoryPerformance
                        strongest={stats.categories.strongest}
                        weakest={stats.categories.weakest}
                    />

                    {/* Weekly Streak Overview */}
                    <StreakOverview weeklyStreak={stats.weeklyStreak} />

                    {/* Comparisons */}
                    <ComparisonCharts
                        publicStats={stats.comparisons.public}
                        leagueComparisons={stats.comparisons.leagues}
                        userAverage={stats.summary.averageScore}
                    />
                </div>
            </main>
            <Footer />
        </>
    );
}
