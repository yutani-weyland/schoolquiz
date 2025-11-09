"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// Stub auth helper - replace with real auth check later
function isLoggedIn(): boolean {
	if (typeof window === 'undefined') return false;
	// Check for session or auth token
	return localStorage.getItem('isLoggedIn') === 'true' || !!sessionStorage.getItem('authToken');
}

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
        <Link
          href="/sign-up"
          className="inline-flex items-center justify-center px-6 py-3 bg-[#3B82F6] text-white rounded-full font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 min-w-[200px]"
        >
          3 Quizzes for Free
        </Link>
        <Link
          href="/premium"
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-[#DCDCDC] text-gray-700 dark:text-[#DCDCDC] rounded-full font-medium hover:bg-gray-100 dark:hover:bg-[#DCDCDC] hover:text-gray-900 dark:hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-[#DCDCDC] focus:ring-offset-2 min-w-[200px]"
        >
          Upgrade to Premium
        </Link>
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
        <Link
          href="/quizzes"
          className="inline-flex items-center justify-center px-6 py-3 bg-[#3B82F6] text-white rounded-full font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 min-w-[200px]"
        >
          Play this week's quiz
        </Link>
        <Link
          href="/upgrade"
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-[#DCDCDC] text-gray-700 dark:text-[#DCDCDC] rounded-full font-medium hover:bg-gray-100 dark:hover:bg-[#DCDCDC] hover:text-gray-900 dark:hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-[#DCDCDC] focus:ring-offset-2 min-w-[200px]"
        >
          Upgrade to Premium
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-center gap-4 justify-center"
    >
      <Link
        href="/sign-up"
        className="inline-flex items-center justify-center px-6 py-3 bg-[#3B82F6] text-white rounded-full font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 min-w-[200px] shadow-lg hover:shadow-xl"
      >
        Subscribe for Free
      </Link>
      <Link
        href="/premium"
        className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-[#DCDCDC] text-gray-700 dark:text-[#DCDCDC] rounded-full font-medium hover:bg-gray-100 dark:hover:bg-[#DCDCDC] hover:text-gray-900 dark:hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-[#DCDCDC] focus:ring-offset-2 min-w-[200px]"
      >
        Upgrade to Premium
      </Link>
    </motion.div>
  );
}

