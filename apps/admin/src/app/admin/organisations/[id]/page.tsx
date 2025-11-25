/**
 * Server Component for Admin Organisation Detail Page
 * Fetches organisation data on the server and passes to client component for interactivity
 */

import { Card } from '@/components/admin/ui'
import { getOrganisationDetail } from './organisation-detail-server'
import { OrganisationDetailClient } from './OrganisationDetailClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminOrganisationDetailPage({ params }: PageProps) {
  const { id: organisationId } = await params
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
