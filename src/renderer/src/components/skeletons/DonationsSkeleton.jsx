/* eslint-disable */
import Skeleton from '../ui/Skeleton'

export default function DonationsSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header and action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Skeleton className="h-7 w-56 rounded-lg mb-1" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/80 rounded-2xl p-4 shadow-sm border border-gray-100/80 flex items-center gap-3"
          >
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-6 w-14 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main donations / donors list card */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-200/50 pb-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-md" />
            <Skeleton className="h-4 w-36 rounded-md" />
          </div>
          <Skeleton className="h-8 w-48 rounded-xl" />
        </div>

        {/* Donations Items List */}
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white/70 rounded-xl p-3.5 border border-gray-100/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3 w-3/4 rounded" />
                <div className="flex items-center gap-3 pt-1">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-center">
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
