"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SpellCheckInput } from "@/components/SpellCheckInput";
import { QUIZ_CONSTANTS } from "@schoolquiz/db";

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

interface Question {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  category: string;
}

type RoundKind = 'standard' | 'finale';

interface QuizRound {
  id: string;
  category: string;
  title: string;
  blurb: string;
  color: string;
  questions: Question[];
  kind?: RoundKind;
}

interface Quiz {
  id?: string;
  number: number;
  title: string;
  description: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledDate?: string;
  rounds: QuizRound[];
}

interface Category {
  name: string;
  icon: string;
}

const STANDARD_ROUND_COUNT = QUIZ_CONSTANTS.STANDARD_ROUND_COUNT;
const QUESTIONS_PER_STANDARD_ROUND = QUIZ_CONSTANTS.QUESTIONS_PER_STANDARD_ROUND;
const PEOPLE_ROUND_COUNT = QUIZ_CONSTANTS.PEOPLE_ROUND_QUESTION_COUNT;
const TOTAL_ROUNDS = QUIZ_CONSTANTS.TOTAL_ROUNDS;
const TOTAL_QUESTIONS = QUIZ_CONSTANTS.TOTAL_QUESTIONS;

export default function CreateQuiz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editQuizId = searchParams.get('edit');
  const isEditing = !!editQuizId;

  const [quiz, setQuiz] = useState<Quiz>({
    number: 0,
    title: '',
    description: '',
    status: 'draft',
    rounds: []
  });
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Load quiz data when editing
  useEffect(() => {
    if (isEditing && editQuizId) {
      loadQuizForEditing(editQuizId);
    }
  }, [isEditing, editQuizId]);

  const loadQuizForEditing = async (quizId: string) => {
    setIsLoadingQuiz(true);
    setLoadError(null);

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load quiz');
      }

      const quizData = data.quiz;

      // Transform database format to component format
      const transformedQuiz: Quiz = {
        id: quizData.id,
        number: quizData.slug && /^\d+$/.test(quizData.slug) ? parseInt(quizData.slug) : 0,
        title: quizData.title,
        description: quizData.blurb || '',
        status: quizData.status,
        scheduledDate: quizData.publicationDate ? new Date(quizData.publicationDate).toISOString().split('T')[0] : undefined,
        rounds: (quizData.rounds || []).map((round: any, index: number) => {
          const isPeoplesRound = round.isPeoplesRound || index === (quizData.rounds.length - 1);
          return {
            id: round.id,
            category: round.category?.name || round.title || 'General Knowledge',
            title: round.title || round.category?.name || `Round ${index + 1}`,
            blurb: round.blurb || '',
            color: roundColors[index % roundColors.length],
            kind: isPeoplesRound ? 'finale' : 'standard',
            questions: (round.questions || []).map((rq: any) => ({
              id: rq.question?.id || '',
              question: rq.question?.text || '',
              answer: rq.question?.answer || '',
              explanation: rq.question?.explanation || '',
              category: round.category?.name || 'General Knowledge',
            })),
          };
        }),
      };

      setQuiz(transformedQuiz);

      // Set active round tab to first round if available
      if (transformedQuiz.rounds.length > 0) {
        setActiveRoundTab(transformedQuiz.rounds[0].id);
      }
    } catch (error: any) {
      console.error('Error loading quiz:', error);
      setLoadError(error.message || 'Failed to load quiz');
      alert(`Error loading quiz: ${error.message || 'Failed to load quiz. Please try again.'}`);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const [categorySearch, setCategorySearch] = useState('');
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeRoundTab, setActiveRoundTab] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [showImportQuestionModal, setShowImportQuestionModal] = useState(false);
  const [usedQuizNumbers, setUsedQuizNumbers] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]); // Sample used numbers
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Round colors - solid block colors without borders
  const roundColors = [
    'bg-blue-100 dark:bg-blue-900/30',
    'bg-green-100 dark:bg-green-900/30',
    'bg-purple-100 dark:bg-purple-900/30',
    'bg-orange-100 dark:bg-orange-900/30',
    'bg-fuchsia-100 dark:bg-fuchsia-900/30',
  ];

  // Tab colors that match the round colors
  const tabColors = [
    'bg-blue-600 hover:bg-blue-700',
    'bg-green-600 hover:bg-green-700', 
    'bg-purple-600 hover:bg-purple-700',
    'bg-orange-600 hover:bg-orange-700',
    'bg-fuchsia-600 hover:bg-fuchsia-700',
  ];

  // Button colors for add question buttons
  const buttonColors = [
    'bg-blue-600 hover:bg-blue-700',
    'bg-green-600 hover:bg-green-700',
    'bg-purple-600 hover:bg-purple-700',
    'bg-orange-600 hover:bg-orange-700',
    'bg-fuchsia-600 hover:bg-fuchsia-700',
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Categories with icons (using Lucide React icons)
  const [categories, setCategories] = useState<Category[]>([
    { name: 'Geography', icon: 'Globe' },
    { name: 'Science', icon: 'Microscope' },
    { name: 'History', icon: 'BookOpen' },
    { name: 'Math', icon: 'Calculator' },
    { name: 'Literature', icon: 'Book' },
    { name: 'Current Affairs', icon: 'Newspaper' },
    { name: 'Pop Culture', icon: 'Star' },
    { name: 'Sports', icon: 'Trophy' },
    { name: 'Art', icon: 'Palette' },
    { name: 'Music', icon: 'Music' },
    { name: 'Film', icon: 'Film' },
    { name: 'Technology', icon: 'Cpu' },
    { name: 'Biology', icon: 'Dna' },
    { name: 'Chemistry', icon: 'FlaskConical' },
    { name: 'Physics', icon: 'Atom' },
    { name: 'Astronomy', icon: 'Telescope' },
    { name: 'Psychology', icon: 'Brain' },
    { name: 'Sociology', icon: 'Users' },
    { name: 'Philosophy', icon: 'Lightbulb' },
    { name: 'Economics', icon: 'TrendingUp' },
    { name: 'Politics', icon: 'Vote' },
    { name: 'Law', icon: 'Scale' },
    { name: 'Medicine', icon: 'Heart' },
    { name: 'Architecture', icon: 'Building' },
    { name: 'Engineering', icon: 'Wrench' },
    { name: 'Agriculture', icon: 'Wheat' },
    { name: 'Environmental Science', icon: 'Leaf' },
    { name: 'Geology', icon: 'Mountain' },
    { name: 'Meteorology', icon: 'Cloud' },
    { name: 'Oceanography', icon: 'Waves' },
    { name: 'Anthropology', icon: 'User' },
    { name: 'Archaeology', icon: 'Shovel' },
    { name: 'Linguistics', icon: 'MessageSquare' },
    { name: 'Religious Studies', icon: 'Church' },
    { name: 'Mythology', icon: 'Zap' },
    { name: 'Folklore', icon: 'Scroll' },
    { name: 'Cuisine', icon: 'Utensils' },
    { name: 'Fashion', icon: 'Shirt' },
    { name: 'Design', icon: 'PenTool' },
    { name: 'Photography', icon: 'Camera' },
    { name: 'Dance', icon: 'Dance' },
    { name: 'Theater', icon: 'Theater' },
    { name: 'Comedy', icon: 'Smile' },
    { name: 'Gaming', icon: 'Gamepad2' },
    { name: 'Esports', icon: 'Trophy' },
    { name: 'Cryptocurrency', icon: 'Bitcoin' },
    { name: 'Blockchain', icon: 'Link' },
    { name: 'Artificial Intelligence', icon: 'Bot' },
    { name: 'Machine Learning', icon: 'Brain' },
    { name: 'Data Science', icon: 'BarChart3' },
    { name: 'Cybersecurity', icon: 'Shield' },
    { name: 'Cloud Computing', icon: 'Cloud' },
    { name: 'Mobile Development', icon: 'Smartphone' },
    { name: 'Web Development', icon: 'Code' },
    { name: 'DevOps', icon: 'Settings' },
    { name: 'UI/UX Design', icon: 'Layout' },
    { name: 'Product Management', icon: 'Package' },
    { name: 'Marketing', icon: 'Megaphone' },
    { name: 'Advertising', icon: 'Target' },
    { name: 'Journalism', icon: 'Edit' },
    { name: 'Education', icon: 'GraduationCap' },
    { name: 'Public Administration', icon: 'Building2' },
    { name: 'Social Work', icon: 'HandHeart' },
    { name: 'Urban Planning', icon: 'Map' }
  ]);

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const getNextAvailableQuizNumber = () => {
    const maxUsed = Math.max(...usedQuizNumbers, 0);
    return maxUsed + 1;
  };

  const isQuizNumberValid = (number: number) => {
    if (number <= 0) return false;
    if (usedQuizNumbers.includes(number)) return false;
    return true;
  };

  const updateQuizNumber = (number: number) => {
    setQuiz(prev => ({ ...prev, number }));
  };

  const addRound = (categoryName: string) => {
    let createdRoundId: string | null = null;

    setQuiz(prev => {
      if (prev.rounds.length >= TOTAL_ROUNDS) {
        alert(`You've already added ${STANDARD_ROUND_COUNT} rounds and the People's Question.`);
        return prev;
      }

      const isFinale = prev.rounds.length === STANDARD_ROUND_COUNT;
      const colorIndex = prev.rounds.length % roundColors.length;
      const roundId = `round-${Date.now()}`;
      const newRound: QuizRound = {
        id: roundId,
        category: isFinale ? "People's Question" : categoryName,
        title: isFinale ? "People's Question" : `${categoryName} Round`,
        blurb: isFinale ? 'Wrap up the quiz with the crowd favourite question.' : '',
        color: roundColors[colorIndex],
        kind: isFinale ? 'finale' : 'standard',
        questions: [],
      };

      createdRoundId = roundId;
      return {
        ...prev,
        rounds: [...prev.rounds, newRound],
      };
    });

    if (createdRoundId) {
      setActiveRoundTab(createdRoundId);
    }
  };

  const addNewCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: Category = {
        name: newCategoryName.trim(),
        icon: 'Tag' // Default icon for new categories
      };
      setCategories(prev => [...prev, newCategory]);
      setNewCategoryName('');
      setShowNewCategoryModal(false);
    }
  };

  const removeRound = (roundId: string) => {
    setQuiz(prev => ({
      ...prev,
      rounds: prev.rounds.filter(round => round.id !== roundId)
    }));
    
    // If we're removing the active tab, switch to another tab or clear
    if (activeRoundTab === roundId) {
      const remainingRounds = quiz.rounds.filter(round => round.id !== roundId);
      setActiveRoundTab(remainingRounds.length > 0 ? remainingRounds[0].id : null);
    }
  };

  const addQuestion = (roundId: string) => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      question: '',
      answer: '',
      category: quiz.rounds.find(r => r.id === roundId)?.category || ''
    };

    setQuiz(prev => ({
      ...prev,
      rounds: prev.rounds.map(round =>
        round.id === roundId
          ? { ...round, questions: [...round.questions, newQuestion] }
          : round
      )
    }));
  };

  const updateQuestion = (roundId: string, questionId: string, field: keyof Question, value: string) => {
    setQuiz(prev => ({
      ...prev,
      rounds: prev.rounds.map(round =>
        round.id === roundId
          ? {
              ...round,
              questions: round.questions.map(q =>
                q.id === questionId ? { ...q, [field]: value } : q
              )
            }
          : round
      )
    }));
  };

  const updateRoundBlurb = (roundId: string, blurb: string) => {
    setQuiz(prev => ({
      ...prev,
      rounds: prev.rounds.map(round =>
        round.id === roundId ? { ...round, blurb } : round
      )
    }));
  };


  const getRoundIndex = (roundId: string) => {
    return quiz.rounds.findIndex(round => round.id === roundId);
  };

  const resolveRoundKind = (round: QuizRound, explicitIndex?: number): RoundKind => {
    if (round.kind) return round.kind;
    const index = explicitIndex ?? quiz.rounds.findIndex(r => r.id === round.id);
    return index === STANDARD_ROUND_COUNT ? 'finale' : 'standard';
  };

  const getTargetQuestionCount = (round: QuizRound, explicitIndex?: number) =>
    resolveRoundKind(round, explicitIndex) === 'finale'
      ? PEOPLE_ROUND_COUNT
      : QUESTIONS_PER_STANDARD_ROUND;

  const hasFinaleRound = () =>
    quiz.rounds.some((round, idx) => resolveRoundKind(round, idx) === 'finale');

  const countStandardRounds = () =>
    quiz.rounds.filter((round, idx) => resolveRoundKind(round, idx) === 'standard').length;

  const standardRounds = quiz.rounds.filter((round, idx) => resolveRoundKind(round, idx) === 'standard');
  const standardRoundsCompleted = standardRounds.length;
  const finaleReady = hasFinaleRound();
  const completedSections = standardRoundsCompleted + (finaleReady ? 1 : 0);
  const sectionsProgress = (completedSections / TOTAL_ROUNDS) * 100;
  const totalStandardQuestions = standardRounds.reduce((sum, round) => sum + round.questions.length, 0);
  const totalQuestionsAuthored = quiz.rounds.reduce((sum, round) => sum + round.questions.length, 0);
  const averageStandardQuestions = standardRoundsCompleted > 0 ? Math.round(totalStandardQuestions / standardRoundsCompleted) : 0;
  const standardRoundsFilled = standardRoundsCompleted === STANDARD_ROUND_COUNT && standardRounds.every(round => round.questions.length === QUESTIONS_PER_STANDARD_ROUND);
  const finaleFilled = quiz.rounds.some((round, idx) => resolveRoundKind(round, idx) === 'finale' && round.questions.length === PEOPLE_ROUND_COUNT);
  const structureComplete = standardRoundsFilled && finaleFilled;
  const totalQuestionsPercent = Math.round((totalQuestionsAuthored / TOTAL_QUESTIONS) * 100);
  const canPublish = structureComplete && Boolean(quiz.title.trim()) && quiz.number > 0 && isQuizNumberValid(quiz.number);

  // Sample data for category usage tracking (in a real app, this would come from backend)
  const categoryUsageData = {
    'Geography': { used: 15, total: 20 },
    'Science': { used: 18, total: 20 },
    'History': { used: 12, total: 20 },
    'Math': { used: 16, total: 20 },
    'Literature': { used: 14, total: 20 },
    'Current Affairs': { used: 8, total: 20 },
    'Pop Culture': { used: 10, total: 20 },
    'Sports': { used: 6, total: 20 },
    'Art': { used: 4, total: 20 },
    'Music': { used: 7, total: 20 },
    'Film': { used: 5, total: 20 },
    'Technology': { used: 9, total: 20 },
    'Biology': { used: 11, total: 20 },
    'Chemistry': { used: 13, total: 20 },
    'Physics': { used: 10, total: 20 },
    'Astronomy': { used: 3, total: 20 },
    'Psychology': { used: 6, total: 20 },
    'Sociology': { used: 4, total: 20 },
    'Philosophy': { used: 2, total: 20 },
    'Economics': { used: 5, total: 20 },
    'Politics': { used: 7, total: 20 },
    'Law': { used: 3, total: 20 },
    'Medicine': { used: 8, total: 20 },
    'Architecture': { used: 2, total: 20 },
    'Engineering': { used: 6, total: 20 },
    'Agriculture': { used: 1, total: 20 },
    'Environmental Science': { used: 4, total: 20 },
    'Geology': { used: 3, total: 20 },
    'Meteorology': { used: 2, total: 20 },
    'Oceanography': { used: 1, total: 20 },
    'Anthropology': { used: 2, total: 20 },
    'Archaeology': { used: 1, total: 20 },
    'Linguistics': { used: 2, total: 20 },
    'Religious Studies': { used: 1, total: 20 },
    'Mythology': { used: 3, total: 20 },
    'Folklore': { used: 1, total: 20 },
    'Cuisine': { used: 2, total: 20 },
    'Fashion': { used: 1, total: 20 },
    'Design': { used: 3, total: 20 },
    'Photography': { used: 2, total: 20 },
    'Comedy': { used: 1, total: 20 },
    'Gaming': { used: 4, total: 20 },
    'Esports': { used: 2, total: 20 },
    'Cryptocurrency': { used: 1, total: 20 },
    'Blockchain': { used: 1, total: 20 },
    'Artificial Intelligence': { used: 3, total: 20 },
    'Machine Learning': { used: 2, total: 20 },
    'Data Science': { used: 2, total: 20 },
    'Cybersecurity': { used: 1, total: 20 },
    'Cloud Computing': { used: 1, total: 20 },
    'Mobile Development': { used: 1, total: 20 },
    'Web Development': { used: 2, total: 20 },
    'DevOps': { used: 1, total: 20 },
    'UI/UX Design': { used: 2, total: 20 },
    'Product Management': { used: 1, total: 20 },
    'Marketing': { used: 3, total: 20 },
    'Advertising': { used: 1, total: 20 },
    'Journalism': { used: 2, total: 20 },
    'Education': { used: 4, total: 20 },
    'Public Administration': { used: 1, total: 20 },
    'Social Work': { used: 1, total: 20 },
    'Urban Planning': { used: 1, total: 20 }
  };

  const getCategoryUsagePercentage = (categoryName: string) => {
    const usage = categoryUsageData[categoryName as keyof typeof categoryUsageData];
    if (!usage) return 0;
    return Math.round((usage.used / usage.total) * 100);
  };

  // User-voted category from previous week
  const userVotedCategory = {
    name: 'Science',
    votes: 1247,
    percentage: 34.2,
    previousWeek: 'Week 24'
  };

  // Sample question bank data for importing questions
  const questionBank = {
    'Geography': [
      { id: 'geo-q1', question: 'What is the capital of France?', answer: 'Paris', explanation: 'Paris has been the capital of France since the 12th century.' },
      { id: 'geo-q2', question: 'Which is the longest river in the world?', answer: 'Nile River', explanation: 'The Nile River is approximately 4,135 miles long.' },
      { id: 'geo-q3', question: 'What is the smallest country in the world?', answer: 'Vatican City', explanation: 'Vatican City covers only 0.17 square miles.' },
      { id: 'geo-q4', question: 'Which continent is the driest?', answer: 'Antarctica', explanation: 'Antarctica receives less than 2 inches of precipitation annually.' },
      { id: 'geo-q5', question: 'What is the highest mountain in the world?', answer: 'Mount Everest', explanation: 'Mount Everest reaches 29,032 feet above sea level.' }
    ],
    'Science': [
      { id: 'sci-q1', question: 'What is the chemical symbol for water?', answer: 'H2O', explanation: 'Water consists of two hydrogen atoms and one oxygen atom.' },
      { id: 'sci-q2', question: 'What is the speed of light?', answer: '299,792,458 meters per second', explanation: 'This is approximately 186,282 miles per second.' },
      { id: 'sci-q3', question: 'What is the hardest natural substance?', answer: 'Diamond', explanation: 'Diamond has a Mohs hardness of 10.' },
      { id: 'sci-q4', question: 'What gas makes up most of Earth\'s atmosphere?', answer: 'Nitrogen', explanation: 'Nitrogen makes up about 78% of the atmosphere.' },
      { id: 'sci-q5', question: 'What is the pH of pure water?', answer: '7', explanation: 'Pure water is neutral with a pH of 7.' }
    ],
    'History': [
      { id: 'hist-q1', question: 'When did World War II end?', answer: '1945', explanation: 'World War II ended on September 2, 1945.' },
      { id: 'hist-q2', question: 'Who was the first President of the United States?', answer: 'George Washington', explanation: 'George Washington served from 1789 to 1797.' },
      { id: 'hist-q3', question: 'When did the Berlin Wall fall?', answer: '1989', explanation: 'The Berlin Wall fell on November 9, 1989.' },
      { id: 'hist-q4', question: 'Who wrote the Declaration of Independence?', answer: 'Thomas Jefferson', explanation: 'Thomas Jefferson was the primary author.' },
      { id: 'hist-q5', question: 'When did the Roman Empire fall?', answer: '476 AD', explanation: 'The Western Roman Empire fell in 476 AD.' }
    ],
    'Math': [
      { id: 'math-q1', question: 'What is 15% of 200?', answer: '30', explanation: '15% of 200 = 0.15 × 200 = 30' },
      { id: 'math-q2', question: 'What is the square root of 144?', answer: '12', explanation: '12 × 12 = 144' },
      { id: 'math-q3', question: 'What is the value of π to 2 decimal places?', answer: '3.14', explanation: 'π (pi) is approximately 3.14159' },
      { id: 'math-q4', question: 'What is 2 to the power of 8?', answer: '256', explanation: '2^8 = 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 = 256' },
      { id: 'math-q5', question: 'What is the area of a circle with radius 5?', answer: '25π', explanation: 'Area = π × r² = π × 5² = 25π' }
    ],
    'Literature': [
      { id: 'lit-q1', question: 'Who wrote "Romeo and Juliet"?', answer: 'William Shakespeare', explanation: 'Shakespeare wrote this tragedy in the 1590s.' },
      { id: 'lit-q2', question: 'What is the longest novel ever written?', answer: 'In Search of Lost Time by Marcel Proust', explanation: 'It contains over 1.2 million words.' },
      { id: 'lit-q3', question: 'Who wrote "1984"?', answer: 'George Orwell', explanation: 'George Orwell published this dystopian novel in 1949.' },
      { id: 'lit-q4', question: 'What is the first book in the Harry Potter series?', answer: 'Harry Potter and the Philosopher\'s Stone', explanation: 'Published in 1997 in the UK.' },
      { id: 'lit-q5', question: 'Who wrote "To Kill a Mockingbird"?', answer: 'Harper Lee', explanation: 'Harper Lee published this novel in 1960.' }
    ]
  };

  const removeQuestion = (roundId: string, questionId: string) => {
    setQuiz(prev => ({
      ...prev,
      rounds: prev.rounds.map(round =>
        round.id === roundId
          ? { ...round, questions: round.questions.filter(q => q.id !== questionId) }
          : round
      )
    }));
  };

  const importQuestion = (roundId: string, questionData: any) => {
    setQuiz(prev => ({
      ...prev,
      rounds: prev.rounds.map((round, idx) =>
        round.id === roundId && round.questions.length < getTargetQuestionCount(round, idx)
          ? {
              ...round,
              questions: [
                ...round.questions,
                {
                  id: `q-${Date.now()}-${round.questions.length}`,
                  question: questionData.question,
                  answer: questionData.answer,
                  explanation: questionData.explanation,
                  category: round.category
                }
              ]
            }
          : round
      )
    }));
    setShowImportQuestionModal(false);
  };

  const importDraftQuiz = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedQuiz = JSON.parse(e.target?.result as string);
        if (importedQuiz.title && importedQuiz.rounds) {
          setQuiz(importedQuiz);
          alert('Draft quiz imported successfully!');
        } else {
          alert('Invalid quiz file format.');
        }
      } catch (error) {
        alert('Error reading quiz file. Please ensure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const exportDraftQuiz = () => {
    if (!quiz.title.trim()) {
      alert('Please enter a quiz title before exporting.');
      return;
    }

    const dataStr = JSON.stringify(quiz, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_draft.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveQuiz = async (asDraft = false, scheduleForLater = false) => {
    if (!quiz.title.trim()) {
      alert('Please enter a quiz title.');
      return;
    }
    if (quiz.number <= 0) {
      alert('Please enter a valid quiz number.');
      return;
    }
    if (!isQuizNumberValid(quiz.number)) {
      alert(`Quiz number ${quiz.number} is already used or invalid. Please choose a different number.`);
      return;
    }
    if (!asDraft && !scheduleForLater) {
      if (quiz.rounds.length !== TOTAL_ROUNDS) {
        alert(`Please create ${STANDARD_ROUND_COUNT} rounds plus the People's Question.`);
        return;
      }

      const standardRounds = quiz.rounds.filter((round, idx) => resolveRoundKind(round, idx) === 'standard');
      if (standardRounds.length !== STANDARD_ROUND_COUNT) {
        alert(`Make sure you have ${STANDARD_ROUND_COUNT} standard rounds.`);
        return;
      }
      if (!standardRounds.every((round, idx) => round.questions.length === QUESTIONS_PER_STANDARD_ROUND)) {
        alert(`Each standard round must have exactly ${QUESTIONS_PER_STANDARD_ROUND} questions.`);
        return;
      }

      const finaleRound = quiz.rounds.find((round, idx) => resolveRoundKind(round, idx) === 'finale');
      if (!finaleRound) {
        alert("Don't forget to add the People's Question finale.");
        return;
      }
      if (finaleRound.questions.length !== PEOPLE_ROUND_COUNT) {
        alert(`The People's Question must have exactly ${PEOPLE_ROUND_COUNT} question.`);
        return;
      }
    }
    if (scheduleForLater && !scheduledDate) {
      alert('Please select a date and time for publishing.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const quizToSave = {
        ...quiz,
        status: asDraft ? 'draft' : scheduleForLater ? 'scheduled' : 'published',
        scheduledDate: scheduleForLater ? scheduledDate : undefined
      };

      // Use PUT for editing, POST for creating
      const url = isEditing && quiz.id 
        ? `/api/admin/quizzes/${quiz.id}`
        : '/api/admin/quizzes';
      const method = isEditing && quiz.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizToSave),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to save quiz');
      }

      // Add the quiz number to used numbers if publishing or scheduling (only for new quizzes)
      if (!asDraft && !isEditing) {
        setUsedQuizNumbers(prev => [...prev, quiz.number]);
      }

      if (scheduleForLater) {
        alert(`Quiz #${quiz.number} ${isEditing ? 'updated and' : ''} scheduled for ${new Date(scheduledDate).toLocaleString()}!`);
      } else {
        alert(`Quiz #${quiz.number} ${isEditing ? 'updated and ' : ''}${asDraft ? 'saved as draft' : 'published'} successfully!`);
      }
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error saving quiz:', error);
      setSaveError(error.message || 'Failed to save quiz');
      alert(`Error: ${error.message || 'Failed to save quiz. Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedCategories = () => {
    return [...new Set(quiz.rounds.map(round => round.category))];
  };

  const getRoundsForCategory = (category: string) => {
    return quiz.rounds.filter(round => round.category === category);
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.icon || 'Tag';
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
              <a href="/create-quiz" className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-full">
                Quizzes
              </a>
              <a href="/explore-quizzes" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
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

        {/* Loading State */}
        {isLoadingQuiz && (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading quiz...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {loadError && !isLoadingQuiz && (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">Error: {loadError}</p>
              <button
                onClick={() => router.push('/admin/quizzes')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Quizzes
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isLoadingQuiz && !loadError && (
             <main className="pt-20 pb-20">
               <div className="max-w-full mx-auto px-6">
                 {/* Page Header */}
                 <div className="mb-8">
                   <div className="flex items-center justify-between mb-6">
                     <div>
                       <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                         {isEditing ? 'Edit Quiz' : 'New Quiz'}
                       </h1>
                       <p className="text-gray-600 dark:text-gray-400">
                         {isEditing 
                           ? 'Update quiz details, rounds, and questions'
                           : 'Build 4 rounds of 6 questions and finish with a People\'s Question finale'}
                       </p>
                     </div>
                     <div className="flex items-center gap-3">
                       <button
                         onClick={importDraftQuiz}
                         className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors font-medium text-sm"
                       >
                         Load Draft
                       </button>
                       <button
                         onClick={() => {
                           // Reset quiz to create a new one
                           setQuiz({
                             number: getNextAvailableQuizNumber(),
                             title: '',
                             description: '',
                             rounds: [],
                             status: 'draft'
                           });
                         }}
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

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   {/* Left Column - Main Content */}
                   <div className="lg:col-span-2 space-y-6">

                     {/* Quiz Details - Compact Grid */}
                     <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quiz Details</h2>
                       <div className="grid grid-cols-3 gap-4 mb-4">
                         <div>
                           <input
                             type="number"
                             value={quiz.number || ''}
                             onChange={(e) => updateQuizNumber(parseInt(e.target.value) || 0)}
                             className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                             placeholder="Week #"
                             min="1"
                           />
                           {quiz.number > 0 && !isQuizNumberValid(quiz.number) && (
                             <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                               Quiz #{quiz.number} is already used
                             </p>
                           )}
                         </div>
                         <div className="col-span-2">
                           <SpellCheckInput
                             value={quiz.title}
                             onChange={(value) => setQuiz(prev => ({ ...prev, title: value }))}
                             placeholder="Weekly Quiz – Week 25"
                             className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                           />
                         </div>
                       </div>
                       <SpellCheckInput
                         value={quiz.description}
                         onChange={(value) => setQuiz(prev => ({ ...prev, description: value }))}
                         placeholder="Brief description..."
                         className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                       />
                     </div>

                     {/* Community Choice - Dismissible Card */}
                     <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800">
                       <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                           <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                             <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                           </svg>
                           <span className="font-medium text-gray-900 dark:text-white">Community Choice</span>
                         </div>
                         <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-medium rounded-full">
                           Most Requested
                         </span>
                       </div>
                       <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                         {userVotedCategory.name} — {userVotedCategory.votes.toLocaleString()} votes ({userVotedCategory.percentage}%) from {userVotedCategory.previousWeek}
                       </p>
                       <button
                         onClick={() => addRound(userVotedCategory.name)}
                         className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-400 text-sm font-medium rounded-full transition-colors"
                       >
                         Add Category
                       </button>
                     </div>

          {/* Rounds */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rounds</h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {standardRoundsCompleted}/{STANDARD_ROUND_COUNT} standard rounds · People's Question {finaleReady ? 'ready' : 'pending'}
              </span>
            </div>

            {/* Round Tabs */}
            {quiz.rounds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                       {quiz.rounds.map((round, index) => {
                         const roundIndex = getRoundIndex(round.id);
                         const tabColor = tabColors[roundIndex % tabColors.length];
                         const targetCount = getTargetQuestionCount(round, roundIndex);
                         const roundKind = resolveRoundKind(round, roundIndex);
                         const label =
                           roundKind === 'finale'
                             ? `People's Question (${round.questions.length}/${targetCount})`
                             : `${round.category} (${round.questions.length}/${targetCount})`;
                         
                         return (
                           <div key={round.id} className="flex items-center gap-2 relative">
                             <button
                               onClick={() => setActiveRoundTab(round.id)}
                               onMouseEnter={() => setShowTooltip(round.id)}
                               onMouseLeave={() => setShowTooltip(null)}
                               className={`px-4 py-2 rounded-full text-sm font-medium transition-colors text-white flex items-center gap-2 ${
                                 activeRoundTab === round.id
                                   ? tabColor
                                   : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                               }`}
                             >
                        {label}
                        <svg className="w-3 h-3 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Usage Tooltip */}
                      {showTooltip === round.id && (
                        <div className="absolute top-full left-0 mt-2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg z-50 whitespace-nowrap border border-gray-600 dark:border-gray-500">
                          <div className="font-medium">{round.category}</div>
                          <div className="text-gray-300">
                            Used in {getCategoryUsagePercentage(round.category)}% of quizzes
                          </div>
                          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 border-l border-t border-gray-600 dark:border-gray-500"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add New Round */}
            {quiz.rounds.length < TOTAL_ROUNDS && (
              <div className="mb-4 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl">
                {quiz.rounds.length === STANDARD_ROUND_COUNT ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Finish with the People's Question finale.</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">One community-powered question to close things out.</p>
                    </div>
                    <button
                      onClick={() => addRound("People's Question")}
                      className="px-3 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full text-sm font-medium transition-colors"
                    >
                      Add People's Question
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 relative" ref={dropdownRef}>
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => {
                          setCategorySearch(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                        placeholder="Search and select category..."
                      />
                      
                      {/* Dropdown */}
                      {showDropdown && categorySearch && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg z-10 max-h-48 overflow-y-auto">
                          {filteredCategories
                            .filter(cat => !quiz.rounds.some(round => round.category === cat.name))
                            .slice(0, 10)
                            .map((category) => (
                              <button
                                key={category.name}
                                onClick={() => {
                                  addRound(category.name);
                                  setCategorySearch('');
                                  setShowDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              >
                                {category.name}
                              </button>
                            ))}
                          {filteredCategories.filter(cat => !quiz.rounds.some(round => round.category === cat.name)).length === 0 && (
                            <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                              No available categories
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                           <button
                             onClick={() => setShowNewCategoryModal(true)}
                             className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                           >
                             + New
                           </button>
                  </div>
                )}
              </div>
            )}

            {/* Active Round Content */}
            {activeRoundTab && quiz.rounds.find(round => round.id === activeRoundTab) && (
              <div className="mt-4">
                {(() => {
                  const activeRound = quiz.rounds.find(round => round.id === activeRoundTab);
                  if (!activeRound) return null;
                  const activeRoundIndex = getRoundIndex(activeRound.id);
                  const activeTargetCount = getTargetQuestionCount(activeRound, activeRoundIndex);
                  const activeRoundKind = resolveRoundKind(activeRound, activeRoundIndex);

                  return (
                           <div className={`rounded-2xl p-4 ${activeRound.color}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-gray-900 dark:text-white">{activeRound.category}</span>
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                            {activeRound.questions.length}/{activeTargetCount} questions
                          </span>
                        </div>
                               <button
                                 onClick={() => removeRound(activeRound.id)}
                                 className="px-2 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full transition-colors flex items-center justify-center"
                                 title="Remove round"
                               >
                                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                   <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                 </svg>
                               </button>
                      </div>

                      {/* Round Description */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Round Description
                        </label>
                        <SpellCheckInput
                          value={activeRound.blurb}
                          onChange={(value) => updateRoundBlurb(activeRound.id, value)}
                          placeholder={`Brief description for this ${activeRound.category} round...`}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                          type="textarea"
                          rows={2}
                        />
                      </div>

                      {/* Questions */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {activeRoundKind === 'finale' ? "People's Question" : "Questions"}
                          </h4>
                          <div className="flex items-center gap-2">
                            {activeRound.questions.length < activeTargetCount && (
                              <button
                                onClick={() => setShowImportQuestionModal(true)}
                                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors font-medium flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Import
                              </button>
                            )}
                            {activeRound.questions.length < activeTargetCount && (
                                   <button
                                     onClick={() => addQuestion(activeRound.id)}
                                     className={`px-3 py-1 text-sm text-white rounded-full transition-colors font-medium flex items-center gap-1 ${
                                       buttonColors[activeRoundIndex % buttonColors.length]
                                     }`}
                                   >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                              Add Question ({activeTargetCount - activeRound.questions.length} remaining)
                            </button>
                            )}
                          </div>
                        </div>

                        {activeRound.questions.map((question, index) => (
                                 <div key={question.id} className={`rounded-2xl p-3 ${activeRound.color}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Question {index + 1}
                              </span>
                              <button
                                onClick={() => removeQuestion(activeRound.id, question.id)}
                                className="px-2 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full transition-colors flex items-center justify-center"
                                title="Remove question"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <div className="space-y-2">
                                     <SpellCheckInput
                                       value={question.question}
                                       onChange={(value) => updateQuestion(activeRound.id, question.id, 'question', value)}
                                       placeholder="Question..."
                                       className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                                     />
                                     <SpellCheckInput
                                       value={question.answer}
                                       onChange={(value) => updateQuestion(activeRound.id, question.id, 'answer', value)}
                                       placeholder="Answer..."
                                       className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                                     />
                            </div>
                          </div>
                        ))}

                        {activeRound.questions.length === 0 && (
                          <div className="text-center py-6 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl">
                            <p className="text-sm">No questions yet. Add your first question above.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* No rounds message */}
            {quiz.rounds.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl">
                <p className="text-sm">No rounds yet. Select a category above to create your first round.</p>
              </div>
            )}
          </div>

                   </div>

                   {/* Right Sidebar - Summary Panel */}
                   <aside className="hidden lg:block space-y-4">
                     {/* Progress Summary */}
                     <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Progress</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Sections</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {completedSections}/{TOTAL_ROUNDS}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(sectionsProgress, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">People's question</span>
                          <span className={`text-sm font-medium ${finaleReady ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {finaleReady ? 'Ready' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Questions</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {totalQuestionsAuthored}/{TOTAL_QUESTIONS}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((totalQuestionsAuthored / TOTAL_QUESTIONS) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Ready for publish: {Math.round((totalQuestionsAuthored / TOTAL_QUESTIONS) * 100)}%
                          </div>
                        </div>
                      </div>
                     </div>

                     {/* Quick Stats */}
                     <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                       <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Standard rounds</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {standardRoundsCompleted}/{STANDARD_ROUND_COUNT}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">People's question</span>
                          <span className={`text-sm font-medium ${finaleReady ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {finaleReady ? 'Configured' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Avg questions/standard round</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {averageStandardQuestions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Completion Status</span>
                          <span className={`text-sm font-medium ${
                            structureComplete
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-orange-600 dark:text-orange-400'
                          }`}>
                            {structureComplete ? 'Structure complete' : 'In progress'}
                          </span>
                        </div>
                      </div>
                     </div>

                     {/* Analytics Shortcut */}
                     <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800">
                       <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analytics</h3>
                       <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                         View performance data from last week's quizzes
                       </p>
                       <a 
                         href="/admin/analytics"
                         className="inline-flex items-center px-3 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-400 text-sm font-medium rounded-full transition-colors"
                       >
                         <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                         </svg>
                         View Analytics
                       </a>
                     </div>

                     {/* Autosave Status */}
                     <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
                       <div className="flex items-center justify-between">
                         <span className="text-sm text-gray-600 dark:text-gray-400">Last saved</span>
                         <span className="text-sm font-medium text-gray-900 dark:text-white">2 min ago</span>
                       </div>
                       <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                         Auto-save enabled
                       </div>
                     </div>
                   </aside>
                 </div>
               </div>
             </main>

             {/* Sticky Progress Bar */}
             {!isLoadingQuiz && !loadError && (
             <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0F1419] border-t border-gray-200 dark:border-gray-700 py-3 z-40">
               <div className="max-w-full mx-auto px-6 flex justify-between items-center">
                 <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Saved 2 min ago • {totalQuestionsPercent}% complete
                  </div>
                   <div className="flex items-center space-x-2">
                     <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                       <div 
                         className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(totalQuestionsPercent, 100)}%` }}
                       ></div>
                     </div>
                     <span className="text-xs text-gray-500 dark:text-gray-400">
                      {totalQuestionsAuthored}/{TOTAL_QUESTIONS} questions
                     </span>
                   </div>
                 </div>
                 <div className="flex gap-3 items-center">
                   <button
                     onClick={() => window.open('/preview', '_blank')}
                     className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors font-medium text-sm"
                   >
                     Preview
                   </button>
                   {saveError && (
                     <span className="text-sm text-red-600 dark:text-red-400">
                       {saveError}
                     </span>
                   )}
                   <button
                     onClick={() => saveQuiz(true)}
                     disabled={isSaving || !quiz.title.trim()}
                     className={`px-4 py-2 rounded-full font-medium transition-colors text-sm ${
                       isSaving || !quiz.title.trim()
                         ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                         : 'bg-gray-600 text-white hover:bg-gray-700'
                     }`}
                   >
                     {isSaving ? 'Saving...' : 'Save Draft'}
                   </button>
                   <button
                     onClick={() => setShowScheduleModal(true)}
                    disabled={!canPublish || isSaving}
                     className={`px-4 py-2 rounded-full font-medium transition-colors text-sm ${
                      canPublish && !isSaving
                         ? 'bg-orange-600 text-white hover:bg-orange-700'
                         : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                     }`}
                   >
                     {isSaving ? 'Saving...' : `Publish Quiz #${quiz.number}`}
                   </button>
                 </div>
               </div>
             </div>
             )}

      {/* Hidden file input for importing drafts */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Schedule Quiz Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Schedule Quiz #{quiz.number}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Publish Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Quiz will be automatically published at the scheduled time.</p>
                <p className="mt-1">Total questions: {totalQuestionsAuthored}/{TOTAL_QUESTIONS}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => saveQuiz(false, true)}
                  disabled={!scheduledDate || !canPublish}
                  className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors ${
                    scheduledDate && canPublish
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  Schedule Quiz
                </button>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduledDate('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


             {/* Import Question Modal */}
             {showImportQuestionModal && activeRoundTab && (
               <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                 <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                       Import Question - {quiz.rounds.find(r => r.id === activeRoundTab)?.category}
                     </h3>
                     <button
                       onClick={() => setShowImportQuestionModal(false)}
                       className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                     >
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                       </svg>
                     </button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto">
                     <div className="space-y-3">
                       {(() => {
                         const activeRound = quiz.rounds.find(r => r.id === activeRoundTab);
                         const availableQuestions = questionBank[activeRound?.category as keyof typeof questionBank] || [];
                         
                         return availableQuestions.map((question) => (
                           <div key={question.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                             <div className="flex items-start justify-between">
                               <div className="flex-1">
                                 <h4 className="font-medium text-gray-900 dark:text-white mb-2">{question.question}</h4>
                                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                   <span className="font-medium">Answer:</span> {question.answer}
                                 </p>
                                 {question.explanation && (
                                   <p className="text-sm text-gray-500 dark:text-gray-500">
                                     <span className="font-medium">Explanation:</span> {question.explanation}
                                   </p>
                                 )}
                               </div>
                               <button
                                 onClick={() => importQuestion(activeRoundTab, question)}
                                 className="ml-4 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors font-medium"
                               >
                                 Import
                               </button>
                             </div>
                           </div>
                         ));
                       })()}
                       
                       {(() => {
                         const activeRound = quiz.rounds.find(r => r.id === activeRoundTab);
                         const availableQuestions = questionBank[activeRound?.category as keyof typeof questionBank] || [];
                         
                         if (availableQuestions.length === 0) {
                           return (
                             <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                               <p className="text-sm">No questions available for this category.</p>
                             </div>
                           );
                         }
                         
                         return null;
                       })()}
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {/* New Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                  placeholder="Enter category name..."
                  autoFocus
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={addNewCategory}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Category
                </button>
                <button
                  onClick={() => {
                    setShowNewCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}