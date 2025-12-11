/**
 * LandingHero - Static server-renderable hero section
 * 
 * This component is designed to render statically with CSS-only animations,
 * enabling fast LCP without waiting for JavaScript hydration.
 * 
 * Strategy for rotating text:
 * - SSR: Static "students" text (fast LCP)
 * - After hydration: RotatingTextClient takes over with animation
 * 
 * This keeps Lighthouse score high because LCP measures initial paint.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RotatingTextClient } from "./RotatingTextClient";

// Static CTA buttons - SSR version that shows immediately
export function HeroCTAStatic() {
  return (
    <div className="flex flex-row items-center gap-3 sm:gap-4 justify-center flex-wrap w-full max-w-md mx-auto landing-fade-in landing-delay-200">
      <Link
        href="/sign-up"
        className="inline-flex items-center justify-center h-12 px-4 sm:px-6 bg-[#3B82F6] text-white rounded-full text-sm sm:text-base font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 flex-1 sm:flex-none sm:min-w-[200px]"
      >
        Join for free
      </Link>
      <Link
        href="/quizzes/12/intro"
        className="inline-flex items-center justify-center gap-2 h-12 px-4 sm:px-6 border border-gray-300 dark:border-[#DCDCDC] text-gray-700 dark:text-[#DCDCDC] rounded-full text-sm sm:text-base font-medium hover:bg-gray-100 dark:hover:bg-[#DCDCDC] hover:text-gray-900 dark:hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-[#DCDCDC] focus:ring-offset-2 flex-1 sm:flex-none sm:min-w-[200px]"
      >
        Play the quiz
        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Link>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 pt-24 sm:pt-32 relative bg-gray-50 dark:bg-[#0F1419]">
      <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-16">
        <h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 md:mb-10 leading-[1.1] sm:leading-tight landing-fade-in"
          id="headline"
        >
          A weekly quiz for<br />
          high school<br />
          <span className="text-blue-600 dark:text-blue-400 block min-h-[1.2em]">
            <RotatingTextClient 
              texts={["students", "tutor groups", "homerooms"]}
              duration={3000}
            />
          </span>
        </h1>

        <div
          className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-[#DCDCDC] mb-10 sm:mb-12 max-w-4xl mx-auto leading-relaxed landing-fade-in landing-delay-100"
          id="description"
        >
          <div className="hidden sm:block space-y-4">
            <p>
              A great quiz brings out shared laughs, inside jokes, and those easy moments that help you build stronger connections with your students.
            </p>
            <p>
              The School Quiz is built for exactly that.
            </p>
            <p>
              Each week it blends general knowledge with school-friendly fun — music, sport, movies, current affairs, pop culture, and whatever&apos;s actually trending with teenagers in Australia. No trick questions. No AI slop. Just a solid, reliable quiz landing every Monday morning.
            </p>
          </div>
          <div className="block sm:hidden space-y-3">
            <p>
              A great quiz brings out shared laughs, inside jokes, and those easy moments that help you build stronger connections with your students.
            </p>
            <p>
              The School Quiz is built for exactly that.
            </p>
            <p>
              Each week it blends general knowledge with school-friendly fun — music, sport, movies, current affairs, pop culture, and whatever&apos;s actually trending with teenagers in Australia. No trick questions. No AI slop. Just a solid, reliable quiz landing every Monday morning.
            </p>
          </div>
        </div>

        <div id="buttons">
          <HeroCTAStatic />
        </div>
      </div>
    </section>
  );
}
