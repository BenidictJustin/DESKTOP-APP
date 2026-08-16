import React from 'react'
import { User, Code2 } from 'lucide-react'

const DEVELOPERS_LIST = [
  {
    name: 'BENIDICT JUSTIN SALUNGA',
    role: 'LEAD PROGRAMMER',
    initials: 'BS'
  },
  {
    name: 'MC HARRY TOLENTINO',
    role: 'PROJECT MANAGER',
    initials: 'MT'
  },
  {
    name: 'ARON STEFAN TARUC',
    role: 'UI/UX DESIGNER',
    initials: 'AT'
  },
  {
    name: 'JOHN HAROLD SANTOS',
    role: 'TESTER',
    initials: 'JS'
  }
]

export default function DevelopersChart() {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 space-y-6 text-center font-poppins flex flex-col items-center w-full">
      {/* Top Banner Header */}
      <div className="w-full bg-navy-blue text-white rounded-2xl py-2.5 px-4 shadow-2xs border-b-2 border-sig-green flex items-center justify-center gap-2">
        <Code2 className="w-4 h-4 text-sig-green" />
        <h2 className="font-extrabold text-sm uppercase tracking-widest text-white">
          DEVELOPERS
        </h2>
      </div>

      {/* Horizontal Developers Row (Lead Programmer | Project Manager | UI/UX Designer | Tester) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-2">
        {DEVELOPERS_LIST.map((dev) => {
          return (
            <div
              key={dev.name}
              className="group flex flex-col items-center text-center transition-all duration-200 hover:scale-[1.03] cursor-default p-3 rounded-2xl hover:bg-slate-50/80"
            >
              {/* Avatar with Curved Partial Circular Accent Arc */}
              <div className="relative w-20 h-20 flex items-center justify-center mb-3">
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
                {dev.name}
              </p>

              {/* Position / Title */}
              <p className="text-[13.5px] font-black text-navy-blue uppercase tracking-tight mt-1.5 leading-snug">
                {dev.role}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
