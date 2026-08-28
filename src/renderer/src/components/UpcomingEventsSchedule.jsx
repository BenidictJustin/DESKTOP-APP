import React, { useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  ArrowUpRight
} from 'lucide-react'

const CALENDAR_MONTHS = [
  { name: 'January', index: 0 },
  { name: 'February', index: 1 },
  { name: 'March', index: 2 },
  { name: 'April', index: 3 },
  { name: 'May', index: 4 },
  { name: 'June', index: 5 },
  { name: 'July', index: 6 },
  { name: 'August', index: 7 },
  { name: 'September', index: 8 },
  { name: 'October', index: 9 },
  { name: 'November', index: 10 },
  { name: 'December', index: 11 }
]

export default function UpcomingEventsSchedule({
  events = [],
  orgs = [],
  onViewEvent,
  onViewAll,
  title = 'Upcoming Events'
}) {
  const now = new Date()
  const currentMonthIdx = now.getMonth()
  const currentYear = now.getFullYear()

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'planned' | 'completed'

  // Events grouped for each of the 12 calendar months (January - December)
  const groupedMonths = useMemo(() => {
    return CALENDAR_MONTHS.map((m) => {
      const monthEvents = events.filter((evt) => {
        if (!evt?.scheduleDate) return false
        const d = new Date(evt.scheduleDate)
        if (isNaN(d.getTime())) return false

        const matchesDate = d.getMonth() === m.index && d.getFullYear() === selectedYear
        if (!matchesDate) return false

        // Status filter
        if (statusFilter !== 'all') {
          const s = (evt.status || 'planned').toLowerCase()
          if (statusFilter === 'planned' && s !== 'planned') return false
          if (
            statusFilter === 'completed' &&
            s !== 'completed' &&
            s !== 'successful' &&
            s !== 'done'
          )
            return false
        }

        return true
      })

      // Sort events chronologically within the month
      monthEvents.sort((a, b) => new Date(a.scheduleDate) - new Date(b.scheduleDate))

      const isCurrent = m.index === currentMonthIdx && selectedYear === currentYear

      return {
        ...m,
        events: monthEvents,
        isCurrent
      }
    })
  }, [events, selectedYear, statusFilter, currentMonthIdx, currentYear])

  // Total count of scheduled events in the selected year
  const totalYearEvents = useMemo(() => {
    return groupedMonths.reduce((acc, m) => acc + m.events.length, 0)
  }, [groupedMonths])

  const handlePrevYear = () => setSelectedYear((prev) => prev - 1)
  const handleNextYear = () => setSelectedYear((prev) => prev + 1)
  const handleResetCurrentYear = () => setSelectedYear(currentYear)

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-5 w-full text-left font-poppins">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        {/* Title & Year Badge (without sparkle star icon) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 bg-navy-blue text-white rounded-xl shadow-2xs">
            <CalendarIcon className="w-5 h-5 text-sig-green" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-navy-blue text-base sm:text-lg tracking-tight">
                {title}
              </h3>
              <span className="inline-flex items-center text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sig-green/10 text-sig-green border border-sig-green/20 whitespace-nowrap">
                January – December {selectedYear}
              </span>
            </div>
          </div>
        </div>

        {/* Controls & Navigations */}
        <div className="flex items-center gap-2.5 flex-nowrap shrink-0">
          {/* Status Filter */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl text-xs shrink-0">
            {['all', 'planned', 'completed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-navy-blue text-white shadow-2xs'
                    : 'text-gray-500 hover:text-navy-blue'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Year Switcher */}
          <div className="flex items-center bg-slate-50 border border-gray-200/80 rounded-xl px-2 py-1 text-xs font-bold text-navy-blue shadow-2xs shrink-0">
            <button
              type="button"
              onClick={handlePrevYear}
              className="p-1 text-gray-400 hover:text-navy-blue hover:bg-gray-150 rounded-lg transition cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-extrabold select-none tracking-wide whitespace-nowrap">
              {selectedYear}
            </span>
            <button
              type="button"
              onClick={handleNextYear}
              className="p-1 text-gray-400 hover:text-navy-blue hover:bg-gray-150 rounded-lg transition cursor-pointer"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Reset to Current Year button */}
          {selectedYear !== currentYear && (
            <button
              type="button"
              onClick={handleResetCurrentYear}
              className="text-xs font-bold text-sig-green hover:underline px-2 py-1 bg-sig-green/10 rounded-xl border border-sig-green/20 cursor-pointer whitespace-nowrap shrink-0"
            >
              Current ({currentYear})
            </button>
          )}

          {/* Optional View All Link (placed at far right of controls) */}
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="flex items-center gap-1.5 bg-navy-blue hover:bg-navy-blue/90 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer ml-1 whitespace-nowrap shrink-0"
            >
              <span>Events Module</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Complete 12-Month Calendar Schedule Grid (January - December) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {groupedMonths.map((m) => {
          const hasOverflow = m.events.length > 3

          return (
            <div
              key={m.name}
              className={`h-[275px] rounded-2xl p-3.5 border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                m.isCurrent
                  ? 'bg-gradient-to-b from-white via-white to-sig-green/5 border-sig-green/40 shadow-xs ring-1 ring-sig-green/20'
                  : 'bg-gradient-to-b from-slate-50/70 to-white border-gray-200/80 hover:border-navy-blue/25 hover:shadow-2xs'
              }`}
            >
              {/* Month Card Title Header */}
              <div className="border-b border-gray-100 pb-2 mb-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-navy-blue text-xs uppercase tracking-widest">
                    {m.name}
                  </h4>
                  {m.isCurrent && (
                    <span className="bg-sig-green text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider leading-none">
                      This Month
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full leading-none ${
                    m.events.length > 0
                      ? 'bg-navy-blue text-sig-green'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {m.events.length} {m.events.length === 1 ? 'Event' : 'Events'}
                </span>
              </div>

              {/* Scrollable Events List (consistent height, up to 3 visible without scroll) */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                {m.events.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-6 text-center">
                    <p className="text-xs text-gray-400 font-medium italic select-none">
                      No scheduled events
                    </p>
                  </div>
                ) : (
                  m.events.map((evt) => {
                    const org = orgs.find((o) => o.id === evt.assignedOrganizationId)
                    const d = new Date(evt.scheduleDate)
                    const dayStr = !isNaN(d.getTime()) ? d.getDate() : ''
                    const isCompleted =
                      evt.status === 'completed' || evt.status === 'successful'

                    return (
                      <div
                        key={evt.id}
                        onClick={() => onViewEvent && onViewEvent(evt)}
                        className="group p-2 bg-white hover:bg-navy-blue/5 border border-gray-150 hover:border-sig-green/40 rounded-xl transition-all duration-150 cursor-pointer shadow-2xs text-left"
                        title="Click to view full event details"
                      >
                        {/* Event Title with Bullet Dot */}
                        <div className="flex items-start gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                              isCompleted ? 'bg-green-500' : 'bg-sig-green'
                            }`}
                          />
                          <span className="font-bold text-navy-blue text-xs uppercase tracking-tight group-hover:text-sig-green transition-colors leading-tight line-clamp-1">
                            {evt.name}
                          </span>
                        </div>

                        {/* Short Info Metadata Row */}
                        <div className="mt-1 pl-3 flex items-center justify-between text-xs text-gray-500 font-medium gap-1">
                          <span className="flex items-center gap-1 text-navy-blue font-semibold shrink-0">
                            <CalendarIcon className="w-3 h-3 text-navy-blue shrink-0" />
                            <span>
                              {m.name.slice(0, 3)} {dayStr}
                            </span>
                          </span>

                          {evt.location && (
                            <span className="truncate max-w-[85px] text-gray-400">
                              {evt.location}
                            </span>
                          )}

                          <span className="bg-navy-blue/5 text-navy-blue text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0">
                            {org ? org.abbreviation : 'CES'}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Month Footer Status / Scroll Hint */}
              <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[9.5px] text-gray-400 font-semibold shrink-0">
                <span>
                  {hasOverflow ? (
                    <span className="text-sig-green font-bold">
                      +{m.events.length - 3} more (scroll)
                    </span>
                  ) : m.events.length > 0 ? (
                    <span>All events shown</span>
                  ) : (
                    <span>—</span>
                  )}
                </span>
                <span className="text-gray-300">{selectedYear}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
