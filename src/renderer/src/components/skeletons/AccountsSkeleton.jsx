/* eslint-disable */
import Skeleton from '../ui/Skeleton'

export default function AccountsSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header and action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Skeleton className="h-7 w-64 rounded-lg mb-1" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-9 w-44 rounded-xl" />
      </div>

      {/* Accounts Table Container */}
      <div className="glass-card rounded-2xl overflow-hidden border border-gray-200/60 shadow-glass-sm">
        {/* Table Header */}
        <div className="bg-navy-blue/5 border-b border-gray-200/80 px-4 py-3 grid grid-cols-12 gap-3 items-center">
          <Skeleton className="h-3.5 col-span-4 rounded" />
          <Skeleton className="h-3.5 col-span-3 rounded" />
          <Skeleton className="h-3.5 col-span-2 rounded" />
          <Skeleton className="h-3.5 col-span-2 rounded" />
          <Skeleton className="h-3.5 col-span-1 rounded" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-100 bg-white/60">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-4 py-3.5 grid grid-cols-12 gap-3 items-center">
              {/* User Avatar + Name */}
              <div className="col-span-4 flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3.5 w-32 rounded" />
                  <Skeleton className="h-2.5 w-24 rounded" />
                </div>
              </div>
              {/* Email / Username */}
              <div className="col-span-3">
                <Skeleton className="h-3.5 w-40 rounded" />
              </div>
              {/* Department */}
              <div className="col-span-2">
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              {/* Status */}
              <div className="col-span-2">
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              {/* Actions */}
              <div className="col-span-1 flex items-center justify-end gap-1.5">
                <Skeleton className="w-7 h-7 rounded-lg" />
                <Skeleton className="w-7 h-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
