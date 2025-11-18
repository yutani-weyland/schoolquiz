'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    setMounted(true);
    
    // Initialize dark mode - check HTML element first (may be set by root layout)
    const getInitialTheme = () => {
      // First, check if HTML element already has dark class (set by root layout)
      const htmlHasDark = document.documentElement.classList.contains('dark');
      if (htmlHasDark) {
        return true;
      }
      
      // Check localStorage
      try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          return savedTheme === 'dark';
        }
      } catch (e) {
        // localStorage might not be available
      }
      
      // Check cookie (for compatibility with root layout)
      const cookieMatch = document.cookie.match(/(?:^|; )sq_theme=([^;]*)/);
      const cookieTheme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
      if (cookieTheme === 'dark' || cookieTheme === 'light') {
        return cookieTheme === 'dark';
      }
      
      // Check system preference
      if (window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      return false;
    };

    const initialIsDark = getInitialTheme();
    
    // Apply theme to HTML element (only if not already set correctly)
    const currentIsDark = document.documentElement.classList.contains('dark');
    if (initialIsDark !== currentIsDark) {
      if (initialIsDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
    
    setIsDark(initialIsDark);
    
    // Save to localStorage
    try {
      localStorage.setItem('theme', initialIsDark ? 'dark' : 'light');
    } catch (e) {
      // localStorage might not be available
    }
    
    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        // Only auto-update if user hasn't manually set a preference
        try {
          const savedTheme = localStorage.getItem('theme');
          if (!savedTheme || savedTheme === 'system') {
            if (e.matches) {
              document.documentElement.classList.add('dark');
              document.documentElement.setAttribute('data-theme', 'dark');
              setIsDark(true);
            } else {
              document.documentElement.classList.remove('dark');
              document.documentElement.setAttribute('data-theme', 'light');
              setIsDark(false);
            }
          }
        } catch (e) {
          // localStorage might not be available
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, []);

  const toggleTheme = () => {
    if (typeof window === 'undefined') return;
    
    const currentIsDark = document.documentElement.classList.contains('dark');
    const newIsDark = !currentIsDark;
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      try {
        localStorage.setItem('theme', 'dark');
      } catch (e) {
        // localStorage might not be available
      }
      // Also set cookie for compatibility
      document.cookie = `sq_theme=dark; path=/; max-age=31536000`; // 1 year
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      try {
        localStorage.setItem('theme', 'light');
      } catch (e) {
        // localStorage might not be available
      }
      // Also set cookie for compatibility
      document.cookie = `sq_theme=light; path=/; max-age=31536000`; // 1 year
    }
    
    setIsDark(newIsDark);
  };

  // Always provide context, even before mounting (prevents errors)
  // The isDark state will update once mounted
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within an AdminThemeProvider');
  }
  return context;
}

// Keep ThemeProvider as alias for backwards compatibility if needed
export const ThemeProvider = AdminThemeProvider;
