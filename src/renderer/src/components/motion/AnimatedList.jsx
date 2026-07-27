import React from 'react'
import { motion } from 'motion/react'
import { staggerContainer, staggerItem } from './motionConfig'

/**
 * AnimatedList — Staggered entrance animation for lists, grids, and table bodies.
 *
 * Wraps children in a motion container that staggers child animations.
 * Each direct child should be wrapped in AnimatedListItem for the effect.
 *
 * @param {string} className — CSS classes for the container
 * @param {string} as — the HTML element tag (default: 'div')
 * @param {React.ReactNode} children
 */
export function AnimatedList({ className = '', children, ...props }) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * AnimatedListItem — Individual item with stagger-compatible entrance animation.
 *
 * @param {string} className — CSS classes
 * @param {React.ReactNode} children
 */
export function AnimatedListItem({ className = '', children, ...props }) {
  return (
    <motion.div className={className} variants={staggerItem} {...props}>
      {children}
    </motion.div>
  )
}
