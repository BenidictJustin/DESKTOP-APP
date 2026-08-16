import React from 'react'
import { User, Users } from 'lucide-react'

const ORG_HIERARCHY = [
  {
    name: 'SR. LORNA I. ABLOG, O.P.',
    role: 'SCHOOL ADMINISTRATOR',
    initials: 'LA',
    badge: 'Executive',
    badgeColor: 'bg-navy-blue text-sig-green'
  },
  {
    name: 'DR. AUGUSTO R. DELA CRUZ',
    role: 'VICE PRESIDENT OF ACADEMIC AFFAIRS',
    initials: 'AD',
    badge: 'Academic Affairs',
    badgeColor: 'bg-navy-blue/10 text-navy-blue'
  },
  {
    name: 'MRS. FAITHFUL ANNE F. ARUGAY',
    role: 'HEAD, CES',
    initials: 'FA',
    badge: 'CES Leadership',
    badgeColor: 'bg-sig-green/15 text-sig-green'
  },
  {
    name: 'MR. JONNEL B. MANIO',
    role: 'COORDINATOR, CES',
    initials: 'JM',
    badge: 'CES Operations',
    badgeColor: 'bg-navy-blue/5 text-navy-blue'
  }
]

export default function OrganizationalChart() {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 space-y-6 text-center font-poppins flex flex-col items-center">
      {/* Top Banner / Header matching reference */}
      <div className="w-full bg-navy-blue text-white rounded-2xl py-2.5 px-4 shadow-2xs border-b-2 border-sig-green flex items-center justify-center gap-2">
        <Users className="w-4 h-4 text-sig-green" />
        <h2 className="font-extrabold text-sm uppercase tracking-widest text-white">
          ORGANIZATIONAL CHART
        </h2>
      </div>

      {/* Vertical Organizational Hierarchy Structure */}
      <div className="w-full flex flex-col items-center space-y-1">
        {ORG_HIERARCHY.map((person, idx) => {
          const isLast = idx === ORG_HIERARCHY.length - 1

          return (
            <React.Fragment key={person.name}>
              {/* Person Card Node */}
              <div className="group flex flex-col items-center text-center transition-all duration-200 hover:scale-[1.02] cursor-default max-w-sm w-full py-1">
                {/* Avatar with Curved Partial Circular Accent Arc */}
                <div className="relative w-20 h-20 flex items-center justify-center mb-2.5">
                  {/* Outer SVG Curved Partial Ring */}
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-45 transition-transform duration-300 group-hover:rotate-0"
                    viewBox="0 0 100 100"
                  >
                    {/* Base Light Circular Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r="43"
                      fill="none"
                      stroke="#F1F5F9"
                      strokeWidth="5"
                    />
                    {/* Bold Curved Partial Arc Accent */}
                    <path
                      d="M 50 7 A 43 43 0 0 1 93 50"
                      fill="none"
                      stroke="#0B2545"
                      strokeWidth="6.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Circular Profile Container */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-b from-slate-100 to-slate-200/80 border-2 border-white shadow-xs flex items-center justify-center overflow-hidden">
                    <div className="flex flex-col items-center justify-center">
                      <User className="w-6 h-6 text-navy-blue/70" />
                    </div>
                  </div>
                </div>

                {/* Name */}
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide leading-tight">
                  {person.name}
                </p>

                {/* Position / Title */}
                <p className="text-[13.5px] font-black text-navy-blue uppercase tracking-tight mt-1 leading-snug">
                  {person.role}
                </p>
              </div>

              {/* Hierarchy Connecting Line */}
              {!isLast && (
                <div className="flex flex-col items-center my-0.5">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-navy-blue/35 to-navy-blue/15 rounded-full" />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
