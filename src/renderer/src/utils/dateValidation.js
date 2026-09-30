/**
 * Global Date Validation Utility for DommUnity
 *
 * Enforces rule:
 * - Today and future dates -> allowed
 * - Yesterday and any earlier dates -> not allowed for new entries/records
 */

/**
 * Checks if a given date string or Date object represents a date before today (in local calendar time).
 * Today (00:00:00 to 23:59:59) and future dates return false (allowed).
 * Yesterday and any earlier dates return true (not allowed).
 *
 * @param {string|Date|number|null|undefined} val
 * @returns {boolean}
 */
export function isPastDate(val) {
  if (!val) return false

  let targetYear, targetMonth, targetDay

  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return false

    // Parse YYYY-MM-DD or YYYY-MM-DDTHH:mm or ISO format safely without timezone shift
    const [datePart] = trimmed.split('T')
    if (datePart && datePart.includes('-')) {
      const parts = datePart.split('-').map(Number)
      if (parts.length === 3 && !parts.some(isNaN)) {
        targetYear = parts[0]
        targetMonth = parts[1] - 1
        targetDay = parts[2]
      }
    }
  }

  let target
  if (targetYear !== undefined) {
    target = new Date(targetYear, targetMonth, targetDay)
  } else {
    target = new Date(val)
  }

  if (isNaN(target.getTime())) return false

  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return target.getTime() < today.getTime()
}

/**
 * Standard inline validation error messages
 */
export const DATE_ERROR_MESSAGES = {
  EVENT_PAST: 'Cannot schedule an event on a past date. Please select today or a future date.',
  EXPIRY_PAST: 'Expiration date cannot be in the past. Please select today or a future date.',
  DONATION_PAST: 'Donation date cannot be in the past. Please select today or a future date.'
}
