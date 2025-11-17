'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden"
              style={{
                boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.5)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Unfinished Questions
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You have {unansweredQuestions.length} unanswered question{unansweredQuestions.length !== 1 ? 's' : ''}. 
                  Click on any question below to navigate to it.
                </p>

                <div className="space-y-3">
                  {unansweredQuestions.map((question) => {
                    const questionIndex = getQuestionIndex(question.id);
                    const questionNumber = questionIndex + 1;
                    
                    return (
                      <motion.button
                        key={question.id}
                        onClick={() => {
                          onNavigateToQuestion(questionIndex);
                          onClose();
                        }}
                        className="w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 shadow-[0_1px_2px_0_rgba(0,0,0,0.05),inset_0_1px_2px_0_rgba(255,255,255,0.5)]"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-4">
                          {/* Numbered circle */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 shadow-[0_1px_2px_0_rgba(0,0,0,0.05),inset_0_1px_2px_0_rgba(255,255,255,0.5)]">
                            <span className="text-base font-bold text-gray-700 dark:text-gray-300">
                              {questionNumber}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-900 dark:text-white line-clamp-2 font-medium">
                              {question.question}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Answered questions count */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>
                      {allQuestions.length - unansweredQuestions.length} of {allQuestions.length} questions answered
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <motion.button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-full font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05),inset_0_1px_2px_0_rgba(255,255,255,0.5)] border border-gray-200 dark:border-gray-700"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue Quiz
                </motion.button>
                <motion.button
                  onClick={onFinishAnyway}
                  className="flex-1 px-6 py-3 rounded-full font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05),inset_0_1px_2px_0_rgba(255,255,255,0.5)]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Finish Anyway
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

