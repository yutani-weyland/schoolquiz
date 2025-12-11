/**
 * OPTIMIZED: Minimal loading state for landing page
 * 
 * This loading.tsx file must be EXTREMELY lightweight because:
 * 1. It's bundled into app/loading.js which was ~945 KiB before
 * 2. It loads on EVERY route transition including the landing page
 * 3. The previous version imported SiteHeader which pulls in framer-motion, next-auth, etc.
 * 
 * This version uses only:
 * - Plain HTML/CSS (no component imports)
 * - CSS classes from globals.css (already loaded)
 * - Tailwind classes (already tree-shaken)
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50 dark:bg-[#0F1419]">
      {/* Simple centered shimmer bar - matches critical skeleton CSS */}
      <div className="w-full max-w-md space-y-4">
        <div className="h-8 w-3/4 mx-auto rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-4/6 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    </div>
  )
}
