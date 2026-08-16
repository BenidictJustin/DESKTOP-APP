/* eslint-disable */
import Skeleton from '../ui/Skeleton'

export default function OrganizationSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header and action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Skeleton className="h-7 w-64 rounded-lg mb-1" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white/80 rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Top dept icon + abbr */}
              <div className="flex items-start justify-between">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              {/* Department Full Name & Description */}
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-4/5 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
              </div>
            </div>

            {/* Coordinator Info & Projects Metric */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-2.5 w-20 rounded" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-4 w-20 rounded" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="w-7 h-7 rounded-lg" />
                  <Skeleton className="w-7 h-7 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
