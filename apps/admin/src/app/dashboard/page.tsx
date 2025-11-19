"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SubscriptionChart, QuizCategoryChart, WeeklyUsageChart } from "@/components/charts";
import { DataTable } from "@/components/data-table";
import { KPICard, ProgressRing } from "@/components/dashboard/KPICard";
import { CategoriesLeaderboard } from "@/components/dashboard/CategoriesLeaderboard";
import { QualityHeatmap } from "@/components/dashboard/QualityHeatmap";
import { QuestionLifecycleFunnel } from "@/components/dashboard/QuestionLifecycleFunnel";
import { TeacherActivityHeatmap } from "@/components/dashboard/TeacherActivityHeatmap";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { QuestionBankCoverage } from "@/components/dashboard/QuestionBankCoverage";

// Dark mode toggle component
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const currentIsDark = document.documentElement.classList.contains('dark');
    
    if (currentIsDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-medium transition-colors duration-200 flex items-center justify-center"
      aria-label="Toggle theme"
    >
      <svg 
        className={`w-4 h-4 transition-all duration-300 ${isDark ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        style={{ position: 'absolute' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <svg 
        className={`w-4 h-4 transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-180 scale-0'}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        style={{ position: 'absolute' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>
  );
}

export default function Dashboard() {
  const router = useRouter();
  
  // KPI Data with trends
  const kpiData = {
    activeQuizzes: {
      title: 'Active Quizzes',
      value: 38,
      trend: { direction: 'up' as const, percentage: 6, data: [32, 34, 35, 36, 37, 38] },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    questionBankHealth: {
      title: 'Question Bank Health',
      current: 742,
      total: 810,
      subtitle: 'Published questions'
    },
    avgSuccessRate: {
      title: 'Avg Success Rate',
      value: 74.5,
      trend: { direction: 'down' as const, percentage: 1.2, data: [76, 75.5, 75, 74.8, 74.7, 74.5] },
      format: 'percentage' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    weeklyCompletions: {
      title: 'Weekly Completions',
      value: 1847,
      trend: { direction: 'up' as const, percentage: 12, data: [1600, 1650, 1700, 1750, 1800, 1847] },
      subtitle: 'Student completions'
    },
    teacherRetention: {
      title: 'Teacher Retention',
      value: 82,
      trend: { direction: 'up' as const, percentage: 3, data: [78, 79, 80, 81, 81.5, 82] },
      format: 'percentage' as const,
      subtitle: 'Returning users'
    }
  };

  // Categories Performance Data
  const categoriesPerformance = [
    { rank: 1, category: 'Science', quizzes: 12, avgSuccessRate: 78.4, engagement: 2300, trend: [75, 76, 77, 78, 78.2, 78.4] },
    { rank: 2, category: 'Current Affairs', quizzes: 8, avgSuccessRate: 65.1, engagement: 3200, trend: [62, 63, 64, 64.5, 64.8, 65.1] },
    { rank: 3, category: 'Geography', quizzes: 15, avgSuccessRate: 72.3, engagement: 1800, trend: [70, 70.5, 71, 71.5, 72, 72.3] },
    { rank: 4, category: 'History', quizzes: 10, avgSuccessRate: 68.7, engagement: 2100, trend: [65, 66, 67, 68, 68.3, 68.7] },
    { rank: 5, category: 'Math', quizzes: 6, avgSuccessRate: 81.2, engagement: 1200, trend: [78, 79, 80, 80.5, 80.8, 81.2] },
    { rank: 6, category: 'Literature', quizzes: 9, avgSuccessRate: 69.8, engagement: 1500, trend: [67, 68, 68.5, 69, 69.5, 69.8] },
    { rank: 7, category: 'Arts', quizzes: 4, avgSuccessRate: 73.5, engagement: 800, trend: [70, 71, 72, 72.5, 73, 73.5] },
    { rank: 8, category: 'Sports', quizzes: 3, avgSuccessRate: 76.1, engagement: 600, trend: [74, 74.5, 75, 75.5, 75.8, 76.1] },
    { rank: 9, category: 'Technology', quizzes: 5, avgSuccessRate: 71.4, engagement: 900, trend: [68, 69, 70, 70.5, 71, 71.4] },
    { rank: 10, category: 'Environment', quizzes: 2, avgSuccessRate: 79.3, engagement: 400, trend: [76, 77, 78, 78.5, 79, 79.3] }
  ];

  // Quality Heatmap Data
  const qualityHeatmapData = [
    { category: 'Science', difficulty: 1, successRate: 88, questionCount: 45 },
    { category: 'Science', difficulty: 2, successRate: 72, questionCount: 38 },
    { category: 'Science', difficulty: 3, successRate: 55, questionCount: 42 },
    { category: 'Science', difficulty: 4, successRate: 42, questionCount: 28 },
    { category: 'Science', difficulty: 5, successRate: 39, questionCount: 15 },
    { category: 'History', difficulty: 1, successRate: 91, questionCount: 52 },
    { category: 'History', difficulty: 2, successRate: 84, questionCount: 41 },
    { category: 'History', difficulty: 3, successRate: 60, questionCount: 35 },
    { category: 'History', difficulty: 4, successRate: 45, questionCount: 22 },
    { category: 'History', difficulty: 5, successRate: 30, questionCount: 12 },
    { category: 'Geography', difficulty: 1, successRate: 85, questionCount: 48 },
    { category: 'Geography', difficulty: 2, successRate: 78, questionCount: 39 },
    { category: 'Geography', difficulty: 3, successRate: 62, questionCount: 33 },
    { category: 'Geography', difficulty: 4, successRate: 48, questionCount: 25 },
    { category: 'Geography', difficulty: 5, successRate: 35, questionCount: 18 }
  ];

  // Question Lifecycle Data
  const lifecycleData = [
    { stage: 'Draft', count: 68, percentage: 8.4, color: '#6B7280', description: 'Questions being written' },
    { stage: 'Review', count: 45, percentage: 5.6, color: '#F59E0B', description: 'Awaiting approval' },
    { stage: 'Published', count: 742, percentage: 91.6, color: '#10B981', description: 'Available for quizzes' },
    { stage: 'Used in Quiz', count: 523, percentage: 64.6, color: '#3B82F6', description: 'Actively used' },
    { stage: 'Retired', count: 12, percentage: 1.5, color: '#EF4444', description: 'Archived questions' }
  ];

  // Teacher Activity Data - Using deterministic data to avoid hydration issues
  const teacherActivityData = Array.from({ length: 90 }, (_, i) => {
    // Use a fixed base date to ensure consistent data across server/client
    const baseDate = new Date('2024-01-01');
    baseDate.setDate(baseDate.getDate() + i);
    // Use a deterministic seed based on the day to ensure consistent data
    const seed = i * 7 + 13;
    const count = seed % 8;
    const teachers = count > 0 ? ['Sarah Johnson', 'Mike Chen', 'Dr. Emily Watson'].slice(0, count) : [];
    
    return {
      date: baseDate.toISOString().split('T')[0],
      count,
      teachers
    };
  });

  // Upcoming Events Data
  const upcomingEvents = [
    {
      id: '1',
      title: 'Australia Day',
      date: '2024-01-26',
      category: 'National Holiday',
      description: 'Celebrate Australian culture and history',
      suggestedCategories: ['History', 'Current Affairs', 'Culture'],
      priority: 'high' as const
    },
    {
      id: '2',
      title: 'School Term 1 Starts',
      date: '2024-01-29',
      category: 'Education',
      description: 'First day of Term 1 for most Australian schools',
      suggestedCategories: ['Education', 'Current Affairs'],
      priority: 'medium' as const
    },
    {
      id: '3',
      title: 'Valentine\'s Day',
      date: '2024-02-14',
      category: 'Cultural',
      description: 'Celebrate love and relationships',
      suggestedCategories: ['Literature', 'Culture', 'History'],
      priority: 'low' as const
    }
  ];

  // Question Bank Coverage Data
  const coverageData = [
    {
      subject: 'Science',
      totalCount: 168,
      categories: [
        { name: 'Biology', count: 45, color: '#10B981' },
        { name: 'Chemistry', count: 38, color: '#059669' },
        { name: 'Physics', count: 42, color: '#047857' },
        { name: 'Earth Science', count: 28, color: '#065F46' },
        { name: 'Astronomy', count: 15, color: '#064E3B' }
      ]
    },
    {
      subject: 'Geography',
      totalCount: 163,
      categories: [
        { name: 'Physical Geography', count: 48, color: '#3B82F6' },
        { name: 'Human Geography', count: 39, color: '#2563EB' },
        { name: 'Australian Geography', count: 33, color: '#1D4ED8' },
        { name: 'World Geography', count: 25, color: '#1E40AF' },
        { name: 'Climate', count: 18, color: '#1E3A8A' }
      ]
    },
    {
      subject: 'History',
      totalCount: 162,
      categories: [
        { name: 'Australian History', count: 52, color: '#8B5CF6' },
        { name: 'World History', count: 41, color: '#7C3AED' },
        { name: 'Ancient History', count: 35, color: '#6D28D9' },
        { name: 'Modern History', count: 22, color: '#5B21B6' },
        { name: 'Military History', count: 12, color: '#4C1D95' }
      ]
    }
  ];

  // Sample data for charts
  const subscriptionData = [
    { date: 'Jan', subscribers: 180, revenue: 3600 },
    { date: 'Feb', subscribers: 195, revenue: 3900 },
    { date: 'Mar', subscribers: 210, revenue: 4200 },
    { date: 'Apr', subscribers: 225, revenue: 4500 },
    { date: 'May', subscribers: 235, revenue: 4700 },
    { date: 'Jun', subscribers: 247, revenue: 4940 },
  ];

  const quizPerformanceData = [
    { name: 'Geography', value: 35 },
    { name: 'Science', value: 28 },
    { name: 'History', value: 22 },
    { name: 'Math', value: 15 },
  ];

  const weeklyUsageData = [
    { day: 'Mon', completions: 245 },
    { day: 'Tue', completions: 312 },
    { day: 'Wed', completions: 289 },
    { day: 'Thu', completions: 267 },
    { day: 'Fri', completions: 198 },
    { day: 'Sat', completions: 156 },
    { day: 'Sun', completions: 180 },
  ];

         const recentQuizzes = [
           { id: 1, title: 'Weekly Geography Quiz - Week 24', category: 'Geography', subscribers: 247, rating: 4.8, status: 'Published' },
           { id: 2, title: 'Science Challenge - Chemistry Basics', category: 'Science', subscribers: 198, rating: 4.6, status: 'Published' },
           { id: 3, title: 'History Deep Dive - World War II', category: 'History', subscribers: 156, rating: 4.9, status: 'Draft' },
         ];

         const mostActiveTeams = [
           { name: 'Lincoln High School', completions: 89, members: 24, lastActive: '2 hours ago' },
           { name: 'Roosevelt Middle School', completions: 76, members: 18, lastActive: '4 hours ago' },
           { name: 'Washington Elementary', completions: 65, members: 22, lastActive: '6 hours ago' },
           { name: 'Jefferson Academy', completions: 58, members: 15, lastActive: '1 day ago' },
           { name: 'Madison Prep', completions: 52, members: 20, lastActive: '1 day ago' },
         ];

         const privateLeagueCreators = [
           { name: 'Sarah Johnson', leagues: 3, totalMembers: 67, avgRating: 4.8, lastCreated: '3 days ago' },
           { name: 'Michael Chen', leagues: 2, totalMembers: 45, avgRating: 4.9, lastCreated: '1 week ago' },
           { name: 'Emily Rodriguez', leagues: 4, totalMembers: 89, avgRating: 4.7, lastCreated: '2 weeks ago' },
           { name: 'David Kim', leagues: 2, totalMembers: 38, avgRating: 4.6, lastCreated: '2 weeks ago' },
           { name: 'Lisa Thompson', leagues: 3, totalMembers: 72, avgRating: 4.8, lastCreated: '3 weeks ago' },
         ];

         // Sample data for achievements analytics
         const achievementsData = [
           { name: 'Quiz Master', count: 45, description: 'Completed 10+ quizzes' },
           { name: 'Speed Demon', count: 23, description: 'Answered 50+ questions in under 30s' },
           { name: 'Perfectionist', count: 18, description: 'Got 100% on 5+ quizzes' },
           { name: 'Streak King', count: 12, description: '7+ day quiz streak' },
           { name: 'Category Expert', count: 31, description: 'Mastered 3+ categories' },
           { name: 'Early Bird', count: 28, description: 'Completed quiz before 8 AM' }
         ];

         const topAchievementHolders = [
           { name: 'Sarah Johnson', achievements: 8, topAchievement: 'Quiz Master' },
           { name: 'Mike Chen', achievements: 7, topAchievement: 'Speed Demon' },
           { name: 'Emma Wilson', achievements: 6, topAchievement: 'Perfectionist' },
           { name: 'Alex Rodriguez', achievements: 6, topAchievement: 'Streak King' },
           { name: 'Lisa Park', achievements: 5, topAchievement: 'Category Expert' }
         ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1419]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 py-3 px-6 bg-white/95 dark:bg-[#0F1419]/95 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            The School Quiz
          </div>
          
          <div className="flex items-center gap-3">
                   {/* Navigation Pills */}
                   <nav className="flex items-center gap-2">
                     <a href="/question-bank" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                       Questions
                     </a>
                     <a href="/create-quiz" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                       Quizzes
                     </a>
                     <a href="/explore-quizzes" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                       Explore
                     </a>
                     <a href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-full">
                       Dashboard
                     </a>
                   </nav>
            
            <ThemeToggle />
            
            {/* Logout Button */}
            <a href="/logout" className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
              Logout
            </a>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main className="pt-20 px-6">
        <div className="max-w-full mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400">Overview of your quiz service performance</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    // TODO: Implement load draft functionality
                    console.log('Load draft clicked');
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors font-medium text-sm"
                >
                  Load Draft
                </button>
                <button 
                  onClick={() => router.push('/create-quiz')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors text-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Quiz
                </button>
              </div>
            </div>
          </div>

          {/* Overview Bar - Compact KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard 
              title="Active Quizzes"
              value="38"
              trend={{
                direction: 'up',
                percentage: 6,
                data: [32, 33, 34, 35, 36, 37, 38]
              }}
              icon={<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            />
            <KPICard 
              title="Question Bank Health"
              value="91%"
              trend={{
                direction: 'up',
                percentage: 3,
                data: [88, 89, 89.5, 90, 90.5, 91]
              }}
              icon={<svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <KPICard 
              title="Avg Success Rate"
              value="74.5%"
              trend={{
                direction: 'down',
                percentage: 1.2,
                data: [75.7, 75.5, 75.2, 74.8, 74.6, 74.5]
              }}
              icon={<svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            />
            <KPICard 
              title="Weekly Completions"
              value="1,847"
              trend={{
                direction: 'up',
                percentage: 12,
                data: [1600, 1650, 1700, 1750, 1800, 1847]
              }}
              icon={<svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
          </div>

          {/* Performance Overview Section */}
          <div className="grid gap-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Categories Leaderboard */}
              <CategoriesLeaderboard data={categoriesPerformance} />
              
              {/* Content Quality Heatmap */}
              <QualityHeatmap data={qualityHeatmapData} />
            </div>
          </div>

          {/* Content Health Section */}
          <div className="grid gap-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Question Lifecycle Funnel */}
              <QuestionLifecycleFunnel data={lifecycleData} />
              
              {/* Question Bank Coverage */}
              <QuestionBankCoverage data={coverageData} />
            </div>
          </div>

          {/* Engagement Analytics Section */}
          <div className="grid gap-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Teacher Activity Heatmap */}
              <TeacherActivityHeatmap data={teacherActivityData} />
              
              {/* Upcoming Events */}
              <UpcomingEvents events={upcomingEvents} />
            </div>
          </div>


                 {/* Quick Actions & Recent Quizzes */}
                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                   {/* Quick Actions */}
                   <div className="lg:col-span-1">
                     <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                       <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                       <div className="space-y-3">
                         <button 
                           onClick={() => router.push('/question-bank')}
                           className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                         >
                           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                           Question Bank
                         </button>
                         <button 
                           onClick={() => router.push('/create-quiz')}
                           className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors text-sm"
                         >
                           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                           </svg>
                           Create Quiz
                         </button>
                         <button 
                           onClick={() => router.push('/admin/quizzes')}
                           className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                         >
                           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                           </svg>
                           Manage Quizzes
                         </button>
                         <button 
                           onClick={() => router.push('/admin/analytics')}
                           className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                         >
                           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                           </svg>
                           View Analytics
                         </button>
                       </div>
                     </div>
                   </div>
                   
                   {/* Recent Quizzes Table */}
                   <div className="lg:col-span-3">
                       <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                       <div className="flex items-center justify-between mb-6">
                         <div>
                           <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Quizzes</h3>
                           <p className="text-sm text-gray-600 dark:text-gray-300">Latest quizzes created for subscribers</p>
                         </div>
                         <button className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                           View All
                         </button>
                       </div>
                       <DataTable
                         data={recentQuizzes}
                         columns={[
                           { key: 'title', label: 'Quiz Title', sortable: true },
                           { key: 'category', label: 'Category', sortable: true },
                           { key: 'subscribers', label: 'Subscribers', sortable: true },
                           { key: 'rating', label: 'Rating', sortable: true },
                           { key: 'status', label: 'Status', sortable: true },
                         ]}
                         onRowClick={(row) => console.log('Clicked quiz:', row)}
                       />
                     </div>
                   </div>
                 </div>

                 {/* Achievements Analytics */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                   {/* Achievement Statistics */}
                       <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                     <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Achievement Statistics</h3>
                     <div className="space-y-3">
                       {achievementsData.map((achievement, index) => (
                         <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                           <div>
                             <div className="font-medium text-gray-900 dark:text-white">{achievement.name}</div>
                             <div className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</div>
                           </div>
                           <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{achievement.count}</div>
                         </div>
                       ))}
                     </div>
                   </div>

                   {/* Top Achievement Holders */}
                       <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                     <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Top Achievement Holders</h3>
                     <div className="space-y-3">
                       {topAchievementHolders.map((holder, index) => (
                         <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                           <div className="flex items-center space-x-3">
                             <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                               <span className="text-sm font-bold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                             </div>
                             <div>
                               <div className="font-medium text-gray-900 dark:text-white">{holder.name}</div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">{holder.topAchievement}</div>
                             </div>
                           </div>
                           <div className="text-lg font-semibold text-gray-900 dark:text-white">{holder.achievements}</div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
        </div>
      </main>
    </div>
  );
}