import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { sidebarTransition, tooltipVariants, duration, easing } from './motion/motionConfig'
import AnimatedModal from './motion/AnimatedModal'

export default function AnimatedSidebar({
  tabs = [],
  activeTab,
  setActiveTab,
  disabled = false,
  onLogout,
  user // Kept for compatibility but not rendered
}) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('dommunity_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const [hoveredTab, setHoveredTab] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const toggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    try {
      localStorage.setItem('dommunity_sidebar_collapsed', String(next))
    } catch {}
  }

  const activeIndex = tabs.findIndex((t) => t.id === activeTab)

  return (
    <motion.aside
      className="glass-sidebar flex flex-col justify-between shrink-0 relative rounded-2xl my-4 ml-4 shadow-glass-navy select-none"
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={sidebarTransition}
    >
      {/* Top Header Row with Collapse Toggle */}
      <div className="pt-3.5 px-3 flex items-center justify-between border-b border-white/5 pb-3">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="px-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast }}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-sig-green/80">
                Navigation Menu
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          disabled={disabled}
          onClick={toggleCollapse}
          className={`p-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer ${
            isCollapsed ? 'mx-auto' : ''
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* Main Navigation Links Container */}
      <div className="flex-1 py-3 px-3 overflow-y-auto overflow-x-hidden relative">
        <nav className="space-y-1.5 relative">
          {/* Animated Sliding Active Indicator Pill */}
          {activeIndex !== -1 && (
            <motion.div
              className="absolute left-0 right-0 rounded-xl bg-sig-green/20 backdrop-blur-md border-l-[3.5px] border-sig-green shadow-xs pointer-events-none"
              style={{ height: '42px' }}
              animate={{ top: activeIndex * 48 }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 30,
                mass: 0.8
              }}
            />
          )}

          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <div key={tab.id} className="relative group">
                <motion.button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) {
                      setActiveTab(tab.id)
                    }
                  }}
                  onMouseEnter={() => setHoveredTab(tab.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                  } py-2.5 rounded-xl text-[13px] font-semibold tracking-normal transition-colors duration-200 relative z-10 h-[42px] ${
                    disabled
                      ? 'opacity-40 cursor-not-allowed text-gray-500'
                      : isActive
                        ? 'text-sig-green font-bold cursor-pointer'
                        : 'text-gray-200 hover:text-white hover:bg-white/8 cursor-pointer'
                  }`}
                  whileHover={!disabled ? { x: 2 } : {}}
                  whileTap={!disabled ? { scale: 0.98 } : {}}
                  transition={{ duration: duration.fast, ease: easing.easeOut }}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3.5'}`}>
                    <motion.div
                      animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                      transition={{ duration: duration.fast }}
                    >
                      <Icon
                        className={`w-4.5 h-4.5 shrink-0 ${
                          isActive
                            ? 'text-sig-green'
                            : 'text-gray-200 group-hover:text-white'
                        }`}
                      />
                    </motion.div>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          className="truncate whitespace-nowrap text-gray-200 group-hover:text-white"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: duration.fast }}
                        >
                          {tab.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Badge Component */}
                  {tab.badge > 0 && !isCollapsed && (
                    <span className="bg-error-500 text-white rounded-full px-2 py-0.5 text-[9px] font-bold min-w-[20px] text-center shadow-2xs animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                  {tab.badge > 0 && isCollapsed && (
                    <span className="absolute top-1 right-1 bg-error-500 w-2 h-2 rounded-full border border-navy-blue" />
                  )}
                </motion.button>

                {/* Tooltip for Collapsed Sidebar */}
                <AnimatePresence>
                  {isCollapsed && hoveredTab === tab.id && (
                    <motion.div
                      className="fixed left-24 z-50 px-3 py-1.5 bg-navy-blue/95 backdrop-blur-md text-white text-xs font-semibold rounded-xl shadow-xl border border-white/10 flex items-center gap-2 pointer-events-none"
                      variants={tooltipVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: duration.fast, ease: easing.easeOut }}
                    >
                      <span>{tab.label}</span>
                      {tab.badge > 0 && (
                        <span className="bg-error-500 text-white rounded-full px-1.5 py-0.2 text-[9px] font-bold">
                          {tab.badge}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>
      </div>

      {/* Footer Area with Logout Button */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <motion.button
          type="button"
          disabled={disabled}
          onClick={() => setShowLogoutConfirm(true)}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold transition-colors duration-200 flex items-center justify-center space-x-2 border shadow-glass-sm ${
            disabled
              ? 'opacity-40 cursor-not-allowed bg-gray-500 text-gray-300 border-transparent'
              : 'bg-sig-green hover:bg-sig-green-600 active:bg-sig-green-700 text-navy-blue cursor-pointer hover:shadow-md border-white/40'
          }`}
          title="Logout"
          whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
          whileTap={!disabled ? { scale: 0.97 } : {}}
          transition={{ duration: duration.fast }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: duration.fast }}
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatedModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        overlayClassName="fixed inset-0 z-[99999] flex items-center justify-center bg-navy-blue/40 backdrop-blur-xs p-4"
        contentClassName="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 max-w-sm w-full text-center space-y-4 font-poppins"
      >
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-2 shadow-xs">
            <LogOut className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h4 className="font-extrabold text-navy-blue text-sm uppercase tracking-wide">
            Confirm Logout
          </h4>
          <p className="text-xs text-gray-500 font-semibold mt-1 leading-relaxed">
            Are you sure you want to log out?
          </p>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(false)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full text-xs py-2.5 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLogoutConfirm(false)
              onLogout()
            }}
            className="flex-1 bg-navy-blue hover:bg-navy-blue-600 text-white font-bold rounded-full text-xs py-2.5 shadow-md transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </AnimatedModal>
    </motion.aside>
  )
}
