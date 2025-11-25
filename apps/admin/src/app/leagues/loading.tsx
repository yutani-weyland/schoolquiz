import { RouteLoading } from '@/components/ui/RouteLoading'
import { LeaguesListSkeleton, LeagueDetailsSkeleton } from '@/components/leagues/LeaguesSkeleton'

export default function LeaguesLoading() {
  return (
    <RouteLoading>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <LeaguesListSkeleton />
          </div>
          <div className="lg:col-span-2">
            <LeagueDetailsSkeleton />
          </div>
        </div>
      </div>
    </RouteLoading>
  )
}

