import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { pageVariants, pageTransition } from './motionConfig'

/**
 * AnimatedPage — Wrapper for tab/page content transitions.
 *
 * Wraps content in AnimatePresence + motion.div to provide
 * smooth fade + slide when switching between tabs/pages.
 *
 * @param {string} pageKey — unique key for the current page/tab (triggers animation on change)
 * @param {string} className — optional CSS classes
 * @param {React.ReactNode} children — page content
 */
export default function AnimatedPage({ pageKey, className = '', children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        className={className}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
