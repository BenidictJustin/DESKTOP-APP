/* eslint-disable */
import Skeleton from '../ui/Skeleton'

export default function ReportsSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header and action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Skeleton className="h-7 w-48 rounded-lg mb-1" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Filter bar */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      </div>

      {/* Reports Table Container */}
      <div className="glass-card rounded-2xl overflow-hidden border border-gray-200/60 shadow-glass-sm">
        {/* Table Header */}
        <div className="bg-navy-blue/5 border-b border-gray-200/80 px-4 py-3 grid grid-cols-12 gap-3 items-center">
          <Skeleton className="h-3.5 col-span-4 rounded" />
          <Skeleton className="h-3.5 col-span-2 rounded" />
          <Skeleton className="h-3.5 col-span-2 rounded" />
          <Skeleton className="h-3.5 col-span-2 rounded" />
          <Skeleton className="h-3.5 col-span-2 rounded" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-100 bg-white/60">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-4 py-3.5 grid grid-cols-12 gap-3 items-center">
              {/* Title */}
              <div className="col-span-4 space-y-1">
                <Skeleton className="h-4 w-4/5 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
              {/* Department */}
              <div className="col-span-2">
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              {/* Author */}
              <div className="col-span-2">
                <Skeleton className="h-3.5 w-28 rounded" />
              </div>
              {/* Status */}
              <div className="col-span-2">
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-2">
                <Skeleton className="h-7 w-16 rounded-lg" />
                <Skeleton className="w-7 h-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
