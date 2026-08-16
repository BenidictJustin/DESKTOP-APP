/* eslint-disable */
import Skeleton from '../ui/Skeleton'

export default function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header title */}
      <div>
        <Skeleton className="h-7 w-36 rounded-lg" />
      </div>

      {/* Quick Stats Grid (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white/80 rounded-2xl p-4 shadow-sm border border-gray-100/80 flex items-center gap-3"
          >
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-6 w-10 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Pending Submitted Reports Card */}
      <div className="glass-card rounded-2xl p-4 space-y-3 w-full">
        <div className="flex items-center justify-between border-b border-gray-200/50 pb-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-md" />
            <Skeleton className="h-4 w-44 rounded-md" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white/70 rounded-xl p-3.5 border border-gray-100/90 shadow-sm space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <div className="flex items-center gap-4 pt-1">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events / Calendar Schedule Section */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-200/50 pb-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-md" />
            <Skeleton className="h-4 w-36 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-20 rounded-xl" />
            <Skeleton className="h-7 w-24 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/70 rounded-xl p-3.5 border border-gray-100/90 shadow-sm space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-4/5 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
