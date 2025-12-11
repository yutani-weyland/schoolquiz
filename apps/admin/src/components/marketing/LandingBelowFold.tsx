'use client';

/**
 * LandingBelowFold - Lazy loaded below-the-fold sections
 * 
 * This component is dynamically imported with ssr: false
 * so it doesn't block the initial HTML render or LCP.
 * 
 * It contains all the heavy sections:
 * - Quiz card stack
 * - Value propositions
 * - Quiz preview
 * - Premium features (includes achievements)
 * - Testimonials
 * - Pricing
 */

import { useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LandingFooter } from './LandingFooter';

// Dynamic imports for heavy components
const QuizCardStack = dynamic(
  () => import("@/components/marketing/QuizCardStack").then(mod => mod.QuizCardStack),
  { ssr: false }
);

const QuizSafariPreview = dynamic(
  () => import("@/components/QuizSafariPreview"),
  { ssr: false }
);

const ReasonsCarousel = dynamic(
  () => import("@/components/marketing/ReasonsCarousel").then(mod => mod.ReasonsCarousel),
  { ssr: false }
);

const PremiumFeatures = dynamic(
  () => import("./PremiumFeatures").then(mod => mod.PremiumFeatures),
  { ssr: false }
);

const TestimonialsSection = dynamic(
  () => import("./TestimonialsSection").then(mod => mod.TestimonialsSection),
  { ssr: false }
);

const PricingSection = dynamic(
  () => import("./PricingSection").then(mod => mod.PricingSection),
  { ssr: false }
);

// Sample quiz data for the card stack - 8 cards for full visual effect
const sampleQuizzes = [
  { id: 5, slug: "12", title: "", blurb: "", weekISO: "2023-11-20", colorHex: "#14B8A6", status: "available" as const, tags: [] },
  { id: 6, slug: "12", title: "", blurb: "", weekISO: "2023-11-27", colorHex: "#F97316", status: "available" as const, tags: [] },
  { id: 7, slug: "12", title: "", blurb: "", weekISO: "2023-12-04", colorHex: "#06B6D4", status: "available" as const, tags: [] },
  { id: 8, slug: "12", title: "", blurb: "", weekISO: "2023-12-11", colorHex: "#10B981", status: "available" as const, tags: [] },
  { id: 9, slug: "12", title: "", blurb: "", weekISO: "2023-12-18", colorHex: "#6366F1", status: "available" as const, tags: [] },
  { id: 10, slug: "12", title: "", blurb: "", weekISO: "2024-01-01", colorHex: "#EC4899", status: "available" as const, tags: [] },
  { id: 11, slug: "12", title: "", blurb: "", weekISO: "2024-01-08", colorHex: "#8B5CF6", status: "available" as const, tags: [] },
  { id: 12, slug: "12", title: "Shape Up, Pumpkins, Famous First Words...", blurb: "A weekly selection mixing patterns, pop culture and logic.", weekISO: "2024-01-15", colorHex: "#3B82F6", status: "available" as const, tags: ["Patterns", "Pop Culture", "Logic"] },
];

// Intersection observer hook for lazy loading sections
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '100px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Simple skeleton placeholder
function SectionSkeleton({ height = "400px" }: { height?: string }) {
  return (
    <div 
      className="w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse"
      style={{ height }}
    >
      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}

export function LandingBelowFold() {
  const quizStack = useInView();
  const reasons = useInView();
  const preview = useInView();
  const premium = useInView();
  const testimonials = useInView();
  const pricing = useInView();

  return (
    <>
      {/* A new quiz every week */}
      <section className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            A new quiz every week
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 sm:mb-12">
            Balanced, teacher-written, and tailor made for Australian high school students.
          </p>
          {/* Quiz Card Stack */}
          <div ref={quizStack.ref}>
            {quizStack.isInView ? (
              <Suspense fallback={<SectionSkeleton height="300px" />}>
                <QuizCardStack quizzes={sampleQuizzes} />
              </Suspense>
            ) : (
              <SectionSkeleton height="300px" />
            )}
          </div>
        </div>
      </section>

      {/* Value Propositions - ReasonsCarousel has its own py-16 sm:py-20 md:py-24 */}
      <section ref={reasons.ref} className="w-full">
        {reasons.isInView ? (
          <Suspense fallback={<SectionSkeleton height="200px" />}>
            <ReasonsCarousel />
          </Suspense>
        ) : (
          <SectionSkeleton height="200px" />
        )}
      </section>

      {/* Run the quiz your way */}
      <section className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Run the quiz your way
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 sm:mb-12">
            Use Presenter View for the screen or projector, Quick View for an at-a-glance overview, and Printable when you need a paper copy.
          </p>
          {/* Safari Preview */}
          <div ref={preview.ref}>
            {preview.isInView ? (
              <Suspense fallback={<SectionSkeleton height="400px" />}>
                <QuizSafariPreview />
              </Suspense>
            ) : (
              <SectionSkeleton height="400px" />
            )}
          </div>
        </div>
      </section>

      {/* Premium Features */}
      <section id="features" ref={premium.ref} className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 scroll-mt-20">
        {premium.isInView ? (
          <Suspense fallback={<SectionSkeleton height="600px" />}>
            <PremiumFeatures />
          </Suspense>
        ) : (
          <SectionSkeleton height="600px" />
        )}
      </section>

      {/* Testimonials */}
      <section ref={testimonials.ref} className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 overflow-x-hidden">
        {testimonials.isInView ? (
          <Suspense fallback={<SectionSkeleton height="400px" />}>
            <TestimonialsSection />
          </Suspense>
        ) : (
          <SectionSkeleton height="400px" />
        )}
      </section>

      {/* Pricing */}
      <section id="pricing" ref={pricing.ref} className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 bg-gray-50 dark:bg-[#0F1419] scroll-mt-20">
        {pricing.isInView ? (
          <Suspense fallback={<SectionSkeleton height="500px" />}>
            <PricingSection />
          </Suspense>
        ) : (
          <SectionSkeleton height="500px" />
        )}
      </section>

      {/* Footer */}
      <LandingFooter />
    </>
  );
}
