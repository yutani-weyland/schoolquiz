"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X, ArrowRight, Star } from "lucide-react";

interface QuizLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizzesPlayed: number;
  maxQuizzes: number;
}

export function QuizLimitModal({ isOpen, onClose, quizzesPlayed, maxQuizzes }: QuizLimitModalProps) {
  if (!isOpen) return null;

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
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Free Quizzes Used
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      You've used all {maxQuizzes} free quizzes
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    You've already played {quizzesPlayed} quiz{quizzesPlayed !== 1 ? 'es' : ''} with your free account. 
                    To continue playing unlimited quizzes and access all features, upgrade to Premium.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    With Premium, you'll get:
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Unlimited quiz access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Access to all quizzes (not just latest)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Private leagues</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Advanced analytics</span>
                    </li>
                  </ul>
                </div>

                {/* CTA Button */}
                <a
                  href="/upgrade"
                  onClick={onClose}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                >
                  Upgrade to Premium
                  <ArrowRight className="w-4 h-4" />
                </a>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  Questions? <a href="/contact" className="text-gray-900 dark:text-white font-medium hover:underline">Contact us</a>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

