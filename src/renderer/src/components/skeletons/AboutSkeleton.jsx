/* eslint-disable */
import Skeleton from '../ui/Skeleton'

export default function AboutSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in w-full text-left">
      {/* ── 1. PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-36 rounded-xl" />
        </div>
      </div>

      {/* ── 2. SYSTEM DESCRIPTION (full-width) ── */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <Skeleton className="h-5 w-44 rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      </div>

      {/* ── 3. CES OFFICE — Vision / Mission / Goal ── */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div className="border-b border-gray-100 pb-3">
          <Skeleton className="h-5 w-64 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Vision Skeleton Card */}
          <div className="bg-gradient-to-b from-slate-50/80 via-white to-white rounded-2xl p-6 border border-gray-100 shadow-2xs flex flex-col items-center text-center space-y-3">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <div className="space-y-2 w-full pt-1">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-5/6 mx-auto rounded" />
              <Skeleton className="h-3.5 w-4/5 mx-auto rounded" />
              <Skeleton className="h-3.5 w-2/3 mx-auto rounded" />
            </div>
          </div>

          {/* Mission Skeleton Card */}
          <div className="bg-gradient-to-b from-slate-50/80 via-white to-white rounded-2xl p-6 border border-gray-100 shadow-2xs flex flex-col items-center text-center space-y-3">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <div className="space-y-2 w-full pt-1">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-5/6 mx-auto rounded" />
              <Skeleton className="h-3.5 w-4/5 mx-auto rounded" />
              <Skeleton className="h-3.5 w-2/3 mx-auto rounded" />
            </div>
          </div>

          {/* Goal Skeleton Card */}
          <div className="bg-gradient-to-b from-slate-50/80 via-white to-white rounded-2xl p-6 border border-gray-100 shadow-2xs flex flex-col items-center text-center space-y-3">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <div className="space-y-2 w-full pt-1">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-5/6 mx-auto rounded" />
              <Skeleton className="h-3.5 w-4/5 mx-auto rounded" />
              <Skeleton className="h-3.5 w-2/3 mx-auto rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Organizational Chart Skeleton ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 space-y-6 text-center flex flex-col items-center">
        {/* Banner */}
        <div className="w-full h-10 bg-navy-blue/10 rounded-2xl flex items-center justify-center">
          <Skeleton className="h-4 w-48 rounded" />
        </div>

        {/* Hierarchy vertical cards */}
        <div className="w-full flex flex-col items-center space-y-3">
          {[1, 2, 3, 4].map((i, idx) => (
            <div key={i} className="flex flex-col items-center w-full max-w-sm">
              <div className="flex flex-col items-center space-y-2 py-1">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="h-3 w-40 rounded" />
                <Skeleton className="h-3.5 w-56 rounded" />
              </div>
              {idx < 3 && <div className="w-0.5 h-6 bg-gray-200 rounded-full my-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Developers Skeleton ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 space-y-6 text-center flex flex-col items-center w-full">
        {/* Banner */}
        <div className="w-full h-10 bg-navy-blue/10 rounded-2xl flex items-center justify-center">
          <Skeleton className="h-4 w-36 rounded" />
        </div>

        {/* 4-grid of devs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center text-center p-3 rounded-2xl space-y-2.5">
              <Skeleton className="w-16 h-16 rounded-full mb-1" />
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-3.5 w-28 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
