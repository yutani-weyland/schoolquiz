import { Suspense } from 'react'
import { getUsers } from './users-server'
import UsersClient from './UsersClient'
import { TableSkeleton } from '@/components/admin/ui/TableSkeleton'
import { PageHeader } from '@/components/admin/ui'

interface PageProps {
  searchParams: Promise<{
    search?: string
    tier?: string
    page?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }>
}

/**
 * Server Component wrapper for Users page
 * Fetches initial data server-side for faster initial load
 */
export default async function AdminUsersPage({ searchParams }: PageProps) {
  // Await searchParams in Next.js 15
  const params = await searchParams
  const search = params.search || ''
  const tier = params.tier || ''
  const page = parseInt(params.page || '1', 10)
  const sortBy = params.sortBy || 'createdAt'
  const sortOrder = (params.sortOrder || 'desc') as 'asc' | 'desc'

  // Fetch initial data server-side
  const initialDataPromise = getUsers({
    search,
    tier,
    page,
    limit: 50,
    sortBy,
    sortOrder,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage users and their accounts"
      />

      <Suspense fallback={<TableSkeleton />}>
        <UsersDataWrapper
          initialDataPromise={initialDataPromise}
          initialSearchParams={{ search, tier, page, sortBy, sortOrder }}
        />
      </Suspense>
    </div>
  )
}

/**
 * Async wrapper component that awaits the data and passes it to client component
 */
async function UsersDataWrapper({
  initialDataPromise,
  initialSearchParams,
}: {
  initialDataPromise: Promise<{
    users: any[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>
  initialSearchParams: {
    search: string
    tier: string
    page: number
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
}) {
  const initialData = await initialDataPromise

  return (
    <UsersClient
      initialUsers={initialData.users}
      initialPagination={initialData.pagination}
      initialSearchParams={initialSearchParams}
    />
  )
}
