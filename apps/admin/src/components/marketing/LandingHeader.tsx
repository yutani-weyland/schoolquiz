'use client';

/**
 * LandingHeader - Lightweight header for the landing page
 * 
 * This is a minimal header that:
 * - Does NOT import framer-motion
 * - Does NOT import next-auth/react or useSession
 * - Does NOT import heavy contexts (UserAccessContext)
 * - Uses CSS transitions instead of motion animations
 * 
 * For logged-in state detection, we check localStorage directly
 * which is available immediately without waiting for session.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Menu, X, User, Sun, Moon, Info, Play, Sparkles, CreditCard, UserPlus, LogIn } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { applyTheme, Theme } from '@/lib/theme';

export function LandingHeader() {
  const { isDark, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll to hide/show logo
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (target.closest('button[aria-label*="menu"]')) {
          return;
        }
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMenuOpen]);

  const handleLinkClick = useCallback(() => {
    setTimeout(() => {
      setIsMenuOpen(false);
    }, 100);
  }, []);

  return (
    <>
      <header className="site-header fixed top-0 left-0 right-0 z-[1100]">
        <div className="flex items-center justify-between w-full" style={{ height: '100%' }}>
          <Link
            id="site-logo"
            href="/"
            className={`transition-all duration-300 hover:opacity-80 cursor-pointer ${
              isScrolled 
                ? 'opacity-0 pointer-events-none -translate-x-4 w-0 overflow-hidden' 
                : 'opacity-100 translate-x-0'
            }`}
          >
            <Logo className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/sign-up"
              className="hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
            >
              Sign Up
            </Link>
            <div className="relative flex-shrink-0 flex items-center gap-2" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="w-12 h-12 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-800 backdrop-blur-sm text-gray-900 dark:text-white relative z-[120] shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 flex-shrink-0 active:scale-95"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 transition-transform duration-200" />
                ) : (
                  <Menu className="w-5 h-5 transition-transform duration-200" />
                )}
              </button>

              {/* Backdrop overlay */}
              {isMenuOpen && (
                <div
                  className="fixed inset-0 bg-black/30 backdrop-blur-md z-[1100] transition-opacity duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Dropdown Menu - CSS transitions instead of framer-motion */}
              <div
                className={`fixed top-20 right-4 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 flex flex-col z-[1101] overflow-hidden pointer-events-auto transition-all duration-300 ease-out ${
                  isMenuOpen 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 translate-x-full pointer-events-none'
                }`}
              >
                <div className="p-4 overflow-y-auto flex-1">
                  {/* Visitor menu - optimized for conversion */}
                  <div className="space-y-1">
                    <Link
                      href="/quizzes/12/intro"
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      Play the quiz
                    </Link>
                    <Link
                      href="/#features"
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Sparkles className="w-5 h-5" />
                      How it works
                    </Link>
                    <Link
                      href="/#pricing"
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <CreditCard className="w-5 h-5" />
                      Pricing
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
                    <Link
                      href="/sign-in"
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <LogIn className="w-5 h-5" />
                      Log in
                    </Link>
                    <Link
                      href="/sign-up"
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <UserPlus className="w-5 h-5" />
                      Sign up
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
                    <Link
                      href="/about"
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Info className="w-5 h-5" />
                      About
                    </Link>
                  </div>

                  {/* Dark Mode Toggle - Only show when mounted to avoid hydration mismatch */}
                  <div className="border-t border-gray-100 dark:border-gray-700/50 my-3"></div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {mounted && isDark ? (
                        <Sun className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <Moon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      )}
                      <span className="text-base text-gray-700 dark:text-gray-200">Dark mode</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextTheme: Theme = isDark ? "light" : "dark";
                        applyTheme(nextTheme);
                        toggleTheme();
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        mounted && isDark ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      role="switch"
                      aria-checked={mounted && isDark}
                      aria-label="Toggle dark mode"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          mounted && isDark ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
