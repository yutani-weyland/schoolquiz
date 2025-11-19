"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

interface QuizRound {
  id: string;
  category: string;
  title: string;
  blurb: string;
  color: string;
  questions: Question[];
}

interface Question {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  category: string;
}

interface Quiz {
  id: string;
  number: number;
  title: string;
  description: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledDate?: string;
  publishedDate?: string;
  rounds: QuizRound[];
  submissions?: number;
  averageScore?: number;
  averageTime?: number;
  categories: string[];
}

export default function ExploreQuizzes() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'scheduled'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'number' | 'submissions' | 'score'>('date');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const [isLoading, setIsLoading] = useState(true);

  // Fetch quizzes from database
  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, sortBy, searchQuery]);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/admin/quizzes?${params}`);
      const data = await response.json();

      if (response.ok) {
        // Transform database quizzes to component format
        const transformedQuizzes: Quiz[] = (data.quizzes || []).map((q: any) => {
          // Extract categories from rounds
          const categories = q.rounds?.map((r: any) => r.category?.name || r.title).filter(Boolean) || [];
          
          // Extract number from slug (if it's numeric)
          const number = q.slug && /^\d+$/.test(q.slug) ? parseInt(q.slug) : 0;

          return {
            id: q.id,
            number,
            title: q.title,
            description: q.blurb || '',
            status: q.status,
            publishedDate: q.publicationDate || null,
            scheduledDate: q.publicationDate || null,
            rounds: (q.rounds || []).map((r: any, idx: number) => ({
              id: r.id,
              category: r.category?.name || r.title || 'Unknown',
              title: r.title || r.category?.name || 'Round',
              blurb: r.blurb || '',
              color: `bg-blue-${100 + idx * 100} dark:bg-blue-${900}/30`,
              questions: (r.questions || []).map((rq: any) => ({
                id: rq.question?.id || '',
                question: rq.question?.text || '',
                answer: rq.question?.answer || '',
                explanation: rq.question?.explanation || '',
                category: r.category?.name || '',
              })),
            })),
            submissions: q._count?.runs || 0,
            averageScore: 0, // TODO: Calculate from completion data
            averageTime: 0, // TODO: Calculate from completion data
            categories,
          };
        });

        setQuizzes(transformedQuizzes);
      } else {
        console.error('Failed to fetch quizzes:', data);
        setQuizzes([]);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setQuizzes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedQuizzes = quizzes
    .filter(quiz => {
      const matchesStatus = filterStatus === 'all' || quiz.status === filterStatus;
      const matchesSearch = searchQuery === '' || 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase())) ||
        quiz.number.toString().includes(searchQuery);
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.publishedDate || b.scheduledDate || '').getTime() - new Date(a.publishedDate || a.scheduledDate || '').getTime();
        case 'number':
          return b.number - a.number;
        case 'submissions':
          return (b.submissions || 0) - (a.submissions || 0);
        case 'score':
          return (b.averageScore || 0) - (a.averageScore || 0);
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'scheduled': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      );
      case 'scheduled': return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      case 'draft': return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
      default: return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    }
  };

  const getPerformanceBadges = (quiz: Quiz) => {
    const badges = [];
    if (quiz.status === 'published') {
      if (quiz.averageScore && quiz.averageScore >= 75) {
        badges.push({ text: 'Top performing', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' });
      }
      if (quiz.submissions && quiz.submissions >= 1000) {
        badges.push({ text: 'High engagement', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' });
      }
      if (quiz.averageScore && quiz.averageScore < 60) {
        badges.push({ text: 'Needs review', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' });
      }
    }
    return badges;
  };

  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous) {
      return { color: 'text-green-600 dark:text-green-400', text: `+${(current - previous).toFixed(1)}%` };
    } else if (current < previous) {
      return { color: 'text-red-600 dark:text-red-400', text: `${(current - previous).toFixed(1)}%` };
    }
    return { color: 'text-gray-600 dark:text-gray-400', text: '0%' };
  };

  const editQuiz = (quizId: string) => {
    router.push(`/create-quiz?edit=${quizId}`);
  };

  const getQuickStats = () => {
    const total = quizzes.length;
    const published = quizzes.filter(q => q.status === 'published').length;
    const scheduled = quizzes.filter(q => q.status === 'scheduled').length;
    const drafts = quizzes.filter(q => q.status === 'draft').length;
    
    const publishedQuizzes = quizzes.filter(q => q.status === 'published');
    const avgScore = publishedQuizzes.length > 0 
      ? (publishedQuizzes.reduce((sum, q) => sum + (q.averageScore || 0), 0) / publishedQuizzes.length).toFixed(1)
      : '0';
    const avgTime = publishedQuizzes.length > 0
      ? (publishedQuizzes.reduce((sum, q) => sum + (q.averageTime || 0), 0) / publishedQuizzes.length).toFixed(1)
      : '0';
    const totalSubmissions = publishedQuizzes.reduce((sum, q) => sum + (q.submissions || 0), 0);
    
    return { total, published, scheduled, drafts, avgScore, avgTime, totalSubmissions };
  };

  const groupQuizzesByMonth = (quizzes: Quiz[]) => {
    const groups: { [key: string]: Quiz[] } = {};
    
    quizzes.forEach(quiz => {
      const date = quiz.publishedDate || quiz.scheduledDate || new Date().toISOString();
      const monthKey = new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(quiz);
    });
    
    return groups;
  };

  const groupedQuizzes = groupQuizzesByMonth(filteredAndSortedQuizzes);
  const quickStats = getQuickStats();

  const scheduleQuiz = (quizId: string) => {
    // TODO: Implement scheduling modal
    console.log('Schedule quiz:', quizId);
  };

  const duplicateQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to duplicate this quiz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/duplicate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to duplicate quiz');
      }

      alert(`Quiz duplicated successfully! New quiz: ${data.quiz.title}`);
      // Refresh the quiz list
      window.location.reload();
    } catch (error: any) {
      console.error('Error duplicating quiz:', error);
      alert(`Error: ${error.message || 'Failed to duplicate quiz'}`);
    }
  };

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete quiz');
      }

      alert('Quiz deleted successfully!');
      // Refresh the quiz list
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting quiz:', error);
      alert(`Error: ${error.message || 'Failed to delete quiz'}`);
    }
  };

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
              <a href="/explore-quizzes" className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-full">
                Explore
              </a>
              <a href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Explore Quizzes</h1>
                <p className="text-gray-600 dark:text-gray-400">Browse, manage, and analyze all your quizzes</p>
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
                <a
                  href="/create-quiz"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors text-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Quiz
                </a>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              {/* Search Bar */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by week, category, or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="all">All Quizzes</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="draft">Drafts</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="date">Date</option>
                  <option value="number">Quiz Number</option>
                  <option value="submissions">Submissions</option>
                  <option value="score">Average Score</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">Total Quizzes:</span>
                  <span className="text-gray-600 dark:text-gray-400">{quickStats.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">Published:</span>
                  <span className="text-green-600 dark:text-green-400">{quickStats.published}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">Scheduled:</span>
                  <span className="text-orange-600 dark:text-orange-400">{quickStats.scheduled}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">Drafts:</span>
                  <span className="text-blue-600 dark:text-blue-400">{quickStats.drafts}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">Avg Score:</span>
                  <span className="text-gray-600 dark:text-gray-400">{quickStats.avgScore}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">Avg Time:</span>
                  <span className="text-gray-600 dark:text-gray-400">{quickStats.avgTime}m</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">Total Submissions:</span>
                  <span className="text-gray-600 dark:text-gray-400">{quickStats.totalSubmissions.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Grid - Timeline Layout */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading quizzes...</p>
            </div>
          ) : (
          <div className="space-y-6">
            {Object.entries(groupedQuizzes).map(([month, quizzes]) => (
              <div key={month}>
                {/* Month Divider */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{month}</h2>
                  </div>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{quizzes.length} quiz{quizzes.length !== 1 ? 'es' : ''}</span>
                </div>
                
                {/* Quizzes for this month */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {quizzes.map((quiz) => {
              const performanceBadges = getPerformanceBadges(quiz);
              const publishedDate = quiz.publishedDate ? new Date(quiz.publishedDate).toLocaleDateString() : '';
              const scheduledDate = quiz.scheduledDate ? new Date(quiz.scheduledDate).toLocaleDateString() : '';
              const isDraft = quiz.status === 'draft';
              
              return (
                <div key={quiz.id} className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 group ${isDraft ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Week {quiz.number}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quiz.status)}`}>
                            {getStatusIcon(quiz.status)}
                            {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{quiz.description}</p>
                        
                        {/* Performance Metrics */}
                        {quiz.status === 'published' && (
                          <div className="flex items-center gap-4 text-xs mb-2">
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8" />
                              </svg>
                              <span className="font-medium text-gray-900 dark:text-white">{quiz.submissions?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <span className="font-medium text-gray-900 dark:text-white">{quiz.averageScore}%</span>
                              <span className="text-green-600 dark:text-green-400">(+2.1%)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium text-gray-900 dark:text-white">{quiz.averageTime}m</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Performance Badges */}
                        {performanceBadges.length > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            {performanceBadges.map((badge, index) => (
                              <span key={index} className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                                {badge.text}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Date */}
                        {(publishedDate || scheduledDate) && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {publishedDate ? `Published ${publishedDate}` : `Scheduled ${scheduledDate}`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {quiz.categories.map((category, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                          {category}
                        </span>
                      ))}
                    </div>

                    {/* Actions - Enhanced Hover Toolbar */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                      <button
                        onClick={() => editQuiz(quiz.id)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-full transition-colors flex items-center gap-1"
                        title="Edit Quiz"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      {quiz.status === 'published' && (
                        <button className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-full transition-colors flex items-center gap-1" title="View Analytics">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Analytics
                        </button>
                      )}
                      {quiz.status === 'draft' && (
                        <button
                          onClick={() => scheduleQuiz(quiz.id)}
                          className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-full transition-colors flex items-center gap-1"
                          title="Schedule Quiz"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Schedule
                        </button>
                      )}
                      <button
                        onClick={() => duplicateQuiz(quiz.id)}
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-full transition-colors flex items-center gap-1"
                        title="Duplicate Quiz"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Duplicate
                      </button>
                      <button
                        onClick={() => deleteQuiz(quiz.id)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-full transition-colors flex items-center gap-1"
                        title="Delete Quiz"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                  );
                  })}
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Empty State */}
          {!isLoading && Object.keys(groupedQuizzes).length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No quizzes found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your filters or create a new quiz.</p>
              <a
                href="/create-quiz"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors text-sm inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Quiz
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
