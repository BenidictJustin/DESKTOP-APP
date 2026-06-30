import React, { useEffect, useRef, useState } from "react";
import { X, Edit3, FileText, Loader } from "lucide-react";
import { renderAsync } from "docx-preview";

/**
 * DocxPreviewModal — Renders an imported .docx file with full page-by-page
 * layout fidelity using docx-preview. Includes an "Edit in Editor" button
 * which loads the editable version via mammoth into the main canvas.
 */
export default function DocxPreviewModal({ show, arrayBuffer, fileName, onClose, onEditInEditor }) {
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!show || !arrayBuffer || !containerRef.current) return;
    setIsLoading(true);
    setError(null);
    containerRef.current.innerHTML = "";

    renderAsync(arrayBuffer, containerRef.current, null, {
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      ignoreLastRenderedPageBreak: false,
      inWrapper: true,
      useBase64URL: true,
    })
      .then(() => setIsLoading(false))
      .catch((err) => {
        console.error("docx-preview error:", err);
        setError("Failed to render the document. The file may be corrupted or unsupported.");
        setIsLoading(false);
      });
  }, [show, arrayBuffer]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: "#1a1a2e" }}>
      {/* Header bar */}
      <div
        className="flex items-center justify-between shrink-0 px-5 py-3 border-b"
        style={{ background: "#16213e", borderColor: "#0f3460" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#0f3460" }}>
            <FileText className="w-4 h-4 text-blue-300" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold truncate max-w-xs">
              {fileName || "Document Preview"}
            </p>
            <p className="text-[10px]" style={{ color: "rgba(147,197,253,0.6)" }}>
              Read-only preview — layout matches original
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEditInEditor}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff" }}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit in Editor
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview scroll area */}
      <div className="flex-1 overflow-auto relative" style={{ background: "#1a1a2e", padding: "24px" }}>
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-blue-400" />
            <p className="text-sm" style={{ color: "rgba(147,197,253,0.7)" }}>
              Rendering document layout...
            </p>
          </div>
        )}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        <div ref={containerRef} style={{ visibility: isLoading ? "hidden" : "visible" }} />
      </div>

      <style>{`
        .docx-wrapper {
          background: #1a1a2e !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 24px !important;
        }
        .docx-wrapper > section.docx {
          box-shadow: 0 8px 40px rgba(0,0,0,0.5) !important;
          border-radius: 4px !important;
          margin: 0 auto !important;
        }
      `}</style>
    </div>
  );
}
