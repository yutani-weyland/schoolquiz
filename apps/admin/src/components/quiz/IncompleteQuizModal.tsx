'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, ArrowRight } from 'lucide-react';
import { QuizQuestion } from './play/types';

interface IncompleteQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinishAnyway: () => void;
  unansweredQuestions: QuizQuestion[];
  allQuestions: QuizQuestion[];
  onNavigateToQuestion: (questionIndex: number) => void;
  viewMode: 'presenter' | 'grid';
}

export function IncompleteQuizModal({
  isOpen,
  onClose,
  onFinishAnyway,
  unansweredQuestions,
  allQuestions,
  onNavigateToQuestion,
  viewMode,
}: IncompleteQuizModalProps) {
  if (!isOpen) return null;

  const getQuestionIndex = (questionId: number) => {
    return allQuestions.findIndex(q => q.id === questionId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 max-w-2xl w-full relative overflow-hidden pointer-events-auto max-h-[85vh] flex flex-col"
            >

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              <div className="relative z-10 flex flex-col flex-1 min-h-0">
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    Unfinished Questions
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    You have {unansweredQuestions.length} unanswered question{unansweredQuestions.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Questions List */}
                <div className="flex-1 overflow-y-auto mb-6 space-y-3 pr-2 scrollbar-hide">
                  {unansweredQuestions.map((question, index) => {
                    const questionIndex = getQuestionIndex(question.id);
                    const questionNumber = questionIndex + 1;
                    
                    return (
                      <motion.button
                        key={question.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          onNavigateToQuestion(questionIndex);
                          onClose();
                        }}
                        className="w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700 relative group"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center gap-4">
                          {/* Numbered circle */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {questionNumber}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-900 dark:text-white line-clamp-2 font-medium text-sm md:text-base">
                              {question.question}
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Progress Summary */}
                <div className="mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>
                      {allQuestions.length - unansweredQuestions.length} of {allQuestions.length} questions answered
                    </span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-full font-medium transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    Continue Quiz
                  </motion.button>
                  <motion.button
                    onClick={onFinishAnyway}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
                  >
                    Finish Anyway
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

