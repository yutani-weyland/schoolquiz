'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';
import Link from 'next/link';
import { useUserAccess } from '@/contexts/UserAccessContext';

interface MidQuizSignupPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: () => void;
  questionsAnswered: number;
}

export function MidQuizSignupPrompt({ 
  isOpen, 
  onClose, 
  onSignUp,
  questionsAnswered 
}: MidQuizSignupPromptProps) {
  const { userName } = useUserAccess();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-4">
                  <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  Join our Community!
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                  Sign up to continue playing and save your progress.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Most people sign up after their first round
                </p>
              </div>

              {/* Benefits */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  When you join, you'll get:
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Free access to the latest edition of <span className="font-bold text-blue-600 dark:text-blue-400">The School Quiz</span></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Complete the full quiz (25 questions)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Save your progress and achievements</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Weekly email and SMS reminders</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Appear on leaderboards</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/sign-up"
                  onClick={onSignUp}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-center shadow-lg hover:shadow-xl"
                >
                  Join our Community
                </Link>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
                >
                  Continue viewing
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

