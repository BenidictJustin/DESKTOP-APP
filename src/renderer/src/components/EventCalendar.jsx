/* eslint-disable */
import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Search,
  CheckCircle,
  Edit2,
  Trash2,
  Eye,
  Filter,
  Layers,
  CalendarDays,
  Grid,
  List,
  Sparkles,
  Info,
  X,
  AlertCircle
} from 'lucide-react'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const FULL_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]

// Hourly slots for Week & Day views (7:00 AM to 9:00 PM)
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7)

function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h}:00 ${period}`
}

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false
  const date1 = new Date(d1)
  const date2 = new Date(d2)
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function isToday(d) {
  return isSameDay(d, new Date())
}

function getEventStatus(evt) {
  const status = (evt?.status || 'planned').toLowerCase().trim()
  if (status === 'completed') return 'completed'
  if (status === 'cancelled') return 'cancelled'
  return 'planned'
}

function getStatusBadgeStyle(status) {
  switch (status) {
    case 'completed':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        chip: 'bg-emerald-500/10 text-emerald-800 border-emerald-200 hover:bg-emerald-500/20'
      }
    case 'cancelled':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        dot: 'bg-red-500',
        chip: 'bg-red-500/10 text-red-800 border-red-200 hover:bg-red-500/20'
      }
    case 'planned':
    default:
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-600',
        chip: 'bg-navy-blue/10 text-navy-blue border-navy-blue/20 hover:bg-navy-blue/15'
      }
  }
}

export default function EventCalendar({
  events = [],
  orgs = [],
  onViewEvent,
  onEditEvent,
  onDeleteEvent,
  onCompleteEvent,
  onScheduleEvent
}) {
  const [viewMode, setViewMode] = useState('month') // 'month' | 'week' | 'day'
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'planned' | 'completed' | 'cancelled'
  const [orgFilter, setOrgFilter] = useState('all')
  const [overflowModalDay, setOverflowModalDay] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const searchContainerRef = useRef(null)

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Matched Events based on searchQuery
  const matchedEvents = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    return events
      .filter((evt) => {
        const name = (evt.name || '').toLowerCase()
        const desc = (evt.description || '').toLowerCase()
        const loc = (evt.location || '').toLowerCase()
        const orgName = (evt.organizationName || '').toLowerCase()
        const orgObj = orgs.find((o) => o.id === evt.assignedOrganizationId)
        const orgAbbr = (orgObj?.abbreviation || '').toLowerCase()
        const orgFullName = (orgObj?.name || '').toLowerCase()
        const status = (evt.status || '').toLowerCase()

        return (
          name.includes(q) ||
          desc.includes(q) ||
          loc.includes(q) ||
          orgName.includes(q) ||
          orgAbbr.includes(q) ||
          orgFullName.includes(q) ||
          status.includes(q)
        )
      })
      .sort((a, b) => new Date(a.scheduleDate) - new Date(b.scheduleDate))
  }, [events, orgs, searchQuery])

  // Active highlighted event ID
  const activeMatchedEventId = useMemo(() => {
    if (matchedEvents.length === 0) return null
    const safeIdx = Math.min(activeMatchIndex, matchedEvents.length - 1)
    return matchedEvents[safeIdx]?.id || null
  }, [matchedEvents, activeMatchIndex])

  // Set of all matched event IDs for fast lookup
  const matchedEventIdsSet = useMemo(() => {
    return new Set(matchedEvents.map((e) => e.id))
  }, [matchedEvents])

  // Search input handler with auto-navigation
  const handleSearchChange = (query) => {
    setSearchQuery(query)
    setActiveMatchIndex(0)
    setIsSearchFocused(true)

    if (query.trim()) {
      const q = query.toLowerCase().trim()
      const matches = events
        .filter((evt) => {
          const name = (evt.name || '').toLowerCase()
          const desc = (evt.description || '').toLowerCase()
          const loc = (evt.location || '').toLowerCase()
          const orgName = (evt.organizationName || '').toLowerCase()
          const orgObj = orgs.find((o) => o.id === evt.assignedOrganizationId)
          const orgAbbr = (orgObj?.abbreviation || '').toLowerCase()
          const orgFullName = (orgObj?.name || '').toLowerCase()
          const status = (evt.status || '').toLowerCase()

          return (
            name.includes(q) ||
            desc.includes(q) ||
            loc.includes(q) ||
            orgName.includes(q) ||
            orgAbbr.includes(q) ||
            orgFullName.includes(q) ||
            status.includes(q)
          )
        })
        .sort((a, b) => new Date(a.scheduleDate) - new Date(b.scheduleDate))

      if (matches.length > 0) {
        const firstMatchDate = new Date(matches[0].scheduleDate)
        setCurrentDate(firstMatchDate)
        setSelectedDate(firstMatchDate)
      }
    }
  }

  // Navigate to specific match index and close dropdown
  const handleSelectMatch = (index) => {
    if (index < 0 || index >= matchedEvents.length) return
    setActiveMatchIndex(index)
    const targetEvt = matchedEvents[index]
    if (targetEvt?.scheduleDate) {
      const matchDate = new Date(targetEvt.scheduleDate)
      setCurrentDate(matchDate)
      setSelectedDate(matchDate)
    }
    setIsSearchFocused(false)
  }

  const handlePrevMatch = (e) => {
    if (e) e.stopPropagation()
    if (matchedEvents.length === 0) return
    const nextIdx =
      (activeMatchIndex - 1 + matchedEvents.length) % matchedEvents.length
    handleSelectMatch(nextIdx)
  }

  const handleNextMatch = (e) => {
    if (e) e.stopPropagation()
    if (matchedEvents.length === 0) return
    const nextIdx = (activeMatchIndex + 1) % matchedEvents.length
    handleSelectMatch(nextIdx)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setActiveMatchIndex(0)
    setIsSearchFocused(false)
  }

  // Filtered Events for grid display
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Status filter
      const st = getEventStatus(evt)
      if (statusFilter !== 'all' && st !== statusFilter) return false

      // Org filter
      if (orgFilter !== 'all' && evt.assignedOrganizationId !== orgFilter)
        return false

      return true
    })
  }, [events, statusFilter, orgFilter])

  // Counts for status
  const counts = useMemo(() => {
    const planned = events.filter((e) => getEventStatus(e) === 'planned').length
    const completed = events.filter((e) => getEventStatus(e) === 'completed').length
    return { planned, completed, total: events.length }
  }, [events])

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      )
    } else if (viewMode === 'week') {
      const nextD = new Date(currentDate)
      nextD.setDate(nextD.getDate() - 7)
      setCurrentDate(nextD)
    } else {
      const nextD = new Date(currentDate)
      nextD.setDate(nextD.getDate() - 1)
      setCurrentDate(nextD)
      setSelectedDate(nextD)
    }
  }

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      )
    } else if (viewMode === 'week') {
      const nextD = new Date(currentDate)
      nextD.setDate(nextD.getDate() + 7)
      setCurrentDate(nextD)
    } else {
      const nextD = new Date(currentDate)
      nextD.setDate(nextD.getDate() + 1)
      setCurrentDate(nextD)
      setSelectedDate(nextD)
    }
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  // Header Title
  const headerTitle = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = MONTH_NAMES[currentDate.getMonth()]

    if (viewMode === 'month') {
      return `${month} ${year}`
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate)
      const day = startOfWeek.getDay()
      startOfWeek.setDate(startOfWeek.getDate() - day)

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)

      const startMonth = MONTH_NAMES[startOfWeek.getMonth()].slice(0, 3)
      const endMonth = MONTH_NAMES[endOfWeek.getMonth()].slice(0, 3)

      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startMonth} ${startOfWeek.getDate()} – ${endOfWeek.getDate()}, ${year}`
      }
      return `${startMonth} ${startOfWeek.getDate()} – ${endMonth} ${endOfWeek.getDate()}, ${year}`
    } else {
      return `${FULL_DAYS[currentDate.getDay()]}, ${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()}, ${year}`
    }
  }, [currentDate, viewMode])

  // Month grid days calculation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const firstDayIndex = firstDay.getDay() // 0 is Sun

    const prevMonthLastDate = new Date(year, month, 0).getDate()
    const currentMonthTotalDays = new Date(year, month + 1, 0).getDate()

    const days = []

    // Previous month trailing days
    for (let x = firstDayIndex; x > 0; x--) {
      const date = new Date(year, month - 1, prevMonthLastDate - x + 1)
      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: false
      })
    }

    // Current month days
    for (let i = 1; i <= currentMonthTotalDays; i++) {
      const date = new Date(year, month, i)
      days.push({
        date,
        dayNumber: i,
        isCurrentMonth: true
      })
    }

    // Next month trailing days to complete 5 or 6 weeks (35 or 42 grid cells)
    const remaining = (7 - (days.length % 7)) % 7
    const totalNeeded = days.length + remaining < 35 ? 35 : days.length + remaining
    const trailingCount = totalNeeded - days.length

    for (let j = 1; j <= trailingCount; j++) {
      const date = new Date(year, month + 1, j)
      days.push({
        date,
        dayNumber: j,
        isCurrentMonth: false
      })
    }

    return days
  }, [currentDate])

  // Week days calculation
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate)
    const dayOfWeek = curr.getDay()
    const startOfWeek = new Date(curr)
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek)

    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(d.getDate() + i)
      days.push(d)
    }
    return days
  }, [currentDate])

  // Mini calendar calculation
  const miniCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const firstDayIndex = firstDay.getDay()

    const prevMonthLastDate = new Date(year, month, 0).getDate()
    const currentMonthTotalDays = new Date(year, month + 1, 0).getDate()

    const days = []

    for (let x = firstDayIndex; x > 0; x--) {
      const d = new Date(year, month - 1, prevMonthLastDate - x + 1)
      days.push({ date: d, isCurrentMonth: false })
    }

    for (let i = 1; i <= currentMonthTotalDays; i++) {
      const d = new Date(year, month, i)
      days.push({ date: d, isCurrentMonth: true })
    }

    const remaining = (7 - (days.length % 7)) % 7
    for (let j = 1; j <= remaining; j++) {
      const d = new Date(year, month + 1, j)
      days.push({ date: d, isCurrentMonth: false })
    }

    return days
  }, [currentDate])

  // Events on selected day
  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter((e) => isSameDay(e.scheduleDate, selectedDate))
  }, [filteredEvents, selectedDate])

  return (
    <div className="flex flex-col space-y-4">
      {/* ── TOP OUTLOOK CONTROLS BAR ── */}
      <div
        className="bg-white rounded-3xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        style={{ position: 'relative', zIndex: 30 }}
      >
        {/* 1. LEFT SIDE: Search Bar */}
        <div className="w-full lg:w-72 flex-shrink-0">
          {/* Search Input Container */}
          <div ref={searchContainerRef} className="relative w-full" style={{ zIndex: 50 }}>
            <div
              className={`flex items-center bg-gray-50/80 border rounded-xl transition duration-150 ${
                isSearchFocused
                  ? 'bg-white border-navy-blue ring-2 ring-navy-blue/15 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ height: '38px' }}
            >
              <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search event, venue..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (e.shiftKey) {
                      handlePrevMatch(e)
                    } else {
                      handleNextMatch(e)
                    }
                    setIsSearchFocused(false)
                  } else if (e.key === 'Escape') {
                    handleClearSearch()
                  }
                }}
                className="w-full pl-2.5 pr-2 py-2 text-xs bg-transparent focus:outline-none font-medium text-navy-blue"
              />

              {/* Clear Search Button (when searchQuery is present) */}
              {searchQuery.trim() && (
                <div className="flex items-center pr-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="text-gray-400 hover:text-navy-blue p-1 rounded-md hover:bg-gray-150 transition cursor-pointer"
                    title="Clear search (Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Live Search Results Dropdown Popover */}
            {isSearchFocused && searchQuery.trim() !== '' && (
              <div
                className="absolute left-0 top-full mt-1.5 w-full sm:w-80 bg-white rounded-2xl border border-gray-200 py-2 max-h-56 overflow-y-auto overflow-x-hidden isolate"
                style={{
                  zIndex: 9999,
                  boxShadow:
                    '0 12px 40px -4px rgba(0,0,0,0.18), 0 4px 12px -2px rgba(0,0,0,0.08)',
                  contain: 'layout paint'
                }}
              >
                {matchedEvents.length === 0 ? (
                  <div className="p-3.5 text-center space-y-1">
                    <div className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-bold text-navy-blue">
                      No events found
                    </p>
                    <p className="text-[11px] text-gray-400">
                      No matches for &ldquo;{searchQuery}&rdquo;
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 flex items-center justify-between">
                      <span>Search Matches ({matchedEvents.length})</span>
                      <button
                        type="button"
                        onClick={() => setIsSearchFocused(false)}
                        className="text-[10px] text-navy-blue font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <span>Dismiss</span>
                      </button>
                    </div>
                    <div className="divide-y divide-gray-50 pt-1">
                      {matchedEvents.map((evt, idx) => {
                        const org = orgs.find(
                          (o) => o.id === evt.assignedOrganizationId
                        )
                        const isCurrentActive = idx === activeMatchIndex
                        const statusStyle = getStatusBadgeStyle(
                          getEventStatus(evt)
                        )
                        const dateObj = new Date(evt.scheduleDate)

                        return (
                          <div
                            key={evt.id}
                            onClick={() => handleSelectMatch(idx)}
                            style={{ contain: 'content' }}
                            className={`p-2.5 px-3 transition-colors duration-100 cursor-pointer flex flex-col space-y-0.5 ${
                              isCurrentActive
                                ? 'bg-sig-green/15 border-l-[3px] border-sig-green'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-navy-blue truncate">
                                {evt.name}
                              </span>
                              <span
                                className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text} shrink-0`}
                              >
                                {evt.status || 'planned'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-gray-500 font-semibold">
                              <span className="flex items-center gap-1 text-navy-blue">
                                <CalendarIcon className="w-3 h-3 text-navy-blue" />
                                {dateObj.toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                {dateObj.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {evt.location && (
                                <span className="flex items-center gap-1 truncate text-gray-500 max-w-[120px]">
                                  <MapPin className="w-3 h-3 text-sig-green shrink-0" />
                                  <span className="truncate">{evt.location}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. CENTER: Today button + Month indicator with Previous < and Next > navigation */}
        <div className="flex flex-wrap items-center justify-center gap-3 flex-1">
          {/* Today Button */}
          <button
            type="button"
            onClick={handleToday}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-navy-blue bg-gray-50 border border-gray-200/80 hover:bg-navy-blue hover:text-white hover:border-navy-blue transition duration-150 cursor-pointer shadow-2xs"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          {/* Month Indicator & Chevrons */}
          <div className="flex items-center gap-2 bg-gray-50/70 border border-gray-200/80 rounded-xl px-2 py-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 text-gray-600 hover:text-navy-blue hover:bg-white rounded-lg transition cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <h2 className="text-sm sm:text-base font-black text-navy-blue tracking-tight select-none px-2 whitespace-nowrap text-center min-w-[120px]">
              {headerTitle}
            </h2>

            <button
              type="button"
              onClick={handleNext}
              className="p-1 text-gray-600 hover:text-navy-blue hover:bg-white rounded-lg transition cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. RIGHT SIDE: View Switcher (Month | Week | Day) */}
        <div className="flex items-center justify-end flex-shrink-0">
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/60 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-navy-blue shadow-xs'
                  : 'text-gray-500 hover:text-navy-blue'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white text-navy-blue shadow-xs'
                  : 'text-gray-500 hover:text-navy-blue'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-white text-navy-blue shadow-xs'
                  : 'text-gray-500 hover:text-navy-blue'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CALENDAR BODY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT SIDEBAR (OUTLOOK MINI-CALENDAR & FILTERS) ── */}
        <div
          className={`lg:col-span-3 space-y-4 transition-all duration-200 ${
            sidebarOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Mini Calendar Card */}
          <div className="bg-white rounded-3xl p-4.5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-navy-blue">
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentDate(
                      new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() - 1,
                        1
                      )
                    )
                  }
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-navy-blue transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentDate(
                      new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() + 1,
                        1
                      )
                    )
                  }
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-navy-blue transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mini Day Names */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-bold text-gray-400 py-0.5"
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Mini Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {miniCalendarDays.map((item, idx) => {
                const isSelected = isSameDay(item.date, selectedDate)
                const isCurrent = isToday(item.date)
                const hasEvents = events.some((e) =>
                  isSameDay(e.scheduleDate, item.date)
                )
                const hasMatch =
                  searchQuery.trim() !== '' &&
                  matchedEvents.some((e) => isSameDay(e.scheduleDate, item.date))

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedDate(item.date)
                      setCurrentDate(item.date)
                    }}
                    className={`relative py-1.5 text-[11px] rounded-lg font-semibold transition cursor-pointer flex flex-col items-center justify-center ${
                      hasMatch
                        ? 'font-bold bg-sig-green/25 text-navy-blue border-2 border-sig-green'
                        : isSelected
                          ? 'bg-navy-blue text-white shadow-xs'
                          : isCurrent
                            ? 'bg-sig-green/20 text-navy-blue font-black'
                            : item.isCurrentMonth
                              ? 'text-gray-700 hover:bg-gray-100'
                              : 'text-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{item.date.getDate()}</span>
                    {hasEvents && (
                      <span
                        className={`w-1 h-1 rounded-full mt-0.5 ${
                          hasMatch
                            ? 'bg-sig-green'
                            : isSelected
                              ? 'bg-sig-green'
                              : 'bg-navy-blue'
                        }`}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status Filter Card */}
          <div className="bg-white rounded-3xl p-4.5 shadow-sm border border-gray-100">
            <h4 className="text-xs font-bold text-navy-blue uppercase tracking-wider mb-3">
              Event Status
            </h4>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-navy-blue text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <span>All Events</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    statusFilter === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {counts.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('planned')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'planned'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-blue-50/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Planned / Upcoming</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    statusFilter === 'planned'
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {counts.planned}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:bg-emerald-50/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Completed</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    statusFilter === 'completed'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {counts.completed}
                </span>
              </button>
            </div>
          </div>

          {/* Organization / Department Filter */}
          {orgs.length > 0 && (
            <div className="bg-white rounded-3xl p-4.5 shadow-sm border border-gray-100">
              <h4 className="text-xs font-bold text-navy-blue uppercase tracking-wider mb-2.5">
                Department / Org
              </h4>
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue cursor-pointer"
              >
                <option value="all">All Departments / Orgs</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.abbreviation})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selected Day Quick Agenda Panel */}
          <div className="bg-white rounded-3xl p-4.5 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-sig-green" />
                <span className="text-xs font-bold text-navy-blue">
                  {FULL_DAYS[selectedDate.getDay()]}, {selectedDate.getDate()}
                </span>
              </div>
              <span className="text-[10px] font-bold text-gray-400">
                {selectedDayEvents.length}{' '}
                {selectedDayEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-xs font-medium">
                No events scheduled on this date.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedDayEvents.map((evt) => {
                  const style = getStatusBadgeStyle(getEventStatus(evt))
                  const isMatch = matchedEventIdsSet.has(evt.id)
                  const isActive = evt.id === activeMatchedEventId
                  const timeStr = new Date(evt.scheduleDate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  return (
                    <div
                      key={evt.id}
                      onClick={() => onViewEvent && onViewEvent(evt)}
                      className={`p-2.5 rounded-xl border transition duration-150 cursor-pointer space-y-1 ${
                        isActive
                          ? 'bg-sig-green/20 border-sig-green border-2 shadow-xs'
                          : isMatch
                            ? 'bg-sig-green/10 border-sig-green/70 border-2'
                            : `${style.border} ${style.bg} hover:shadow-xs`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-navy-blue flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {timeStr}
                        </span>
                        <div className="flex items-center gap-1">
                          {isMatch && (
                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-sig-green text-navy-blue">
                              Match
                            </span>
                          )}
                          <span
                            className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}
                          >
                            {evt.status || 'planned'}
                          </span>
                        </div>
                      </div>
                      <h5 className="font-bold text-xs text-navy-blue line-clamp-1">
                        {evt.name}
                      </h5>
                      {evt.location && (
                        <p className="text-[10px] text-gray-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-sig-green shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT CALENDAR VIEW AREA ── */}
        <div className="lg:col-span-9 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {/* ════════════════════════════════════════════════════════ */}
          {/* A. MONTH VIEW */}
          {/* ════════════════════════════════════════════════════════ */}
          {viewMode === 'month' && (
            <div className="flex flex-col">
              {/* Day Headers (Sun - Sat) */}
              <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/80">
                {SHORT_DAYS.map((d) => (
                  <div
                    key={d}
                    className="py-3 text-center text-xs font-bold text-navy-blue tracking-wider uppercase"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Grid Cells */}
              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-100">
                {monthDays.map((cell, idx) => {
                  const dayEvents = filteredEvents.filter((e) =>
                    isSameDay(e.scheduleDate, cell.date)
                  )
                  const isCurrent = isToday(cell.date)
                  const isSelected = isSameDay(cell.date, selectedDate)
                  const hasMatchInCell =
                    searchQuery.trim() !== '' &&
                    dayEvents.some((e) => matchedEventIdsSet.has(e.id))

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(cell.date)}
                      className={`min-h-[110px] sm:min-h-[125px] p-2 flex flex-col justify-between transition-colors relative group ${
                        !cell.isCurrentMonth
                          ? 'bg-gray-50/40 text-gray-300'
                          : 'bg-white text-gray-800 hover:bg-gray-50/70'
                      } ${
                        hasMatchInCell
                          ? 'bg-sig-green/10'
                          : isSelected
                            ? 'bg-blue-50/30'
                            : ''
                      }`}
                      style={hasMatchInCell ? { boxShadow: 'inset 0 0 0 2px var(--color-sig-green, #4ade80)' } : isSelected ? { boxShadow: 'inset 0 0 0 2px rgba(29,53,87,0.15)' } : undefined}
                    >
                      {/* Cell Top Header */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full transition ${
                            hasMatchInCell
                              ? 'bg-sig-green text-navy-blue font-bold shadow-xs'
                              : isCurrent
                                ? 'bg-navy-blue text-white shadow-xs font-black'
                                : cell.isCurrentMonth
                                  ? 'text-gray-700'
                                  : 'text-gray-400'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {/* Quick schedule button on hover */}
                        {onScheduleEvent && cell.isCurrentMonth && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onScheduleEvent(cell.date)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-navy-blue hover:bg-gray-150 rounded transition cursor-pointer"
                            title="Schedule on this day"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Event Chips List */}
                      <div className="flex-1 space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((evt) => {
                          const status = getEventStatus(evt)
                          const style = getStatusBadgeStyle(status)
                          const isMatch = matchedEventIdsSet.has(evt.id)
                          const isActiveMatch = evt.id === activeMatchedEventId
                          const timeStr = new Date(evt.scheduleDate).toLocaleTimeString(
                            [],
                            { hour: 'numeric', minute: '2-digit' }
                          )

                          return (
                            <div
                              key={evt.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onViewEvent) onViewEvent(evt)
                              }}
                              className={`group/chip px-2 py-1 rounded-md text-[10px] font-semibold flex items-center justify-between gap-1 truncate cursor-pointer transition border ${
                                isActiveMatch
                                  ? 'bg-sig-green text-navy-blue font-bold border-sig-green shadow-xs'
                                  : isMatch
                                    ? 'bg-sig-green/25 text-navy-blue font-bold border-sig-green/60'
                                    : style.chip
                              }`}
                              title={`${evt.name} - ${timeStr} (${evt.status})`}
                            >
                              <div className="flex items-center space-x-1 min-w-0 truncate">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isMatch ? 'bg-navy-blue' : style.dot
                                  }`}
                                />
                                <span className="text-[9px] font-bold opacity-80 shrink-0">
                                  {timeStr}
                                </span>
                                <span className="truncate font-bold">
                                  {evt.name}
                                </span>
                              </div>
                            </div>
                          )
                        })}

                        {/* Overflow "+N more" badge */}
                        {dayEvents.length > 3 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOverflowModalDay({
                                date: cell.date,
                                events: dayEvents
                              })
                            }}
                            className="w-full text-left px-1.5 py-0.5 text-[9px] font-bold text-navy-blue hover:text-sig-green hover:underline cursor-pointer transition block"
                          >
                            +{dayEvents.length - 3} more events
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/* B. WEEK VIEW */}
          {/* ════════════════════════════════════════════════════════ */}
          {viewMode === 'week' && (
            <div className="flex flex-col overflow-x-auto">
              {/* Week Column Headers */}
              <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50/80 sticky top-0 z-10 min-w-[700px]">
                <div className="py-3 px-2 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider border-r border-gray-100">
                  Time
                </div>
                {weekDays.map((d, i) => {
                  const isCurrent = isToday(d)
                  const isSelected = isSameDay(d, selectedDate)
                  const hasMatchInDay =
                    searchQuery.trim() !== '' &&
                    matchedEvents.some((e) => isSameDay(e.scheduleDate, d))

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDate(d)}
                      className={`py-3 text-center cursor-pointer transition border-r border-gray-100 ${
                        hasMatchInDay
                          ? 'bg-sig-green/15 font-bold'
                          : isCurrent
                            ? 'bg-navy-blue/5 font-bold'
                            : isSelected
                              ? 'bg-blue-50/30'
                              : ''
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">
                        {SHORT_DAYS[d.getDay()]}
                      </span>
                      <span
                        className={`text-sm font-extrabold inline-flex items-center justify-center w-7 h-7 rounded-full mt-0.5 ${
                          hasMatchInDay
                            ? 'bg-sig-green text-navy-blue font-bold shadow-xs'
                            : isCurrent
                              ? 'bg-navy-blue text-white shadow-xs'
                              : 'text-navy-blue'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Week Hourly Grid */}
              <div className="divide-y divide-gray-100 min-w-[700px] max-h-[650px] overflow-y-auto">
                {HOURS.map((hour) => (
                  <div key={hour} className="grid grid-cols-8 min-h-[64px]">
                    {/* Time Label */}
                    <div className="p-2 text-right text-[11px] font-semibold text-gray-400 border-r border-gray-100 select-none">
                      {formatHour(hour)}
                    </div>

                    {/* 7 Days Columns for this hour */}
                    {weekDays.map((d, dayIdx) => {
                      const hourEvents = filteredEvents.filter((evt) => {
                        if (!isSameDay(evt.scheduleDate, d)) return false
                        const evtHour = new Date(evt.scheduleDate).getHours()
                        return evtHour === hour
                      })

                      return (
                        <div
                          key={dayIdx}
                          onClick={() => {
                            setSelectedDate(d)
                            if (onScheduleEvent && hourEvents.length === 0) {
                              const targetDate = new Date(d)
                              targetDate.setHours(hour, 0, 0, 0)
                              onScheduleEvent(targetDate)
                            }
                          }}
                          className="p-1 border-r border-gray-100 relative hover:bg-gray-50/60 transition group cursor-pointer"
                        >
                          {hourEvents.map((evt) => {
                            const status = getEventStatus(evt)
                            const style = getStatusBadgeStyle(status)
                            const isMatch = matchedEventIdsSet.has(evt.id)
                            const isActiveMatch = evt.id === activeMatchedEventId
                            const timeStr = new Date(
                              evt.scheduleDate
                            ).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit'
                            })

                            return (
                              <div
                                key={evt.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (onViewEvent) onViewEvent(evt)
                                }}
                                className={`p-1.5 rounded-lg border text-[10px] font-semibold space-y-0.5 transition ${
                                  isActiveMatch
                                    ? 'bg-sig-green/25 border-sig-green text-navy-blue font-bold shadow-xs'
                                    : isMatch
                                      ? 'bg-sig-green/15 border-sig-green/80 text-navy-blue font-bold'
                                      : `${style.chip} shadow-2xs hover:shadow-sm`
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold truncate text-navy-blue">
                                    {evt.name}
                                  </span>
                                </div>
                                <div className="text-[9px] opacity-80 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{timeStr}</span>
                                </div>
                                {evt.location && (
                                  <div className="text-[9px] opacity-80 flex items-center gap-1 truncate">
                                    <MapPin className="w-2.5 h-2.5 text-sig-green shrink-0" />
                                    <span className="truncate">{evt.location}</span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/* C. DAY VIEW */}
          {/* ════════════════════════════════════════════════════════ */}
          {viewMode === 'day' && (
            <div className="flex flex-col">
              {/* Day Header Banner */}
              <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-navy-blue">
                    {FULL_DAYS[currentDate.getDay()]}, {MONTH_NAMES[currentDate.getMonth()]}{' '}
                    {currentDate.getDate()}, {currentDate.getFullYear()}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {
                      filteredEvents.filter((e) =>
                        isSameDay(e.scheduleDate, currentDate)
                      ).length
                    }{' '}
                    events scheduled for this day
                  </p>
                </div>
              </div>

              {/* Day Hourly Breakdown */}
              <div className="divide-y divide-gray-100 max-h-[650px] overflow-y-auto">
                {HOURS.map((hour) => {
                  const hourEvents = filteredEvents.filter((evt) => {
                    if (!isSameDay(evt.scheduleDate, currentDate)) return false
                    const evtHour = new Date(evt.scheduleDate).getHours()
                    return evtHour === hour
                  })

                  return (
                    <div
                      key={hour}
                      className="flex items-start min-h-[75px] group hover:bg-gray-50/50 transition"
                    >
                      {/* Hour Marker */}
                      <div className="w-24 p-3 text-right text-xs font-bold text-gray-400 border-r border-gray-100 select-none shrink-0">
                        {formatHour(hour)}
                      </div>

                      {/* Content Slot */}
                      <div className="flex-1 p-3 space-y-2">
                        {hourEvents.length === 0 ? (
                          <div
                            onClick={() => {
                              if (onScheduleEvent) {
                                const targetDate = new Date(currentDate)
                                targetDate.setHours(hour, 0, 0, 0)
                                onScheduleEvent(targetDate)
                              }
                            }}
                            className="h-full w-full opacity-0 group-hover:opacity-100 text-[11px] text-gray-400 flex items-center gap-1 cursor-pointer transition py-1"
                          >
                            <Plus className="w-3 h-3 text-navy-blue" />
                            <span>Click to schedule at {formatHour(hour)}</span>
                          </div>
                        ) : (
                          hourEvents.map((evt) => {
                            const status = getEventStatus(evt)
                            const style = getStatusBadgeStyle(status)
                            const isMatch = matchedEventIdsSet.has(evt.id)
                            const isActiveMatch = evt.id === activeMatchedEventId
                            const org = orgs.find(
                              (o) => o.id === evt.assignedOrganizationId
                            )
                            const timeStr = new Date(
                              evt.scheduleDate
                            ).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })

                            return (
                              <div
                                key={evt.id}
                                onClick={() => onViewEvent && onViewEvent(evt)}
                                className={`p-3.5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition duration-150 cursor-pointer ${
                                  isActiveMatch
                                    ? 'bg-sig-green/20 border-sig-green border-2 shadow-xs'
                                    : isMatch
                                      ? 'bg-sig-green/10 border-sig-green/70 border-2'
                                      : `${style.border} ${style.bg} shadow-2xs hover:shadow-xs`
                                }`}
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    {isMatch && (
                                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-sig-green text-navy-blue">
                                        Match Found
                                      </span>
                                    )}
                                    <span
                                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}
                                    >
                                      {evt.status || 'planned'}
                                    </span>
                                    <span className="text-xs font-bold text-navy-blue">
                                      {evt.eventType === 'organization'
                                        ? `${evt.organizationName || 'Org'} (${org ? org.abbreviation : 'All'})`
                                        : org
                                          ? org.name
                                          : 'All Departments'}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-black text-navy-blue">
                                    {evt.name}
                                  </h4>
                                  {evt.description && (
                                    <p className="text-xs text-gray-500 line-clamp-2">
                                      {evt.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 font-semibold pt-1">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-navy-blue" />
                                      <span>{timeStr}</span>
                                    </div>
                                    {evt.location && (
                                      <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-sig-green" />
                                        <span>{evt.location}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Quick Action Buttons */}
                                <div className="flex items-center space-x-1.5 self-end md:self-center shrink-0">
                                  {onCompleteEvent && status !== 'completed' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onCompleteEvent(evt)
                                      }}
                                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100/60 transition cursor-pointer"
                                      title="Mark Completed"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                  )}
                                  {onEditEvent && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onEditEvent(evt)
                                      }}
                                      className="p-1.5 rounded-lg text-navy-blue hover:bg-navy-blue/10 transition cursor-pointer"
                                      title="Edit Event"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  {onDeleteEvent && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onDeleteEvent(evt)
                                      }}
                                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"
                                      title="Delete Event"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── OVERFLOW DAY MODAL (When clicking "+N more" on a day in Month view) ── */}
      {overflowModalDay && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 glass-modal-overlay animate-fade-in">
          <div className="glass-modal rounded-3xl p-6 max-w-md w-full shadow-2xl border border-white/80 space-y-4 max-h-[85vh] overflow-y-auto animate-fade-in-scale">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div>
                <h3 className="font-extrabold text-navy-blue text-base">
                  {FULL_DAYS[overflowModalDay.date.getDay()]},{' '}
                  {MONTH_NAMES[overflowModalDay.date.getMonth()]}{' '}
                  {overflowModalDay.date.getDate()}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {overflowModalDay.events.length} events scheduled
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOverflowModalDay(null)}
                className="text-gray-400 hover:text-navy-blue p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {overflowModalDay.events.map((evt) => {
                const style = getStatusBadgeStyle(getEventStatus(evt))
                const isMatch = matchedEventIdsSet.has(evt.id)
                const isActive = evt.id === activeMatchedEventId
                const timeStr = new Date(evt.scheduleDate).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setOverflowModalDay(null)
                      if (onViewEvent) onViewEvent(evt)
                    }}
                    className={`p-3 rounded-2xl border transition duration-150 cursor-pointer space-y-1 ${
                      isActive
                        ? 'bg-sig-green/20 border-sig-green border-2 shadow-xs'
                        : isMatch
                          ? 'bg-sig-green/10 border-sig-green/70 border-2'
                          : `${style.border} ${style.bg} hover:shadow-xs`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy-blue flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {timeStr}
                      </span>
                      <div className="flex items-center gap-1">
                        {isMatch && (
                          <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-sig-green text-navy-blue">
                            Match
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}
                        >
                          {evt.status || 'planned'}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-extrabold text-xs text-navy-blue">
                      {evt.name}
                    </h4>
                    {evt.location && (
                      <p className="text-[10px] text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-sig-green shrink-0" />
                        <span>{evt.location}</span>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setOverflowModalDay(null)}
                className="bg-navy-blue text-white rounded-xl text-xs font-semibold py-2 px-5 hover:bg-navy-blue/90 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
