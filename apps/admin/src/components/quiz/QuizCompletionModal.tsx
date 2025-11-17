'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, UserPlus, Trophy, Target, CheckCircle, RotateCcw, Home } from 'lucide-react';
import { useUserAccess } from '@/contexts/UserAccessContext';
import Link from 'next/link';

interface QuizCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  totalQuestions: number;
  quizSlug: string;
  quizTitle: string;
  onReviewAnswers?: () => void;
}

export function QuizCompletionModal({
  isOpen,
  onClose,
  score,
  totalQuestions,
  quizSlug,
  quizTitle,
  onReviewAnswers,
}: QuizCompletionModalProps) {
  const { isVisitor } = useUserAccess();
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const handleShare = async () => {
    const url = `${window.location.origin}/quizzes/${quizSlug}/intro`;
    const text = `I just scored ${score}/${totalQuestions} (${percentage}%) on "${quizTitle}"! Try it yourself:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: quizTitle,
          text,
          url,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        alert('Quiz link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const stats = [
    {
      label: 'Score',
      value: `${score}/${totalQuestions}`,
      description: 'Questions correct',
      icon: Trophy,
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      iconBg: 'bg-blue-600',
    },
    {
      label: '% Correct',
      value: `${percentage}%`,
      description: 'Accuracy',
      icon: Target,
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      iconBg: 'bg-green-600',
    },
    {
      label: 'Questions',
      value: totalQuestions.toString(),
      description: 'Total answered',
      icon: CheckCircle,
      bgColor: 'bg-purple-500',
      textColor: 'text-white',
      iconBg: 'bg-purple-600',
    },
  ];

  // Slight rotation angles for each card
  const rotations = [-0.75, 0.5, -0.5];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              // When closing, navigate to quizzes page
              window.location.href = '/quizzes';
            }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-2xl w-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2),0_20px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4),0_20px_40px_-10px_rgba(0,0,0,0.3)] relative overflow-hidden pointer-events-auto"
            >
              {/* Light highlight on top */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/10 pointer-events-none" />

              {/* Close button */}
              <button
                onClick={() => {
                  // When closing, navigate to quizzes page
                  window.location.href = '/quizzes';
                }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    Quiz Complete!
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Great job completing the quiz
                  </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    const rotation = rotations[index] || 0;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10, rotate: 0 }}
                        animate={{ opacity: 1, y: 0, rotate: rotation }}
                        transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                        whileHover={{ rotate: rotation + (rotation > 0 ? 0.5 : -0.5), scale: 1.02 }}
                        className={`${stat.bgColor} rounded-2xl p-6 shadow-[0_2px_4px_0_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_4px_0_rgba(0,0,0,0.3),0_4px_6px_-1px_rgba(0,0,0,0.2)] relative overflow-hidden`}
                      >
                        {/* Light highlight on top */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                        <div className="relative z-10 text-center">
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <div className={`${stat.iconBg} rounded-lg p-1.5 shadow-sm`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className={`text-xs font-medium ${stat.textColor} opacity-90`}>
                              {stat.label}
                            </span>
                          </div>
                          <div className={`text-4xl md:text-5xl font-bold ${stat.textColor} mb-1`}>
                            {stat.value}
                          </div>
                          <div className={`text-xs ${stat.textColor} opacity-75`}>
                            {stat.description}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {onReviewAnswers && (
                      <motion.button
                        onClick={() => {
                          onReviewAnswers();
                          onClose();
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all shadow-[0_2px_4px_0_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_4px_0_rgba(0,0,0,0.3),0_4px_6px_-1px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_6px_0_rgba(0,0,0,0.15),0_8px_12px_-2px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_6px_0_rgba(0,0,0,0.4),0_8px_12px_-2px_rgba(0,0,0,0.3)] relative overflow-hidden"
                      >
                        {/* Light highlight on top */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                        <RotateCcw className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">Review Answers</span>
                      </motion.button>
                    )}
                    
                    <Link href="/quizzes" className="flex-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-full font-medium transition-all shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] dark:hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.3)] relative overflow-hidden"
                      >
                        {/* Light highlight on top */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10 pointer-events-none" />
                        <Home className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">Back to Quizzes</span>
                      </motion.button>
                    </Link>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button
                      onClick={handleShare}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-full font-medium transition-all shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] dark:hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.3)] relative overflow-hidden"
                    >
                      {/* Light highlight on top */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10 pointer-events-none" />
                      <Share2 className="w-5 h-5 relative z-10" />
                      <span className="relative z-10">Share Quiz</span>
                    </motion.button>

                    {isVisitor && (
                      <Link
                        href="/sign-up"
                        className="flex-1"
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all shadow-[0_2px_4px_0_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_4px_0_rgba(0,0,0,0.3),0_4px_6px_-1px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_6px_0_rgba(0,0,0,0.15),0_8px_12px_-2px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_6px_0_rgba(0,0,0,0.4),0_8px_12px_-2px_rgba(0,0,0,0.3)] relative overflow-hidden"
                        >
                          {/* Light highlight on top */}
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                          <UserPlus className="w-5 h-5 relative z-10" />
                          <span className="relative z-10">Sign Up</span>
                        </motion.button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

