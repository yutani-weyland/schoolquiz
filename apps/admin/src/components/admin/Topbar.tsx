'use client';

import { useState } from 'react';
import { Search, Sun, Moon, User } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function Topbar() {
  const { isDark, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement global search
    console.log('Search:', searchQuery);
  };

  return (
    <div className="sticky top-0 z-40 bg-white/95 dark:bg-[hsl(var(--background))]/95 backdrop-blur border-b border-[hsl(var(--border))]">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Global Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Search quizzes, questions, teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[hsl(var(--border))] rounded-lg bg-white dark:bg-[hsl(var(--input))] text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent"
            />
          </div>
        </form>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] opacity-80 hover:opacity-100 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Profile */}
          <button className="p-2 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] opacity-80 hover:opacity-100 transition-colors">
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}