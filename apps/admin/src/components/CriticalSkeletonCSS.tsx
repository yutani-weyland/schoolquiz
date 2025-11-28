/**
 * CriticalSkeletonCSS - Inline critical CSS for above-the-fold content
 * OPTIMIZATION: Only includes skeleton/loading styles, doesn't override fonts or layout
 */
export function CriticalSkeletonCSS() {
    return (
        <style dangerouslySetInnerHTML={{
            __html: `
        /* Skeleton animation - Critical for loading states */
        .skeleton-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          background-color: hsl(var(--muted, 210 40% 96.1%));
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        
        /* Skeleton card styles */
        .skeleton-card {
          border-radius: 1.5rem;
          padding: 1.75rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          display: flex;
          flex-direction: column;
          background-color: white;
        }
        .dark .skeleton-card {
          background-color: #1f2937;
        }
      `
        }} />
    )
}
