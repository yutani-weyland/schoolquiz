'use client'

import { Suspense, use } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
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
async function fetchStats(): Promise<StatsData> {
    const response = await fetch('/api/stats', {
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
    // Use critical data for first paint (fast)
    const criticalStats = initialCriticalData || (initialData ? {
        summary: initialData.summary,
        streaks: initialData.streaks,
        categories: initialData.categories,
        weeklyStreak: initialData.weeklyStreak,
    } : null);
    
    // Legacy support: if only initialData is provided, use it
    const stats = initialData || (criticalStats ? {
        ...criticalStats,
        performanceOverTime: [],
        comparisons: { public: { averageScore: 0, totalUsers: 0 }, leagues: [] },
        seasonStats: null,
    } : null);

    if (!criticalStats) {
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
                    <SummaryStats summary={criticalStats.summary} />

                    {/* Streak Cards */}
                    <StreakCards streaks={criticalStats.streaks} />

                    {/* Category Performance - FIRST PAINT */}
                    <CategoryPerformance
                        strongest={criticalStats.categories.strongest}
                        weakest={criticalStats.categories.weakest}
                    />

                    {/* Weekly Streak Overview - MOVED UP */}
                    <StreakOverview weeklyStreak={criticalStats.weeklyStreak} />

                    {/* Deferred Data (Performance Chart) - Loads after first paint */}
                    {deferredDataPromise && (
                        <Suspense fallback={
                            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                        }>
                            <DeferredStats 
                                deferredDataPromise={deferredDataPromise}
                                userAverage={criticalStats.summary.averageScore}
                            />
                        </Suspense>
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
