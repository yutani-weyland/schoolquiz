"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useUserAccess } from "@/contexts/UserAccessContext";

export default function HeroCTA() {
  const { isVisitor, isFree, isPremium, isLoading } = useUserAccess();

  if (isLoading) {
    // SSR fallback - show logged out state
    return (
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
        <Link
          href="/sign-up"
          className="inline-flex items-center justify-center h-12 px-6 bg-[#3B82F6] text-white rounded-full font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 min-w-[200px]"
        >
          Try Demo Quiz
        </Link>
        <Link
          href="/sign-up"
          className="inline-flex items-center justify-center h-12 px-6 border border-gray-300 dark:border-[#DCDCDC] text-gray-700 dark:text-[#DCDCDC] rounded-full font-medium hover:bg-gray-100 dark:hover:bg-[#DCDCDC] hover:text-gray-900 dark:hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-[#DCDCDC] focus:ring-offset-2 min-w-[200px]"
        >
          Join for free
        </Link>
      </div>
    );
  }

  if (isVisitor) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-row items-center gap-3 sm:gap-4 justify-center flex-wrap w-full max-w-md mx-auto"
      >
        <Link
          href="/sign-up"
          className="inline-flex items-center justify-center h-12 px-4 sm:px-6 bg-[#3B82F6] text-white rounded-full text-sm sm:text-base font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 flex-1 sm:flex-none sm:min-w-[200px]"
        >
          Join for free
        </Link>
        <Link
          href="/quizzes/12/intro"
          className="inline-flex items-center justify-center gap-2 h-12 px-4 sm:px-6 border border-gray-300 dark:border-[#DCDCDC] text-gray-700 dark:text-[#DCDCDC] rounded-full text-sm sm:text-base font-medium hover:bg-gray-100 dark:hover:bg-[#DCDCDC] hover:text-gray-900 dark:hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-[#DCDCDC] focus:ring-offset-2 flex-1 sm:flex-none sm:min-w-[200px]"
        >
          Play the quiz
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
          href="/quizzes/12/intro"
          className="inline-flex items-center justify-center h-12 px-6 bg-[#3B82F6] text-white rounded-full font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 min-w-[200px]"
        >
          Play this week's quiz
        </Link>
        {!isPremium && (
          <Link
            href="/upgrade"
            className="inline-flex items-center justify-center h-12 px-6 border border-gray-300 dark:border-[#DCDCDC] text-gray-700 dark:text-[#DCDCDC] rounded-full font-medium hover:bg-gray-100 dark:hover:bg-[#DCDCDC] hover:text-gray-900 dark:hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-[#DCDCDC] focus:ring-offset-2 min-w-[200px]"
          >
            Upgrade to Premium
          </Link>
        )}
      </motion.div>
    );
  }

  return null;
}

