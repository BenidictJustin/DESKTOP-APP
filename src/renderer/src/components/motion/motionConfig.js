/**
 * Motion Animation Configuration
 * Central configuration for all Motion animations in DommUnity.
 * Keeps timing, easing, and variants consistent system-wide.
 */

// ── Duration Presets (seconds) ──────────────────────────────────────────────────
export const duration = {
  fast: 0.15,
  normal: 0.2,
  medium: 0.25,
  slow: 0.3
}

// ── Easing Presets ──────────────────────────────────────────────────────────────
export const easing = {
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  springSoft: { type: 'spring', stiffness: 200, damping: 24 },
  springBouncy: { type: 'spring', stiffness: 400, damping: 25 }
}

// ── Default Transition ──────────────────────────────────────────────────────────
export const defaultTransition = {
  duration: duration.normal,
  ease: easing.easeOut
}

// ── Page / Tab Transition Variants ──────────────────────────────────────────────
export const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 }
}

export const pageTransition = {
  duration: duration.normal,
  ease: easing.easeOut
}

// ── Fade In Variants ────────────────────────────────────────────────────────────
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 }
}

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 }
}

// ── Modal Variants ──────────────────────────────────────────────────────────────
export const modalOverlayVariants = {
  initial: { opacity: 0, pointerEvents: 'none' },
  animate: { opacity: 1, pointerEvents: 'auto' },
  exit: { opacity: 0, pointerEvents: 'none' }
}

export const modalContentVariants = {
  initial: { opacity: 0, scale: 0.96, y: 10, pointerEvents: 'none' },
  animate: { opacity: 1, scale: 1, y: 0, pointerEvents: 'auto' },
  exit: { opacity: 0, scale: 0.96, y: 10, pointerEvents: 'none' }
}

export const modalOverlayTransition = {
  duration: duration.normal,
  ease: easing.easeOut
}

export const modalContentTransition = {
  type: 'spring',
  stiffness: 350,
  damping: 30,
  mass: 0.8
}

// ── Dropdown Variants ───────────────────────────────────────────────────────────
export const dropdownVariants = {
  initial: { opacity: 0, y: -4, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 }
}

export const dropdownTransition = {
  duration: duration.fast,
  ease: easing.easeOut
}

// ── Sidebar Variants ────────────────────────────────────────────────────────────
export const sidebarTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8
}

export const tooltipVariants = {
  initial: { opacity: 0, x: -4 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -4 }
}

// ── Stagger Container & Item Variants ───────────────────────────────────────────
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02
    }
  }
}

export const staggerItem = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.easeOut
    }
  }
}

// ── Hover & Tap Presets (inline usage) ──────────────────────────────────────────
export const hoverLift = {
  y: -1,
  transition: { duration: duration.fast, ease: easing.easeOut }
}

export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1, ease: easing.easeOut }
}

// ── Splash Screen Variants ──────────────────────────────────────────────────────
export const splashContainerVariants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    transition: {
      duration: 0.4,
      ease: easing.easeIn
    }
  }
}

// ── Auth State Transition ───────────────────────────────────────────────────────
export const authTransitionVariants = {
  initial: { opacity: 0, pointerEvents: 'none' },
  animate: { opacity: 1, pointerEvents: 'auto' },
  exit: { opacity: 0, pointerEvents: 'none' }
}

export const authTransition = {
  duration: duration.medium,
  ease: easing.easeInOut
}
