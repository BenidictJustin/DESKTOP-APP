import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'

/**
 * Standardized Glassmorphic Date / Date-Time Picker
 *
 * Props:
 * - value: string (ISO format 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm')
 * - onChange: (formattedValueString: string) => void
 * - showTime: boolean (default false)
 * - placeholder: string
 * - disabled: boolean
 * - className: string
 */
export default function GlassDatePicker({
  value = '',
  onChange,
  showTime = false,
  placeholder = showTime ? 'dd/mm/yyyy, --:-- --' : 'dd/mm/yyyy',
  disabled = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, positionAbove: false })
  const [isPositioned, setIsPositioned] = useState(false)
  const containerRef = useRef(null)
  const popoverRef = useRef(null)

  // Safe local date parsing (prevents UTC timezone shift bugs)
  const parseValueDate = (val) => {
    if (!val) return new Date()
    if (typeof val === 'string') {
      const trimmed = val.trim()
      if (!trimmed) return new Date()

      // YYYY-MM-DD or YYYY-MM-DDTHH:mm or ISO string
      const [datePart, timePart] = trimmed.split('T')
      if (datePart && datePart.includes('-')) {
        const parts = datePart.split('-').map(Number)
        if (parts.length === 3 && !parts.some(isNaN)) {
          let h = 0
          let min = 0
          if (timePart) {
            const timeSub = timePart.split(':').map(Number)
            if (!isNaN(timeSub[0])) h = timeSub[0]
            if (!isNaN(timeSub[1])) min = timeSub[1]
          }
          return new Date(parts[0], parts[1] - 1, parts[2], h, min)
        }
      }
    }
    const d = new Date(val)
    return isNaN(d.getTime()) ? new Date() : d
  }

  const initialDate = parseValueDate(value)
  const [viewYear, setViewYear] = useState(initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth())

  // Selected date components
  const [selectedDay, setSelectedDay] = useState(value ? initialDate.getDate() : null)
  const [selectedYear, setSelectedYear] = useState(value ? initialDate.getFullYear() : null)
  const [selectedMonth, setSelectedMonth] = useState(value ? initialDate.getMonth() : null)

  // Time components (if showTime is true)
  const [hours, setHours] = useState(value ? initialDate.getHours() % 12 || 12 : 9)
  const [minutes, setMinutes] = useState(value ? initialDate.getMinutes() : 0)
  const [ampm, setAmPm] = useState(value ? (initialDate.getHours() >= 12 ? 'PM' : 'AM') : 'AM')

  // Keep view year/month updated when value changes externally
  useEffect(() => {
    if (value) {
      const d = parseValueDate(value)
      setSelectedDay(d.getDate())
      setSelectedMonth(d.getMonth())
      setSelectedYear(d.getFullYear())
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())

      if (showTime) {
        setHours(d.getHours() % 12 || 12)
        setMinutes(d.getMinutes())
        setAmPm(d.getHours() >= 12 ? 'PM' : 'AM')
      }
    } else {
      setSelectedDay(null)
      setSelectedMonth(null)
      setSelectedYear(null)
    }
  }, [value, showTime])

  // Recalculate popover position to fit on screen
  const updatePosition = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const popoverHeight = showTime ? 420 : 350
    const positionAbove = spaceBelow < popoverHeight && rect.top > popoverHeight

    let left = Math.max(10, Math.min(rect.left, window.innerWidth - 330))
    let top = positionAbove ? rect.top - popoverHeight - 8 : rect.bottom + 8

    // Clamp within visible viewport bounds
    top = Math.max(10, Math.min(top, window.innerHeight - popoverHeight - 10))

    setCoords({
      top,
      left,
      positionAbove
    })
    setIsPositioned(true)
  }

  const handleToggleOpen = (e) => {
    if (e) e.stopPropagation()
    if (disabled) return
    if (!isOpen) {
      setIsPositioned(false)
      updatePosition()
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!document.contains(e.target)) return
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      updatePosition()
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('keydown', handleKeyDown)
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  // Helpers for Month Calendar Grid
  const monthsList = [
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

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay() // 0 = Sun

  const handlePrevMonth = (e) => {
    e.stopPropagation()
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const handleNextMonth = (e) => {
    e.stopPropagation()
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  // Emit change when a date (and optional time) is chosen
  const emitChange = (d, m, y, h = hours, min = minutes, ap = ampm) => {
    if (!d || m === null || !y) return

    const pad = (n) => String(n).padStart(2, '0')
    const formattedDateStr = `${y}-${pad(m + 1)}-${pad(d)}`

    if (showTime) {
      let h24 = h % 12
      if (ap === 'PM') h24 += 12
      const formattedDateTimeStr = `${formattedDateStr}T${pad(h24)}:${pad(min)}`
      onChange(formattedDateTimeStr)
    } else {
      onChange(formattedDateStr)
    }
  }

  const handleSelectDay = (day) => {
    setSelectedDay(day)
    setSelectedMonth(viewMonth)
    setSelectedYear(viewYear)
    emitChange(day, viewMonth, viewYear)
    if (!showTime) {
      setIsOpen(false)
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setSelectedDay(null)
    setSelectedMonth(null)
    setSelectedYear(null)
    onChange('')
    setIsOpen(false)
  }

  // Display text in input field
  const getDisplayText = () => {
    if (!value || selectedDay === null) return ''
    const pad = (n) => String(n).padStart(2, '0')
    const datePart = `${pad(selectedDay)}/${pad(selectedMonth + 1)}/${selectedYear}`

    if (showTime) {
      const timePart = `${pad(hours)}:${pad(minutes)} ${ampm}`
      return `${datePart}, ${timePart}`
    }
    return datePart
  }

  const currentMonthDays = daysInMonth(viewYear, viewMonth)
  const prevMonthDays = daysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1)

  const today = new Date()
  const isToday = (day) =>
    today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear

  const isSelected = (day) =>
    selectedDay === day && selectedMonth === viewMonth && selectedYear === viewYear

  // Year options list for quick dropdown (5 years past to 15 years future)
  const currentYearNum = today.getFullYear()
  const yearOptions = Array.from({ length: 20 }, (_, i) => currentYearNum - 5 + i)

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Glass Input Trigger Container */}
      <div
        onClick={handleToggleOpen}
        className={`w-full px-3 py-2 text-xs glass-input rounded-xl focus:outline-none font-semibold text-navy-blue flex items-center justify-between cursor-pointer transition-all duration-150 ${
          isOpen ? 'ring-2 ring-sig-green/40 border-sig-green' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
        style={{ minHeight: '38px' }}
      >
        <div className="flex items-center space-x-2 truncate pointer-events-none">
          <Calendar className="w-4 h-4 text-navy-blue shrink-0" />
          <span
            className={getDisplayText() ? 'text-navy-blue font-bold' : 'text-gray-400 font-normal'}
          >
            {getDisplayText() || placeholder}
          </span>
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Popover Portal */}
      {isOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="glass-date-picker-popover"
              ref={popoverRef}
              style={{
                position: 'fixed',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                zIndex: 99999,
                visibility: isPositioned ? 'visible' : 'hidden'
              }}
              className="w-[310px] glass-modal rounded-2xl p-4 shadow-2xl border border-white/90 space-y-3"
              initial={{ opacity: 0, scale: 0.98, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {/* Header: Month & Year Selector */}
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 text-navy-blue hover:bg-navy-blue/10 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-1 font-extrabold text-navy-blue text-xs">
                  <select
                    value={viewMonth}
                    onChange={(e) => setViewMonth(Number(e.target.value))}
                    className="bg-transparent font-bold text-navy-blue focus:outline-none cursor-pointer p-0.5 rounded hover:bg-navy-blue/5"
                  >
                    {monthsList.map((m, idx) => (
                      <option key={m} value={idx}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={viewYear}
                    onChange={(e) => setViewYear(Number(e.target.value))}
                    className="bg-transparent font-bold text-navy-blue focus:outline-none cursor-pointer p-0.5 rounded hover:bg-navy-blue/5"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 text-navy-blue hover:bg-navy-blue/10 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day of week headers */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {/* Muted Days from previous month */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <span
                    key={`prev-${idx}`}
                    className="py-1.5 text-gray-300 text-[11px] font-normal select-none"
                  >
                    {prevMonthDays - firstDayOfWeek + idx + 1}
                  </span>
                ))}

                {/* Current Month Days */}
                {Array.from({ length: currentMonthDays }).map((_, idx) => {
                  const day = idx + 1
                  const sel = isSelected(day)
                  const tod = isToday(day)
                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                        sel
                          ? 'bg-navy-blue text-white shadow-xs font-bold'
                          : tod
                            ? 'bg-sig-green/20 text-navy-blue font-bold ring-1 ring-sig-green'
                            : 'hover:bg-navy-blue/10 text-gray-700'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>

              {/* Time Selector Section (if showTime is true) */}
              {showTime && (
                <div className="border-t border-gray-200/60 pt-3 space-y-2">
                  <div className="flex items-center space-x-1 text-xs font-bold text-navy-blue">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Select Time</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    {/* Hours Selector */}
                    <select
                      value={hours}
                      onChange={(e) => {
                        const h = Number(e.target.value)
                        setHours(h)
                        if (selectedDay)
                          emitChange(selectedDay, selectedMonth, selectedYear, h, minutes, ampm)
                      }}
                      className="w-16 h-8 text-xs font-bold text-navy-blue bg-white border border-gray-200 rounded-xl px-2 focus:outline-none focus:ring-2 focus:ring-sig-green/40 cursor-pointer shadow-2xs"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {String(i + 1).padStart(2, '0')}
                        </option>
                      ))}
                    </select>

                    <span className="font-bold text-navy-blue">:</span>

                    {/* Minutes Selector */}
                    <select
                      value={minutes}
                      onChange={(e) => {
                        const m = Number(e.target.value)
                        setMinutes(m)
                        if (selectedDay)
                          emitChange(selectedDay, selectedMonth, selectedYear, hours, m, ampm)
                      }}
                      className="w-16 h-8 text-xs font-bold text-navy-blue bg-white border border-gray-200 rounded-xl px-2 focus:outline-none focus:ring-2 focus:ring-sig-green/40 cursor-pointer shadow-2xs"
                    >
                      {Array.from({ length: 60 }).map((_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, '0')}
                        </option>
                      ))}
                    </select>

                    {/* AM/PM Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextAp = ampm === 'AM' ? 'PM' : 'AM'
                        setAmPm(nextAp)
                        if (selectedDay)
                          emitChange(
                            selectedDay,
                            selectedMonth,
                            selectedYear,
                            hours,
                            minutes,
                            nextAp
                          )
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-navy-blue text-white text-xs font-extrabold shadow-2xs hover:bg-navy-blue-600 transition-colors cursor-pointer"
                    >
                      {ampm}
                    </button>
                  </div>
                </div>
              )}

              {/* Footer Action Buttons */}
              <div className="flex items-center justify-between border-t border-gray-200/60 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date()
                    setViewYear(now.getFullYear())
                    setViewMonth(now.getMonth())
                    handleSelectDay(now.getDate())
                  }}
                  className="text-sig-green-600 hover:underline font-bold text-[11px] cursor-pointer"
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="bg-navy-blue hover:bg-navy-blue-600 text-white font-bold py-1 px-3 rounded-lg text-[11px] shadow-2xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
