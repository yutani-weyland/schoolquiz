'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContentCard } from '@/components/layout/ContentCard';
import { motion } from 'framer-motion';
import { Plus, Edit, Share2, Trash2, FileText, Filter, Search, Sparkles } from 'lucide-react';
import { useUserTier } from '@/hooks/useUserTier';
import { getAuthToken, getUserId } from '@/lib/storage';
import Link from 'next/link';

interface CustomQuiz {
  id: string;
  slug: string;
  title: string;
  blurb?: string;
  colorHex?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  shareCount?: number;
  isShared?: boolean;
  sharedBy?: {
    id: string;
    name?: string;
    email: string;
  };
  rounds?: Array<{
    id: string;
    index: number;
    title?: string;
    questions: Array<{
      id: string;
      text: string;
      answer: string;
    }>;
  }>;
}

interface UsageData {
  currentMonth: {
    quizzesCreated: number;
    quizzesShared: number;
    quizzesCreatedLimit: number;
    quizzesSharedLimit: number;
  };
  storage: {
    totalQuizzes: number;
    maxQuizzes: number;
  };
  canCreate: boolean;
  canShare: boolean;
}

type FilterType = 'all' | 'mine' | 'shared';

export default function MyCustomQuizzesPage() {
  const router = useRouter();
  const { tier, isPremium, isLoading: tierLoading } = useUserTier();
  const [quizzes, setQuizzes] = useState<CustomQuiz[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect if not premium
  useEffect(() => {
    if (!tierLoading && !isPremium) {
      router.push('/premium');
    }
  }, [tierLoading, isPremium, router]);

  // Fetch quizzes and usage
  useEffect(() => {
    if (!isPremium) return;

    const fetchData = async () => {
      try {
        const token = getAuthToken();
        const userId = getUserId();

        if (!token || !userId) {
          router.push('/sign-in');
          return;
        }

        const [quizzesRes, usageRes] = await Promise.all([
          fetch('/api/premium/custom-quizzes?includeShared=true', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-User-Id': userId,
            },
          }),
          fetch('/api/premium/custom-quizzes/usage', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-User-Id': userId,
            },
          }),
        ]);

        if (quizzesRes.ok) {
          const data = await quizzesRes.json();
          setQuizzes(data.quizzes || []);
        }

        if (usageRes.ok) {
          const data = await usageRes.json();
          setUsage(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isPremium, router]);

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'mine' && !quiz.isShared) ||
      (filter === 'shared' && quiz.isShared);
    
    const matchesSearch =
      !searchQuery ||
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.blurb?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleDelete = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      const token = getAuthToken();
      const userId = getUserId();

      const res = await fetch(`/api/premium/custom-quizzes/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId,
        },
      });

      if (res.ok) {
        setQuizzes(quizzes.filter(q => q.id !== quizId));
        // Refresh usage
        const usageRes = await fetch('/api/premium/custom-quizzes/usage', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': userId,
          },
        });
        if (usageRes.ok) {
          const data = await usageRes.json();
          setUsage(data);
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete quiz');
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Failed to delete quiz');
    }
  };

  if (tierLoading || loading) {
    return (
      <PageLayout>
        <PageContainer maxWidth="6xl">
          <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </PageContainer>
      </PageLayout>
    );
  }

  if (!isPremium) {
    return null; // Will redirect
  }

  return (
    <PageLayout>
      <PageContainer maxWidth="6xl">
        <PageHeader
          title="My Custom Quizzes"
          subtitle="Create, manage, and share your custom quizzes"
          centered
        />

        {/* Usage Stats */}
        {usage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <ContentCard padding="lg" rounded="3xl" hoverAnimation={false}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {usage.currentMonth.quizzesCreated} / {usage.currentMonth.quizzesCreatedLimit}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Quizzes Created This Month
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {usage.currentMonth.quizzesShared} / {usage.currentMonth.quizzesSharedLimit}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Shares This Month
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {usage.storage.totalQuizzes} / {usage.storage.maxQuizzes}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Stored Quizzes
                  </div>
                </div>
              </div>
            </ContentCard>
          </motion.div>
        )}

        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        >
          <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {(['all', 'mine', 'shared'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'mine' ? 'Mine' : 'Shared'}
                </button>
              ))}
            </div>
          </div>

          {/* Create Button */}
          <Link
            href="/premium/create-quiz"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Quiz
          </Link>
        </motion.div>

        {/* Quizzes Grid */}
        {filteredQuizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ContentCard padding="xl" rounded="3xl" hoverAnimation={false}>
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'No quizzes found' : 'No custom quizzes yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Create your first custom quiz to get started'}
                </p>
                {!searchQuery && (
                  <Link
                    href="/premium/create-quiz"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Quiz
                  </Link>
                )}
              </div>
            </ContentCard>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <ContentCard padding="lg" rounded="3xl" hoverAnimation={true}>
                  {/* Quiz Header */}
                  <div
                    className="h-32 rounded-xl mb-4 flex items-center justify-center"
                    style={{
                      backgroundColor: quiz.colorHex || '#6366f1',
                    }}
                  >
                    <h3 className="text-xl font-bold text-white text-center px-4 line-clamp-2">
                      {quiz.title}
                    </h3>
                  </div>

                  {/* Quiz Info */}
                  <div className="mb-4">
                    {quiz.blurb && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {quiz.blurb}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                        Custom
                      </span>
                      {quiz.isShared && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                          Shared
                        </span>
                      )}
                      {quiz.shareCount && quiz.shareCount > 0 && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                          {quiz.shareCount} shares
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!quiz.isShared && (
                      <>
                        <Link
                          href={`/premium/create-quiz?edit=${quiz.id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => router.push(`/premium/my-quizzes?share=${quiz.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                        <button
                          onClick={() => handleDelete(quiz.id)}
                          className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <Link
                      href={`/quizzes/${quiz.slug}/play`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Play
                    </Link>
                  </div>
                </ContentCard>
              </motion.div>
            ))}
          </div>
        )}
      </PageContainer>
    </PageLayout>
  );
}

