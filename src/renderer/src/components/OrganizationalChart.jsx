import React, { useState, useEffect } from 'react'
import {
  User,
  Users,
  Pencil,
  Camera,
  X,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react'
import {
  DEFAULT_ORG_CHART,
  normalizeOrgChartMembers,
  subscribeOrgChart,
  updateOrgChartMember,
  uploadOrgChartPhoto
} from '../services/db'
import AnimatedModal from './motion/AnimatedModal'

export default function OrganizationalChart({ canEdit = false }) {
  const [members, setMembers] = useState(() => normalizeOrgChartMembers(DEFAULT_ORG_CHART))
  const [editingMember, setEditingMember] = useState(null)
  const [formName, setFormName] = useState('')
  const [formImage, setFormImage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [failedImages, setFailedImages] = useState({})
  const [previewError, setPreviewError] = useState(false)

  // Real-time synchronization between Admin & Coordinator
  useEffect(() => {
    const unsubscribe = subscribeOrgChart((updatedMembers) => {
      if (Array.isArray(updatedMembers) && updatedMembers.length > 0) {
        setMembers(normalizeOrgChartMembers(updatedMembers))
      }
    })
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  const handleOpenEdit = (person) => {
    setEditingMember(person)
    setFormName(person.name || '')
    const isBroken = failedImages[person.id || person.role]
    setFormImage(isBroken ? '' : (person.imageUrl || ''))
    setSelectedFile(null)
    setPreviewError(false)
    setErrorMessage('')
  }

  const handleCloseEdit = () => {
    if (isSaving) return
    setEditingMember(null)
    setFormName('')
    setFormImage('')
    setSelectedFile(null)
    setPreviewError(false)
    setErrorMessage('')
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate format
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp']
    const lowerName = file.name.toLowerCase()
    const isValidExt = allowedExtensions.some((ext) => lowerName.endsWith(ext))
    const isValidMime = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp'
    ].includes((file.type || '').toLowerCase())

    if (!isValidExt && !isValidMime) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, or WEBP).')
      e.target.value = ''
      return
    }

    // Validate size (15MB limit)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 15MB limit. Please choose a smaller photo.')
      e.target.value = ''
      return
    }

    setErrorMessage('')
    setPreviewError(false)
    setSelectedFile(file)

    // Local instant preview preserving aspect ratio (Department Card behavior)
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormImage(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setFormImage('')
    setSelectedFile(null)
    setPreviewError(false)
    setErrorMessage('')
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      setErrorMessage('Please enter a name for this position.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    try {
      let finalImageUrl = formImage

      // If user selected a new file, compress to high-quality Data URL (matching Department Card)
      if (selectedFile) {
        try {
          finalImageUrl = await uploadOrgChartPhoto(selectedFile)
        } catch (uploadErr) {
          console.error('Photo upload failed:', uploadErr)
          throw new Error(uploadErr.message || 'Failed to process photo. Please try again.')
        }
      }

      await updateOrgChartMember(editingMember.id || editingMember.role, {
        id: editingMember.id,
        role: editingMember.role,
        name: formName.trim(),
        imageUrl: finalImageUrl
      })

      // Immediately clear failedImages flag for this member so new photo displays instantly
      setFailedImages((prev) => {
        const copy = { ...prev }
        delete copy[editingMember.id]
        delete copy[editingMember.role]
        return copy
      })

      // Immediately update local UI
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id || m.role === editingMember.role
            ? { ...m, name: formName.trim(), imageUrl: finalImageUrl }
            : m
        )
      )

      handleCloseEdit()
    } catch (err) {
      console.error('Failed to save organization chart member:', err)
      setErrorMessage(err.message || 'Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 space-y-6 text-center font-poppins flex flex-col items-center relative">
      {/* Top Banner / Header matching reference */}
      <div className="w-full bg-navy-blue text-white rounded-2xl py-2.5 px-4 shadow-2xs border-b-2 border-sig-green flex items-center justify-center gap-2">
        <Users className="w-4 h-4 text-sig-green" />
        <h2 className="font-extrabold text-sm uppercase tracking-widest text-white">
          ORGANIZATIONAL CHART
        </h2>
      </div>

      {/* Vertical Organizational Hierarchy Structure */}
      <div className="w-full flex flex-col items-center space-y-1">
        {members.map((person, idx) => {
          const isLast = idx === members.length - 1

          return (
            <React.Fragment key={person.id || person.role || idx}>
              {/* Person Card Node */}
              <div
                onClick={() => {
                  if (canEdit) handleOpenEdit(person)
                }}
                className={`group relative flex flex-col items-center text-center transition-all duration-200 hover:scale-[1.02] max-w-sm w-full py-1 ${
                  canEdit ? 'cursor-pointer' : 'cursor-default'
                }`}
                title={canEdit ? `Click to edit ${person.role}` : undefined}
              >
                {/* Avatar with Curved Partial Circular Accent Arc (Sized to match Department Card logo: w-32 h-32) */}
                <div className="relative w-28 h-28 flex items-center justify-center mb-3">
                  {/* Outer SVG Curved Partial Ring */}
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-45 transition-transform duration-300 group-hover:rotate-0"
                    viewBox="0 0 100 100"
                  >
                    {/* Base Light Circular Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#F1F5F9"
                      strokeWidth="3.5"
                    />
                    {/* Bold Curved Partial Arc Accent */}
                    <path
                      d="M 50 5 A 45 45 0 0 1 95 50"
                      fill="none"
                      stroke="#0B2545"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Circular Profile Container (object-cover prevents distortion, matching Department Card w-32 h-32 sizing) */}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-b from-slate-100 to-slate-200/80 border-3 border-white shadow-sm flex items-center justify-center overflow-hidden">
                    {person.imageUrl && !failedImages[person.id || person.role] ? (
                      <img
                        src={person.imageUrl}
                        alt={person.name}
                        onError={() =>
                          setFailedImages((prev) => ({
                            ...prev,
                            [person.id || person.role]: true
                          }))
                        }
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <User className="w-14 h-14 text-navy-blue/70" />
                      </div>
                    )}
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

                {/* Admin Inline Edit Badge (Single clean edit trigger) */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenEdit(person)
                    }}
                    className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[11px] font-semibold text-navy-blue/75 hover:text-navy-blue bg-slate-100 hover:bg-slate-200/90 px-3 py-0.5 rounded-full cursor-pointer shadow-2xs"
                  >
                    <Pencil className="w-3 h-3 text-sig-green" />
                    <span>Edit</span>
                  </button>
                )}
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

      {/* ── Admin Edit Modal (Standard DommUnity CRUD Modal with AnimatedModal portal) ── */}
      <AnimatedModal
        isOpen={Boolean(editingMember)}
        onClose={handleCloseEdit}
        overlayClassName="fixed inset-0 z-[99999] flex items-center justify-center p-4 glass-modal-overlay select-none"
        contentClassName="glass-modal rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-white/80 space-y-5 text-left font-poppins relative select-text"
      >
        {editingMember && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-extrabold text-navy-blue">
                  Edit Organization Member
                </h3>
                <p className="text-xs font-bold text-sig-green uppercase tracking-wider mt-0.5">
                  {editingMember.role}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={isSaving}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-2xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="flex-1 font-medium">{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="text-red-400 hover:text-red-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Profile Photo Upload / Replace — Sizing & aspect ratio behavior matching Department Card */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-dashed border-gray-200 space-y-3">
              {/* Circular Preview Area */}
              <div className="w-24 h-24 rounded-full border-3 border-gray-200 bg-white shadow-xs flex items-center justify-center overflow-hidden">
                {formImage && !previewError ? (
                  <img
                    src={formImage}
                    alt="Photo preview"
                    onError={() => setPreviewError(true)}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <User className="w-12 h-12 text-navy-blue/60" />
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="org-photo-input"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSaving}
                />
                <label
                  htmlFor="org-photo-input"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-blue text-white text-xs font-semibold rounded-full hover:bg-navy-blue/90 transition-colors cursor-pointer shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5 text-sig-green" />
                  <span>{formImage ? 'Replace Photo' : 'Upload Photo'}</span>
                </label>
                {formImage && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isSaving}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-400 text-center">
                JPG, PNG, or WEBP up to 15MB
              </p>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value)
                  if (errorMessage) setErrorMessage('')
                }}
                disabled={isSaving}
                placeholder="e.g. SR. LORNA I. ABLOG, O.P."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-blue/20 focus:border-navy-blue transition-all"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 bg-navy-blue text-white text-xs font-bold rounded-xl hover:bg-navy-blue/90 active:scale-95 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sig-green" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-sig-green" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </AnimatedModal>
    </div>
  )
}
