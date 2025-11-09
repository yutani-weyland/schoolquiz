'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, User, Sun, Moon, LogOut } from 'lucide-react';

export function SiteHeader({ fadeLogo = false, showUpgrade = false }: { fadeLogo?: boolean; showUpgrade?: boolean }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

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
    setIsLoggedIn(loggedIn);
    
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
    
    // Close menu
    setIsMenuOpen(false);
    
    // Redirect to home
    router.push('/');
    window.location.reload(); // Reload to clear any cached state
  };

  // Listen for login changes
  useEffect(() => {
    const handleStorageChange = () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
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
  }, []);

  // Handle scroll to hide/show logo
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50); // Hide logo after 50px scroll
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-12 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-medium transition-all duration-300 flex items-center justify-center relative"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 absolute transition-all duration-300" />
              ) : (
                <Menu className="w-5 h-5 absolute transition-all duration-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out menu overlay */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-20 right-4 max-h-[calc(100vh-6rem)] w-96 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-out rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50">
            <div className="p-6 overflow-y-auto flex-1 scroll-smooth menu-scroll-mask">
              {/* Premium CTA - Only if not logged in */}
              {!isLoggedIn && (
                <div className="mb-6">
                  <a href="/premium" className="group block bg-blue-600 hover:bg-blue-700 p-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl">
                        <svg className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-bold text-lg">Upgrade</span>
                        </div>
                        <p className="text-blue-50 text-sm leading-tight">Unlock premium features</p>
                      </div>
                    </div>
                  </a>
                </div>
              )}

              {/* Primary Navigation - Consistent Styling */}
              <div className="space-y-1 mb-6">
                <Link 
                  href="/quizzes" 
                  onClick={handleLinkClick} 
                  className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  Quizzes
                </Link>
                
                {isLoggedIn && (
                  <>
                    {userId && (
                      <Link 
                        href={`/profile/${userId}`} 
                        onClick={handleLinkClick} 
                        className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                      >
                        <User className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                        Profile
                      </Link>
                    )}
                    <Link 
                      href="/account" 
                      onClick={handleLinkClick} 
                      className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                      </svg>
                      Private Leagues
                    </Link>
                    <Link 
                      href="/account?tab=account" 
                      onClick={handleLinkClick} 
                      className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      Settings
                    </Link>
                    
                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 w-full text-left"
                    >
                      <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                      Logout
                    </button>
                  </>
                )}
                
                {!isLoggedIn && (
                  <Link 
                    href="/sign-in" 
                    onClick={handleLinkClick} 
                    className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                    </svg>
                    Sign In
                  </Link>
                )}
              </div>

              {/* Footer Links - Consistent Styling */}
              <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700 space-y-1">
                <Link 
                  href="/about" 
                  onClick={handleLinkClick} 
                  className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  About
                </Link>
                <Link 
                  href="/contact" 
                  onClick={handleLinkClick} 
                  className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  Contact
                </Link>
                <Link 
                  href="/help" 
                  onClick={handleLinkClick} 
                  className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Help
                </Link>
                <Link 
                  href="/privacy" 
                  onClick={handleLinkClick} 
                  className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  Privacy
                </Link>
                <Link 
                  href="/terms" 
                  onClick={handleLinkClick} 
                  className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Terms
                </Link>
                
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 w-full text-left"
                >
                  {isDark ? (
                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                  )}
                  {isDark ? 'Light mode' : 'Dark mode'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

