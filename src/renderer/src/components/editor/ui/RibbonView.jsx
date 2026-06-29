import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { RBtn, RGroup } from './DropdownWrapper';

export default function RibbonView({
  zoom, setZoom,
  readingMode, setReadingMode,
  showRuler, setShowRuler,
  showGridlines, setShowGridlines,
  showNavPane, setShowNavPane,
}) {
  return (
    <div className="flex items-end gap-0 overflow-visible flex-nowrap">

      {/* ── Zoom ── */}
      <RGroup label="Zoom">
        <RBtn title="Zoom Out (Ctrl+-)" onClick={() => setZoom(z => Math.max(50, z - 10))}>
          <ZoomOut className="w-3.5 h-3.5" />
        </RBtn>
        <div className="flex items-center mx-1">
          <input
            type="range"
            min={50}
            max={200}
            step={10}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="w-20 h-1 accent-blue-600 cursor-pointer"
            title={`${zoom}%`}
          />
        </div>
        <span className="text-[10px] font-bold text-gray-700 px-1 w-10 text-center select-none">{zoom}%</span>
        <RBtn title="Zoom In (Ctrl++)" onClick={() => setZoom(z => Math.min(200, z + 10))}>
          <ZoomIn className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn title="Reset to 100%" onClick={() => setZoom(100)} className="px-2 text-[10px] ml-1">
          Fit
        </RBtn>
      </RGroup>

      {/* ── Views ── */}
      <RGroup label="Views">
        <RBtn active={!readingMode} onClick={() => setReadingMode(false)} className="px-2 text-[10px]">
          Print Layout
        </RBtn>
        <RBtn active={readingMode} onClick={() => setReadingMode(true)} className="px-2 text-[10px]">
          Reading
        </RBtn>
      </RGroup>

      {/* ── Show/Hide ── */}
      <RGroup label="Show">
        <RBtn active={showRuler} onClick={() => setShowRuler(!showRuler)} className="px-2 text-[10px]">
          Ruler
        </RBtn>
        <RBtn active={showGridlines} onClick={() => setShowGridlines(!showGridlines)} className="px-2 text-[10px]">
          Gridlines
        </RBtn>
        <RBtn active={showNavPane} onClick={() => setShowNavPane(!showNavPane)} className="px-2 text-[10px]">
          Nav Pane
        </RBtn>
      </RGroup>

      {/* ── Full Screen ── */}
      <RGroup label="Window">
        <RBtn
          title="Full Screen"
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              document.documentElement.requestFullscreen().catch(() => {});
            }
          }}
          className="px-2 text-[10px]"
        >
          Full Screen
        </RBtn>
      </RGroup>
    </div>
  );
}
