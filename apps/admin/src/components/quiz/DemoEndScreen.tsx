'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useUserAccess } from '@/contexts/UserAccessContext';
import Link from 'next/link';

interface DemoEndScreenProps {
  score: number;
  totalQuestions: number;
  onRestart?: () => void;
}

export function DemoEndScreen({ score, totalQuestions, onRestart }: DemoEndScreenProps) {
  const { userName } = useUserAccess();
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {/* Score Display */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-8"
          >
            <div className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-white mb-4">
              {score}/{totalQuestions}
            </div>
            <div className="text-2xl md:text-3xl font-semibold text-gray-600 dark:text-gray-400">
              {percentage}% correct
            </div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Nice work{userName ? `, ${userName}` : ''}!
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-2">
              You scored {score} out of {totalQuestions} questions.
            </p>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
              Join our community to get free access to the latest edition of <span className="font-bold text-blue-600 dark:text-blue-400">The School Quiz</span>, plus weekly email and SMS reminders!
            </p>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8 text-sm text-gray-500 dark:text-gray-400"
          >
            Most people sign up after their first round
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/sign-up"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Join our Community
            </Link>
            {onRestart && (
              <button
                onClick={onRestart}
                className="px-8 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
              >
                Try demo again
              </button>
            )}
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              When you join, you'll get:
            </p>
            <ul className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Free access to latest edition
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Full quizzes (25 questions)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Weekly email & SMS reminders
              </li>
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

