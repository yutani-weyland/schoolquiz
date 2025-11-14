'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Settings, Wallet, Users, Pencil, Plus, LogOut, Sun, Moon, LayoutDashboard, Trophy, BarChart3, Crown, Info, Play, BookOpen } from 'lucide-react';
import { useUserAccess } from '@/contexts/UserAccessContext';
import { useTheme } from '@/contexts/ThemeContext';
import { applyTheme, Theme } from '@/lib/theme';
import { storage, getUserId, getUserName } from '@/lib/storage';
import { logger } from '@/lib/logger';

export function SiteHeader({ fadeLogo = false }: { fadeLogo?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn: userIsLoggedIn, userName, userEmail, tier, isVisitor, isFree, isPremium, isLoading: userLoading } = useUserAccess();
  const { isDark, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Capture safe-area-inset-top once on mount to prevent header jumping on scroll
  useEffect(() => {
    try {
      // Create a temporary element to measure safe-area-inset-top
      const testEl = document.createElement('div');
      testEl.style.position = 'fixed';
      testEl.style.top = '0';
      testEl.style.left = '0';
      testEl.style.width = '1px';
      testEl.style.height = '1px';
      testEl.style.paddingTop = 'env(safe-area-inset-top)';
      testEl.style.visibility = 'hidden';
      testEl.style.pointerEvents = 'none';
      document.body.appendChild(testEl);
      const computedStyle = window.getComputedStyle(testEl);
      const safeAreaTop = computedStyle.paddingTop || '0px';
      document.body.removeChild(testEl);
      document.documentElement.style.setProperty('--safe-area-top-fixed', safeAreaTop);
    } catch (e) {
      // Fallback to 0px if measurement fails
      document.documentElement.style.setProperty('--safe-area-top-fixed', '0px');
    }
  }, []);
  
  // Use userIsLoggedIn directly to avoid hydration issues
  const isLoggedIn = userIsLoggedIn;
  
  // Safety check: if localStorage says logged in, override context
  const [localStorageLoggedIn, setLocalStorageLoggedIn] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      const actuallyLoggedIn = !!(authToken && userId);
      setLocalStorageLoggedIn(actuallyLoggedIn);
    }
  }, []);
  
  // Determine if user is free - use context's isFree which is more reliable
  // isFreeUser is for header buttons, isFree is for menu items
  // If localStorage says logged in but context hasn't updated, assume free tier
  const effectiveIsFree = isFree || (localStorageLoggedIn && !isPremium && !isVisitor);
  const effectiveIsVisitor = isVisitor && !localStorageLoggedIn; // Only visitor if NOT logged in per localStorage
  const isFreeUser = effectiveIsFree; // Use effectiveIsFree for consistency
  
  // Debug logging
  useEffect(() => {
    console.log('[SiteHeader] Auth state:', {
      isLoggedIn,
      isVisitor,
      isFree,
      isPremium,
      tier,
      isFreeUser,
      localStorageLoggedIn,
      effectiveIsFree,
      effectiveIsVisitor,
    });
  }, [isLoggedIn, isVisitor, isFree, isPremium, tier, isFreeUser, localStorageLoggedIn, effectiveIsFree, effectiveIsVisitor]);
  
  // Check if we're on the quizzes page
  const isOnQuizzesPage = pathname === '/quizzes';
  const isOnIndexPage = pathname === '/';

  useEffect(() => {
    // Get user ID if logged in
    if (userIsLoggedIn) {
      // Try to get userId from localStorage or fetch from API
      const storedUserId = getUserId();
      if (storedUserId) {
        setUserId(storedUserId);
      } else {
        // Try to fetch userId from profile API
        const token = storage.get<string | null>('authToken', null);
        if (token) {
          fetch('/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.id) {
                setUserId(data.id);
                storage.set('userId', data.id);
              }
            })
            .catch(() => {
              // Fallback: use mock userId for now
              logger.warn('Failed to fetch user profile, using fallback');
              setUserId('user-andrew-123');
            });
        }
      }
    }
  }, [userIsLoggedIn]);

  const handleLinkClick = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    // Clear auth session
    storage.remove('authToken');
    storage.remove('isLoggedIn');
    storage.remove('userId');
    storage.remove('userEmail');
    storage.remove('userName');
    storage.remove('userTier');
    
    // Close menu
    setIsMenuOpen(false);
    
    // Redirect to home/index page
    window.location.href = '/';
  }, []);

  const handleStorageChange = useCallback(() => {
    if (userIsLoggedIn) {
      const storedUserId = getUserId();
      if (storedUserId) {
        setUserId(storedUserId);
      }
    } else {
      setUserId(null);
    }
  }, [userIsLoggedIn]);

  // Listen for login changes
  useEffect(() => {
    // Check on focus (when user switches tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, [handleStorageChange]);

  // Handle scroll to hide/show logo
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50); // Hide logo after 50px scroll
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside (but not on the button itself)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Don't close if clicking on the button
        const target = event.target as HTMLElement;
        if (target.closest('button[aria-label*="menu"]')) {
          return;
        }
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      // Use a small delay to prevent immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMenuOpen]);

  return (
    <>
      <header className="site-header fixed top-0 left-0 right-0 z-[100]">
        <div className="flex items-center justify-between w-full" style={{ height: '100%' }}>
          <Link
            id="site-logo"
            data-fade={fadeLogo ? 'true' : 'false'}
            href={isLoggedIn ? '/quizzes' : '/'}
            className={`text-2xl font-bold text-gray-900 dark:text-white tracking-tight transition-all duration-300 hover:opacity-80 cursor-pointer ${
              isScrolled 
                ? 'opacity-0 pointer-events-none -translate-x-4 w-0 overflow-hidden' 
                : 'opacity-100 translate-x-0'
            }`}
          >
            The School Quiz
          </Link>
          <div className="flex items-center gap-3 flex-shrink-0">
            {isOnQuizzesPage && isFreeUser && (
              <Link
                href="/upgrade"
                className="hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
              >
                <Crown className="w-4 h-4" />
                Get Premium
              </Link>
            )}
            {isOnIndexPage && !isLoggedIn && (
              <Link
                href="/sign-up"
                className="hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
              >
                Sign Up
              </Link>
            )}
            {isOnIndexPage && isFreeUser && (
              <Link
                href="/upgrade"
                className="hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
              >
                <Crown className="w-4 h-4" />
                Get Premium
              </Link>
            )}
            <div className="relative flex-shrink-0" ref={menuRef}>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="w-12 h-12 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-800 backdrop-blur-sm text-gray-900 dark:text-white relative z-[100] shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Backdrop overlay */}
              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="fixed inset-0 bg-black/30 backdrop-blur-md z-[90]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                      }}
                      aria-hidden="true"
                    />
                  </>
                )}
              </AnimatePresence>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed top-20 right-4 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 flex flex-col z-[100] overflow-hidden"
                  >
                  <div className="p-4 overflow-y-auto flex-1">
                  {/* User Profile Section - Only for logged-in users */}
                  {(isLoggedIn || localStorageLoggedIn) && (
                    <div className="px-0 py-0 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700/50">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-base relative flex-shrink-0">
                          {(userName || getUserName()) ? (userName || getUserName())?.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white text-base truncate">
                              {userName || getUserName() || 'User'}
                            </p>
                            {isPremium && (
                              <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Menu Items - Tier-specific */}
                  <div className="py-2">
                    {(() => {
                      console.log('[SiteHeader Menu] Rendering menu with:', {
                        isVisitor,
                        effectiveIsVisitor,
                        isFree,
                        effectiveIsFree,
                        isPremium,
                        tier,
                        isLoading: userLoading,
                        isLoggedIn,
                        localStorageLoggedIn,
                      });
                      return null;
                    })()}
                    {effectiveIsVisitor ? (
                      // Visitor menu - Play Quiz, Sign In, Sign Up, divider, About, Dark Mode
                      <>
                        <Link
                          href="/quizzes/12/intro"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Play className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Play the quiz
                        </Link>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1.5"></div>
                        <Link
                          href="/sign-in"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          Log In
                        </Link>
                        <Link
                          href="/sign-up"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-all duration-200"
                        >
                          <User className="w-5 h-5 text-white" />
                          Sign Up
                        </Link>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1.5"></div>
                        <Link
                          href="/about"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          About The School Quiz
                        </Link>
                      </>
                    ) : effectiveIsFree ? (
                      // Free user menu - restructured
                      <>
                        <Link
                          href="/quizzes"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <BookOpen className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Quizzes
                        </Link>
                        <Link
                          href="/achievements"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Trophy className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Achievements
                        </Link>
                        <Link
                          href="/account"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Settings
                        </Link>
                      </>
                    ) : (
                      // Premium user menu
                      <>
                        <Link
                          href="/dashboard"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <LayoutDashboard className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Dashboard
                        </Link>
                        <Link
                          href="/quizzes/279/play"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Play className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Play Quiz
                        </Link>
                        <Link
                          href="/leagues"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Private Leagues
                        </Link>
                        <Link
                          href="/stats"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <BarChart3 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Stats & Analytics
                        </Link>
                        <Link
                          href="/achievements"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Trophy className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Achievements
                        </Link>
                        <Link
                          href="/account"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Account
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Upgrade CTA for Free Users */}
                  {isFreeUser && (
                    <>
                      <div className="border-t border-gray-100 dark:border-gray-700/50 my-1"></div>
                      <div className="py-2">
                        <Link
                          href="/upgrade"
                          onClick={handleLinkClick}
                          className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-base font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors w-full"
                        >
                          <Crown className="w-4 h-4" />
                          Get Premium
                        </Link>
                      </div>
                    </>
                  )}

                  {/* Dark Mode and Sign Out - Always at bottom (static across tiers) */}
                  <div className="border-t border-gray-100 dark:border-gray-700/50 mt-1"></div>
                  <div className="py-2">
                    {(isLoggedIn || localStorageLoggedIn) && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 px-5 py-2.5 text-base text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                      >
                        <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                        Sign Out
                      </button>
                    )}
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        {isDark ? (
                          <Sun className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <Moon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        )}
                        <span className="text-base text-gray-700 dark:text-gray-200">Dark mode</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Use unified applyTheme function to ensure cookie is written properly
                          const nextTheme: Theme = isDark ? "light" : "dark";
                          applyTheme(nextTheme);
                          toggleTheme(); // Also update context state for UI
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          isDark ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        role="switch"
                        aria-checked={isDark}
                        aria-label="Toggle dark mode"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isDark ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
