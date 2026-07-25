import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'

export default function AnimatedSidebar({
  tabs = [],
  activeTab,
  setActiveTab,
  disabled = false,
  onLogout
}) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('dommunity_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const [hoveredTab, setHoveredTab] = useState(null)

  const toggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    try {
      localStorage.setItem('dommunity_sidebar_collapsed', String(next))
    } catch {}
  }

  const activeIndex = tabs.findIndex((t) => t.id === activeTab)

  return (
    <aside
      className={`glass-sidebar flex flex-col justify-between shrink-0 relative rounded-2xl my-4 ml-4 shadow-glass-navy transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Decorative Top/Bottom Accent Gradient Line */}
      <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-sig-green/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sig-green via-sig-green to-sig-green/40 rounded-b-2xl" />

      {/* Top Header Row with Collapse Toggle */}
      <div className="pt-3.5 px-3 flex items-center justify-between border-b border-white/5 pb-3">
        {!isCollapsed && (
          <div className="px-2 transition-opacity duration-200">
            <span className="text-[10px] uppercase font-bold tracking-wider text-sig-green/80">
              Navigation Menu
            </span>
          </div>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={toggleCollapse}
          className={`p-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer ${
            isCollapsed ? 'mx-auto' : ''
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation Links Container */}
      <div className="flex-1 py-3 px-3 overflow-y-auto overflow-x-hidden relative">
        <nav className="space-y-1.5 relative">
          {/* Animated Sliding Active Indicator Pill */}
          {activeIndex !== -1 && (
            <div
              className="absolute left-0 right-0 rounded-xl bg-sig-green/20 backdrop-blur-md border-l-[3.5px] border-sig-green shadow-xs transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
              style={{
                height: '42px',
                top: `${activeIndex * 48}px`
              }}
            />
          )}

          {tabs.map((tab, idx) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <div key={tab.id} className="relative group">
                <button
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
                  } py-2.5 rounded-xl text-[13px] font-semibold tracking-normal transition-all duration-200 relative z-10 h-[42px] ${
                    disabled
                      ? 'opacity-40 cursor-not-allowed text-gray-500'
                      : isActive
                        ? 'text-sig-green font-bold'
                        : 'text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3.5'}`}>
                    <Icon
                      className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 ${
                        isActive
                          ? 'text-sig-green scale-110'
                          : 'text-gray-400 group-hover:text-white group-hover:scale-110'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate whitespace-nowrap transition-colors duration-200">
                        {tab.label}
                      </span>
                    )}
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
                </button>

                {/* Tooltip for Collapsed Sidebar */}
                {isCollapsed && hoveredTab === tab.id && (
                  <div className="fixed left-24 z-50 px-3 py-1.5 bg-navy-blue/95 backdrop-blur-md text-white text-xs font-semibold rounded-xl shadow-xl border border-white/10 flex items-center gap-2 pointer-events-none animate-fade-in">
                    <span>{tab.label}</span>
                    {tab.badge > 0 && (
                      <span className="bg-error-500 text-white rounded-full px-1.5 py-0.2 text-[9px] font-bold">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Footer Area with Logout Button */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onLogout}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center space-x-2 border shadow-glass-sm ${
            disabled
              ? 'opacity-40 cursor-not-allowed bg-gray-500 text-gray-300 border-transparent'
              : 'bg-sig-green hover:bg-sig-green-600 active:bg-sig-green-700 text-navy-blue cursor-pointer hover:shadow-md border-white/40 active:scale-[0.98]'
          }`}
          title="Logout"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
