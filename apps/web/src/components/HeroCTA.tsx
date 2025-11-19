"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { isLoggedIn } from "../lib/auth";

export default function HeroCTA() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLoggedIn(isLoggedIn());
    
    // Listen for auth changes
    const handleStorageChange = () => {
      setLoggedIn(isLoggedIn());
    };
    
    window.addEventListener("storage", handleStorageChange);
    // Also check on focus in case auth changed in another tab
    window.addEventListener("focus", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, []);

  if (!mounted) {
    // SSR fallback - show logged out state
    return (
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
        <a
          href="/sign-up"
          className="inline-flex items-center justify-center px-6 h-12 bg-[#3B82F6] text-white rounded-full font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 min-w-[200px]"
        >
          3 Quizzes for Free
        </a>
        <a
          href="/premium"
          className="inline-flex items-center justify-center px-6 h-12 border border-gray-300 dark:border-[#DCDCDC] text-gray-700 dark:text-[#DCDCDC] rounded-full font-medium hover:bg-gray-100 dark:hover:bg-[#DCDCDC] hover:text-gray-900 dark:hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-[#DCDCDC] focus:ring-offset-2 min-w-[200px]"
        >
          Upgrade to Premium
        </a>
      </div>
    );
  }

  if (loggedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center gap-4 justify-center"
      >
        <a
          href="/quizzes"
          className="inline-flex items-center justify-center px-6 h-12 bg-[#3B82F6] text-white rounded-full font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 min-w-[200px]"
        >
          Play this week's quiz
        </a>
        <a
          href="/upgrade"
          className="inline-flex items-center justify-center px-6 h-12 border border-gray-300 dark:border-[#DCDCDC] text-gray-700 dark:text-[#DCDCDC] rounded-full font-medium hover:bg-gray-100 dark:hover:bg-[#DCDCDC] hover:text-gray-900 dark:hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-[#DCDCDC] focus:ring-offset-2 min-w-[200px]"
        >
          Upgrade to Premium
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-center gap-4 justify-center"
    >
      <a
        href="/sign-up"
        className="inline-flex items-center justify-center px-6 h-12 bg-[#3B82F6] text-white rounded-full font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 min-w-[200px] shadow-lg hover:shadow-xl"
      >
        Subscribe for Free
      </a>
      <a
        href="/premium"
        className="inline-flex items-center justify-center px-6 h-12 border border-gray-300 dark:border-[#DCDCDC] text-gray-700 dark:text-[#DCDCDC] rounded-full font-medium hover:bg-gray-100 dark:hover:bg-[#DCDCDC] hover:text-gray-900 dark:hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-[#DCDCDC] focus:ring-offset-2 min-w-[200px]"
      >
        Upgrade to Premium
      </a>
    </motion.div>
  );
}

