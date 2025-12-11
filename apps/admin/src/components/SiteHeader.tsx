'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Settings, Wallet, Users, Pencil, Plus, LogOut, Sun, Moon, Trophy, BarChart3, Crown, Info, Play, BookOpen, FileEdit, Sparkles, CreditCard, UserPlus, LogIn } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useUserAccess } from '@/contexts/UserAccessContext';
import { useTheme } from '@/contexts/ThemeContext';
import { applyTheme, Theme } from '@/lib/theme';
import { storage, getUserId, getUserName } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { LeagueRequestsNotification } from '@/components/leagues/LeagueRequestsNotification';
import { Logo } from '@/components/Logo';

export function SiteHeader({ fadeLogo = false }: { fadeLogo?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession(); // NextAuth session
  const { isLoggedIn: userIsLoggedIn, userName, userEmail, tier, isVisitor, isFree, isPremium, isLoading: userLoading } = useUserAccess();
  const { isDark, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Set data attribute on body when menu is open for CSS targeting
  useEffect(() => {
    if (isMenuOpen) {
      document.body.setAttribute('data-menu-open', 'true');
    } else {
      document.body.removeAttribute('data-menu-open');
    }
    return () => {
      document.body.removeAttribute('data-menu-open');
    };
  }, [isMenuOpen]);
  
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
  
  // Check NextAuth session first (primary auth), then fall back to context/legacy
  const isNextAuthLoggedIn = sessionStatus === 'authenticated' && !!session;
  const isLoggedIn = isNextAuthLoggedIn || userIsLoggedIn;
  
  // Get user info from NextAuth session (preferred) or context (fallback)
  const displayName = session?.user?.name || userName || null;
  const displayEmail = session?.user?.email || userEmail || null;
  
  // Determine if user is free - use context's isFree which is more reliable
  // isFreeUser is for header buttons, isFree is for menu items
  const effectiveIsFree = isFree || (isLoggedIn && !isPremium && !isVisitor);
  const effectiveIsVisitor = !isLoggedIn; // Visitor if not logged in via NextAuth or legacy
  const isFreeUser = effectiveIsFree; // Use effectiveIsFree for consistency
  
  // Debug logging - only log when auth state actually changes (removed excessive logging)
  // Use browser devtools or logger level filtering instead of console.log in production
  
  // Check if we're on the quizzes page
  const isOnQuizzesPage = pathname === '/quizzes' || pathname?.startsWith('/quizzes/');
  const isOnIndexPage = pathname === '/';
  
  // Helper function to check if pathname matches a route
  const isActiveRoute = (route: string) => {
    if (route === '/') return pathname === '/';
    return pathname === route || pathname?.startsWith(`${route}/`);
  };

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

  const handleLinkClick = useCallback((e?: React.MouseEvent) => {
    // Close menu after a tiny delay to ensure Link navigation happens first
    setTimeout(() => {
      setIsMenuOpen(false);
    }, 100);
    // Don't prevent default - let Next.js Link handle navigation
  }, []);

  const handleLogout = useCallback(async () => {
    // Close menu first
    setIsMenuOpen(false);
    
    // Sign out using NextAuth (primary auth system)
    if (isNextAuthLoggedIn) {
      await signOut({ callbackUrl: '/' });
      return;
    }
    
    // Fallback: Clear legacy auth session
    storage.remove('authToken');
    storage.remove('isLoggedIn');
    storage.remove('userId');
    storage.remove('userEmail');
    storage.remove('userName');
    storage.remove('userTier');
    
    // Redirect to home/index page
    window.location.href = '/';
  }, [isNextAuthLoggedIn]);

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
      <header className="site-header fixed top-0 left-0 right-0 z-[1100]">
        <div className="flex items-center justify-between w-full" style={{ height: '100%' }}>
          <Link
            id="site-logo"
            data-fade={fadeLogo ? 'true' : 'false'}
            href={isLoggedIn ? '/quizzes' : '/'}
            className={`transition-all duration-300 hover:opacity-80 cursor-pointer ${
              isScrolled 
                ? 'opacity-0 pointer-events-none -translate-x-4 w-0 overflow-hidden' 
                : 'opacity-100 translate-x-0'
            }`}
          >
            <Logo className="h-7 w-auto" />
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
            <div className="relative flex-shrink-0 flex items-center gap-2" ref={menuRef}>
              {/* League Requests Notification - Only for logged-in premium users */}
              {isLoggedIn && (isPremium || tier === 'premium') && (
                <LeagueRequestsNotification />
              )}
              
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="w-12 h-12 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-800 backdrop-blur-sm text-gray-900 dark:text-white relative z-[120] shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
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
                      className="fixed inset-0 bg-black/30 backdrop-blur-md z-[1100] pointer-events-auto"
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
                    className="fixed top-20 right-4 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 flex flex-col z-[1101] overflow-hidden pointer-events-auto"
                  >
                  <div className="p-4 overflow-y-auto flex-1">
                  {/* User Profile Section - Only for logged-in users */}
                  {isLoggedIn && (
                    <div className="px-0 py-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700/50">
                      <div className="flex items-center gap-3 pl-4">
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
                  <div className="space-y-1">
                    {effectiveIsVisitor ? (
                      // Visitor menu - optimized for conversion
                      <>
                        <Link
                          href="/quizzes/12/intro"
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-full text-base transition-colors",
                            isActiveRoute('/quizzes')
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
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
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-full text-base transition-colors",
                            isActiveRoute('/sign-in')
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          )}
                        >
                          <LogIn className="w-5 h-5" />
                          Log in
                        </Link>
                        <Link
                          href="/sign-up"
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-full text-base transition-colors",
                            isActiveRoute('/sign-up')
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          )}
                        >
                          <UserPlus className="w-5 h-5" />
                          Sign up
                        </Link>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
                        <Link
                          href="/about"
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-full text-base transition-colors",
                            isActiveRoute('/about')
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          )}
                        >
                          <Info className="w-5 h-5" />
                          About
                        </Link>
                      </>
                    ) : effectiveIsFree ? (
                      // Free user menu - restructured
                      <>
                        <Link
                          href="/quizzes"
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-full text-base transition-colors",
                            isActiveRoute('/quizzes')
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <BookOpen className="w-5 h-5" />
                          Quizzes
                        </Link>
                        <Link
                          href="/achievements"
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-full text-base transition-colors",
                            isActiveRoute('/achievements')
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <Trophy className="w-5 h-5" />
                          Achievements
                        </Link>
                        <Link
                          href="/account"
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-full text-base transition-colors",
                            isActiveRoute('/account')
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <Settings className="w-5 h-5" />
                          Settings
                        </Link>
                      </>
                    ) : (
                      // Premium user menu
                      <>
                        <Link
                          href="/quizzes"
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-full text-base transition-colors",
                            isActiveRoute('/quizzes')
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <BookOpen className="w-5 h-5" />
                          Quizzes
                        </Link>
                        <Link
                          href="/custom-quizzes"
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-full text-base transition-colors",
                            isActiveRoute('/custom-quizzes')
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <FileEdit className="w-5 h-5" />
                          Create Quiz
                        </Link>
                        <Link
                          href="/leagues"
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-full text-base transition-colors",
                            isActiveRoute('/leagues')
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <Users className="w-5 h-5" />
                          Leagues
                        </Link>
                        <Link
                          href="/stats"
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-full text-base transition-colors",
                            isActiveRoute('/stats')
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <BarChart3 className="w-5 h-5" />
                          Insights
                        </Link>
                        <Link
                          href="/achievements"
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-full text-base transition-colors",
                            isActiveRoute('/achievements')
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <Trophy className="w-5 h-5" />
                          Achievements
                        </Link>
                        <Link
                          href="/account"
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-full text-base transition-colors",
                            isActiveRoute('/account')
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <Settings className="w-5 h-5" />
                          Account
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Upgrade CTA for Free Users */}
                  {isFreeUser && (
                    <>
                      <div className="border-t border-gray-100 dark:border-gray-700/50 my-2"></div>
                      <div className="space-y-1">
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
                  <div className="border-t border-gray-100 dark:border-gray-700/50 my-3"></div>
                  <div className="space-y-2">
                    {isLoggedIn && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-base text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left rounded-full"
                      >
                        <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                        Sign Out
                      </button>
                    )}
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between px-4 py-2.5">
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
