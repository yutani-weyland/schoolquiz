/**
 * Server Component for Admin Organisation Detail Page
 * Fetches organisation data on the server and passes to client component for interactivity
 */

import { Suspense } from 'react'
import { Card } from '@/components/admin/ui'
import { getOrganisationDetail } from './organisation-detail-server'
import { OrganisationDetailClient } from './OrganisationDetailClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

async function OrganisationDetailContent({ organisationId }: { organisationId: string }) {
  const organisation = await getOrganisationDetail(organisationId)

  if (!organisation) {
    return (
      <Card className="text-center py-12">
        <p className="text-[hsl(var(--muted-foreground))]">Organisation not found</p>
      </Card>
    )
  }

  return <OrganisationDetailClient organisation={organisation} organisationId={organisationId} />
}

export default async function AdminOrganisationDetailPage({ params }: PageProps) {
  const { id: organisationId } = await params

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

          {/* Organisation header skeleton */}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
                <div className="h-9 w-32 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
              </div>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 w-full bg-[hsl(var(--muted))] animate-pulse rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <OrganisationDetailContent organisationId={organisationId} />
    </Suspense>
  )
}
