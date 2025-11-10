"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useUserAccess } from "@/contexts/UserAccessContext";

export default function HeroCTA() {
  const { isVisitor, isFree, isPremium, isLoading } = useUserAccess();

  if (isLoading) {
    // SSR fallback - show logged out state
    return (
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
        <Link
          href="/sign-up"
          className="inline-flex items-center justify-center px-6 py-3 bg-[#3B82F6] text-white rounded-full font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 min-w-[200px]"
        >
          Try Demo Quiz
        </Link>
        <Link
          href="/sign-up"
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-[#DCDCDC] text-gray-700 dark:text-[#DCDCDC] rounded-full font-medium hover:bg-gray-100 dark:hover:bg-[#DCDCDC] hover:text-gray-900 dark:hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-[#DCDCDC] focus:ring-offset-2 min-w-[200px]"
        >
          Sign Up Free
        </Link>
      </div>
    );
  }

  if (isVisitor) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center gap-4 justify-center"
      >
        <Link
          href="/quizzes/279/intro"
          className="inline-flex items-center justify-center px-6 py-3 bg-[#3B82F6] text-white rounded-full font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 min-w-[200px] shadow-none"
        >
          Play This Week's Quiz
        </Link>
      </motion.div>
    );
  }

  if (isFree || isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center gap-4 justify-center"
      >
        <Link
          href="/quizzes"
          className="inline-flex items-center justify-center px-6 py-3 bg-[#3B82F6] text-white rounded-full font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 min-w-[200px]"
        >
          Play this week's quiz
        </Link>
        {!isPremium && (
          <Link
            href="/upgrade"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-[#DCDCDC] text-gray-700 dark:text-[#DCDCDC] rounded-full font-medium hover:bg-gray-100 dark:hover:bg-[#DCDCDC] hover:text-gray-900 dark:hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-[#DCDCDC] focus:ring-offset-2 min-w-[200px]"
          >
            Upgrade to Premium
          </Link>
        )}
      </motion.div>
    );
  }

  return null;
}

