import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, ChevronDown } from 'lucide-react'
import { dropdownVariants, dropdownTransition } from './motion/motionConfig'

export default function SearchableDropdown({
  value,
  onChange,
  options = [], // Can be array of strings or array of { id, name, abbreviation }
  onDelete, // Callback when option deleted: onDelete(option)
  placeholder = 'Select or search option...',
  className = '',
  style = {},
  disabled = false,
  allowCustom = false,
  error = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [openUpward, setOpenUpward] = useState(false)
  const dropdownRef = useRef(null)

  // Normalize options to objects: { id, name, abbreviation }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { id: String(opt), name: String(opt) }
    }
    return {
      id: String(opt.id || opt.uid || opt.value || opt.abbreviation || ''),
      name: String(opt.name || opt.label || opt.title || opt.abbreviation || ''),
      abbreviation: opt.abbreviation ? String(opt.abbreviation) : '',
      original: opt
    }
  })

  // Find currently selected option's display name
  const selectedOption = normalizedOptions.find((opt) => opt.id === String(value))
  const displayVal = selectedOption
    ? selectedOption.abbreviation
      ? `${selectedOption.name} (${selectedOption.abbreviation})`
      : selectedOption.name
    : (allowCustom && value ? String(value) : '')

  // Synchronize search text input with selection when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchVal(displayVal)
    }
  }, [value, isOpen, displayVal])

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Check positioning to prevent clipping or screen edge overflow
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      // If less than 200px below and enough space above, render upward
      if (spaceBelow < 220 && rect.top > 220) {
        setOpenUpward(true)
      } else {
        setOpenUpward(false)
      }
    }
  }, [isOpen])

  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchVal || searchVal === displayVal) return true
    const term = searchVal.toLowerCase()
    return (
      opt.name.toLowerCase().includes(term) ||
      opt.id.toLowerCase().includes(term) ||
      (opt.abbreviation && opt.abbreviation.toLowerCase().includes(term))
    )
  })

  return (
    <div className={`relative w-full ${className}`} style={style} ref={dropdownRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          disabled={disabled}
          value={isOpen ? searchVal : displayVal}
          onChange={(e) => {
            setSearchVal(e.target.value)
            if (allowCustom) {
              onChange(e.target.value)
            } else if (!e.target.value) {
              onChange('')
            }
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true)
              setSearchVal('') // Clear input text to show all options
            }
          }}
          placeholder={placeholder}
          className={`w-full pl-3.5 pr-10 py-2.5 text-xs bg-white border rounded-xl focus:outline-none font-semibold text-navy-blue placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-2xs ${
            error
              ? 'border-red-500 ring-2 ring-red-500/10'
              : 'border-gray-250 hover:border-gray-300 focus:ring-2 focus:ring-navy-blue/10'
          }`}
          style={{ height: '40px' }}
        />
        <span
          className="absolute right-3.5 text-gray-400 pointer-events-none transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
        >
          <ChevronDown className="w-4 h-4" />
        </span>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`absolute left-0 right-0 max-h-56 overflow-y-auto bg-white border border-gray-200/80 rounded-xl shadow-xl z-99999 divide-y divide-gray-50/50 py-1 ${
              openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            }`}
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={dropdownTransition}
          >
            {filteredOptions.map((opt) => {
              const isSelected = opt.id === String(value)
              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id)
                    setIsOpen(false)
                  }}
                  className={`group flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-left cursor-pointer transition-all duration-100 ${
                    isSelected
                      ? 'bg-navy-blue text-white'
                      : 'text-navy-blue hover:bg-sig-green/10 hover:text-navy-blue'
                  }`}
                >
                  <span className="truncate">
                    {opt.abbreviation ? `${opt.name} (${opt.abbreviation})` : opt.name}
                  </span>
                  {onDelete && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(opt.original || opt)
                      }}
                      className={`p-1 rounded-md transition-colors duration-150 cursor-pointer ${
                        isSelected
                          ? 'text-white/60 hover:text-white hover:bg-white/10'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
            {filteredOptions.length === 0 && (
              <div className="px-3.5 py-2.5 text-xs text-gray-400 text-left font-medium">
                No matching options found.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
