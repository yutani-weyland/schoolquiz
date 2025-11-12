'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Theme, getInitialTheme, applyTheme, getThemeFromCookieClient } from '@/lib/theme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Get theme from HTML element (for initial render)
 */
function getHtmlTheme(): Theme {
  if (typeof document === "undefined") return "light";
  
  const dataTheme = document.documentElement.getAttribute("data-theme");
  if (dataTheme === "dark" || dataTheme === "light" || dataTheme === "color") {
    return dataTheme as Theme;
  }
  
  return getInitialTheme();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize from DOM (set by pre-paint script) to avoid flash
  const initialTheme = useMemo<Theme>(() => {
    if (typeof document === "undefined") return "light";
    return getHtmlTheme();
  }, []);

  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const isInitialMount = useRef(true);

  // Apply theme when it changes - use unified applyTheme function
  const applyThemeToDoc = useCallback((nextTheme: Theme, skipCookie = false) => {
    // Use the unified applyTheme function that writes cookie properly
    if (skipCookie) {
      // Only apply to DOM, don't write cookie (for initial mount)
      if (typeof document !== "undefined") {
        const html = document.documentElement;
        html.setAttribute("data-theme", nextTheme);
        if (nextTheme === "dark") {
          html.classList.add("dark");
        } else {
          html.classList.remove("dark");
        }
      }
    } else {
      // Write cookie normally
      applyTheme(nextTheme);
    }
    
    // Also update localStorage for quiz pages (backward compatibility)
    if (typeof window !== 'undefined') {
      try {
        // Map unified theme to quiz theme mode
        const quizThemeMode = nextTheme === "color" ? "colored" : nextTheme;
        localStorage.setItem('quizThemeMode', quizThemeMode);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, []);

  useEffect(() => {
    // On initial mount, check if cookie exists - if it does, don't override it
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const cookieTheme = getThemeFromCookieClient();
      if (cookieTheme && cookieTheme !== theme) {
        // Cookie exists and differs from initial theme - sync state to cookie
        setThemeState(cookieTheme);
        applyThemeToDoc(cookieTheme, false); // Write cookie to ensure consistency
        return;
      } else if (cookieTheme) {
        // Cookie exists and matches - just apply to DOM without writing cookie
        applyThemeToDoc(theme, true);
        return;
      }
    }
    
    // Normal theme change - write cookie
    applyThemeToDoc(theme, false);
  }, [theme, applyThemeToDoc]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDoc(newTheme);
  }, [applyThemeToDoc]);

  const toggleTheme = useCallback(() => {
    // Toggle between light and dark (not color, which is quiz-specific)
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setThemeState(nextTheme);
    applyThemeToDoc(nextTheme);
  }, [theme, applyThemeToDoc]);

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sq_theme' || e.key === 'quizThemeMode') {
        const cookieTheme = getThemeFromCookieClient();
        if (cookieTheme) {
          setThemeState(cookieTheme);
          applyThemeToDoc(cookieTheme);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [applyThemeToDoc]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === "dark",
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
