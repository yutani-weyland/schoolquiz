'use client';

/**
 * TestimonialsSection - Lazy loaded testimonials carousel
 */

import { motion } from 'framer-motion';

const TESTIMONIALS = [
  { name: "Sarah L.", role: "Year 10 Adviser — NSW", quote: "Private leaderboards have created the healthiest bit of competition I've seen in pastoral time. The boys race to beat last week's score and actually cheer each other on.", rotate: -0.3 },
  { name: "Tom B.", role: "Homeroom Teacher — VIC", quote: "It's refreshingly social. Kids aren't buried in laptops — they're talking, guessing, arguing, laughing. It feels like old-school trivia but sharper.", rotate: 0.4 },
  { name: "Michelle R.", role: "Assistant Head of Wellbeing — QLD", quote: "The difficulty sits in a sweet spot. Easy wins early, a few curveballs later, and enough variety that everyone gets to feel clever at least once.", rotate: -0.4 },
  { name: "Mark P.", role: "Digital Technologies Teacher — SA", quote: "Honestly, it's just simple. One quiz a week, well-written questions, no setup dramas, and the class actually looks forward to Monday mornings.", rotate: 0.3 },
];

export function TestimonialsSection() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-10 sm:mb-12">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          What teachers are saying
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Teachers across Australia use The School Quiz to spark conversation, build routines, and make pastoral time a bit easier.
        </p>
      </div>

      {/* Testimonials Carousel */}
      <div className="relative overflow-x-hidden pb-6 mb-10 sm:mb-12 group/testimonials">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 dark:from-[#0F1419] to-transparent z-20 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 dark:from-[#0F1419] to-transparent z-20 pointer-events-none"></div>

        <div className="flex gap-6 animate-infinite-scroll group-hover/testimonials:pause-animation px-8 sm:px-12 md:px-16" style={{ width: 'max-content' }}>
          {/* First set */}
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={`testimonial-1-${index}`}
              initial={{ opacity: 0, y: 20, rotate: testimonial.rotate }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ rotate: -testimonial.rotate, scale: 1.02, y: -4 }}
              transition={{ duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border-[1px] border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow flex-shrink-0"
              style={{ width: '320px', minWidth: '320px' }}
            >
              <div className="mb-4">
                <div className="font-bold text-gray-900 dark:text-white mb-1">{testimonial.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{testimonial.quote}</p>
            </motion.div>
          ))}
          {/* Duplicate set for infinite scroll */}
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={`testimonial-2-${index}`}
              initial={{ opacity: 0, y: 20, rotate: testimonial.rotate }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ rotate: -testimonial.rotate, scale: 1.02, y: -4 }}
              transition={{ duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border-[1px] border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow flex-shrink-0"
              style={{ width: '320px', minWidth: '320px' }}
            >
              <div className="mb-4">
                <div className="font-bold text-gray-900 dark:text-white mb-1">{testimonial.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{testimonial.quote}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <a
          href="/contact"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors mb-2"
        >
          Submit a comment →
        </a>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Share your experience — you might even unlock an achievement 😉
        </p>
      </div>
    </div>
  );
}
