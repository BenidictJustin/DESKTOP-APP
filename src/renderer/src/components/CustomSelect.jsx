import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, Check } from 'lucide-react'
import { dropdownVariants, dropdownTransition } from './motion/motionConfig'

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  className = '',
  style = {},
  disabled = false,
  id
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const containerRef = useRef(null)

  // Normalize options array to { value, label } format
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt.id,
        label: opt.label !== undefined ? opt.label : opt.name || opt.value || opt.id
      }
    }
    return { value: opt, label: String(opt) }
  })

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value))

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-detect viewport boundaries
  const handleToggle = () => {
    if (disabled) return
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      if (spaceBelow < 220 && rect.top > 220) {
        setOpenUpward(true)
      } else {
        setOpenUpward(false)
      }
    }
    setIsOpen(!isOpen)
  }

  const handleSelect = (val) => {
    if (disabled) return
    setIsOpen(false)
    if (onChange) {
      // Support both event-like targets and direct value calls
      onChange({ target: { value: val, name: id } }, val)
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} style={style}>
      {/* Trigger Field Standardized to Unit Dropdown */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full px-3 text-xs bg-white border rounded-xl focus:outline-none font-semibold text-navy-blue flex items-center justify-between cursor-pointer transition-all duration-150 shadow-2xs ${
          isOpen
            ? 'border-sig-green ring-2 ring-sig-green/20'
            : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
        style={{ height: style.height || '40px' }}
      >
        <span className={`truncate text-left ${!selectedOption ? 'text-gray-400 font-normal' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-navy-blue shrink-0 ml-1.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-sig-green' : ''
          }`}
        />
      </button>

      {/* Floating Options Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`absolute z-60 w-full bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-1 ${
              openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
            style={{ zIndex: 9999 }}
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={dropdownTransition}
          >
            {normalizedOptions.length === 0 ? (
              <div className="p-3 text-xs text-gray-400 font-medium text-center">
                No options available
              </div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <div
                    key={opt.value}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between p-2.5 text-xs cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left transition-colors duration-100 ${
                      isSelected
                        ? 'bg-navy-blue text-white hover:bg-navy-blue/95 font-bold'
                        : 'text-navy-blue hover:bg-sig-green/10'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2 text-sig-green" />}
                  </div>
                )
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
