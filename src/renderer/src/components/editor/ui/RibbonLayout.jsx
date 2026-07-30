import React, { useState, useRef } from 'react'
import { Columns, ChevronDown } from 'lucide-react'
import { RBtn, RGroup, DropdownWrapper } from './DropdownWrapper'
import { MARGINS, PAPER } from '../constants'
import CustomSelect from '../../CustomSelect'

export default function RibbonLayout({
  editor,
  marginKey,
  setMarginKey,
  orientation,
  setOrientation,
  paperKey,
  setPaperKey,
  columns,
  setColumns,
  showLineNumbers,
  setShowLineNumbers,
  onOpenDocProps // Callback to open document properties dialog
}) {
  const [showSizeDD, setShowSizeDD] = useState(false)
  const sizeTriggerRef = useRef(null)

  const selectedPaper = PAPER[paperKey] || PAPER.Letter

  return (
    <div className="flex items-end gap-0 overflow-visible flex-nowrap">
      {/* ── Margins ── */}
      <RGroup label="Margins">
        {Object.keys(MARGINS).map((m) => (
          <RBtn
            key={m}
            active={marginKey === m}
            onClick={() => setMarginKey(m)}
            className="px-2 text-[10px]"
          >
            {m}
          </RBtn>
        ))}
      </RGroup>

      {/* ── Orientation ── */}
      <RGroup label="Orientation">
        <RBtn
          active={orientation === 'portrait'}
          onClick={() => setOrientation('portrait')}
          className="px-2 text-[10px]"
        >
          Portrait
        </RBtn>
        <RBtn
          active={orientation === 'landscape'}
          onClick={() => setOrientation('landscape')}
          className="px-2 text-[10px]"
        >
          Landscape
        </RBtn>
      </RGroup>

      {/* ── Paper Size Dropdown (Microsoft Word style) ── */}
      <RGroup label="Size">
        <div className="relative" ref={sizeTriggerRef}>
          <button
            onClick={() => setShowSizeDD(!showSizeDD)}
            className="flex items-center justify-between bg-white border border-gray-300 rounded px-2 py-0.5 text-[10px] w-28 h-7 text-gray-700 hover:border-blue-400 cursor-pointer transition"
          >
            <span className="truncate flex-1 text-left font-semibold">{selectedPaper.name}</span>
            <ChevronDown className="w-2.5 h-2.5 text-gray-400 shrink-0 ml-1" />
          </button>

          <DropdownWrapper
            open={showSizeDD}
            onClose={() => setShowSizeDD(false)}
            triggerRef={sizeTriggerRef}
            width={220}
          >
            <div className="py-1 max-h-64 overflow-y-auto w-52 divide-y divide-gray-50">
              {Object.keys(PAPER).map((key) => {
                const p = PAPER[key]
                const isActive = paperKey === key
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setPaperKey(key)
                      setShowSizeDD(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center gap-3 transition hover:bg-blue-50/50 cursor-pointer
                      ${isActive ? 'bg-blue-50 text-blue-800' : 'text-gray-700'}`}
                  >
                    {/* SVG Page Preview icon */}
                    <div className="w-5 h-6 border border-gray-300 bg-white shadow-xs rounded flex items-center justify-center shrink-0">
                      <div className="w-3 h-4 bg-blue-100 rounded-xs border border-blue-200" />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold leading-tight">{p.name}</span>
                      <span className="text-[8px] text-gray-400 leading-tight mt-0.5">
                        {p.label}
                      </span>
                    </div>
                  </button>
                )
              })}

              {/* More Paper Sizes option */}
              <button
                onClick={() => {
                  setShowSizeDD(false)
                  onOpenDocProps()
                }}
                className="w-full text-left px-3 py-2 text-[10px] text-blue-600 hover:bg-blue-50 font-bold cursor-pointer block"
              >
                More Paper Sizes...
              </button>
            </div>
          </DropdownWrapper>
        </div>
      </RGroup>

      {/* ── Columns ── */}
      <RGroup label="Columns">
        {[1, 2, 3].map((n) => (
          <RBtn
            key={n}
            active={columns === n}
            onClick={() => setColumns(n)}
            className="px-2 text-[10px]"
          >
            {n} Col
          </RBtn>
        ))}
      </RGroup>

      {/* ── Paragraph Spacing ── */}
      <RGroup label="Paragraph">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[10px] text-gray-600">
            <span className="whitespace-nowrap">Before:</span>
            <CustomSelect
              options={['0pt', '6pt', '12pt', '18pt', '24pt']}
              onChange={(val) =>
                editor?.chain().focus().updateAttributes('paragraph', { marginTop: val }).run()
              }
              style={{ height: '24px', width: '60px' }}
            />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-600">
            <span className="whitespace-nowrap">After:</span>
            <CustomSelect
              options={['0pt', '6pt', '8pt', '12pt', '18pt']}
              onChange={(val) =>
                editor?.chain().focus().updateAttributes('paragraph', { marginBottom: val }).run()
              }
              style={{ height: '24px', width: '60px' }}
            />
          </div>
        </div>
      </RGroup>

      {/* ── Page Break ── */}
      <RGroup label="Breaks">
        <RBtn
          title="Insert Page Break"
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .insertContent({ type: 'pageBreak' })
              .insertContent('<p></p>')
              .run()
          }
          className="px-2 text-[10px]"
        >
          Page Break
        </RBtn>
      </RGroup>

      {/* ── Line Numbers ── */}
      <RGroup label="Line Numbers">
        <RBtn
          active={showLineNumbers}
          onClick={() => setShowLineNumbers(!showLineNumbers)}
          className="px-2 text-[10px]"
        >
          {showLineNumbers ? 'Hide' : 'Show'} Numbers
        </RBtn>
      </RGroup>
    </div>
  )
}
