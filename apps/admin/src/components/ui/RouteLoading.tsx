import { SiteHeader } from '@/components/SiteHeader'
import { Footer } from '@/components/Footer'
import { ReactNode } from 'react'

interface RouteLoadingProps {
  children: ReactNode
  showHeader?: boolean
  showFooter?: boolean
}

export function RouteLoading({ 
  children, 
  showHeader = true,
  showFooter = false 
}: RouteLoadingProps) {
  return (
    <>
      {showHeader && <SiteHeader />}
      <main className="min-h-screen pt-24 pb-16">
        {children}
      </main>
      {showFooter && <Footer />}
    </>
  )
}







