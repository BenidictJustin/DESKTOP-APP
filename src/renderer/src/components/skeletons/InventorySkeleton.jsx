/* eslint-disable */
import Skeleton from '../ui/Skeleton'

export default function InventorySkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header and action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Skeleton className="h-7 w-52 rounded-lg mb-1" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/80 rounded-2xl p-3.5 shadow-sm border border-gray-100/80 flex items-center gap-3"
          >
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-5 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <Skeleton className="h-10 w-full md:w-72 rounded-xl" />
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-xl shrink-0" />
          ))}
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="glass-card rounded-2xl overflow-hidden border border-gray-200/60 shadow-glass-sm">
        {/* Table Header */}
        <div className="bg-navy-blue/5 border-b border-gray-200/80 px-4 py-3 grid grid-cols-12 gap-3 items-center">
          <Skeleton className="h-3.5 col-span-3 rounded" />
          <Skeleton className="h-3.5 col-span-2 rounded" />
          <Skeleton className="h-3.5 col-span-2 rounded" />
          <Skeleton className="h-3.5 col-span-2 rounded" />
          <Skeleton className="h-3.5 col-span-2 rounded" />
          <Skeleton className="h-3.5 col-span-1 rounded" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-100 bg-white/60">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="px-4 py-3.5 grid grid-cols-12 gap-3 items-center">
              {/* Item Name */}
              <div className="col-span-3 flex items-center gap-2.5">
                <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3.5 w-3/4 rounded" />
                  <Skeleton className="h-2.5 w-1/2 rounded" />
                </div>
              </div>
              {/* Category */}
              <div className="col-span-2">
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              {/* Quantity */}
              <div className="col-span-2">
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              {/* Unit */}
              <div className="col-span-2">
                <Skeleton className="h-4 w-14 rounded" />
              </div>
              {/* Status / Expiration */}
              <div className="col-span-2">
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              {/* Actions */}
              <div className="col-span-1 flex items-center justify-end gap-1.5">
                <Skeleton className="w-6 h-6 rounded-md" />
                <Skeleton className="w-6 h-6 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
