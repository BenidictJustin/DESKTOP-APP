/* eslint-disable */
import Skeleton from '../ui/Skeleton'

export default function EventsSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header and action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Skeleton className="h-7 w-48 rounded-lg mb-1" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Filter and year controls */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-200/50 pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-xl" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-xl" />
            <Skeleton className="h-8 w-20 rounded-xl" />
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white/80 rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col"
            >
              {/* Event Top Banner */}
              <Skeleton className="h-28 w-full rounded-none" />
              {/* Event Content */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-24 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-4/5 rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
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
    </div>
  )
}
