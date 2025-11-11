'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Settings, Wallet, Users, Pencil, Plus, LogOut, Sun, Moon, LayoutDashboard, Trophy, BarChart3, Crown, Info, Play, BookOpen } from 'lucide-react';
import { useUserAccess } from '@/contexts/UserAccessContext';

export function SiteHeader({ fadeLogo = false, showUpgrade = false }: { fadeLogo?: boolean; showUpgrade?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn: userIsLoggedIn, userName, userEmail, tier, isVisitor, isFree, isPremium } = useUserAccess();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Check if we're on the quizzes page
  const isOnQuizzesPage = pathname === '/quizzes';
  const isOnIndexPage = pathname === '/';

  // Get time-based theme preference
  const getTimeBasedTheme = (): boolean => {
    const hour = new Date().getHours();
    // Dark mode from 6 PM (18:00) to 6 AM (06:00)
    return hour >= 18 || hour < 6;
  };

  // Apply theme
  const applyTheme = (dark: boolean) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Check if user has manually set a theme preference
    const manualOverride = localStorage.getItem('themeOverride');
    const savedTheme = localStorage.getItem('theme');
    
    if (manualOverride === 'true' && savedTheme) {
      // User has manually set a preference, respect it
      const dark = savedTheme === 'dark';
      applyTheme(dark);
    } else {
      // No manual override, use time-based theme
      const timeBasedDark = getTimeBasedTheme();
      applyTheme(timeBasedDark);
      localStorage.setItem('theme', timeBasedDark ? 'dark' : 'light');
    }

    // Check theme periodically (every minute) if no manual override
    const checkThemeInterval = setInterval(() => {
      const override = localStorage.getItem('themeOverride');
      if (override !== 'true') {
        const timeBasedDark = getTimeBasedTheme();
        applyTheme(timeBasedDark);
        localStorage.setItem('theme', timeBasedDark ? 'dark' : 'light');
      }
    }, 60000); // Check every minute

    // Check login status on client only
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn || userIsLoggedIn);
    
    // Get user ID if logged in
    if (loggedIn) {
      // Try to get userId from localStorage or fetch from API
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
      } else {
        // Try to fetch userId from profile API
        const token = localStorage.getItem('authToken');
        if (token) {
          fetch('/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.id) {
                setUserId(data.id);
                localStorage.setItem('userId', data.id);
              }
            })
            .catch(() => {
              // Fallback: use mock userId for now
              setUserId('user-andrew-123');
            });
        }
      }
    }

    return () => clearInterval(checkThemeInterval);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    applyTheme(newDark);
    // Mark as manual override
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    localStorage.setItem('themeOverride', 'true');
    window.dispatchEvent(new CustomEvent('themechange', { detail: { isDark: newDark } }));
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    // Clear auth session
    localStorage.removeItem('authToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    
    // Close menu
    setIsMenuOpen(false);
    setIsLoggedIn(false);
    
    // Redirect to home/index page
    window.location.href = '/';
  };

  // Listen for login changes
  useEffect(() => {
    const handleStorageChange = () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedIn || userIsLoggedIn);
      
      if (loggedIn || userIsLoggedIn) {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } else {
        setUserId(null);
      }
    };

    // Check on focus (when user switches tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, [userIsLoggedIn]);

  // Handle scroll to hide/show logo
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50); // Hide logo after 50px scroll
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <>
      <header className="site-header fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-3">
            {showUpgrade && !isLoggedIn && (
              <a
                href="/premium"
                className="hidden md:inline-flex group items-center gap-2 whitespace-nowrap h-10 px-3 text-xs md:h-12 md:px-4 md:text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
              >
                <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
                <span>Upgrade</span>
              </a>
            )}
            {isOnQuizzesPage && isLoggedIn && isFree && (
              <Link
                href="/upgrade"
                className="hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
              >
                <Crown className="w-4 h-4" />
                Upgrade
              </Link>
            )}
            {isOnIndexPage && !isLoggedIn && (
              <Link
                href="/sign-up"
                className="hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
              >
                Sign Up Free
              </Link>
            )}
            <div className="relative" ref={menuRef}>
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-12 h-12 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-800 backdrop-blur-sm text-gray-900 dark:text-white relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
              >
                <AnimatePresence mode="wait">
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
                      className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
                      onClick={() => setIsMenuOpen(false)}
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
                    className="fixed top-20 right-4 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden"
                  >
                  <div className="p-6 overflow-y-auto flex-1">
                  {/* User Profile Section - Only for logged-in users */}
                  {isLoggedIn && (
                    <div className="px-0 py-0 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700/50">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-base relative flex-shrink-0">
                          {(userName || localStorage.getItem('userName')) ? (userName || localStorage.getItem('userName'))?.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white text-base truncate">
                              {userName || localStorage.getItem('userName') || 'User'}
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
                    {isVisitor ? (
                      // Visitor menu - Play Quiz, Sign In, Sign Up, divider, About, Dark Mode
                      <>
                        <Link
                          href="/quizzes/12/intro"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Play className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Play This Week's Quiz
                        </Link>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1.5"></div>
                        <Link
                          href="/sign-in"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          Log In
                        </Link>
                        <Link
                          href="/sign-up"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-white bg-[#3B82F6]/80 hover:bg-[#3B82F6] transition-all duration-200"
                        >
                          <User className="w-5 h-5 text-white" />
                          Sign Up Free
                        </Link>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1.5"></div>
                        <Link
                          href="/about"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          About The School Quiz
                        </Link>
                      </>
                    ) : isFree ? (
                      // Free user menu - restructured
                      <>
                        <Link
                          href="/quizzes"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <BookOpen className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Quizzes
                        </Link>
                        <Link
                          href="/achievements"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Trophy className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Achievements
                        </Link>
                        <Link
                          href="/account"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Profile & Settings
                        </Link>
                      </>
                    ) : (
                      // Premium user menu
                      <>
                        <Link
                          href="/dashboard"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <LayoutDashboard className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Dashboard
                        </Link>
                        <Link
                          href="/quizzes/279/play"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Play className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Play Quiz
                        </Link>
                        <Link
                          href="/leagues"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Private Leagues
                        </Link>
                        <Link
                          href="/stats"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <BarChart3 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Stats & Analytics
                        </Link>
                        <Link
                          href="/achievements"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Trophy className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Achievements
                        </Link>
                        <Link
                          href="/account"
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Account
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Upgrade CTA for Free Users */}
                  {isFree && (
                    <>
                      <div className="border-t border-gray-100 dark:border-gray-700/50 my-1"></div>
                      <div className="py-2">
                        <Link
                          href="/upgrade"
                          onClick={handleLinkClick}
                          className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-base font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors w-full"
                        >
                          <Crown className="w-4 h-4" />
                          Upgrade to Premium
                        </Link>
                      </div>
                    </>
                  )}

                  {/* Dark Mode and Sign Out - Always at bottom (static across tiers) */}
                  <div className="border-t border-gray-100 dark:border-gray-700/50 mt-1"></div>
                  <div className="py-2">
                    {isLoggedIn && (
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
                          toggleTheme();
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
