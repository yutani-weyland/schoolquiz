import { Suspense } from 'react'
import { getOrganisations } from './organisations-server'
import OrganisationsClient from './OrganisationsClient'
import { TableSkeleton } from '@/components/admin/ui/TableSkeleton'
import { PageHeader } from '@/components/admin/ui'

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }>
}

/**
 * Server Component wrapper for Organisations page
 * Fetches initial data server-side for faster initial load
 */
export default async function AdminOrganisationsPage({ searchParams }: PageProps) {
  // Await searchParams in Next.js 15
  const params = await searchParams
  const search = params.search || ''
  const status = params.status || ''
  const page = parseInt(params.page || '1', 10)
  const sortBy = params.sortBy || 'createdAt'
  const sortOrder = (params.sortOrder || 'desc') as 'asc' | 'desc'

  // Fetch initial data server-side
  const initialDataPromise = getOrganisations({
    search,
    status,
    page,
    limit: 50,
    sortBy,
    sortOrder,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organisations"
        description="Manage all organisations, their members, and subscriptions"
      />

      <Suspense fallback={<TableSkeleton />}>
        <OrganisationsDataWrapper
          initialDataPromise={initialDataPromise}
          initialSearchParams={{ search, status, page, sortBy, sortOrder }}
        />
      </Suspense>
    </div>
  )
}

/**
 * Async wrapper component that awaits the data and passes it to client component
 */
async function OrganisationsDataWrapper({
  initialDataPromise,
  initialSearchParams,
}: {
  initialDataPromise: Promise<{
    organisations: any[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>
  initialSearchParams: {
    search: string
    status: string
    page: number
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
}) {
  const initialData = await initialDataPromise

  return (
    <OrganisationsClient
      initialOrganisations={initialData.organisations}
      initialPagination={initialData.pagination}
      initialSearchParams={initialSearchParams}
    />
  )
}

