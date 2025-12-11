import Script from 'next/script'
import { generatePreHydrationScript } from '@/lib/html-cache'

/**
 * Custom Quizzes page layout with pre-hydration paint
 * 
 * Injects an inline script in the head that reads from localStorage
 * and paints cached HTML before React loads, making the page appear instant.
 */
export default function CustomQuizzesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const prePaintScript = generatePreHydrationScript('custom-quizzes', 'custom-quizzes-content')

  return (
    <>
      {/* Pre-hydration paint script - runs before React loads */}
      <Script
        id="custom-quizzes-pre-paint"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: prePaintScript,
        }}
      />
      {children}
    </>
  )
}







