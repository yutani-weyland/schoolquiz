/**
 * Server Component for Admin User Detail Page
 * Fetches user data on the server and passes to client component for interactivity
 */

import { Suspense } from 'react'
import { Card } from '@/components/admin/ui'
import { getUserDetail } from './user-detail-server'
import { UserDetailClient } from './UserDetailClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

async function UserDetailContent({ userId }: { userId: string }) {
  const user = await getUserDetail(userId)

  if (!user) {
    return (
      <Card className="text-center py-12">
        <p className="text-[hsl(var(--muted-foreground))]">User not found</p>
      </Card>
    )
  }

  return <UserDetailClient user={user} userId={userId} />
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id: userId } = await params

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
              <div className="h-4 w-96 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
            </div>
          </div>

          {/* Profile header skeleton */}
          <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 bg-[hsl(var(--muted))] animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-48 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
                <div className="h-4 w-64 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-20 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
                  <div className="h-6 w-20 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-[hsl(var(--card))] rounded-2xl p-4 border border-[hsl(var(--border))]"
              >
                <div className="h-4 w-24 bg-[hsl(var(--muted))] animate-pulse rounded-md mb-2" />
                <div className="h-8 w-16 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
              </div>
            ))}
          </div>

          {/* Tabs skeleton */}
          <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-[hsl(var(--border))] pb-2">
                <div className="h-9 w-32 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
                <div className="h-9 w-32 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
              </div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 w-full bg-[hsl(var(--muted))] animate-pulse rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <UserDetailContent userId={userId} />
    </Suspense>
  )
}
