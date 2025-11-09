import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    setThemePreference?: (isDark: boolean) => void;
  }
}

interface SimpleThemeToggleProps {
  className?: string;
}

function applyThemePreference(isDark: boolean) {
  if (typeof window === 'undefined') return;
  const setter = window.setThemePreference;

  if (typeof setter === 'function') {
    setter(isDark);
    return;
  }

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  try {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  } catch {
    // ignore storage errors
  }

  window.dispatchEvent(new CustomEvent('themechange', { detail: { isDark } }));
}

export default function SimpleThemeToggle({ className = '' }: SimpleThemeToggleProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initialize from localStorage first, then check DOM
    let savedTheme: string | null = null;

    try {
      savedTheme = localStorage.getItem('theme');
    } catch {
      savedTheme = null;
    }

    let shouldBeDark = false;
    
    if (savedTheme === 'light') {
      shouldBeDark = false;
    } else if (savedTheme === 'dark') {
      shouldBeDark = true;
    } else {
      // No saved theme, default to dark
      shouldBeDark = true;
      try {
        localStorage.setItem('theme', 'dark');
      } catch {
        // ignore storage errors
      }
    }
    
    applyThemePreference(shouldBeDark);
    setIsDark(shouldBeDark);
    
    // Listen for storage events (in case theme changes in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue === 'dark';
        applyThemePreference(newTheme);
        setIsDark(newTheme);
      }
    };

    const handleThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ isDark?: boolean }>).detail;
      if (detail && typeof detail.isDark === 'boolean') {
        setIsDark(detail.isDark);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themechange', handleThemeChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    console.log('Simple toggle clicked!');
    const currentIsDark = document.documentElement.classList.contains('dark');
    const nextIsDark = !currentIsDark;
    
    applyThemePreference(nextIsDark);
    setIsDark(nextIsDark);
    console.log(nextIsDark ? 'Switched to dark mode' : 'Switched to light mode');
  };

  const baseClassName =
    'w-12 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-medium transition-colors duration-200 flex items-center justify-center';
  const combinedClassName = `${baseClassName} ${className}`.trim();

  return (
    <button
      onClick={toggleTheme}
      className={combinedClassName}
      aria-label="Toggle theme"
    >
      {/* Sun Icon (Light Mode) */}
      <svg 
        className={`w-6 h-6 transition-all duration-300 ${isDark ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        style={{ position: 'absolute' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      
      {/* Moon Icon (Dark Mode) */}
      <svg 
        className={`w-6 h-6 transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-180 scale-0'}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        style={{ position: 'absolute' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>
  );
}

