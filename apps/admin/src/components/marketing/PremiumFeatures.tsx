'use client';

/**
 * PremiumFeatures - Premium feature cards with visual hierarchy
 * 
 * Order by teacher impact:
 * 1. Class Teams (hero) - biggest classroom value
 * 2. Private Leaderboards - fun & engagement
 * 3. Custom Quizzes - flexibility
 * 4. Printable PDFs - practical
 * 5. Insights & Streaks - analytics
 * 6. Achievements - delight
 * 7. Special Editions - bonus content
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, Download, Sparkles, Crown, ChevronDown, PenLine, Layers, Users, MessageCircle } from 'lucide-react';
import { SnowOverlay } from '@/components/ui/snow-overlay';

export function PremiumFeatures() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-10 sm:mb-12">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Built for the classroom
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Premium features designed by a teacher, for teachers. Practical tools that actually make a difference.
        </p>
      </div>

      {/* Hero Feature - Class Teams */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-6 max-w-6xl mx-auto"
      >
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl overflow-hidden shadow-xl">
          <div className="grid md:grid-cols-2 gap-6 p-6 sm:p-8">
            {/* Left: Visual */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-sm space-y-3">
                {/* Class selector */}
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30"
                >
                  <div className="text-xs font-medium text-white/80 mb-2">Playing as:</div>
                  <div className="flex items-center gap-2 p-2 bg-white/90 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-semibold text-gray-900 flex-1">Year 9A</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </motion.div>
                
                {/* Progress bars */}
                {[
                  { name: 'Year 9A', color: 'bg-blue-400', pct: 85, delay: 0.3 },
                  { name: 'Year 9B', color: 'bg-emerald-400', pct: 72, delay: 0.4 },
                  { name: 'Year 9C', color: 'bg-purple-400', pct: 68, delay: 0.5 },
                ].map((cls) => (
                  <motion.div 
                    key={cls.name}
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: cls.delay }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${cls.color}`}></div>
                        <span className="text-sm font-medium text-white">{cls.name}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{cls.pct}%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${cls.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: cls.delay + 0.2, duration: 0.8, ease: "easeOut" }}
                        className={`h-full ${cls.color} rounded-full`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Right: Copy */}
            <div className="flex flex-col justify-center text-white">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-white/80 mb-3">
                <Layers className="w-4 h-4" />
                Most popular feature
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                Class Teams & Progress Tracking
              </h3>
              <p className="text-white/90 text-base sm:text-lg leading-relaxed mb-4">
                Play each quiz as a separate class, keep their results apart, and compare progress over time. Switch between Year 9A, 9B, 9C with one account.
              </p>
              <ul className="space-y-2 text-white/80 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-300">✓</span> Separate stats per class
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-300">✓</span> Quick class switching
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-300">✓</span> Compare class performance
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Secondary Features - 3 columns */}
      <div className="grid md:grid-cols-3 gap-6 mb-6 max-w-6xl mx-auto">
        {/* People's Round */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all"
        >
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 px-5 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Community</span>
              </div>
              {/* Mock question submission UI */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">🎓</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Ms. Thompson</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Year 8 Science</p>
                  </div>
                </div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-2 border border-pink-100 dark:border-pink-800/50"
                >
                  <p className="text-xs text-gray-700 dark:text-gray-300 italic">"Which planet has the most moons?"</p>
                </motion.div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 font-medium">✓ Selected!</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">The People's Round</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Submit questions and get credit when they're featured. Your students become quiz contributors!</p>
          </div>
        </motion.div>

        {/* Private Leaderboards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all"
        >
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 px-5 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">House Competition</span>
              </div>
              {[
                { name: 'Red House', color: 'bg-red-500', score: 2450, position: 1 },
                { name: 'Blue House', color: 'bg-blue-500', score: 2180, position: 2 },
                { name: 'Green House', color: 'bg-emerald-500', score: 1950, position: 3 },
              ].map((team, i) => (
                <motion.div 
                  key={team.name}
                  initial={{ x: -10, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className={`flex items-center justify-between p-2.5 rounded-lg border ${i === 0 ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {team.position}
                    </span>
                    <div className={`w-4 h-4 rounded-full ${team.color}`}></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{team.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{team.score.toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Private Leaderboards</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Run class or school-wide competitions. Perfect for house points, mentor groups, or just bragging rights.</p>
          </div>
        </motion.div>

        {/* Create Custom Quizzes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all"
        >
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 px-5 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="bg-violet-100 dark:bg-violet-900/30 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <PenLine className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">New Custom Quiz</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 flex items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Start-of-Term Icebreaker</span>
                    <motion.span 
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="ml-0.5 w-0.5 h-4 bg-violet-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {['Presenter', 'Quick View', 'PDF'].map((mode) => (
                    <span key={mode} className="text-[10px] px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-medium">
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Create Custom Quizzes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Build your own quizzes with the same Presenter View, Quick View, and printable options. Great for assemblies or wellbeing check-ins.</p>
          </div>
        </motion.div>
      </div>

      {/* Supporting Features - 4 column grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {/* Printable PDFs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all"
        >
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 w-full max-w-[100px]">
              <div className="space-y-1.5">
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <Download className="w-4 h-4 text-emerald-500 mx-auto" />
              </div>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Printable PDFs</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Clean PDFs for relief lessons and offline classes.</p>
          </div>
        </motion.div>

        {/* Insights & Streaks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all"
        >
          <div className="bg-purple-50 dark:bg-purple-950/30 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-end justify-center gap-1 h-16">
              {[3, 5, 4, 7, 6, 8, 7].map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${(h / 8) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
                  className="w-3 bg-purple-400 dark:bg-purple-500 rounded-t"
                />
              ))}
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Insights & Streaks</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Track perfect scores, streaks, and class analytics.</p>
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all"
        >
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center">
            <motion.div 
              whileHover={{ rotate: [0, -2, 2, 0], scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="w-16 h-20 rounded-xl shadow-lg overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)' }}
            >
              <div className="p-2 flex flex-col h-full">
                <span className="text-[8px] font-bold text-white/80 bg-white/20 px-1 rounded self-start">RARE</span>
                <div className="flex-1 flex items-center justify-center text-2xl">🏆</div>
                <div className="text-[8px] font-bold text-white text-center leading-tight">HAIL, CAESAR!</div>
              </div>
            </motion.div>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Fun Achievements</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Collectible badges your students will love.</p>
          </div>
        </motion.div>

        {/* Special Editions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all"
        >
          <div className="relative bg-gradient-to-br from-red-50 via-green-50 to-red-50 dark:from-red-950/20 dark:via-green-950/20 dark:to-red-950/20 p-4 border-b border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center">
            <SnowOverlay />
            <div className="relative z-10 w-14 h-20 rounded-xl shadow-lg flex flex-col p-2" style={{ backgroundColor: '#dc2626' }}>
              <span className="text-[7px] font-bold text-white/80 bg-white/20 px-1 rounded self-start flex items-center gap-0.5">
                <Sparkles className="w-2 h-2" /> Special
              </span>
              <div className="flex-1 flex items-center justify-center text-xl">🎄</div>
              <div className="text-[7px] font-bold text-white text-center">Christmas</div>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Holiday Specials</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Exclusive seasonal quizzes throughout the year.</p>
          </div>
        </motion.div>
      </div>

      {/* CTA Button */}
      <div className="text-center mt-10 sm:mt-12">
        <Link
          href="/upgrade"
          className="inline-flex items-center justify-center gap-2 h-12 px-4 sm:px-6 rounded-full bg-[#3B82F6] text-white text-sm sm:text-base font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
        >
          <Crown className="w-4 h-4" />
          Get Premium
        </Link>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          From $6/month · Cancel anytime
        </p>
      </div>
    </div>
  );
}
