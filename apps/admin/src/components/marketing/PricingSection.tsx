'use client';

/**
 * PricingSection - Clean, calm pricing cards
 * 
 * Design principles:
 * - Premium is hero via structure, not effects
 * - Soft contrast, flat surfaces, minimal decoration
 * - Grouped features for faster scanning
 * - Parallel card structures
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GraduationCap, School, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  /** Hide the default header (for when page provides its own) */
  hideHeader?: boolean;
}

export function PricingSection({ hideHeader = false }: PricingSectionProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-12">
        {!hideHeader && (
          <>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Simple pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
              Start free. Upgrade when you're ready. Cancel anytime.
            </p>
          </>
        )}

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-1 p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-full border border-gray-200 dark:border-gray-700">
          <motion.button
            onClick={() => setBillingPeriod('monthly')}
            className={cn(
              "relative px-5 py-2.5 rounded-full text-sm font-medium transition-colors",
              billingPeriod === 'monthly'
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            {billingPeriod === 'monthly' && (
              <motion.div
                layoutId="billing-toggle"
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-full shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">Monthly</span>
          </motion.button>
          <motion.button
            onClick={() => setBillingPeriod('yearly')}
            className={cn(
              "relative px-5 py-2.5 rounded-full text-sm font-medium transition-colors",
              billingPeriod === 'yearly'
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            {billingPeriod === 'yearly' && (
              <motion.div
                layoutId="billing-toggle"
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-full shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              Yearly
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
                Save 25%
              </span>
            </span>
          </motion.button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto items-start">
        
        {/* Premium - Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.5 }}
          className="relative md:scale-[1.02]"
        >
          <div className="bg-white dark:bg-[#1F2025] rounded-2xl border-2 border-blue-500 dark:border-blue-500/80 p-6 sm:p-8 shadow-sm dark:shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
            {/* Badge */}
            <span className="absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
              Most popular
            </span>

            {/* Header */}
            <div className="mb-6 mt-2">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-blue-500" />
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">For individual teachers</p>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Premium</h3>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">
                  ${billingPeriod === 'monthly' ? '6' : '54'}
                </span>
                <span className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                  / {billingPeriod === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {billingPeriod === 'monthly' ? 'Per teacher — just $1.50 a week' : 'Per teacher — just $4.50 a month'}
              </p>
            </div>

            {/* Grouped Features */}
            <div className="space-y-5 mb-8">
              {/* Weekly content */}
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Weekly content</p>
                <ul className="space-y-2">
                  {[
                    "New quiz every Monday",
                    "Full back-catalogue access",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-blue-500 font-bold text-sm mt-0.5">✓</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Classroom tools */}
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Classroom tools</p>
                <ul className="space-y-2">
                  {[
                    "Class Teams — track each class separately",
                    "Private leaderboards",
                    "Printable PDF packs",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-blue-500 font-bold text-sm mt-0.5">✓</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Engagement */}
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Engagement & extras</p>
                <ul className="space-y-2">
                  {[
                    "People's Round — submit & get featured",
                    "Achievements & streaks",
                    "Holiday special editions",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-blue-500 font-bold text-sm mt-0.5">✓</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/sign-up"
              className="w-full inline-flex items-center justify-center gap-2 h-12 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-semibold transition-colors"
            >
              Bring this to my classroom
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-3">
              Cancel anytime · No lock-in
            </p>
          </div>
        </motion.div>

        {/* School Licence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-[#18191D] rounded-2xl border border-gray-200 dark:border-white/[0.06] p-6 sm:p-8 shadow-sm dark:shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
        >
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <School className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">For departments & faculties</p>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">School Licence</h3>
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">
                ${billingPeriod === 'monthly' ? '4.50' : '40.50'}
              </span>
              <span className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                / teacher / {billingPeriod === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Save 25% · Minimum 5 teachers
            </p>
          </div>

          {/* Features */}
          <div className="space-y-5 mb-8">
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Everything in Premium, plus</p>
              <ul className="space-y-2">
                {[
                  "One invoice for your school",
                  "Licence manager — assign & revoke",
                  "Shared leagues across teachers",
                  "School-wide insights dashboard",
                  "Priority support",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-teal-600 dark:text-teal-400 font-bold text-sm mt-0.5">✓</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/contact"
            className="w-full inline-flex items-center justify-center gap-2 h-12 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Set up for your school
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-3">
            {billingPeriod === 'monthly' ? 'From $270/year for 5 teachers' : 'From $202.50/year for 5 teachers'}
          </p>
        </motion.div>
      </div>

      {/* Trust indicators */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500 dark:text-gray-400">
          <span>Teacher-written, no AI slop</span>
          <span className="hidden sm:block text-gray-300 dark:text-gray-700">·</span>
          <span>Built in Australia</span>
          <span className="hidden sm:block text-gray-300 dark:text-gray-700">·</span>
          <span>10,000+ students last term</span>
        </div>
      </div>

      {/* Bottom note */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Not sure? <Link href="/quizzes/12/intro" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Try a quiz free</Link> · <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Get in touch</Link>
        </p>
      </div>
    </div>
  );
}
