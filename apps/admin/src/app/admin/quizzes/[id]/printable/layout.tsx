/**
 * Layout for Printable Quiz Page
 * 
 * This layout ensures the page is optimized for PDF generation.
 * It uses a minimal layout that doesn't include the main app navigation.
 * 
 * Note: In Next.js App Router, we don't include <html> and <body> tags here.
 * Those are handled by the root layout. Fonts are already loaded in the root layout.
 */

import { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Printable Quiz',
  description: 'Printable quiz page for PDF generation',
}

export default function PrintableLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

