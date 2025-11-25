import { SiteHeader } from '@/components/SiteHeader'
import { Footer } from '@/components/Footer'

export default function StatsLoading() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white dark:bg-[#0F1419] text-gray-900 dark:text-white pt-24 sm:pt-32 pb-16 px-4 sm:px-8 overflow-visible">
        <div className="max-w-6xl mx-auto overflow-visible">
          <div className="text-center mb-8 sm:mb-12">
            <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse mb-4 max-w-md mx-auto" />
            <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse max-w-lg mx-auto" />
          </div>
          <div className="space-y-6">
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

