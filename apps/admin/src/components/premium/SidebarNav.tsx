'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, User, CreditCard, Building2, Menu, X } from 'lucide-react';

type TabId = 'leagues' | 'account' | 'billing' | 'organisation';

interface SidebarNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  hasOrgAdmin: boolean;
}

export function SidebarNav({ activeTab, onTabChange, hasOrgAdmin }: SidebarNavProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isMobileOpen]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    if (isMobileOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isMobileOpen]);

  const navItems = [
    { id: 'leagues' as TabId, label: 'Private Leagues', icon: Trophy },
    { id: 'account' as TabId, label: 'Account & Profile', icon: User },
    { id: 'billing' as TabId, label: 'Subscription & Billing', icon: CreditCard },
  ];

  if (hasOrgAdmin) {
    navItems.push({ id: 'organisation' as TabId, label: 'Organisation Admin', icon: Building2 });
  }

  const handleTabClick = (tab: TabId) => {
    onTabChange(tab);
    setIsMobileOpen(false);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Mobile menu button */}
      <motion.button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-24 left-4 z-[60] w-14 h-14 bg-white dark:bg-gray-900 rounded-full shadow-lg flex items-center justify-center border border-gray-200 dark:border-gray-800 backdrop-blur-sm"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMobileOpen}
      >
        <AnimatePresence mode="wait">
          {isMobileOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6 text-gray-900 dark:text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="w-6 h-6 text-gray-900 dark:text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-md z-[50]"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative top-0 left-0 
          h-screen lg:h-auto lg:min-h-[calc(100vh-8rem)]
          w-64 lg:w-64
          bg-white dark:bg-[#1A1A1A]
          border border-gray-200 dark:border-gray-800
          z-[55] lg:z-auto
          pt-32 lg:pt-6 pb-12 px-4 lg:px-4
          overflow-y-auto lg:overflow-y-auto
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-out lg:transition-none
          will-change-transform lg:will-change-auto
          lg:rounded-2xl lg:mr-6
        `}
      >
        {/* Header */}
        <div className="hidden lg:block mb-6 px-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Settings
          </h2>
        </div>

        {/* Navigation */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            if (item.id === 'organisation') {
              return (
                <Link
                  key={item.id}
                  href="/admin/organisation"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors duration-200 text-left
                  ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:hover:text-blue-400'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
