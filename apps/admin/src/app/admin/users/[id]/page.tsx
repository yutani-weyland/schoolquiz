/**
 * Server Component for Admin User Detail Page
 * Fetches user data on the server and passes to client component for interactivity
 */

import { Card } from '@/components/admin/ui'
import { getUserDetail } from './user-detail-server'
import { UserDetailClient } from './UserDetailClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id: userId } = await params
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
