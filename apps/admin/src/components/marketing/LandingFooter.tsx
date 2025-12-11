/**
 * LandingFooter - Lightweight footer for the landing page
 * 
 * This is a server component (no 'use client') that renders
 * completely static HTML with no JavaScript dependencies.
 */

import Link from 'next/link';
import { Logo } from '@/components/Logo';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();
  const startYear = 2024;
  const endYear = 2026;

  return (
    <footer className="relative bg-blue-600 dark:bg-blue-700 text-white pt-16 sm:pt-20 md:pt-24 pb-8 px-4 sm:px-6 md:px-8">
      {/* Subtle top gradient/shadow for separation */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-black/5 to-transparent" />
      
      {/* Rounded top corners effect */}
      <div 
        className="absolute top-0 left-0 right-0 h-6 md:h-8 rounded-b-[1.5rem] md:rounded-b-[2.5rem] bg-gray-50 dark:bg-[#0F1419]" 
      />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-10 sm:gap-12 lg:gap-16 pb-16 sm:pb-20 md:pb-24">
          {/* Brand Block */}
          <div className="space-y-4 flex-shrink-0 lg:max-w-md">
            <Link href="/" className="inline-block group">
              <Logo className="h-8 w-auto text-white transition-opacity group-hover:opacity-80" />
            </Link>
            <p className="text-blue-100/90 text-sm leading-relaxed">
              Weekly quiz for Australian students. Test your knowledge and compete with friends.
            </p>
            <p className="text-blue-200/70 text-xs italic">
              Built by a teacher for teachers
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-normal text-blue-100/70">
            <Link href="/quizzes" className="hover:text-white transition-colors">Quizzes</Link>
            <span className="text-blue-200/40">·</span>
            <Link href="/achievements" className="hover:text-white transition-colors">Achievements</Link>
            <span className="text-blue-200/40">·</span>
            <Link href="/upgrade" className="hover:text-white transition-colors">Pricing</Link>
            <span className="text-blue-200/40">·</span>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <span className="text-blue-200/40">·</span>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <span className="text-blue-200/40">·</span>
            <Link href="/help" className="hover:text-white transition-colors">Help Center</Link>
            <span className="text-blue-200/40">·</span>
            <Link href="/account" className="hover:text-white transition-colors">Account</Link>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-blue-500/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-blue-100/70 text-xs flex items-center gap-2 flex-wrap">
              <span>© {startYear === currentYear ? currentYear : `${startYear}–${endYear}`} The School Quiz</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">Made in Australia</span>
            </div>
            <nav className="flex gap-4 md:gap-6">
              <Link href="/privacy" className="text-blue-100/70 hover:text-white transition-colors text-xs">Privacy</Link>
              <Link href="/terms" className="text-blue-100/70 hover:text-white transition-colors text-xs">Terms</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
