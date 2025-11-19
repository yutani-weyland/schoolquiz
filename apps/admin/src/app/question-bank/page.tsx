"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  category: string;
  difficulty?: number; // 1-5 scale
  status?: 'draft' | 'review' | 'published' | 'archived';
  tags?: string[];
  usedInQuizzes: string[];
  createdAt: string;
  updatedAt?: string;
  usageCount?: number;
  lastUsedAt?: string;
  createdBy?: string;
  analytics?: {
    successRate?: number;
    ci?: { lower: number; upper: number; nExposed: number; nRuns: number };
    trend28d?: number[];
  };
  quality?: {
    readability?: number;
    flags: string[];
    dupScore?: number;
  };
}

interface QuestionBank {
  [category: string]: Question[];
}

interface FilterState {
  categories: string[];
  status: string[];
  difficulty: number[];
  tags: string[];
  createdBy: string[];
  usedInQuizzes: boolean | null;
  qualityFlags: string[];
}

export default function Questions() {
  const router = useRouter();
  
  // Sample question bank data with more realistic structure
  const [questionBank, setQuestionBank] = useState<QuestionBank>({
    'Geography': [
      {
        id: 'geo-1',
        question: 'What is the capital of Australia?',
        answer: 'Canberra',
        explanation: 'Canberra was chosen as the capital in 1908 as a compromise between Sydney and Melbourne.',
        category: 'Geography',
        difficulty: 2,
        status: 'published',
        tags: ['capitals', 'australia'],
        usedInQuizzes: ['quiz-1'],
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
        usageCount: 15,
        createdBy: 'Sarah Johnson',
        analytics: {
          successRate: 0.78,
          ci: { lower: 0.72, upper: 0.84, nExposed: 150, nRuns: 12 },
          trend28d: Array.from({ length: 28 }, (_, i) => 0.7 + (i % 3) * 0.1)
        },
        quality: {
          readability: 8.2,
          flags: [],
          dupScore: 0.1
        }
      },
      {
        id: 'geo-2',
        question: 'Which river flows through London?',
        answer: 'Thames',
        explanation: 'The River Thames is the longest river entirely in England.',
        category: 'Geography',
        difficulty: 1,
        status: 'published',
        tags: ['rivers', 'england'],
        usedInQuizzes: [],
        createdAt: '2024-01-16',
        updatedAt: '2024-01-16',
        usageCount: 0,
        createdBy: 'Mike Chen',
        analytics: {
          successRate: 0.85,
          ci: { lower: 0.80, upper: 0.90, nExposed: 200, nRuns: 18 },
          trend28d: Array.from({ length: 28 }, (_, i) => 0.8 + (i % 2) * 0.1)
        },
        quality: {
          readability: 7.5,
          flags: [],
          dupScore: 0.05
        }
      }
    ],
    'Science': [
      {
        id: 'sci-1',
        question: 'What is the chemical symbol for gold?',
        answer: 'Au',
        explanation: 'Au comes from the Latin word "aurum" meaning gold.',
        category: 'Science',
        difficulty: 3,
        status: 'review',
        tags: ['chemistry', 'elements'],
        usedInQuizzes: ['quiz-2'],
        createdAt: '2024-01-17',
        updatedAt: '2024-01-17',
        usageCount: 8,
        createdBy: 'Dr. Emily Watson',
        analytics: {
          successRate: 0.72,
          ci: { lower: 0.65, upper: 0.79, nExposed: 120, nRuns: 10 },
          trend28d: Array.from({ length: 28 }, (_, i) => 0.7 + (i % 3) * 0.1)
        },
        quality: {
          readability: 9.1,
          flags: [],
          dupScore: 0.2
        }
      }
    ],
    'History': [],
    'Math': [],
    'Literature': []
  });

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    status: [],
    difficulty: [],
    tags: [],
    createdBy: [],
    usedInQuizzes: null,
    qualityFlags: []
  });
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showEditorDrawer, setShowEditorDrawer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Get all questions as a flat array
  const allQuestions = useMemo(() => {
    return Object.values(questionBank).flat();
  }, [questionBank]);

  // Get all unique categories with counts
  const categoriesWithCounts = useMemo(() => {
    const categoryMap = new Map<string, number>();
    allQuestions.forEach(q => {
      categoryMap.set(q.category, (categoryMap.get(q.category) || 0) + 1);
    });
    return Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));
  }, [allQuestions]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allQuestions.forEach(q => {
      q.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [allQuestions]);

  // Get all unique creators
  const allCreators = useMemo(() => {
    const creatorSet = new Set<string>();
    allQuestions.forEach(q => {
      if (q.createdBy) creatorSet.add(q.createdBy);
    });
    return Array.from(creatorSet).sort();
  }, [allQuestions]);

  // Tokenized search parser
  const parseSearchQuery = (query: string) => {
    const tokens: { [key: string]: string } = {};
    const textParts: string[] = [];
    
    // Parse tokens like cat:Geography status:published diff:easy
    const tokenRegex = /(\w+):([^\s"]+|"[^"]*")/g;
    let match;
    while ((match = tokenRegex.exec(query)) !== null) {
      tokens[match[1]] = match[2].replace(/"/g, '');
    }
    
    // Extract remaining text
    const textQuery = query.replace(/(\w+):([^\s"]+|"[^"]*")/g, '').trim();
    if (textQuery) textParts.push(textQuery);
    
    return { tokens, textQuery };
  };

  // Filter questions based on search and filters
  const filteredQuestions = useMemo(() => {
    const { tokens, textQuery } = parseSearchQuery(searchQuery);
    let questions = allQuestions;
    
    // Apply text search
    if (textQuery) {
      const searchLower = textQuery.toLowerCase();
      questions = questions.filter(q => 
        q.question.toLowerCase().includes(searchLower) ||
        q.answer.toLowerCase().includes(searchLower) ||
        q.explanation?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply token filters
    if (tokens.cat) {
      questions = questions.filter(q => q.category.toLowerCase().includes(tokens.cat.toLowerCase()));
    }
    if (tokens.status) {
      questions = questions.filter(q => q.status === tokens.status);
    }
    if (tokens.diff) {
      questions = questions.filter(q => q.difficulty === parseInt(tokens.diff));
    }
    if (tokens.tag) {
      questions = questions.filter(q => q.tags?.some(tag => tag.toLowerCase().includes(tokens.tag.toLowerCase())));
    }
    
    // Apply sidebar filters
    if (filters.categories.length > 0) {
      questions = questions.filter(q => filters.categories.includes(q.category));
    }
    if (filters.status.length > 0) {
      questions = questions.filter(q => q.status && filters.status.includes(q.status));
    }
    if (filters.difficulty.length > 0) {
      questions = questions.filter(q => q.difficulty && filters.difficulty.includes(q.difficulty));
    }
    if (filters.tags.length > 0) {
      questions = questions.filter(q => q.tags?.some(tag => filters.tags.includes(tag)));
    }
    if (filters.createdBy.length > 0) {
      questions = questions.filter(q => q.createdBy && filters.createdBy.includes(q.createdBy));
    }
    if (filters.usedInQuizzes !== null) {
      if (filters.usedInQuizzes) {
        questions = questions.filter(q => q.usedInQuizzes.length > 0);
      } else {
        questions = questions.filter(q => q.usedInQuizzes.length === 0);
      }
    }
    
    return questions;
  }, [allQuestions, searchQuery, filters]);

  // Filter management functions
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => {
      const currentArray = prev[key] as string[];
      if (currentArray.includes(value)) {
        return { ...prev, [key]: currentArray.filter(item => item !== value) };
      } else {
        return { ...prev, [key]: [...currentArray, value] };
      }
    });
  };

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      status: [],
      difficulty: [],
      tags: [],
      createdBy: [],
      usedInQuizzes: null,
      qualityFlags: []
    });
    setSearchQuery('');
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count += filters.categories.length;
    if (filters.status.length > 0) count += filters.status.length;
    if (filters.difficulty.length > 0) count += filters.difficulty.length;
    if (filters.tags.length > 0) count += filters.tags.length;
    if (filters.createdBy.length > 0) count += filters.createdBy.length;
    if (filters.usedInQuizzes !== null) count += 1;
    if (searchQuery) count += 1;
    return count;
  }, [filters, searchQuery]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'review': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'published': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'archived': return 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'text-green-600 dark:text-green-400';
    if (difficulty <= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Very Easy';
      case 2: return 'Easy';
      case 3: return 'Medium';
      case 4: return 'Hard';
      case 5: return 'Very Hard';
      default: return 'Medium';
    }
  };

  const openQuestionEditor = (question: Question) => {
    setSelectedQuestion(question);
    setShowEditorDrawer(true);
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
              <a href="/question-bank" className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-full">
                Questions
              </a>
              <a href="/create-quiz" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                Quizzes
              </a>
              <a href="/explore-quizzes" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                Explore
              </a>
              <a href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                Dashboard
              </a>
            </nav>
            
            {/* Theme Toggle */}
            <button
              onClick={() => {
                const currentIsDark = document.documentElement.classList.contains('dark');
                if (currentIsDark) {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('theme', 'light');
                } else {
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('theme', 'dark');
                }
              }}
              className="w-10 h-10 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-medium transition-colors duration-200 flex items-center justify-center"
              aria-label="Toggle theme"
            >
              <svg 
                className="w-4 h-4 transition-all duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            
            {/* Logout Button */}
            <a href="/logout" className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
              Logout
            </a>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex pt-[73px] h-screen">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 h-full overflow-y-auto">
          <div className="px-4 py-3">
            <div className="pb-2 mb-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Filters</h3>
            </div>
            
            <div className="space-y-4 text-sm leading-snug">
              {/* Categories - Always visible */}
              <div>
                <details open className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-900 dark:text-white mb-1 list-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1">
                    <span>Categories</span>
                    <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="space-y-1 max-h-40 overflow-y-auto mt-2">
                    {categoriesWithCounts.map(category => (
                      <label key={category.name} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(category.name)}
                          onChange={() => toggleFilter('categories', category.name)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300 text-xs">{category.name}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">({category.count})</span>
                      </label>
                    ))}
                  </div>
                </details>
              </div>

              {/* Status - Collapsed by default */}
              <div>
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-900 dark:text-white mb-1 list-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1">
                    <span>Status</span>
                    <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="space-y-1 mt-2">
                    {['draft', 'review', 'published', 'archived'].map(status => (
                      <label key={status} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1">
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status)}
                          onChange={() => toggleFilter('status', status)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300 text-xs capitalize">{status}</span>
                      </label>
                    ))}
                  </div>
                </details>
              </div>

              {/* Advanced Filters - Collapsed by default */}
              <div>
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-1 list-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1">
                    <span>More filters</span>
                    <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  
                  <div className="space-y-3 mt-2 pl-2 border-l border-gray-200 dark:border-gray-600">
                    {/* Difficulty */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Difficulty</h4>
                      <div className="space-y-1">
                        {[1, 2, 3, 4, 5].map(difficulty => (
                          <label key={difficulty} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1">
                            <input
                              type="checkbox"
                              checked={filters.difficulty.includes(difficulty)}
                              onChange={() => toggleFilter('difficulty', difficulty.toString())}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700 dark:text-gray-300 text-xs">{getDifficultyLabel(difficulty)}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tags</h4>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {allTags.slice(0, 8).map(tag => (
                          <label key={tag} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1">
                            <input
                              type="checkbox"
                              checked={filters.tags.includes(tag)}
                              onChange={() => toggleFilter('tags', tag)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700 dark:text-gray-300 text-xs">{tag}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Usage */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Usage</h4>
                      <div className="space-y-1">
                        <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1">
                          <input
                            type="radio"
                            name="usage"
                            checked={filters.usedInQuizzes === true}
                            onChange={() => updateFilter('usedInQuizzes', true)}
                            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300 text-xs">Used in quizzes</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1">
                          <input
                            type="radio"
                            name="usage"
                            checked={filters.usedInQuizzes === false}
                            onChange={() => updateFilter('usedInQuizzes', false)}
                            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300 text-xs">Available</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </details>
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearAllFilters}
                className="w-full px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-6">
          {/* Search Bar */}
          <div className="pt-6 border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Questions</h1>
                <p className="text-gray-600 dark:text-gray-400">Search and filter your question library</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors font-medium text-sm">
                  Load Draft
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors text-sm">
                  Add Question
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm">
                  Import CSV
                </button>
              </div>
            </div>

            {/* Command Palette Style Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search questions, categories, or use filters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Active Filters Breadcrumb */}
            {activeFilterCount > 0 && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                {filters.categories.map(cat => (
                  <span key={cat} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full flex items-center gap-1">
                    {cat}
                    <button
                      onClick={() => toggleFilter('categories', cat)}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                {filters.status.map(status => (
                  <span key={status} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-full flex items-center gap-1">
                    {status}
                    <button
                      onClick={() => toggleFilter('status', status)}
                      className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                {filters.difficulty.map(diff => (
                  <span key={diff} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs rounded-full flex items-center gap-1">
                    {getDifficultyLabel(diff)}
                    <button
                      onClick={() => toggleFilter('difficulty', diff.toString())}
                      className="hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                {filters.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => toggleFilter('tags', tag)}
                      className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredQuestions.length} questions found
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      viewMode === 'table' 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                    title="Table view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                    title="Grid view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Questions Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {viewMode === 'table' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white w-1/3">Question</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white w-20">Category</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white w-20">Difficulty</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white w-20">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white w-24">Usage</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white w-24">Success Rate</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white w-32">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredQuestions.map((question) => (
                        <tr
                          key={question.id}
                          onClick={() => openQuestionEditor(question)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className={`text-sm font-medium text-gray-900 dark:text-white ${expandedQuestions.has(question.id) ? '' : 'line-clamp-2'}`}>
                              {question.question}
                            </div>
                            <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${expandedQuestions.has(question.id) ? '' : 'line-clamp-1'}`}>
                              {question.answer}
                            </div>
                            {(question.question.length > 100 || question.answer.length > 50) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedQuestions(prev => {
                                    const next = new Set(prev);
                                    if (next.has(question.id)) {
                                      next.delete(question.id);
                                    } else {
                                      next.add(question.id);
                                    }
                                    return next;
                                  });
                                }}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                              >
                                {expandedQuestions.has(question.id) ? 'Show less' : 'Show more'}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                              {question.category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {question.difficulty && (
                              <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(question.difficulty)}`}>
                                {getDifficultyLabel(question.difficulty)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(question.status || 'draft')}`}>
                              {question.status || 'draft'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs ${question.usedInQuizzes.length === 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                              {question.usedInQuizzes.length === 0 ? 'Available' : `Used in ${question.usedInQuizzes.length} quiz${question.usedInQuizzes.length !== 1 ? 'es' : ''}`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {question.analytics && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                                  {Math.round((question.analytics.successRate || 0) * 100)}%
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({question.analytics.ci?.nExposed || 0})
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {question.createdAt}
                            </div>
                            {question.createdBy && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                by {question.createdBy}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredQuestions.map((question) => (
                        <div
                          key={question.id}
                          onClick={() => openQuestionEditor(question)}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          <div className="mb-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">{question.question}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{question.answer}</div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              {question.category}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(question.status || 'draft')}`}>
                              {question.status || 'draft'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{getDifficultyLabel(question.difficulty || 1)}</span>
                            <span>{question.analytics?.successRate && question.analytics.successRate > 0 ? `${Math.round(question.analytics.successRate * 100)}%` : 'No data'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {filteredQuestions.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">No questions found</p>
                  <p className="text-sm">Try adjusting your search criteria or filters</p>
                </div>
              )}
          </div>
        </main>

        {/* Editor Drawer */}
        {showEditorDrawer && selectedQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-end">
            <div className="w-96 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Question</h2>
                  <button
                    onClick={() => setShowEditorDrawer(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Question</label>
                    <textarea
                      value={selectedQuestion.question}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Answer</label>
                    <input
                      type="text"
                      value={selectedQuestion.answer}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Explanation</label>
                    <textarea
                      value={selectedQuestion.explanation || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                      <select
                        value={selectedQuestion.category}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        {categoriesWithCounts.map(cat => (
                          <option key={cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
                      <select
                        value={selectedQuestion.difficulty || 3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="1">Very Easy</option>
                        <option value="2">Easy</option>
                        <option value="3">Medium</option>
                        <option value="4">Hard</option>
                        <option value="5">Very Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                    <select
                      value={selectedQuestion.status || 'draft'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="review">Review</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  {/* Analytics Panel */}
                  {selectedQuestion.analytics && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Analytics</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                          <span className="text-gray-900 dark:text-white">
                            {Math.round((selectedQuestion.analytics.successRate || 0) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Exposures:</span>
                          <span className="text-gray-900 dark:text-white">
                            {selectedQuestion.analytics.ci?.nExposed || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Runs:</span>
                          <span className="text-gray-900 dark:text-white">
                            {selectedQuestion.analytics.ci?.nRuns || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors text-sm">
                      Save Changes
                    </button>
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Filter Modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
            <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Categories */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Categories</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {categoriesWithCounts.map(category => (
                        <label key={category.name} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(category.name)}
                            onChange={() => toggleFilter('categories', category.name)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{category.name}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">({category.count})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Status</h3>
                    <div className="space-y-2">
                      {['draft', 'review', 'published', 'archived'].map(status => (
                        <label key={status} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.status.includes(status)}
                            onChange={() => toggleFilter('status', status)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300 text-sm capitalize">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Difficulty</h3>
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map(difficulty => (
                        <label key={difficulty} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.difficulty.includes(difficulty)}
                            onChange={() => toggleFilter('difficulty', difficulty.toString())}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{getDifficultyLabel(difficulty)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Tags</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {allTags.map(tag => (
                        <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.tags.includes(tag)}
                            onChange={() => toggleFilter('tags', tag)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Usage */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Usage</h3>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="usage"
                          checked={filters.usedInQuizzes === true}
                          onChange={() => updateFilter('usedInQuizzes', true)}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">Used in quizzes</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="usage"
                          checked={filters.usedInQuizzes === false}
                          onChange={() => updateFilter('usedInQuizzes', false)}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">Available</span>
                      </label>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <button
                    onClick={() => {
                      clearAllFilters();
                      setShowMobileFilters(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}