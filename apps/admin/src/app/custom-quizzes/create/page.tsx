'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContentCard } from '@/components/layout/ContentCard';
import { QuizColorPicker } from '@/components/admin/QuizColorPicker';
import { SchoolLogoUpload } from '@/components/premium/SchoolLogoUpload';
import { CustomQuizUsageWidget } from '@/components/premium/CustomQuizUsageWidget';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, Eye, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useUserTier } from '@/hooks/useUserTier';
import { getAuthToken, getUserId } from '@/lib/storage';

interface Question {
  id: string;
  text: string;
  answer: string;
  explanation?: string;
}

interface Round {
  id: string;
  title?: string;
  blurb?: string;
  questions: Question[];
}

interface QuizData {
  id?: string;
  title: string;
  blurb: string;
  colorHex: string;
  rounds: Round[];
  schoolLogoUrl?: string;
  brandHeading?: string;
  brandSubheading?: string;
}

interface OrganisationBranding {
  id: string;
  name: string;
  logoUrl?: string;
  brandHeading?: string;
  brandSubheading?: string;
  role: string;
}

export default function CreateQuizPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { tier, isPremium, isLoading: tierLoading } = useUserTier();
  
  const [quizData, setQuizData] = useState<QuizData>({
    title: '',
    blurb: '',
    colorHex: '#6366f1',
    rounds: [{ id: generateId(), questions: [{ id: generateId(), text: '', answer: '' }] }],
    schoolLogoUrl: undefined,
    brandHeading: undefined,
    brandSubheading: undefined,
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());
  const [organisation, setOrganisation] = useState<OrganisationBranding | null>(null);
  const [useOrgLogo, setUseOrgLogo] = useState(true); // Default to using org logo if available
  const [usage, setUsage] = useState<any>(null);

  // Redirect if not premium
  useEffect(() => {
    if (!tierLoading && !isPremium) {
      router.push('/premium');
    }
  }, [tierLoading, isPremium, router]);

  // Load user's organisation branding and usage
  useEffect(() => {
    if (isPremium) {
      loadOrganisation();
      loadUsage();
    }
  }, [isPremium]);

  const loadUsage = async () => {
    try {
      if (!session?.user?.id) return;

      const res = await fetch('/api/premium/custom-quizzes/usage', {
        credentials: 'include', // Send session cookie
      });

      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Error loading usage:', error);
    }
  };

  // Load quiz for editing
  useEffect(() => {
    if (editId && isPremium) {
      loadQuiz(editId);
    }
  }, [editId, isPremium]);

  const loadOrganisation = async () => {
    try {
      if (!session?.user?.id) return;

      const res = await fetch('/api/user/organisation', {
        credentials: 'include', // Send session cookie
      });

      if (res.ok) {
        const data = await res.json();
        if (data.organisation) {
          setOrganisation(data.organisation);
          // If org has logo and we're creating new quiz, use it by default
          if (!editId && data.organisation.logoUrl) {
            setQuizData(prev => ({
              ...prev,
              schoolLogoUrl: data.organisation.logoUrl,
              brandHeading: data.organisation.brandHeading || prev.brandHeading,
              brandSubheading: data.organisation.brandSubheading || prev.brandSubheading,
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading organisation:', error);
    }
  };

  const loadQuiz = async (id: string) => {
    try {
      const res = await fetch(`/api/premium/custom-quizzes/${id}`, {
        credentials: 'include', // Send session cookie
      });

      if (res.ok) {
        const data = await res.json();
        const quiz = data.quiz;
        
        setQuizData({
          id: quiz.id,
          title: quiz.title,
          blurb: quiz.blurb || '',
          colorHex: quiz.colorHex || '#6366f1',
          schoolLogoUrl: quiz.schoolLogoUrl || undefined,
          brandHeading: quiz.brandHeading || undefined,
          brandSubheading: quiz.brandSubheading || undefined,
          rounds: quiz.rounds.map((round: any) => ({
            id: round.id,
            title: round.title || '',
            blurb: round.blurb || '',
            questions: round.questions.map((q: any) => ({
              id: q.id,
              text: q.text,
              answer: q.answer,
              explanation: q.explanation || '',
            })),
          })),
        });
        
        // Expand all rounds
        setExpandedRounds(new Set(quiz.rounds.map((r: any) => r.id)));
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  };

  const validateQuiz = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!quizData.title.trim() || quizData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    if (quizData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    if (quizData.blurb.length > 500) {
      newErrors.blurb = 'Blurb must be less than 500 characters';
    }
    if (quizData.rounds.length < 1) {
      newErrors.rounds = 'Quiz must have at least 1 round';
    }
    if (quizData.rounds.length > 10) {
      newErrors.rounds = 'Quiz can have at most 10 rounds';
    }

    const totalQuestions = quizData.rounds.reduce((sum, round) => sum + round.questions.length, 0);
    if (totalQuestions < 1) {
      newErrors.questions = 'Quiz must have at least 1 question';
    }
    if (totalQuestions > 100) {
      newErrors.questions = 'Quiz can have at most 100 questions total';
    }

    quizData.rounds.forEach((round, roundIndex) => {
      if (round.questions.length < 1) {
        newErrors[`round_${roundIndex}_questions`] = 'Each round must have at least 1 question';
      }
      if (round.questions.length > 20) {
        newErrors[`round_${roundIndex}_questions`] = 'Each round can have at most 20 questions';
      }

      round.questions.forEach((question, qIndex) => {
        if (!question.text.trim() || question.text.length < 10) {
          newErrors[`round_${roundIndex}_q_${qIndex}_text`] = 'Question text must be at least 10 characters';
        }
        if (question.text.length > 500) {
          newErrors[`round_${roundIndex}_q_${qIndex}_text`] = 'Question text must be less than 500 characters';
        }
        if (!question.answer.trim() || question.answer.length < 1) {
          newErrors[`round_${roundIndex}_q_${qIndex}_answer`] = 'Answer is required';
        }
        if (question.answer.length > 200) {
          newErrors[`round_${roundIndex}_q_${qIndex}_answer`] = 'Answer must be less than 200 characters';
        }
        if (question.explanation && question.explanation.length > 500) {
          newErrors[`round_${roundIndex}_q_${qIndex}_explanation`] = 'Explanation must be less than 500 characters';
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (publish: boolean = false) => {
    if (!validateQuiz()) {
      return;
    }

    setSaving(true);
    try {
      const token = getAuthToken();
      const userId = getUserId();

      const payload = {
        title: quizData.title.trim(),
        blurb: quizData.blurb.trim() || undefined,
        colorHex: quizData.colorHex,
        rounds: quizData.rounds.map(round => ({
          title: round.title?.trim() || undefined,
          blurb: round.blurb?.trim() || undefined,
          questions: round.questions.map(q => ({
            text: q.text.trim(),
            answer: q.answer.trim(),
            explanation: q.explanation?.trim() || undefined,
          })),
        })),
      };

      let res;
      if (editId) {
        // Update existing quiz
        res = await fetch(`/api/premium/custom-quizzes/${editId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Send session cookie
          body: JSON.stringify({
            ...payload,
            status: publish ? 'published' : 'draft',
          }),
        });
      } else {
        // Create new quiz
        res = await fetch('/api/premium/custom-quizzes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Send session cookie
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const data = await res.json();
        // Get quiz ID - for new quizzes it's in data.quiz.id, for updates it's editId
        const quizId = editId || (data.quiz ? data.quiz.id : null);
        
        // Save branding if provided
        if (quizId && (quizData.schoolLogoUrl || quizData.brandHeading || quizData.brandSubheading)) {
          try {
            await fetch(`/api/premium/custom-quizzes/${quizId}/branding`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include', // Send session cookie
              body: JSON.stringify({
                schoolLogoUrl: quizData.schoolLogoUrl || null,
                brandHeading: quizData.brandHeading?.trim() || null,
                brandSubheading: quizData.brandSubheading?.trim() || null,
              }),
            });
          } catch (brandingError) {
            console.error('Error saving branding:', brandingError);
            // Don't fail the whole save if branding fails
          }
        }
        
        router.push('/custom-quizzes');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save quiz');
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const addRound = () => {
    if (quizData.rounds.length >= 10) {
      alert('Maximum 10 rounds allowed');
      return;
    }
    setQuizData({
      ...quizData,
      rounds: [
        ...quizData.rounds,
        { id: generateId(), questions: [{ id: generateId(), text: '', answer: '' }] },
      ],
    });
  };

  const removeRound = (roundId: string) => {
    if (quizData.rounds.length <= 1) {
      alert('Quiz must have at least 1 round');
      return;
    }
    setQuizData({
      ...quizData,
      rounds: quizData.rounds.filter(r => r.id !== roundId),
    });
    const newExpanded = new Set(expandedRounds);
    newExpanded.delete(roundId);
    setExpandedRounds(newExpanded);
  };

  const updateRound = (roundId: string, updates: Partial<Round>) => {
    setQuizData({
      ...quizData,
      rounds: quizData.rounds.map(r =>
        r.id === roundId ? { ...r, ...updates } : r
      ),
    });
  };

  const addQuestion = (roundId: string) => {
    const round = quizData.rounds.find(r => r.id === roundId);
    if (round && round.questions.length >= 20) {
      alert('Maximum 20 questions per round');
      return;
    }
    const totalQuestions = quizData.rounds.reduce((sum, r) => sum + r.questions.length, 0);
    if (totalQuestions >= 100) {
      alert('Maximum 100 questions total');
      return;
    }
    
    setQuizData({
      ...quizData,
      rounds: quizData.rounds.map(r =>
        r.id === roundId
          ? { ...r, questions: [...r.questions, { id: generateId(), text: '', answer: '' }] }
          : r
      ),
    });
  };

  const removeQuestion = (roundId: string, questionId: string) => {
    const round = quizData.rounds.find(r => r.id === roundId);
    if (round && round.questions.length <= 1) {
      alert('Each round must have at least 1 question');
      return;
    }
    
    setQuizData({
      ...quizData,
      rounds: quizData.rounds.map(r =>
        r.id === roundId
          ? { ...r, questions: r.questions.filter(q => q.id !== questionId) }
          : r
      ),
    });
  };

  const updateQuestion = (roundId: string, questionId: string, updates: Partial<Question>) => {
    setQuizData({
      ...quizData,
      rounds: quizData.rounds.map(r =>
        r.id === roundId
          ? {
              ...r,
              questions: r.questions.map(q =>
                q.id === questionId ? { ...q, ...updates } : q
              ),
            }
          : r
      ),
    });
  };

  const toggleRound = (roundId: string) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundId)) {
      newExpanded.delete(roundId);
    } else {
      newExpanded.add(roundId);
    }
    setExpandedRounds(newExpanded);
  };

  const totalQuestions = quizData.rounds.reduce((sum, round) => sum + round.questions.length, 0);

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
          title={editId ? 'Edit Custom Quiz' : 'Create Custom Quiz'}
          subtitle="Build your custom quiz with flexible rounds and questions"
          centered
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Usage Widget - Compact */}
            {usage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CustomQuizUsageWidget usage={usage} compact />
              </motion.div>
            )}
            {/* Quiz Metadata */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ContentCard padding="lg" rounded="3xl" hoverAnimation={false}>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Quiz Details
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={quizData.title}
                      onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                      placeholder="Enter quiz title"
                      className={`w-full px-4 py-2 border rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      maxLength={100}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.title}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {quizData.title.length} / 100 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={quizData.blurb}
                      onChange={(e) => setQuizData({ ...quizData, blurb: e.target.value })}
                      placeholder="Enter quiz description (optional)"
                      rows={3}
                      className={`w-full px-4 py-2 border rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.blurb ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      maxLength={500}
                    />
                    {errors.blurb && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.blurb}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {quizData.blurb.length} / 500 characters
                    </p>
                  </div>

                  <div>
                    <QuizColorPicker
                      value={quizData.colorHex}
                      onChange={(color) => setQuizData({ ...quizData, colorHex: color })}
                    />
                  </div>
                </div>
              </ContentCard>
            </motion.div>

            {/* Branding Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <ContentCard padding="lg" rounded="3xl" hoverAnimation={false}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      PDF Branding
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Optional: Add logo and headings for quiz PDFs
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Organisation Logo Option - Compact */}
                  {organisation?.logoUrl && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="useOrgLogo"
                          checked={useOrgLogo && quizData.schoolLogoUrl === organisation.logoUrl}
                          onChange={(e) => {
                            setUseOrgLogo(e.target.checked);
                            if (e.target.checked) {
                              setQuizData({
                                ...quizData,
                                schoolLogoUrl: organisation.logoUrl,
                                brandHeading: organisation.brandHeading || quizData.brandHeading,
                                brandSubheading: organisation.brandSubheading || quizData.brandSubheading,
                              });
                            } else {
                              setQuizData({
                                ...quizData,
                                schoolLogoUrl: undefined,
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img
                            src={organisation.logoUrl}
                            alt={`${organisation.name} logo`}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label htmlFor="useOrgLogo" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer block">
                            Use {organisation.name} logo
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Or upload custom logo below
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Logo Upload - Compact */}
                  <div>
                    <SchoolLogoUpload
                      value={useOrgLogo && organisation?.logoUrl ? undefined : quizData.schoolLogoUrl}
                      onChange={(url) => {
                        setUseOrgLogo(false);
                        setQuizData({ ...quizData, schoolLogoUrl: url });
                      }}
                      className="compact"
                    />
                  </div>

                  {/* Heading & Subheading - Side by side on desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Heading
                      </label>
                      <input
                        type="text"
                        value={quizData.brandHeading || ''}
                        onChange={(e) => setQuizData({ ...quizData, brandHeading: e.target.value })}
                        placeholder="e.g., St. Augustine's School"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={100}
                      />
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {quizData.brandHeading?.length || 0}/100
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Subheading
                      </label>
                      <input
                        type="text"
                        value={quizData.brandSubheading || ''}
                        onChange={(e) => setQuizData({ ...quizData, brandSubheading: e.target.value })}
                        placeholder="e.g., Weekly Quiz - Term 1"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={200}
                      />
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {quizData.brandSubheading?.length || 0}/200
                      </p>
                    </div>
                  </div>
                </div>
              </ContentCard>
            </motion.div>

            {/* Rounds */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ContentCard padding="lg" rounded="3xl" hoverAnimation={false}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Rounds ({quizData.rounds.length} / 10)
                  </h2>
                  <button
                    onClick={addRound}
                    disabled={quizData.rounds.length >= 10}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Round
                  </button>
                </div>

                {errors.rounds && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full">
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.rounds}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {quizData.rounds.map((round, roundIndex) => (
                    <RoundEditor
                      key={round.id}
                      round={round}
                      roundIndex={roundIndex}
                      isExpanded={expandedRounds.has(round.id)}
                      onToggle={() => toggleRound(round.id)}
                      onUpdate={(updates) => updateRound(round.id, updates)}
                      onRemove={() => removeRound(round.id)}
                      onAddQuestion={() => addQuestion(round.id)}
                      onRemoveQuestion={(questionId) => removeQuestion(round.id, questionId)}
                      onUpdateQuestion={(questionId, updates) =>
                        updateQuestion(round.id, questionId, updates)
                      }
                      errors={errors}
                      canRemove={quizData.rounds.length > 1}
                    />
                  ))}
                </div>
              </ContentCard>
            </motion.div>
          </div>

          {/* Preview & Actions */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24"
            >
              <ContentCard padding="lg" rounded="3xl" hoverAnimation={false}>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Preview
                </h2>

                {/* Quiz Card Preview */}
                <div
                  className="h-32 rounded-xl mb-4 flex items-center justify-center p-4"
                  style={{ backgroundColor: quizData.colorHex }}
                >
                  <h3 className="text-lg font-bold text-white text-center line-clamp-2">
                    {quizData.title || 'Untitled Quiz'}
                  </h3>
                </div>

                {/* Stats */}
                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Rounds:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {quizData.rounds.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Questions:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {totalQuestions} / 100
                    </span>
                  </div>
                </div>

                {errors.questions && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full">
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.questions}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {saving ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </ContentCard>
            </motion.div>
          </div>
        </div>
      </PageContainer>
    </PageLayout>
  );
}

function RoundEditor({
  round,
  roundIndex,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestion,
  errors,
  canRemove,
}: {
  round: Round;
  roundIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Round>) => void;
  onRemove: () => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (questionId: string) => void;
  onUpdateQuestion: (questionId: string, updates: Partial<Question>) => void;
  errors: Record<string, string>;
  canRemove: boolean;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
      {/* Round Header */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onToggle}
            className="flex items-center gap-2 flex-1 text-left"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              Round {roundIndex + 1}
            </span>
            <span className="text-sm text-gray-500">
              ({round.questions.length} questions)
            </span>
          </button>
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        </div>
      </div>

      {/* Round Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Round Title (optional)
            </label>
            <input
              type="text"
              value={round.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="e.g., History Round"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Round Description (optional)
            </label>
            <textarea
              value={round.blurb || ''}
              onChange={(e) => onUpdate({ blurb: e.target.value })}
              placeholder="Brief description of this round"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={300}
            />
          </div>

          {errors[`round_${roundIndex}_questions`] && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[`round_${roundIndex}_questions`]}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Questions ({round.questions.length} / 20)
              </h4>
              <button
                onClick={onAddQuestion}
                disabled={round.questions.length >= 20}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3" />
                Add Question
              </button>
            </div>

            {round.questions.map((question, qIndex) => (
              <QuestionEditor
                key={question.id}
                question={question}
                roundIndex={roundIndex}
                questionIndex={qIndex}
                onUpdate={(updates) => onUpdateQuestion(question.id, updates)}
                onRemove={() => onRemoveQuestion(question.id)}
                errors={errors}
                canRemove={round.questions.length > 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionEditor({
  question,
  roundIndex,
  questionIndex,
  onUpdate,
  onRemove,
  errors,
  canRemove,
}: {
  question: Question;
  roundIndex: number;
  questionIndex: number;
  onUpdate: (updates: Partial<Question>) => void;
  onRemove: () => void;
  errors: Record<string, string>;
  canRemove: boolean;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Question {questionIndex + 1}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Question Text *
        </label>
        <textarea
          value={question.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Enter your question"
          rows={2}
          className={`w-full px-3 py-2 text-sm border rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors[`round_${roundIndex}_q_${questionIndex}_text`]
              ? 'border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          maxLength={500}
        />
        {errors[`round_${roundIndex}_q_${questionIndex}_text`] && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors[`round_${roundIndex}_q_${questionIndex}_text`]}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {question.text.length} / 500
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Answer *
        </label>
        <input
          type="text"
          value={question.answer}
          onChange={(e) => onUpdate({ answer: e.target.value })}
          placeholder="Enter the answer"
          className={`w-full px-3 py-2 text-sm border rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors[`round_${roundIndex}_q_${questionIndex}_answer`]
              ? 'border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          maxLength={200}
        />
        {errors[`round_${roundIndex}_q_${questionIndex}_answer`] && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors[`round_${roundIndex}_q_${questionIndex}_answer`]}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Explanation (optional)
        </label>
        <textarea
          value={question.explanation || ''}
          onChange={(e) => onUpdate({ explanation: e.target.value })}
          placeholder="Optional explanation for the answer"
          rows={2}
          className={`w-full px-3 py-2 text-sm border rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors[`round_${roundIndex}_q_${questionIndex}_explanation`]
              ? 'border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          maxLength={500}
        />
        {errors[`round_${roundIndex}_q_${questionIndex}_explanation`] && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors[`round_${roundIndex}_q_${questionIndex}_explanation`]}
          </p>
        )}
      </div>
    </div>
  );
}

function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`;
}

