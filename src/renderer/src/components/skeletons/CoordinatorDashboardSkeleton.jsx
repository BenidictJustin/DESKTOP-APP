/* eslint-disable */
import Skeleton from '../ui/Skeleton'

export default function CoordinatorDashboardSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Welcome Banner */}
      <div className="glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* Metrics Cards (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white/80 rounded-2xl p-4 shadow-sm border border-gray-100/80 flex items-center gap-3"
          >
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-6 w-10 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Assigned Events & Reports Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scheduled Events Card */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200/50 pb-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-md" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white/70 rounded-xl p-3 border border-gray-100 shadow-sm flex items-center justify-between"
              >
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports Card */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200/50 pb-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-md" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white/70 rounded-xl p-3 border border-gray-100 shadow-sm flex items-center justify-between"
              >
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-4/5 rounded" />
                  <Skeleton className="h-3 w-1/3 rounded" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
