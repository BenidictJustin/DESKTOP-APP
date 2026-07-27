import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { dropdownVariants, dropdownTransition } from './motion/motionConfig'
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'
import CustomSelect from './CustomSelect'

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
  const containerRef = useRef(null)
  const popoverRef = useRef(null)

  // Parse current value or default to current date
  const parseValueDate = (val) => {
    if (!val) return new Date()
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
  const [hours, setHours] = useState(value ? (initialDate.getHours() % 12 || 12) : 9)
  const [minutes, setMinutes] = useState(value ? initialDate.getMinutes() : 0)
  const [ampm, setAmPm] = useState(value ? (initialDate.getHours() >= 12 ? 'PM' : 'AM') : 'AM')

  // Popover positioning state
  const [coords, setCoords] = useState({ top: 0, left: 0, positionAbove: false })

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

  // Recalculate popover position when opening
  const updatePosition = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const popoverHeight = showTime ? 420 : 350
    const positionAbove = spaceBelow < popoverHeight && rect.top > popoverHeight

    let left = rect.left
    if (left + 320 > window.innerWidth) {
      left = Math.max(10, window.innerWidth - 330)
    }

    setCoords({
      top: positionAbove ? rect.top - popoverHeight - 8 : rect.bottom + 8,
      left,
      positionAbove
    })
  }

  const handleToggleOpen = () => {
    if (disabled) return
    if (!isOpen) {
      updatePosition()
    }
    setIsOpen(!isOpen)
  }

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
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
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay() // 0 = Sun

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const handleNextMonth = () => {
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
    today.getDate() === day &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear

  const isSelected = (day) =>
    selectedDay === day &&
    selectedMonth === viewMonth &&
    selectedYear === viewYear

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Glass Input Trigger */}
      <div
        onClick={handleToggleOpen}
        className={`w-full px-3 py-2 text-xs glass-input rounded-xl focus:outline-none font-semibold text-navy-blue flex items-center justify-between cursor-pointer transition-all duration-150 ${
          isOpen ? 'ring-2 ring-sig-green/40 border-sig-green' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
        style={{ minHeight: '38px' }}
      >
        <div className="flex items-center space-x-2 truncate">
          <Calendar className="w-4 h-4 text-navy-blue shrink-0" />
          <span className={getDisplayText() ? 'text-navy-blue font-bold' : 'text-gray-400 font-normal'}>
            {getDisplayText() || placeholder}
          </span>
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Popover Portal */}
      <AnimatePresence>
        {isOpen &&
          createPortal(
            <motion.div
              ref={popoverRef}
              style={{
                position: 'fixed',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                zIndex: 99999
              }}
              className="w-77.5 glass-modal rounded-2xl p-4 shadow-2xl border border-white/90 space-y-3 select-none"
              variants={dropdownVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={dropdownTransition}
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

              <div className="flex items-center space-x-1.5 font-extrabold text-navy-blue text-xs">
                <span>{monthsList[viewMonth]}</span>
                <span>{viewYear}</span>
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
                  className="py-1.5 text-gray-300 text-[11px] font-normal"
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
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                  <CustomSelect
                    value={hours}
                    onChange={(e) => {
                      const h = Number(e.target.value)
                      setHours(h)
                      if (selectedDay) emitChange(selectedDay, selectedMonth, selectedYear, h, minutes, ampm)
                    }}
                    options={Array.from({ length: 12 }).map((_, i) => ({
                      value: i + 1,
                      label: String(i + 1).padStart(2, '0')
                    }))}
                    className="w-16"
                    style={{ height: '32px' }}
                  />

                  <span className="font-bold text-navy-blue">:</span>

                  {/* Minutes Selector */}
                  <CustomSelect
                    value={minutes}
                    onChange={(e) => {
                      const m = Number(e.target.value)
                      setMinutes(m)
                      if (selectedDay) emitChange(selectedDay, selectedMonth, selectedYear, hours, m, ampm)
                    }}
                    options={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => ({
                      value: m,
                      label: String(m).padStart(2, '0')
                    }))}
                    className="w-16"
                    style={{ height: '32px' }}
                  />

                  {/* AM/PM Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextAp = ampm === 'AM' ? 'PM' : 'AM'
                      setAmPm(nextAp)
                      if (selectedDay) emitChange(selectedDay, selectedMonth, selectedYear, hours, minutes, nextAp)
                    }}
                    className="px-2.5 py-1 rounded-lg bg-navy-blue text-white text-xs font-extrabold shadow-2xs hover:bg-navy-blue-600 transition-colors cursor-pointer"
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
            </motion.div>,
            document.body
          )}
      </AnimatePresence>
    </div>
  )
}
