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
  subscribeOrgChart,
  updateOrgChartMember,
  uploadOrgChartPhoto
} from '../services/db'

export default function OrganizationalChart({ canEdit = false }) {
  const [members, setMembers] = useState(DEFAULT_ORG_CHART)
  const [editingMember, setEditingMember] = useState(null)
  const [formName, setFormName] = useState('')
  const [formImage, setFormImage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Real-time synchronization between Admin & Coordinator
  useEffect(() => {
    const unsubscribe = subscribeOrgChart((updatedMembers) => {
      if (Array.isArray(updatedMembers) && updatedMembers.length > 0) {
        setMembers(updatedMembers)
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
    setFormImage(person.imageUrl || '')
    setSelectedFile(null)
    setErrorMessage('')
  }

  const handleCloseEdit = () => {
    if (isSaving) return
    setEditingMember(null)
    setFormName('')
    setFormImage('')
    setSelectedFile(null)
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
    setSelectedFile(file)

    // Local instant preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormImage(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setFormImage('')
    setSelectedFile(null)
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

      // If user selected a new file, upload using Cloudinary / project image storage
      if (selectedFile) {
        finalImageUrl = await uploadOrgChartPhoto(selectedFile)
      }

      await updateOrgChartMember(editingMember.id, {
        name: formName.trim(),
        imageUrl: finalImageUrl
      })

      // Immediately update local UI
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
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
            <React.Fragment key={person.id || person.name || idx}>
              {/* Person Card Node */}
              <div className="group relative flex flex-col items-center text-center transition-all duration-200 hover:scale-[1.02] cursor-default max-w-sm w-full py-1">
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
                    {person.imageUrl ? (
                      <img
                        src={person.imageUrl}
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <User className="w-6 h-6 text-navy-blue/70" />
                      </div>
                    )}
                  </div>

                  {/* Admin Edit Floating Action Button */}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenEdit(person)
                      }}
                      className="absolute -top-1 -right-1 z-10 w-7 h-7 rounded-full bg-navy-blue text-white shadow-md flex items-center justify-center hover:bg-navy-blue/90 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer border-2 border-white"
                      title={`Edit ${person.role}`}
                      aria-label={`Edit ${person.role}`}
                    >
                      <Pencil className="w-3.5 h-3.5 text-sig-green" />
                    </button>
                  )}
                </div>

                {/* Name */}
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide leading-tight">
                  {person.name}
                </p>

                {/* Position / Title */}
                <p className="text-[13.5px] font-black text-navy-blue uppercase tracking-tight mt-1 leading-snug">
                  {person.role}
                </p>

                {/* Admin Inline Edit Badge */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(person)}
                    className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[11px] font-semibold text-navy-blue/75 hover:text-navy-blue bg-slate-100 hover:bg-slate-200/90 px-2.5 py-0.5 rounded-full cursor-pointer shadow-2xs"
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

      {/* ── Admin Edit Modal ── */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-blue/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 text-left font-poppins relative"
            role="dialog"
            aria-modal="true"
          >
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

            {/* Profile Photo Upload / Replace */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-dashed border-gray-200 space-y-3">
              {/* Preview Frame */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg
                  className="absolute inset-0 w-full h-full -rotate-45"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="43"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="5"
                  />
                  <path
                    d="M 50 7 A 43 43 0 0 1 93 50"
                    fill="none"
                    stroke="#0B2545"
                    strokeWidth="6.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="w-14 h-14 rounded-full bg-white border-2 border-white shadow-xs flex items-center justify-center overflow-hidden">
                  {formImage ? (
                    <img
                      src={formImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-navy-blue/60" />
                  )}
                </div>
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
          </div>
        </div>
      )}
    </div>
  )
}
