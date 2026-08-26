import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  modalOverlayVariants,
  modalContentVariants,
  modalOverlayTransition,
  modalContentTransition
} from './motionConfig'

/**
 * AnimatedModal — Reusable modal wrapper with Motion animations.
 *
 * Provides consistent fade overlay + scale/slide content animations
 * for all modals, dialogs, and pop-ups across DommUnity.
 *
 * @param {boolean} isOpen — controls visibility
 * @param {function} onClose — called when overlay is clicked (optional)
 * @param {string} overlayClassName — CSS classes for the overlay div
 * @param {string} contentClassName — CSS classes for the content div
 * @param {React.ReactNode} children — modal content
 */
export default function AnimatedModal({
  isOpen,
  onClose,
  overlayClassName = 'fixed inset-0 z-[99999] flex items-center justify-center bg-navy-blue/40 backdrop-blur-xs p-3 sm:p-4 md:p-6 overflow-y-auto',
  contentClassName = 'bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-gray-100 max-w-sm w-full text-center space-y-4 max-h-[90vh] overflow-y-auto',
  children
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-overlay"
          className={overlayClassName}
          variants={modalOverlayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={modalOverlayTransition}
          onClick={(e) => {
            if (e.target === e.currentTarget && onClose) onClose()
          }}
        >
          <motion.div
            key="modal-content"
            className={contentClassName}
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={modalContentTransition}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
