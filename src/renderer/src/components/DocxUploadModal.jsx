import React, { useState, useRef, useEffect } from 'react'
import { X, FileText, UploadCloud, CheckCircle2, AlertCircle, Loader2, Calendar, Upload } from 'lucide-react'
import AnimatedModal from './motion/AnimatedModal'

/**
 * DocxUploadModal
 *
 * Dedicated modal for direct document submission (DOCX & PDF) matching DommUnity's design system:
 * - Glassmorphic overlay and card styling (glass-modal)
 * - Supports both Microsoft Word (.docx) and Adobe PDF (.pdf) files
 * - DommUnity navy-blue and sig-green branding
 * - Modern dashed drag-and-drop zone with animated feedback
 * - Associated event selector and comments textarea
 * - Brand-consistent action buttons (Navy-blue primary with sig-green border, Gray secondary)
 */
export default function DocxUploadModal({
  isOpen,
  onClose,
  onSubmit,
  eventsList = [],
  isSubmitting = false
}) {
  const [file, setFile] = useState(null)
  const [comment, setComment] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const fileInputRef = useRef(null)

  // Reset form state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setFile(null)
      setComment('')
      setSelectedEventId('')
      setErrorMessage('')
      setDragActive(false)
    }
  }, [isOpen])

  const handleFileSelect = (selectedFile) => {
    setErrorMessage('')
    if (!selectedFile) return

    const fileName = selectedFile.name || ''
    const isDocx =
      fileName.toLowerCase().endsWith('.docx') ||
      selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    const isPdf =
      fileName.toLowerCase().endsWith('.pdf') ||
      selectedFile.type === 'application/pdf'

    if (!isDocx && !isPdf) {
      setErrorMessage('Please select a valid Microsoft Word (.docx) or PDF (.pdf) document.')
      return
    }

    setFile(selectedFile)
  }

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) {
      handleFileSelect(selected)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!file) {
      setErrorMessage('Please select or drop a DOCX or PDF file to upload.')
      return
    }
    onSubmit({
      file,
      comment: comment.trim(),
      eventId: selectedEventId || null
    })
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const isSelectedPdf = file && (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf')

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose()
      }}
      overlayClassName="fixed inset-0 z-[99999] flex items-center justify-center p-4 glass-modal-overlay select-none font-poppins"
      contentClassName="glass-modal rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-white/80 space-y-5 max-h-[90vh] overflow-y-auto"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-gray-200/60 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-navy-blue/5 text-navy-blue rounded-2xl border border-navy-blue/10">
            <UploadCloud className="w-5 h-5 text-navy-blue" />
          </div>
          <div>
            <h3 className="font-extrabold text-navy-blue text-lg tracking-tight">Upload Report</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="text-gray-400 hover:text-navy-blue transition-colors cursor-pointer p-1.5 rounded-xl hover:bg-gray-100/80"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Modal Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Error Notification */}
        {errorMessage && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200/80 text-red-700 text-xs px-3.5 py-2.5 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* File Drop & Selection Area */}
        <div>
          <label className="block text-xs font-bold text-navy-blue uppercase tracking-wider mb-1.5">
            Document File (.docx, .pdf) <span className="text-red-500">*</span>
          </label>
          <div
            onClick={() => !isSubmitting && fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`w-full p-5 border-2 border-dashed rounded-2xl bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${dragActive
                ? 'border-navy-blue ring-4 ring-navy-blue/10 bg-navy-blue/5 scale-[0.99]'
                : file
                  ? isSelectedPdf ? 'border-red-400 bg-red-50/20' : 'border-sig-green/80 bg-sig-green/5'
                  : 'border-gray-250 hover:border-navy-blue/40 hover:bg-white'
              }`}
          >
            {file ? (
              <div className="flex items-center gap-3 w-full bg-white p-3 rounded-xl border border-gray-150 shadow-xs">
                <div className={`p-2.5 rounded-xl shrink-0 ${isSelectedPdf ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-navy-blue truncate" title={file.name}>
                      {file.name}
                    </p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${isSelectedPdf ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isSelectedPdf ? 'PDF' : 'DOCX'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                    {formatFileSize(file.size)} · Click to change file
                  </p>
                </div>
                <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-navy-blue/5 text-navy-blue flex items-center justify-center mb-2.5">
                  <UploadCloud className="w-6 h-6 stroke-[2.2]" />
                </div>
                <p className="text-xs font-bold text-navy-blue">
                  Click to select <span className="text-gray-400 font-normal">or drag &amp; drop (.docx, .pdf) file</span>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Associated Event Selector (Optional) */}
        {eventsList && eventsList.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-navy-blue uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-navy-blue/70" />
              <span>Associated Event <span className="text-gray-400 font-normal normal-case">(Optional)</span></span>
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-250 rounded-xl text-xs font-medium text-navy-blue focus:outline-none focus:ring-2 focus:ring-navy-blue/20 focus:border-navy-blue transition-all cursor-pointer"
            >
              <option value="">General Report (Not tied to specific event)</option>
              {eventsList.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} {ev.scheduleDate ? `(${new Date(ev.scheduleDate).toLocaleDateString()})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Remarks / Comments Field (Optional) */}
        <div>
          <label className="block text-xs font-bold text-navy-blue uppercase tracking-wider mb-1.5">
            Remarks / Comments <span className="text-gray-400 font-normal normal-case">(Optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
            placeholder="Add any notes or context for the reviewer..."
            rows={3}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-250 rounded-xl text-xs text-navy-blue font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-blue/20 focus:border-navy-blue resize-none transition-all"
          />
        </div>

        {/* Bottom Actions: DommUnity Signature Styling */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5 select-none">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !file}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-navy-blue text-white font-bold text-xs rounded-xl border-b-2 border-sig-green hover:bg-navy-blue/90 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Submit Report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </AnimatedModal>
  )
}
