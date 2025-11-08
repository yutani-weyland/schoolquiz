import React, { useState, useEffect } from 'react';

export default function SimpleThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initialize from localStorage first, then check DOM
    const savedTheme = localStorage.getItem('theme');
    let shouldBeDark = false;
    
    if (savedTheme === 'light') {
      shouldBeDark = false;
      document.documentElement.classList.remove('dark');
    } else if (savedTheme === 'dark') {
      shouldBeDark = true;
      document.documentElement.classList.add('dark');
    } else {
      // No saved theme, default to dark
      shouldBeDark = true;
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    
    setIsDark(shouldBeDark);
    
    // Listen for storage events (in case theme changes in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue === 'dark';
        setIsDark(newTheme);
        if (newTheme) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleTheme = () => {
    console.log('Simple toggle clicked!');
    const currentIsDark = document.documentElement.classList.contains('dark');
    
    if (currentIsDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
      console.log('Switched to light mode');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
      console.log('Switched to dark mode');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-12 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-medium transition-colors duration-200 flex items-center justify-center"
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

