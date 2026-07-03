import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function SearchableDropdown({
  value,
  onChange,
  options = [], // Can be array of strings or array of { id, name, abbreviation }
  onDelete,     // Callback when option deleted: onDelete(option)
  placeholder = "Select or search option...",
  className = "",
  style = {},
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const dropdownRef = useRef(null);

  // Normalize options to objects: { id, name, abbreviation }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { id: String(opt), name: String(opt) };
    }
    return {
      id: String(opt.id || opt.uid || opt.value || opt.abbreviation || ''),
      name: String(opt.name || opt.label || opt.title || opt.abbreviation || ''),
      abbreviation: opt.abbreviation ? String(opt.abbreviation) : '',
      original: opt
    };
  });

  // Find currently selected option's display name
  const selectedOption = normalizedOptions.find(opt => opt.id === String(value));
  const displayVal = selectedOption
    ? (selectedOption.abbreviation ? `${selectedOption.name} (${selectedOption.abbreviation})` : selectedOption.name)
    : '';

  // Synchronize search text input with selection when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchVal(displayVal);
    }
  }, [value, isOpen, displayVal]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = normalizedOptions.filter(opt => {
    if (!searchVal || searchVal === displayVal) return true;
    const term = searchVal.toLowerCase();
    return (
      opt.name.toLowerCase().includes(term) ||
      opt.id.toLowerCase().includes(term) ||
      (opt.abbreviation && opt.abbreviation.toLowerCase().includes(term))
    );
  });

  return (
    <div className={`relative w-full ${className}`} style={style} ref={dropdownRef}>
      <input
        type="text"
        disabled={disabled}
        value={isOpen ? searchVal : displayVal}
        onChange={(e) => {
          setSearchVal(e.target.value);
          // If query is cleared, trigger change with empty string
          if (!e.target.value) {
            onChange('');
          }
        }}
        onFocus={() => {
          if (!disabled) {
            setIsOpen(true);
            setSearchVal(''); // Clear input text to show all options
          }
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue placeholder-gray-400 disabled:opacity-60"
        style={{ height: '40px' }}
      />
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50 divide-y divide-gray-50">
          {filteredOptions.map(opt => (
            <div
              key={opt.id}
              onClick={() => {
                onChange(opt.id);
                setIsOpen(false);
              }}
              className="group flex items-center justify-between p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left"
            >
              <span className="truncate">
                {opt.abbreviation ? `${opt.name} (${opt.abbreviation})` : opt.name}
              </span>
              {onDelete && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(opt.original || opt);
                  }}
                  className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5 rounded hover:bg-gray-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {filteredOptions.length === 0 && (
            <div className="p-2.5 text-xs text-gray-400 text-left font-semibold">
              No matching options found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
