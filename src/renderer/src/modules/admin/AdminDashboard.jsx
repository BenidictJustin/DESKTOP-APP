/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import AnimatedModal from '../../components/motion/AnimatedModal'
import AnimatedPage from '../../components/motion/AnimatedPage'
import {
  staggerContainer,
  staggerItem,
  pageVariants,
  pageTransition,
  modalOverlayVariants,
  modalContentVariants,
  modalOverlayTransition,
  modalContentTransition,
  dropdownVariants,
  dropdownTransition,
  fadeInUp,
  duration,
  easing
} from '../../components/motion/motionConfig'
import {
  getUsers,
  subscribeUsers,
  registerUser,
  updateUser,
  deleteUser,
  updateCoordinatorStatus,
  getResetRequests,
  handleResetRequest,
  getOrganizations,
  subscribeOrganizations,
  addOrganization,
  updateOrganization,
  deleteOrganization,
  getInventory,
  subscribeInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getDonors,
  subscribeDonors,
  addDonor,
  updateDonor,
  deleteDonor,
  getDonations,
  subscribeDonations,
  addDonation,
  getEvents,
  subscribeEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  getReports,
  subscribeReports,
  updateReport,
  getInventoryTransactions,
  logInventoryTransaction,
  addReport,
  uploadPhoto,
  sendCoordinatorResetEmail
} from '../../services/db'
import logo from '../../assets/logo.png'
import logo2Img from '../../assets/logo2.png'
import {
  Users,
  Package,
  Gift,
  Calendar,
  FileText,
  Info,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ShieldAlert,
  Download,
  Clock,
  ArrowRight,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Sparkles,
  FolderOpen,
  MapPin,
  Eye,
  FileSymlink,
  ChevronRight,
  AlertTriangle,
  LayoutDashboard,
  Share,
  ListFilter,
  Search,
  Save,
  Send,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  Edit3,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Settings,
  ChevronLeft,
  Home,
  Layers
} from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import SearchableDropdown from '../../components/SearchableDropdown'
import DocumentViewer from '../../components/DocumentViewer'
import GlassDatePicker from '../../components/GlassDatePicker'
import AnimatedSidebar from '../../components/AnimatedSidebar'
import {
  sanitizeOklchInDocument,
  exportElementToPDF,
  resolveHeaderHtml,
  parseNarrativePages
} from '../../components/editor/utils/editorHelpers'
import { PAPER, MARGINS } from '../../components/editor/constants'

const isFuzzyDuplicate = (existingName, newName) => {
  const s1 = existingName.toLowerCase().trim().replace(/\s+/g, ' ')
  const s2 = newName.toLowerCase().trim().replace(/\s+/g, ' ')
  if (s1 === s2) return true

  // Avoid fuzzy matching for short names
  if (s1.length < 6 || s2.length < 6) return false

  const len1 = s1.length
  const len2 = s2.length
  const maxLen = Math.max(len1, len2)

  // Compute Levenshtein distance
  const track = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(null))
  for (let i = 0; i <= len1; i += 1) track[0][i] = i
  for (let j = 0; j <= len2; j += 1) track[j][0] = j
  for (let j = 1; j <= len2; j += 1) {
    for (let i = 1; i <= len1; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  const distance = track[len2][len1]

  // Similarity threshold
  const similarity = 1 - distance / maxLen

  return distance <= 2 || similarity >= 0.85
}

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [editingUser, setEditingUser] = useState(null)

  // Completed Activities Modal State
  const [completedActivitiesModal, setCompletedActivitiesModal] = useState({
    isOpen: false,
    selectedDeptId: null,
    selectedDeptName: null,
    selectedDeptAbbr: null
  })

  // States for database sync
  const [usersList, setUsersList] = useState([])
  const [orgsList, setOrgsList] = useState([])
  const [inventoryList, setInventoryList] = useState([])
  const [donorsList, setDonorsList] = useState([])
  const [donationsList, setDonationsList] = useState([])
  const [eventsList, setEventsList] = useState([])
  const [reportsList, setReportsList] = useState([])
  const [resetRequests, setResetRequests] = useState([])

  // Loading & error handling states
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // PDF Export target reference
  const pdfExportRef = useRef(null)
  const [exportingReport, setExportingReport] = useState(null)

  const [deletedCategories, setDeletedCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('dommunity_deleted_categories')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const defaultCategories = ['school supplies', 'food packs', 'hygiene kits']
  const allCategories = [
    ...new Set([
      ...defaultCategories,
      ...inventoryList.map((i) => (i.category || '').trim().toLowerCase())
    ])
  ].filter(Boolean)
  const activeCategories = allCategories.filter(
    (cat) => !deletedCategories.includes(cat.toLowerCase().trim())
  )

  const [deletedUnits, setDeletedUnits] = useState(() => {
    try {
      const saved = localStorage.getItem('dommunity_deleted_units')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const defaultUnits = ['pieces', 'cans', 'packs', 'boxes', 'bundles', 'bars']
  const allUnits = [
    ...new Set([...defaultUnits, ...inventoryList.map((i) => (i.unit || '').trim().toLowerCase())])
  ].filter(Boolean)
  const activeUnits = allUnits.filter((u) => !deletedUnits.includes(u.toLowerCase().trim()))

  // Form inputs
  // Coordinator Registration form
  const [coordName, setCoordName] = useState('')
  const [coordFirstName, setCoordFirstName] = useState('')
  const [coordLastName, setCoordLastName] = useState('')
  const [coordEmail, setCoordEmail] = useState('')
  const [coordUsername, setCoordUsername] = useState('')
  const [coordPassword, setCoordPassword] = useState('')
  const [coordConfirmPassword, setCoordConfirmPassword] = useState('')
  const [coordOrgId, setCoordOrgId] = useState('')
  const [isDeptSearchOpen, setIsDeptSearchOpen] = useState(false)
  const [deptSearchVal, setDeptSearchVal] = useState('')
  const [coordRole, setCoordRole] = useState('office_coordinator')
  const [coordErrors, setCoordErrors] = useState({})

  // Modal Validation Error States
  const [itemErrors, setItemErrors] = useState({})
  const [evtErrors, setEvtErrors] = useState({})
  const [donErrors, setDonErrors] = useState({})
  const [orgErrors, setOrgErrors] = useState({})
  const [deptErrors, setDeptErrors] = useState({})

  // Inventory Item Form
  const [itemEditing, setItemEditing] = useState(null) // null means adding
  const [itemName, setItemName] = useState('')
  const [itemCategory, setItemCategory] = useState('')
  const [itemUnit, setItemUnit] = useState('')
  const [itemQty, setItemQty] = useState('')
  const [itemExpiry, setItemExpiry] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [releaseItemId, setReleaseItemId] = useState('')
  const [releaseQty, setReleaseQty] = useState('')
  const [releaseQtyGroup, setReleaseQtyGroup] = useState('')
  const [releaseQtyPieces, setReleaseQtyPieces] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [releaseSearch, setReleaseSearch] = useState('')
  const [showReleaseDropdown, setShowReleaseDropdown] = useState(false)
  const [showAddCategoryDropdown, setShowAddCategoryDropdown] = useState(false)
  const [showEditCategoryDropdown, setShowEditCategoryDropdown] = useState(false)
  const [showAddQtyDropdown, setShowAddQtyDropdown] = useState(false)
  const [showEditQtyDropdown, setShowEditQtyDropdown] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null) // { title, message, onConfirm }
  const [showItemNameSuggestions, setShowItemNameSuggestions] = useState(false)
  const [itemPiecesPerUnit, setItemPiecesPerUnit] = useState('')
  const [itemGroupUnit, setItemGroupUnit] = useState('none')
  const [releaseUnitType, setReleaseUnitType] = useState('base')
  const [showAddUnitDropdown, setShowAddUnitDropdown] = useState(false)
  const [showEditUnitDropdown, setShowEditUnitDropdown] = useState(false)
  const [showReportPreview, setShowReportPreview] = useState(false)
  const [txHistory, setTxHistory] = useState([])
  const [reportDate, setReportDate] = useState('')
  const [pendingReleaseItems, setPendingReleaseItems] = useState([])
  const [showAllRecommended, setShowAllRecommended] = useState(false)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false)
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false)
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [feedbackNote, setFeedbackNote] = useState('')
  const [editingOrg, setEditingOrg] = useState(null) // null means registering, object means updating
  const [editingEvent, setEditingEvent] = useState(null)

  // States for donation batch item dropdown inputs
  const [activeDonItemSuggestionsIdx, setActiveDonItemSuggestionsIdx] = useState(null)
  const [activeDonItemCategoryIdx, setActiveDonItemCategoryIdx] = useState(null)
  const [activeDonItemUnitIdx, setActiveDonItemUnitIdx] = useState(null)
  const [activeDonItemQtyIdx, setActiveDonItemQtyIdx] = useState(null)

  const prevAddCategoryRef = useRef('')
  const prevAddQtyRef = useRef('')
  const prevAddUnitRef = useRef('')
  const prevEditCategoryRef = useRef('')
  const prevEditQtyRef = useRef('')
  const prevEditUnitRef = useRef('')
  const prevReleaseSearchRef = useRef('')
  const errorOkButtonRef = useRef(null)
  const confirmButtonRef = useRef(null)

  const prevDonCategoryRef = useRef({ idx: -1, value: '' })
  const prevDonUnitRef = useRef({ idx: -1, value: '' })
  const prevDonQtyRef = useRef({ idx: -1, value: '' })
  const mainRef = useRef(null)

  useEffect(() => {
    if ((actionError || validationError) && errorOkButtonRef.current) {
      errorOkButtonRef.current.focus()
    }
  }, [actionError, validationError])

  useEffect(() => {
    if (confirmDialog && confirmButtonRef.current) {
      confirmButtonRef.current.focus()
    }
  }, [confirmDialog])

  const isAnyModalOpen =
    Boolean(isAddUserModalOpen) ||
    Boolean(isAddModalOpen) ||
    Boolean(isReleaseModalOpen) ||
    Boolean(isReviewModalOpen) ||
    Boolean(isEventModalOpen) ||
    Boolean(isAddOrgModalOpen) ||
    Boolean(isAddDeptModalOpen) ||
    Boolean(isDonationModalOpen) ||
    Boolean(editingOrg) ||
    Boolean(editingEvent) ||
    Boolean(itemEditing) ||
    Boolean(editingUser) ||
    Boolean(confirmDialog) ||
    Boolean(selectedReport) ||
    Boolean(completedActivitiesModal?.isOpen)

  // Body scroll lock effect whenever any modal/popup is open
  useEffect(() => {
    const mainEl = mainRef.current

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      if (mainEl) mainEl.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
        if (mainEl) mainEl.style.overflow = ''
      }
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      if (mainEl) mainEl.style.overflow = ''
    }
  }, [isAnyModalOpen])

  useEffect(() => {
    if ((itemCategory || '').toLowerCase().trim() === 'school supplies') {
      setItemExpiry('')
    }
  }, [itemCategory])

  const formatUnit = (qty, unitStr) => {
    if (!unitStr) return ''
    let unit = unitStr.trim()
    if (unit === '') return ''

    const isCapitalized = unit[0] === unit[0].toUpperCase()
    const isAllUpperCase = unit === unit.toUpperCase()
    let base = unit.toLowerCase()

    const getSingular = (str) => {
      if (str.endsWith('ies')) {
        return str.slice(0, -3) + 'y'
      }
      if (str.endsWith('es')) {
        if (str.endsWith('pieces')) return str.slice(0, -1)
        if (str.endsWith('ces')) return str.slice(0, -1)
        if (
          str.endsWith('xes') ||
          str.endsWith('shes') ||
          str.endsWith('ches') ||
          str.endsWith('sses')
        ) {
          return str.slice(0, -2)
        }
        return str.slice(0, -1)
      }
      if (str.endsWith('s') && !str.endsWith('ss')) {
        return str.slice(0, -1)
      }
      return str
    }

    const getPlural = (str) => {
      if (
        str.endsWith('ies') ||
        (str.endsWith('es') && !str.endsWith('piece')) ||
        (str.endsWith('s') && !str.endsWith('ss'))
      ) {
        str = getSingular(str)
      }
      if (str.endsWith('y') && !['ay', 'ey', 'oy', 'uy'].includes(str.slice(-2))) {
        return str.slice(0, -1) + 'ies'
      }
      if (str.endsWith('x') || str.endsWith('sh') || str.endsWith('ch') || str.endsWith('s')) {
        return str + 'es'
      }
      return str + 's'
    }

    let result = qty === 1 ? getSingular(base) : getPlural(base)

    if (isAllUpperCase) {
      return result.toUpperCase()
    }
    if (isCapitalized) {
      return result.charAt(0).toUpperCase() + result.slice(1)
    }
    return result
  }

  const handleQtyChange = (val) => {
    if (/^\d*$/.test(val)) {
      setItemQty(val)
    }
  }

  const handleReleaseQtyChange = (val) => {
    if (/^\d*$/.test(val)) {
      setReleaseQty(val)
    }
  }

  const handlePiecesPerUnitChange = (val) => {
    if (/^\d*$/.test(val)) {
      setItemPiecesPerUnit(val)
    }
  }

  const displayStock = (qty, unitStr, groupUnit, piecesPerUnit) => {
    if (!qty) return `0 ${formatUnit(0, unitStr)}`

    const pPerUnit = piecesPerUnit ? parseInt(piecesPerUnit, 10) : 0
    if (!groupUnit || groupUnit === 'none' || pPerUnit <= 0) {
      return `${qty} ${formatUnit(qty, unitStr)}`
    }

    const groups = Math.floor(qty / pPerUnit)
    if (groups > 0) {
      return `${groups} ${formatUnit(groups, groupUnit)}`
    } else {
      return `${qty} ${formatUnit(qty, unitStr)}`
    }
  }

  const getRemainingPiecesText = (totalQty, piecesPerUnit, groupUnit) => {
    const qty = parseInt(totalQty, 10)
    const pPerUnit = parseInt(piecesPerUnit, 10) || 12
    if (isNaN(qty) || isNaN(pPerUnit) || pPerUnit <= 0) return ''
    const grouped = Math.floor(qty / pPerUnit)
    const remaining = qty % pPerUnit
    const unitName = groupUnit === 'box' ? 'Box' : groupUnit === 'bundle' ? 'Bundle' : 'Pack'
    const unitPlural = groupUnit === 'box' ? 'Boxes' : groupUnit === 'bundle' ? 'Bundles' : 'Packs'
    const groupPart = `${grouped} ${grouped === 1 ? unitName : unitPlural}`
    const remainingPart = `${remaining} Remaining Piece${remaining === 1 ? '' : 's'}`
    return `${groupPart} + ${remainingPart}`
  }

  const getReleaseFactor = (item, releaseUnitStr) => {
    if (!item) return 1
    const unitLower = (releaseUnitStr || '').toLowerCase().trim()
    const itemUnitLower = (item.unit || '').toLowerCase().trim()

    if (
      unitLower === 'base' ||
      unitLower === itemUnitLower ||
      unitLower === 'piece' ||
      unitLower === 'pieces'
    ) {
      return 1
    }

    if (item.groupUnit && item.groupUnit.toLowerCase().trim() === unitLower) {
      return item.piecesPerUnit || 12
    }

    if (unitLower === 'pack' || unitLower === 'packs') {
      return item.groupUnit === 'pack' && item.piecesPerUnit ? item.piecesPerUnit : 12
    }
    if (unitLower === 'box' || unitLower === 'boxes') {
      return item.groupUnit === 'box' && item.piecesPerUnit ? item.piecesPerUnit : 12
    }
    if (unitLower === 'bundle' || unitLower === 'bundles') {
      return item.groupUnit === 'bundle' && item.piecesPerUnit ? item.piecesPerUnit : 12
    }

    return 1
  }

  const handleDeleteCategory = (catToDelete) => {
    const catLower = catToDelete.toLowerCase().trim()
    const updated = [...deletedCategories, catLower]
    setDeletedCategories(updated)
    localStorage.setItem('dommunity_deleted_categories', JSON.stringify(updated))
    triggerSuccess(`Category "${catToDelete}" has been permanently deleted from the list.`)

    // Clear selections matching the deleted category
    if (prevAddCategoryRef.current.toLowerCase().trim() === catLower) {
      prevAddCategoryRef.current = ''
    }
    if (prevEditCategoryRef.current.toLowerCase().trim() === catLower) {
      prevEditCategoryRef.current = ''
    }
    if (itemCategory.toLowerCase().trim() === catLower) {
      setItemCategory('')
    }
  }

  const handleDeleteUnit = (unitToDelete) => {
    const unitLower = unitToDelete.toLowerCase().trim()
    const updated = [...deletedUnits, unitLower]
    setDeletedUnits(updated)
    localStorage.setItem('dommunity_deleted_units', JSON.stringify(updated))

    // Clear selections matching the deleted unit
    if (prevAddUnitRef.current.toLowerCase().trim() === unitLower) {
      prevAddUnitRef.current = ''
    }
    if (prevEditUnitRef.current.toLowerCase().trim() === unitLower) {
      prevEditUnitRef.current = ''
    }
    if (itemUnit.toLowerCase().trim() === unitLower) {
      setItemUnit('')
    }
  }

  // Donor form
  const [donorName, setDonorName] = useState('')
  const [donorType, setDonorType] = useState('external_sponsor')
  const [donorSearchQuery, setDonorSearchQuery] = useState('')
  const [isDonorTypeSuggestionsOpen, setIsDonorTypeSuggestionsOpen] = useState(false)
  const [deletedDonorTypes, setDeletedDonorTypes] = useState(() => {
    try {
      const saved = localStorage.getItem('dommunity_deleted_donor_types')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Donation form
  const [donPurpose, setDonPurpose] = useState('')
  const [donDesc, setDonDesc] = useState('')
  const [donDate, setDonDate] = useState('')
  const [donItems, setDonItems] = useState([
    {
      category: '',
      name: '',
      quantity: '',
      unit: '',
      expiryDate: '',
      groupUnit: 'none',
      piecesPerUnit: ''
    }
  ])

  // Organization form
  const [orgId, setOrgId] = useState('')
  const [orgName, setOrgName] = useState('')
  const [orgAbbr, setOrgAbbr] = useState('')
  const [orgDesc, setOrgDesc] = useState('')
  const [orgSearchQuery, setOrgSearchQuery] = useState('')
  const [selectedOrgSubTab, setSelectedOrgSubTab] = useState('department')
  const [deptLogo, setDeptLogo] = useState('')
  const [deptCoordinatorId, setDeptCoordinatorId] = useState('')

  // Organization Activity Tracker States
  const [trackerDeptFilter, setTrackerDeptFilter] = useState('all')
  const [trackerMonthFilter, setTrackerMonthFilter] = useState('all')
  const [trackerSearchQuery, setTrackerSearchQuery] = useState('')

  // Event Scheduler form
  const [evtName, setEvtName] = useState('')
  const [evtDesc, setEvtDesc] = useState('')
  const [evtDate, setEvtDate] = useState('')
  const [evtLoc, setEvtLoc] = useState('')
  const [evtOrgId, setEvtOrgId] = useState('')
  const [evtStatus, setEvtStatus] = useState('planned')
  const [eventSearchQuery, setEventSearchQuery] = useState('')
  const [eventMonthFilter, setEventMonthFilter] = useState('')
  const [evtType, setEvtType] = useState('department')
  const [evtOrgName, setEvtOrgName] = useState('')
  const [evtParentDeptId, setEvtParentDeptId] = useState('')

  // Sync data from DB
  const loadData = async () => {
    try {
      const u = await getUsers()
      const o = await getOrganizations()
      const inv = await getInventory()
      const d = await getDonors()
      const dn = await getDonations()
      const ev = await getEvents()
      const rep = await getReports()
      const reset = await getResetRequests()

      setUsersList(u)
      setOrgsList(o)
      setInventoryList(inv)
      setDonorsList(d)
      setDonationsList(dn)
      setEventsList(ev)
      setReportsList(rep)
      setResetRequests(reset)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    }
  }

  useEffect(() => {
    loadData()
    const unsubUsers = subscribeUsers((u) => setUsersList(u))
    const unsubOrgs = subscribeOrganizations((o) => setOrgsList(o))
    const unsubInv = subscribeInventory((inv) => setInventoryList(inv))
    const unsubDonors = subscribeDonors((d) => setDonorsList(d))
    const unsubDonations = subscribeDonations((dn) => setDonationsList(dn))
    const unsubEvents = subscribeEvents((ev) => setEventsList(ev))
    const unsubReports = subscribeReports((rep) => setReportsList(rep))

    return () => {
      if (typeof unsubUsers === 'function') unsubUsers()
      if (typeof unsubOrgs === 'function') unsubOrgs()
      if (typeof unsubInv === 'function') unsubInv()
      if (typeof unsubDonors === 'function') unsubDonors()
      if (typeof unsubDonations === 'function') unsubDonations()
      if (typeof unsubEvents === 'function') unsubEvents()
      if (typeof unsubReports === 'function') unsubReports()
    }
  }, [])

  const triggerError = (msg) => {
    setActionError(msg)
    setActionSuccess('')
  }

  const triggerValidationError = (title, message, fields = [], guidance = '') => {
    setValidationError({ title, message, fields, guidance })
    setActionError('')
  }

  const clearFieldValError = (fieldName) => {
    if (validationError && validationError.fields.includes(fieldName)) {
      setValidationError((prev) => {
        if (!prev) return null
        const remainingFields = prev.fields.filter((f) => f !== fieldName)
        if (remainingFields.length === 0) {
          return null
        }
        return { ...prev, fields: remainingFields }
      })
    }
  }

  const triggerSuccess = (msg) => {
    setActionSuccess(msg)
    setActionError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => setActionSuccess(''), 5000)
  }

  // --- ACTIONS ---

  // Save User (Create or Update)
  const handleSaveUser = async (e) => {
    e.preventDefault()

    const errors = {}

    // 1. First Name Validation
    if (!coordFirstName.trim()) {
      errors.coordFirstName = 'First name is required.'
    }

    // 2. Last Name Validation
    if (!coordLastName.trim()) {
      errors.coordLastName = 'Last name is required.'
    }

    // 3. Email Validation
    if (!coordEmail.trim()) {
      errors.coordEmail = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coordEmail.trim())) {
      errors.coordEmail = 'Please enter a valid email address.'
    }

    // 4. Role Validation
    if (!coordRole) {
      errors.coordRole = 'Role is required.'
    }

    // 5. Password Validation (for new users)
    if (!editingUser) {
      if (!coordPassword) {
        errors.coordPassword = 'Password is required.'
      } else if (coordPassword.length < 8) {
        errors.coordPassword = 'Password must be at least 8 characters.'
      } else if (!/[A-Za-z]/.test(coordPassword) || !/\d/.test(coordPassword)) {
        errors.coordPassword = 'Password must be alphanumeric (contain both letters and numbers).'
      }
      if (!coordConfirmPassword) {
        errors.coordConfirmPassword = 'Confirm password is required.'
      } else if (coordPassword !== coordConfirmPassword) {
        errors.coordConfirmPassword = 'Passwords do not match.'
      }
    }

    setCoordErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    setLoading(true)
    try {
      const fullName = `${coordFirstName.trim()} ${coordLastName.trim()}`
      const username = coordUsername || coordEmail.split('@')[0] || ''
      const assignedOrg = coordOrgId || null

      if (editingUser) {
        const payload = {
          name: fullName,
          email: coordEmail,
          username: username,
          role: coordRole,
          organizationId: assignedOrg
        }
        await updateUser(editingUser.uid, payload)
        triggerSuccess(`Account successfully updated for ${fullName}.`)
      } else {
        const initialPassword = coordPassword.trim() || 'Dommunity@123'
        await registerUser(coordEmail, username, initialPassword, fullName, coordRole, assignedOrg)
        triggerSuccess(`Account successfully established for ${fullName}.`)
      }

      // Reset form & close modal
      setEditingUser(null)
      setCoordName('')
      setCoordFirstName('')
      setCoordLastName('')
      setCoordEmail('')
      setCoordUsername('')
      setCoordPassword('')
      setCoordConfirmPassword('')
      setCoordOrgId('')
      setDeptSearchVal('')
      setIsDeptSearchOpen(false)
      setCoordRole('office_coordinator')
      setCoordErrors({})
      setIsAddUserModalOpen(false)
      loadData()
    } catch (err) {
      triggerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseUserModal = () => {
    setIsAddUserModalOpen(false)
    setEditingUser(null)
    setCoordName('')
    setCoordFirstName('')
    setCoordLastName('')
    setCoordEmail('')
    setCoordUsername('')
    setCoordPassword('')
    setCoordConfirmPassword('')
    setCoordOrgId('')
    setDeptSearchVal('')
    setIsDeptSearchOpen(false)
    setCoordRole('office_coordinator')
    setCoordErrors({})
  }

  const handleCloseDonationModal = () => {
    setIsDonationModalOpen(false)
    setDonorName('')
    setDonorType('')
    setDonPurpose('')
    setDonDesc('')
    setDonDate('')
    setDonItems([
      {
        category: '',
        name: '',
        quantity: '',
        unit: '',
        expiryDate: '',
        groupUnit: 'none',
        piecesPerUnit: ''
      }
    ])
    setDonErrors({})
  }

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.uid === user.uid) {
      triggerError('Cannot delete your own administrator session.')
      return
    }
    setConfirmDialog({
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete the account of ${targetUser.name}? This action is irreversible.`,
      onConfirm: async () => {
        setLoading(true)
        try {
          await deleteUser(targetUser.uid, targetUser.email, targetUser.password)
          triggerSuccess(`Account of ${targetUser.name} has been permanently deleted.`)
          loadData()
        } catch (err) {
          triggerError(err.message)
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // Toggle user status
  const handleToggleStatus = async (uid, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await updateCoordinatorStatus(uid, nextStatus)
      triggerSuccess(`Account status updated to ${nextStatus}.`)
      loadData()
    } catch (err) {
      triggerError(err.message)
    }
  }

  const handleSendCoordinatorReset = (targetUser) => {
    setConfirmDialog({
      title: 'Send Password Reset Link',
      message: `Are you sure you want to send a password reset email to ${targetUser.name} (${targetUser.email})? They will receive a secure link from Firebase to set their new password.`,
      onConfirm: async () => {
        setLoading(true)
        try {
          await sendCoordinatorResetEmail(targetUser.email)
          triggerSuccess(`Password reset email successfully sent to ${targetUser.name}.`)
        } catch (err) {
          triggerError(err.message || 'Failed to send password reset email.')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // Reset password requests approval
  const handleResetApproval = async (reqId, action) => {
    try {
      await handleResetRequest(reqId, action)
      triggerSuccess(`Password request status updated: ${action}.`)
      loadData()
    } catch (err) {
      triggerError(err.message)
    }
  }

  // Inventory Save (Add/Update)
  const handleSaveInventory = async (e) => {
    e.preventDefault()
    const isSchoolSupplies = (itemCategory || '').toLowerCase().trim() === 'school supplies'

    const unitLower = (itemUnit || '').toLowerCase().trim()
    const isAlreadyGrouped = ['pack', 'packs', 'box', 'boxes', 'bundle', 'bundles'].includes(
      unitLower
    )

    const errors = {}
    if (!itemName.trim()) errors.itemName = 'Item name is required.'
    if (!itemCategory.trim()) errors.itemCategory = 'Category is required.'
    if (!itemUnit.trim()) errors.itemUnit = 'Unit of measurement is required.'
    if (!itemQty) errors.itemQty = 'Quantity is required.'
    if (!isSchoolSupplies && !itemExpiry) errors.itemExpiry = 'Expiration date is required.'
    if (isAlreadyGrouped && !itemPiecesPerUnit)
      errors.itemPiecesPerUnit = 'Pieces per unit is required.'

    if (Object.keys(errors).length > 0) {
      setItemErrors(errors)
      return
    }

    let finalQty = parseInt(itemQty, 10)
    let finalUnit = itemUnit
    let finalGroupUnit = itemGroupUnit
    let finalPiecesPerUnit = itemPiecesPerUnit ? parseInt(itemPiecesPerUnit, 10) : null

    if (isAlreadyGrouped) {
      if (unitLower === 'pack' || unitLower === 'packs') finalGroupUnit = 'pack'
      else if (unitLower === 'box' || unitLower === 'boxes') finalGroupUnit = 'box'
      else if (unitLower === 'bundle' || unitLower === 'bundles') finalGroupUnit = 'bundle'

      finalUnit = 'pieces'
      const factor = finalPiecesPerUnit || 12
      finalQty = finalQty * factor
    }

    const payload = {
      name: itemName,
      category: itemCategory,
      unit: finalUnit,
      quantity: finalQty,
      expiryDate: isSchoolSupplies || !itemExpiry ? null : new Date(itemExpiry).toISOString(),
      piecesPerUnit: finalPiecesPerUnit,
      groupUnit: finalGroupUnit
    }

    setLoading(true)
    try {
      if (itemEditing) {
        await updateInventoryItem(itemEditing.id, { ...payload, hasBeenReleased: false }, user.uid)
        const qtyDiff = payload.quantity - itemEditing.quantity
        if (qtyDiff > 0) {
          await logInventoryTransaction(
            'added',
            payload.name,
            qtyDiff,
            payload.unit,
            'Stock updated manually'
          )
        } else if (qtyDiff < 0) {
          await logInventoryTransaction(
            'released',
            payload.name,
            Math.abs(qtyDiff),
            payload.unit,
            'Stock reduced manually'
          )
        }
        triggerSuccess('Inventory catalog updated successfully')
      } else {
        await addInventoryItem(payload, user.uid)
        await logInventoryTransaction(
          'added',
          payload.name,
          payload.quantity,
          payload.unit,
          'New item cataloged'
        )
        triggerSuccess('Item added successfully')
        setIsAddModalOpen(false) // Close Add Modal on success
      }

      setItemEditing(null)
      setItemName('')
      setItemUnit('')
      setItemQty('')
      setItemExpiry('')
      setItemPiecesPerUnit('')
      setItemGroupUnit('none')
      setItemErrors({})
      loadData()
    } catch (err) {
      triggerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInventory = async (itemId) => {
    setConfirmDialog({
      title: 'Delete Inventory Item',
      message: 'Are you sure you want to delete this item? This action is permanent.',
      onConfirm: async () => {
        try {
          const item = inventoryList.find((i) => i.id === itemId)
          await deleteInventoryItem(itemId)
          if (item) {
            await logInventoryTransaction(
              'deleted',
              item.name,
              item.quantity,
              item.unit,
              'Removed from inventory catalog'
            )
          }
          triggerSuccess('Item deleted successfully')
          loadData()
        } catch (err) {
          triggerError(err.message)
        }
      }
    })
  }

  // Inventory Item Release (Added to Pending List)
  const handleAddPendingReleaseItem = (e) => {
    e.preventDefault()
    if (!releaseItemId) {
      triggerValidationError(
        'Release Item Error',
        'Please select an item to release.',
        ['releaseItemId'],
        'Search and choose a stock item before submitting.'
      )
      return
    }

    const item = inventoryList.find((i) => i.id === releaseItemId)
    if (!item) {
      triggerValidationError(
        'Release Item Error',
        'Selected item not found.',
        ['releaseItemId'],
        'Select a valid active item from the searchable stock dropdown list.'
      )
      return
    }

    const hasGroup = item.groupUnit && item.groupUnit !== 'none' && item.piecesPerUnit
    const factor = item.piecesPerUnit ? parseInt(item.piecesPerUnit, 10) : 12

    let baseQtyToRelease = 0
    let qtyGroupVal = 0
    let qtyPiecesVal = 0

    if (hasGroup) {
      qtyGroupVal = parseInt(releaseQtyGroup, 10) || 0
      qtyPiecesVal = parseInt(releaseQtyPieces, 10) || 0
      baseQtyToRelease = qtyGroupVal * factor + qtyPiecesVal
    } else {
      qtyPiecesVal = parseInt(releaseQtyPieces, 10) || parseInt(releaseQty, 10) || 0
      baseQtyToRelease = qtyPiecesVal
    }

    if (baseQtyToRelease <= 0) {
      triggerValidationError(
        'Release Item Error',
        'Please enter a valid positive quantity to release.',
        hasGroup ? ['releaseQtyGroup', 'releaseQtyPieces'] : ['releaseQty'],
        'The release quantity (grouped units or pieces) must be a positive whole number.'
      )
      return
    }

    const existingPending = pendingReleaseItems.find((p) => p.id === releaseItemId)
    const alreadyPendingBaseQty = existingPending ? parseInt(existingPending.baseQty, 10) || 0 : 0
    const totalProposedBaseRelease = alreadyPendingBaseQty + baseQtyToRelease

    if (totalProposedBaseRelease > item.quantity) {
      triggerValidationError(
        'Release Item Error',
        `Insufficient stock. Only ${item.quantity} Total Pieces available, and ${alreadyPendingBaseQty} is already in the release list.`,
        hasGroup ? ['releaseQtyGroup', 'releaseQtyPieces'] : ['releaseQty'],
        'Reduce the release quantity to fit within available stock.'
      )
      return
    }

    if (existingPending) {
      const newBaseQty = alreadyPendingBaseQty + baseQtyToRelease
      let newQtyGroup = 0
      let newQtyPieces = newBaseQty
      if (hasGroup) {
        newQtyGroup = Math.floor(newBaseQty / factor)
        newQtyPieces = newBaseQty % factor
      }
      setPendingReleaseItems((prev) =>
        prev.map((p) =>
          p.id === releaseItemId
            ? {
                ...p,
                qtyGroup: newQtyGroup,
                qtyPieces: newQtyPieces,
                baseQty: newBaseQty
              }
            : p
        )
      )
    } else {
      setPendingReleaseItems((prev) => [
        ...prev,
        {
          id: item.id,
          name: item.name,
          category: item.category,
          baseUnit: item.unit,
          groupUnit: item.groupUnit,
          piecesPerUnit: item.piecesPerUnit,
          availableStock: item.quantity,
          qtyGroup: qtyGroupVal,
          qtyPieces: qtyPiecesVal,
          baseQty: baseQtyToRelease,
          expiryDate: item.expiryDate
        }
      ])
    }

    setReleaseItemId('')
    setReleaseQty('')
    setReleaseQtyGroup('')
    setReleaseQtyPieces('')
    setReleaseSearch('')
    setReleaseUnitType('base')
  }

  const handleEditPendingQty = (itemId, val) => {
    if (val === '') {
      setPendingReleaseItems((prev) => prev.map((p) => (p.id === itemId ? { ...p, qty: '' } : p)))
      return
    }

    const qty = parseInt(val, 10)
    if (isNaN(qty) || qty < 0) return

    const pendingItem = pendingReleaseItems.find((p) => p.id === itemId)
    if (!pendingItem) return

    const item = inventoryList.find((i) => i.id === itemId)
    const itemFactor = getReleaseFactor(item, pendingItem.releaseUnitType)
    const proposedBaseQty = qty * itemFactor

    if (proposedBaseQty > pendingItem.availableStock) {
      triggerValidationError(
        'Release List Edit Error',
        `Cannot release ${qty} ${formatUnit(qty, pendingItem.releaseUnit)}. Only ${displayStock(pendingItem.availableStock, pendingItem.baseUnit, item.groupUnit, item.piecesPerUnit)} is available in stock.`,
        [],
        'Specify a release quantity that does not exceed the available inventory stock.'
      )
      return
    }

    setPendingReleaseItems((prev) =>
      prev.map((p) => (p.id === itemId ? { ...p, qty, baseQty: proposedBaseQty } : p))
    )
  }

  const handleRemovePendingItem = (itemId) => {
    setPendingReleaseItems((prev) => prev.filter((p) => p.id !== itemId))
  }

  const handleConfirmRelease = async () => {
    const invalidItem = pendingReleaseItems.find((p) => !p.baseQty || parseInt(p.baseQty, 10) <= 0)
    if (invalidItem) {
      triggerValidationError(
        'Release Confirmation Error',
        `Please specify a valid quantity for "${invalidItem.name}".`,
        [],
        'Ensure all items in the release list have a quantity greater than zero before confirming.'
      )
      return
    }

    setLoading(true)
    try {
      for (const pending of pendingReleaseItems) {
        const item = inventoryList.find((i) => i.id === pending.id)
        if (!item) {
          throw new Error(`Item "${pending.name}" not found in inventory.`)
        }
        const baseQtyToRelease = parseInt(pending.baseQty, 10)
        if (baseQtyToRelease > item.quantity) {
          throw new Error(
            `Insufficient stock for "${item.name}". Only ${displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)} available.`
          )
        }
        const updatedQty = item.quantity - baseQtyToRelease
        await updateInventoryItem(
          item.id,
          { quantity: updatedQty, hasBeenReleased: true },
          user.uid
        )
        await logInventoryTransaction(
          'released',
          item.name,
          baseQtyToRelease,
          item.baseUnit,
          'Released for outreach program'
        )
      }

      triggerSuccess('Items released successfully')
      setPendingReleaseItems([])
      setIsReviewModalOpen(false) // Close review list modal
      loadData()
    } catch (err) {
      triggerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenReportPreview = async () => {
    setLoading(true)
    try {
      const history = await getInventoryTransactions()
      setTxHistory(history)
      setReportDate(new Date().toLocaleString())
      setShowReportPreview(true)
    } catch (e) {
      console.error(e)
      triggerError('Failed to load inventory transaction history.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDownloadPDF = async () => {
    const input = document.getElementById('inventory-history-pdf-target')
    if (!input) {
      alert('Inventory transaction history print target not found.')
      return
    }

    try {
      await exportElementToPDF(
        input,
        `CES_Inventory_History_${new Date().toISOString().split('T')[0]}`,
        { isDocument: false }
      )
      setShowReportPreview(false)
    } catch (err) {
      console.error('Inventory PDF Export Error:', err)
      alert('Failed to generate Inventory PDF: ' + (err.message || err))
    }
  }

  const handleDeleteDonor = async (donorId) => {
    const donor = donorsList.find((d) => d.id === donorId)
    if (!donor) return

    setConfirmDialog({
      title: 'Delete Donor Profile',
      message: `Are you sure you want to delete ${donor.name}? This will permanently remove the donor profile.`,
      onConfirm: async () => {
        setLoading(true)
        try {
          await deleteDonor(donorId)
          triggerSuccess(`Donor ${donor.name} successfully deleted.`)
          loadData()
        } catch (err) {
          triggerError(err.message)
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // Donation item change
  const handleDonItemChange = (idx, field, val) => {
    const list = [...donItems]
    if (field === 'quantity' || field === 'piecesPerUnit') {
      if (!/^\d*$/.test(val)) return
    }
    list[idx][field] = val
    if (field === 'category' && val.toLowerCase().trim() === 'school supplies') {
      list[idx].expiryDate = ''
    }
    setDonItems(list)
  }

  // Add donation item line
  const handleAddDonItemLine = () => {
    setDonItems([
      ...donItems,
      {
        category: '',
        name: '',
        quantity: '',
        unit: '',
        expiryDate: '',
        groupUnit: 'none',
        piecesPerUnit: ''
      }
    ])
  }

  // Remove donation item line
  const handleRemoveDonItemLine = (idx) => {
    const list = donItems.filter((_, i) => i !== idx)
    setDonItems(list)
  }

  // Donation Batch Create
  const handleCreateDonation = async (e) => {
    e.preventDefault()

    const errors = {}
    if (!donorName.trim()) errors.donorName = 'Donor name is required.'
    if (!donorType) errors.donorType = 'Donor type is required.'
    if (!donPurpose.trim()) errors.donPurpose = 'Purpose is required.'
    if (!donDate) errors.donDate = 'Donation date is required.'

    // Check donation items
    const itemErrors = []
    let hasItemErrors = false
    donItems.forEach((item, idx) => {
      const itemErr = {}
      const isSchoolSupplies = (item.category || '').toLowerCase().trim() === 'school supplies'
      const unitLower = (item.unit || '').toLowerCase().trim()
      const isAlreadyGrouped = ['pack', 'packs', 'box', 'boxes', 'bundle', 'bundles'].includes(
        unitLower
      )

      if (!item.category) itemErr.category = 'Category is required.'
      if (!item.name || !item.name.trim()) itemErr.name = 'Item name is required.'
      if (!item.quantity) itemErr.quantity = 'Quantity is required.'
      if (!item.unit) itemErr.unit = 'Unit is required.'
      if (!isSchoolSupplies && !item.expiryDate) itemErr.expiryDate = 'Expiration date is required.'
      if (isAlreadyGrouped && !item.piecesPerUnit)
        itemErr.piecesPerUnit = 'Pieces per unit is required.'

      if (Object.keys(itemErr).length > 0) {
        hasItemErrors = true
      }
      itemErrors.push(itemErr)
    })

    if (Object.keys(errors).length > 0 || hasItemErrors) {
      setDonErrors({
        fields: errors,
        items: itemErrors
      })
      return
    }

    setLoading(true)
    try {
      // Find or create donor profile under the hood
      let donor = donorsList.find(
        (d) => d.name.toLowerCase().trim() === donorName.toLowerCase().trim()
      )
      let finalDonorId = ''
      if (donor) {
        finalDonorId = donor.id
        if (donor.type !== donorType) {
          await updateDonor(donor.id, { ...donor, type: donorType })
        }
      } else {
        const newDonor = await addDonor({
          name: donorName.trim(),
          type: donorType,
          createdAt: new Date().toISOString()
        })
        finalDonorId = newDonor.id
      }

      // Process and convert grouped items to base units (pieces)
      const processedItems = donItems.map((i) => {
        const isSchoolSupplies = (i.category || '').toLowerCase().trim() === 'school supplies'
        const unitLower = (i.unit || '').toLowerCase().trim()
        const isAlreadyGrouped = ['pack', 'packs', 'box', 'boxes', 'bundle', 'bundles'].includes(
          unitLower
        )

        let finalQty = parseInt(i.quantity, 10)
        let finalUnit = i.unit
        let finalGroupUnit = i.groupUnit || 'none'
        let finalPiecesPerUnit = i.piecesPerUnit ? parseInt(i.piecesPerUnit, 10) : null

        if (isAlreadyGrouped) {
          if (unitLower === 'pack' || unitLower === 'packs') finalGroupUnit = 'pack'
          else if (unitLower === 'box' || unitLower === 'boxes') finalGroupUnit = 'box'
          else if (unitLower === 'bundle' || unitLower === 'bundles') finalGroupUnit = 'bundle'

          finalUnit = 'pieces'
          const factor = finalPiecesPerUnit || 12
          finalQty = finalQty * factor
        }

        return {
          category: i.category,
          name: i.name,
          unit: finalUnit,
          quantity: finalQty,
          expiryDate:
            isSchoolSupplies || !i.expiryDate ? null : new Date(i.expiryDate).toISOString(),
          piecesPerUnit: finalPiecesPerUnit,
          groupUnit: finalGroupUnit
        }
      })

      const payload = {
        donorId: finalDonorId,
        dateOfDonation: new Date(donDate).toISOString(),
        purpose: donPurpose,
        description: donDesc,
        items: processedItems
      }

      await addDonation(payload, user.uid)

      // Since donorsList might have updated (due to new donor added), load the refreshed donors list or local representation
      const updatedDonors = await getDonors()
      const donorObj = updatedDonors.find((d) => d.id === payload.donorId)
      const donorNameStr = donorObj ? donorObj.name : donorName

      for (const item of payload.items) {
        await logInventoryTransaction(
          'added',
          item.name,
          item.quantity,
          item.unit,
          `Received via donation batch from: ${donorNameStr}`
        )
      }
      triggerSuccess('Donation batch registered and items added to inventory stock.')
      setIsDonationModalOpen(false)

      // Reset
      setDonorName('')
      setDonorType('')
      setDonPurpose('')
      setDonDesc('')
      setDonDate('')
      setDonItems([
        {
          category: '',
          name: '',
          quantity: '',
          unit: '',
          expiryDate: '',
          groupUnit: 'none',
          piecesPerUnit: ''
        }
      ])
      setDonErrors({})
      loadData()
    } catch (err) {
      triggerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Org Create & Update
  const handleCreateOrg = async (e) => {
    e.preventDefault()

    const isEditing = editingOrg !== null
    const determinedType = isEditing
      ? editingOrg.type || 'department'
      : selectedOrgSubTab === 'department'
        ? 'department'
        : 'organization'

    const upperAbbr = orgAbbr.toUpperCase().trim()
    let finalOrgId = orgId

    const errors = {}
    if (!orgName.trim()) errors.orgName = 'Name is required.'
    if (!upperAbbr) errors.orgAbbr = 'Abbreviation is required.'

    // Check unique department name
    if (determinedType === 'department') {
      const duplicateDept = orgsList.find(
        (org) =>
          org.id !== (isEditing ? editingOrg.id : null) &&
          (org.type === 'department' || !org.type) &&
          isFuzzyDuplicate(org.name, orgName)
      )
      if (duplicateDept) {
        errors.orgName = `The department name "${duplicateDept.name}" is already in use.`
      }
    }

    // Check unique abbreviation/slug (if not editing abbreviation)
    if (!isEditing) {
      const slug = upperAbbr
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
      finalOrgId = (determinedType === 'department' ? 'dept-' : 'org-') + slug
      const idExists = orgsList.some((org) => org.id.toLowerCase() === finalOrgId.toLowerCase())
      if (idExists) {
        errors.orgAbbr = `The abbreviation '${upperAbbr}' is already in use.`
      }
    }

    if (Object.keys(errors).length > 0) {
      if (determinedType === 'organization') {
        setOrgErrors(errors)
      } else {
        setDeptErrors(errors)
      }
      return
    }

    setLoading(true)
    try {
      if (isEditing) {
        // If updating
        const updates = {
          name: orgName,
          abbreviation: upperAbbr,
          description: orgDesc,
          type: determinedType
        }
        if (determinedType === 'department') {
          updates.logo = deptLogo || null
          updates.coordinatorId = deptCoordinatorId || null
        }
        await updateOrganization(editingOrg.id, updates)

        // Update user organization links
        if (determinedType === 'department' && deptCoordinatorId) {
          await updateUser(deptCoordinatorId, { organizationId: editingOrg.id })
        }
        triggerSuccess(`Profile updated: ${orgName}.`)
        setEditingOrg(null)
      } else {
        // If registering new
        const newOrg = {
          id: finalOrgId,
          name: orgName,
          abbreviation: upperAbbr,
          description: orgDesc,
          type: determinedType
        }
        if (determinedType === 'department') {
          newOrg.logo = deptLogo || null
          newOrg.coordinatorId = deptCoordinatorId || null
        }
        await addOrganization(newOrg)

        // Update user organization links
        if (determinedType === 'department' && deptCoordinatorId) {
          await updateUser(deptCoordinatorId, { organizationId: finalOrgId })
        }
        triggerSuccess(
          `${determinedType === 'department' ? 'Department' : 'Organization'} Profile registered: ${orgName}.`
        )
      }
      setOrgId('')
      setOrgName('')
      setOrgAbbr('')
      setOrgDesc('')
      setDeptLogo('')
      setDeptCoordinatorId('')
      setOrgErrors({})
      setDeptErrors({})
      setIsAddOrgModalOpen(false)
      setIsAddDeptModalOpen(false)
      loadData()
    } catch (err) {
      triggerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditOrgClick = (org) => {
    setEditingOrg(org)
    setOrgId(org.id)
    setOrgName(org.name)
    setOrgAbbr(org.abbreviation)
    setOrgDesc(org.description || '')
    setDeptLogo(org.logo || '')
    setDeptCoordinatorId(org.coordinatorId || '')
    setOrgErrors({})
    setDeptErrors({})
    if (org.type === 'organization') {
      setIsAddOrgModalOpen(true)
    } else {
      setIsAddDeptModalOpen(true)
    }
  }

  const handleCancelOrgEdit = () => {
    setEditingOrg(null)
    setOrgId('')
    setOrgName('')
    setOrgAbbr('')
    setOrgDesc('')
    setDeptLogo('')
    setDeptCoordinatorId('')
    setOrgErrors({})
    setDeptErrors({})
    setIsAddOrgModalOpen(false)
    setIsAddDeptModalOpen(false)
  }

  const handleOpenCompletedModal = (deptObj = null) => {
    setCompletedActivitiesModal({
      isOpen: true,
      selectedDeptId: deptObj ? deptObj.id : null,
      selectedDeptName: deptObj ? deptObj.name : null,
      selectedDeptAbbr: deptObj ? deptObj.abbreviation : null
    })
  }

  const handleDeleteOrg = async (orgId) => {
    const org = orgsList.find((o) => o.id === orgId)
    if (!org) return

    setConfirmDialog({
      title: `Delete ${org.type === 'organization' ? 'Organization' : 'Department'} Profile`,
      message: `Are you sure you want to delete ${org.name}? This will permanently remove the profile.`,
      onConfirm: async () => {
        setLoading(true)
        try {
          await deleteOrganization(orgId)
          triggerSuccess(
            `${org.type === 'organization' ? 'Organization' : 'Department'} ${org.name} successfully deleted.`
          )
          if (editingOrg?.id === orgId) {
            handleCancelOrgEdit()
          }
          if (selectedOrgSubTab === orgId) {
            setSelectedOrgSubTab(org.type === 'organization' ? 'organization' : 'department')
          }
          loadData()
        } catch (err) {
          triggerError(err.message)
        } finally {
          setLoading(false)
          setConfirmDialog(null)
        }
      }
    })
  }

  // Event schedule helper to set edit mode
  const handleEditClick = (evt) => {
    setEditingEvent(evt)
    setEvtName(evt.name || '')
    setEvtDesc(evt.description || '')
    if (evt.scheduleDate) {
      try {
        const localDate = new Date(evt.scheduleDate)
        const offset = localDate.getTimezoneOffset()
        const adjustedDate = new Date(localDate.getTime() - offset * 60 * 1000)
        setEvtDate(adjustedDate.toISOString().slice(0, 16))
      } catch (err) {
        setEvtDate('')
      }
    } else {
      setEvtDate('')
    }
    setEvtLoc(evt.location || '')
    setEvtOrgId(evt.assignedOrganizationId || '')
    setEvtStatus(evt.status || 'planned')
    setEvtType(evt.eventType || 'department')
    setEvtOrgName(evt.organizationName || '')
    setEvtParentDeptId(evt.parentDepartmentId || '')
    setIsEventModalOpen(true)
    clearFieldValError('evtName')
    clearFieldValError('evtDate')
    clearFieldValError('evtOrgId')
    clearFieldValError('evtOrgName')
    clearFieldValError('evtParentDeptId')
  }

  const handleDeleteEventClick = (evt) => {
    setConfirmDialog({
      title: 'Delete Event Profile',
      message: `Are you sure you want to permanently delete event "${evt.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        setLoading(true)
        try {
          await deleteEvent(evt.id)
          triggerSuccess(`Event "${evt.name}" successfully deleted.`)
          loadData()
        } catch (err) {
          triggerError(err.message || 'Failed to delete event.')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // Event schedule / update handler
  const handleCreateEvent = async (e) => {
    e.preventDefault()
    const isOrg = evtType === 'organization'

    const errors = {}
    if (!evtName.trim()) errors.evtName = 'Activity name is required.'
    if (!evtDate) errors.evtDate = 'Schedule date is required.'
    if (!evtLoc.trim()) errors.evtLoc = 'Target location is required.'
    if (isOrg) {
      if (!evtOrgName.trim()) errors.evtOrgName = 'Organization/Club Name is required.'
      if (!evtParentDeptId) errors.evtParentDeptId = 'Parent Department is required.'
    } else {
      if (!evtOrgId) errors.evtOrgId = 'Assigned Department is required.'
    }

    if (Object.keys(errors).length > 0) {
      setEvtErrors(errors)
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: evtName,
        description: evtDesc,
        scheduleDate: new Date(evtDate).toISOString(),
        location: evtLoc,
        assignedOrganizationId: isOrg ? evtParentDeptId : evtOrgId,
        eventType: evtType,
        organizationName: isOrg ? evtOrgName : null,
        parentDepartmentId: isOrg ? evtParentDeptId : null
      }

      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          ...payload,
          status: evtStatus
        })
        triggerSuccess(`Event updated: ${evtName}.`)
        setEditingEvent(null)
      } else {
        await addEvent({
          ...payload,
          status: 'planned'
        })
        triggerSuccess(`Event scheduled: ${evtName}.`)
      }
      setEvtName('')
      setEvtDesc('')
      setEvtDate('')
      setEvtLoc('')
      setEvtOrgId('')
      setEvtStatus('planned')
      setEvtType('department')
      setEvtOrgName('')
      setEvtParentDeptId('')
      setEvtErrors({})
      setIsEventModalOpen(false)
      loadData()
    } catch (err) {
      triggerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Report decision: Approve or Return
  const handleReviewReport = async (status) => {
    if (!selectedReport) return
    if (status === 'returned' && !feedbackNote.trim()) {
      alert('Feedback notes are mandatory to return reports.')
      return
    }

    setLoading(true)
    try {
      await updateReport(
        selectedReport.id,
        {
          status,
          adminFeedback: status === 'returned' ? feedbackNote : null
        },
        user.uid
      )

      triggerSuccess(`Report successfully marked as ${status}.`)
      setSelectedReport(null)
      setFeedbackNote('')
      loadData()
    } catch (err) {
      triggerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Format and export Inventory Report as PDF
  const exportInventoryPDF = async () => {
    const input = document.getElementById('inventory-table-container')
    if (!input) return

    try {
      await exportElementToPDF(
        input,
        `CES_Inventory_Summary_${new Date().toISOString().split('T')[0]}`,
        { isDocument: false }
      )
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('PDF export failed: ' + (err.message || 'Error exporting inventory'))
    }
  }

  // Compile Approved Report to PDF (standard format)
  const compileReportPDF = (report) => {
    setExportingReport(report)
  }

  return (
    <div className="h-screen max-h-screen flex flex-col font-poppins selection:bg-sig-green/20 selection:text-navy-blue overflow-hidden bg-[#F1EFEC]">
      {/* Top Glass Header Bar */}
      <header className="mx-4 mt-4 glass-header rounded-2xl flex items-center justify-between px-6 py-2.5 shrink-0 shadow-glass-sm">
        {/* Left: Logo and Title */}
        <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm p-2 pr-4 rounded-xl border border-white/60">
          <div className="h-11 w-11 rounded-lg bg-white/90 flex items-center justify-center border border-white/80 overflow-hidden shrink-0 shadow-2xs">
            <img src={logo} alt="CES Logo" className="h-9 w-9 object-contain" />
          </div>
          <div className="flex flex-col text-left leading-none">
            <span className="text-[12px] font-bold text-navy-blue tracking-wide uppercase leading-tight">
              Community Extension & Services
            </span>
            <span className="text-[10px] font-semibold text-sig-green tracking-wide uppercase mt-0.5 leading-tight">
              Dominican College of Tarlac
            </span>
          </div>
        </div>

        {/* Right: Info, Home, Profile info */}
        <div className="flex items-center space-x-6">
          <button
            type="button"
            disabled={isAnyModalOpen}
            onClick={() => setActiveTab('about')}
            className={`text-navy-blue transition p-1 ${isAnyModalOpen ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-85 cursor-pointer'}`}
            title="About DommUnity"
          >
            <Info className="w-5 h-5" />
          </button>
          <button
            type="button"
            disabled={isAnyModalOpen}
            onClick={() => setActiveTab('dashboard')}
            className={`text-navy-blue transition p-1 ${isAnyModalOpen ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-85 cursor-pointer'}`}
            title="Dashboard"
          >
            <Home className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm p-2 pr-4 pl-3 rounded-xl border border-white/60">
            <div className="w-9 h-9 rounded-lg border border-navy-blue/15 flex items-center justify-center text-navy-blue bg-white shadow-2xs">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div className="text-left leading-none">
              <div className="text-xs font-bold text-navy-blue">
                {user.username || user.name || 'admin123'}
              </div>
              <div className="text-[9px] text-gray-400 font-medium mt-0.5">{user.email}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <AnimatedSidebar
          tabs={[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'inventory', label: 'Inventory', icon: Package },
            {
              id: 'events',
              label: 'Events',
              icon: Calendar,
              badge: eventsList.filter((e) => e.status === 'planned').length
            },
            { id: 'organization', label: 'Organization', icon: FolderOpen },
            { id: 'donations', label: 'Donor', icon: Gift },
            {
              id: 'reports',
              label: 'Reports Review',
              icon: FileText,
              badge: reportsList.filter((r) => r.status === 'submitted').length
            },
            { id: 'accounts', label: 'User Accounts', icon: Users },
            { id: 'about', label: 'About', icon: Info }
          ]}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={isAnyModalOpen}
          onLogout={onLogout}
          user={user}
        />

        {/* Main Panel Content Area */}
        <main
          ref={mainRef}
          className="flex-1 my-4 mx-4 p-5 overflow-y-auto glass-panel rounded-2xl shadow-glass-md"
        >
          <AnimatedPage pageKey={activeTab}>
            <div className="flex flex-col xl:flex-row gap-5 max-w-[1600px] mx-auto items-start w-full">
              {/* Left / Center Content Column */}
              <div className="flex-1 w-full space-y-5">
                {/* Banner Alert Prompts */}

                {/* ==================================================== */}
                {/* DASHBOARD TAB PANEL */}
                {/* ==================================================== */}
                {activeTab === 'dashboard' && user.role === 'admin' && (
                  <div className="space-y-4">
                    {/* Header row */}
                    <div>
                      <h1 className="text-lg font-extrabold text-navy-blue tracking-tight">
                        Dashboard
                      </h1>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                        Overview of CES activities
                      </p>
                    </div>

                    {/* Quick Stats Grid */}
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                    >
                      <motion.div
                        variants={staggerItem}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
                      >
                        <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl shrink-0">
                          <Users className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider block leading-none mb-1">
                            Coordinators
                          </span>
                          <span className="text-xl font-black text-navy-blue leading-none">
                            {
                              usersList.filter(
                                (u) => u.role === 'office_coordinator' && u.status === 'active'
                              ).length
                            }
                          </span>
                        </div>
                      </motion.div>

                      <motion.div
                        variants={staggerItem}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
                      >
                        <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl shrink-0">
                          <Package className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider block leading-none mb-1">
                            Stock Items
                          </span>
                          <span className="text-xl font-black text-navy-blue leading-none">
                            {inventoryList.reduce((sum, item) => sum + item.quantity, 0)}
                          </span>
                        </div>
                      </motion.div>

                      <motion.div
                        variants={staggerItem}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
                      >
                        <div className="p-2.5 bg-navy-blue/5 text-navy-blue rounded-xl shrink-0">
                          <FolderOpen className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider block leading-none mb-1">
                            Departments
                          </span>
                          <span className="text-xl font-black text-navy-blue leading-none">
                            {orgsList.filter((o) => o.type === 'department' || !o.type).length}
                          </span>
                        </div>
                      </motion.div>

                      <motion.div
                        variants={staggerItem}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
                      >
                        <div className="p-2.5 bg-sig-green/10 text-sig-green rounded-xl shrink-0">
                          <Calendar className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider block leading-none mb-1">
                            Scheduled
                          </span>
                          <span className="text-xl font-black text-navy-blue leading-none">
                            {
                              eventsList.filter((e) => {
                                const o = orgsList.find(
                                  (org) => org.id === e.assignedOrganizationId
                                )
                                const isMatch = !o || o.type === 'department' || !o.type
                                return isMatch && e.status !== 'completed'
                              }).length
                            }
                          </span>
                        </div>
                      </motion.div>

                      <motion.div
                        variants={staggerItem}
                        onClick={() => handleOpenCompletedModal(null)}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-sig-green/30 transition-all duration-200"
                      >
                        <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl shrink-0">
                          <Check className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider block leading-none mb-1">
                            Completed
                          </span>
                          <span className="text-xl font-black text-navy-blue leading-none">
                            {
                              eventsList.filter((e) => {
                                const o = orgsList.find(
                                  (org) => org.id === e.assignedOrganizationId
                                )
                                const isMatch = !o || o.type === 'department' || !o.type
                                return isMatch && e.status === 'completed'
                              }).length
                            }
                          </span>
                        </div>
                      </motion.div>
                    </motion.div>

                    {/* Pending Submitted Reports */}
                    <div className="glass-card rounded-2xl p-4 space-y-3 w-full">
                      <div className="flex items-center justify-between border-b border-gray-200/50 pb-2.5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-navy-blue" />
                          <h3 className="font-bold text-navy-blue text-[12.5px]">
                            Pending Submitted Reports
                          </h3>
                          {reportsList.filter((r) => r.status === 'submitted').length > 0 && (
                            <span className="bg-amber-500 text-white rounded-full px-1.5 py-px text-[9px] font-bold leading-none">
                              {reportsList.filter((r) => r.status === 'submitted').length}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setActiveTab('reports')}
                          className="text-[10px] text-sig-green-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <span>Review All Reports</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      {reportsList.filter((r) => r.status === 'submitted').length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {reportsList
                            .filter((r) => r.status === 'submitted')
                            .slice(0, 4)
                            .map((rep) => {
                              const ev = eventsList.find((e) => e.id === rep.eventId)
                              const org = orgsList.find((o) => o.id === rep.organizationId)
                              const author = usersList.find((u) => u.uid === rep.authorId)
                              return (
                                <div
                                  key={rep.id}
                                  className="p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-white/80 shadow-xs flex items-center justify-between gap-3 hover:shadow-sm transition-all"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span className="text-[9px] font-extrabold text-navy-blue uppercase bg-navy-blue/8 px-1.5 py-0.5 rounded">
                                        {org ? org.abbreviation : 'CES'}
                                      </span>
                                      <span className="text-[9px] text-gray-400">
                                        {new Date(rep.updatedAt || Date.now()).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <h4 className="font-bold text-navy-blue text-[11.5px] truncate">
                                      {ev ? ev.name : rep.activityTitle || 'Submitted Report'}
                                    </h4>
                                    <p className="text-[10px] text-gray-400 mt-px">
                                      Submitted by {author ? author.name : 'Coordinator'}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedReport(rep)
                                      setFeedbackNote('')
                                    }}
                                    className="bg-navy-blue hover:bg-navy-blue-600 text-white font-semibold py-1.5 px-2.5 rounded-lg text-[10px] flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Inspect Report</span>
                                  </button>
                                </div>
                              )
                            })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-400 text-xs font-medium">
                          No pending submitted reports requiring review.
                        </div>
                      )}
                    </div>

                    {/* Upcoming Outreaches Widget */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-navy-blue" />
                          <h3 className="font-bold text-navy-blue text-[12.5px]">
                            Upcoming Outreaches
                          </h3>
                        </div>
                        <button
                          onClick={() => setActiveTab('events')}
                          className="text-[10px] text-sig-green font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <span>View All</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {eventsList
                          .filter((e) => e.status === 'planned')
                          .slice(0, 4)
                          .map((evt) => {
                            const org = orgsList.find((o) => o.id === evt.assignedOrganizationId)
                            return (
                              <div
                                key={evt.id}
                                className="p-2.5 bg-gray-50/80 hover:bg-gray-50 border border-gray-100/80 rounded-xl text-[11px] flex items-center justify-between gap-2 transition-colors"
                              >
                                <div className="min-w-0">
                                  <span className="font-bold text-navy-blue truncate block">
                                    {evt.name}
                                  </span>
                                  <span className="flex items-center gap-1 text-[9.5px] text-gray-400 mt-0.5">
                                    <Clock className="w-2.5 h-2.5 text-gray-300 shrink-0" />
                                    {new Date(evt.scheduleDate).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                    {evt.location && (
                                      <span className="truncate max-w-[80px]">
                                        {' '}
                                        · {evt.location}
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <span className="bg-navy-blue text-sig-green text-[7.5px] font-extrabold px-1.5 py-0.5 rounded leading-none shrink-0">
                                  {org ? org.abbreviation : 'CES'}
                                </span>
                              </div>
                            )
                          })}
                        {eventsList.filter((e) => e.status === 'planned').length === 0 && (
                          <div className="text-center py-5 text-gray-400 text-[10.5px] col-span-full">
                            No upcoming events scheduled.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================================================== */}
                {/* INVENTORY TAB PANEL */}
                {/* ==================================================== */}
                {activeTab === 'inventory' && user.role === 'admin' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Header section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
                      <div>
                        <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                          Inventory Management
                        </h1>
                      </div>
                      <div className="flex flex-col gap-2.5 mt-4 md:mt-0 items-start md:items-end">
                        {/* Row 1 */}
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center space-x-1.5 bg-navy-blue text-white border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green font-semibold py-2 px-4 rounded-full text-xs cursor-pointer transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Catalog Item</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsReleaseModalOpen(true)}
                            className="flex items-center space-x-1.5 bg-navy-blue text-white border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green font-semibold py-2 px-4 rounded-full text-xs cursor-pointer transition"
                          >
                            <Share className="w-3.5 h-3.5 transform rotate-180" />
                            <span>Release Item</span>
                          </button>
                        </div>
                        {/* Row 2 */}
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={() => setIsReviewModalOpen(true)}
                            className="flex items-center space-x-1.5 bg-navy-blue text-white border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green font-bold py-2 px-4 rounded-full text-xs cursor-pointer transition shadow-sm"
                          >
                            <ListFilter className="w-3.5 h-3.5" />
                            <span>Release Review List ({pendingReleaseItems.length})</span>
                          </button>
                          <button
                            onClick={handleOpenReportPreview}
                            className="flex items-center space-x-2 bg-navy-blue text-white border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green font-semibold py-2 px-4 rounded-full text-xs cursor-pointer transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Report PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Recommended Release Items Section */}
                    {(() => {
                      const recommendedItems = inventoryList.filter(
                        (item) =>
                          item.isRecommendedForRelease && item.expiryDate && item.quantity > 0
                      )
                      if (recommendedItems.length === 0) return null

                      // Sort by nearest expiration date
                      const sortedItems = [...recommendedItems].sort(
                        (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
                      )
                      const displayedItems = showAllRecommended
                        ? sortedItems
                        : sortedItems.slice(0, 3)

                      return (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 w-full animate-fade-in">
                          <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3">
                            Recommended Release Items
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayedItems.map((item) => (
                              <div
                                key={item.id}
                                className="border border-sig-green/20 bg-sig-green/5 rounded-2xl p-4 flex flex-col justify-between hover:border-sig-green/45 transition"
                              >
                                <div>
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-navy-blue text-xs">
                                      {item.name}
                                    </h4>
                                    <span className="text-[10px] bg-white border border-sig-green/35 text-navy-blue font-bold px-2 py-0.5 rounded-full capitalize">
                                      {item.category}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-500 mt-2 space-y-0.5">
                                    <div>
                                      Stock Level:{' '}
                                      <span className="font-bold text-navy-blue">
                                        {displayStock(
                                          item.quantity,
                                          item.unit,
                                          item.groupUnit,
                                          item.piecesPerUnit
                                        )}
                                      </span>
                                    </div>
                                    <div className="text-red-500 font-semibold flex items-center">
                                      <Clock className="w-3.5 h-3.5 mr-1" />
                                      Exp: {new Date(item.expiryDate).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReleaseItemId(item.id)
                                      const optionText = `${item.name} (${item.category}) - ${displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)} left ${item.expiryDate ? `(Exp: ${new Date(item.expiryDate).toLocaleDateString()})` : ''}`
                                      setReleaseSearch(optionText)
                                      setReleaseUnitType('base')
                                      setIsReleaseModalOpen(true)
                                    }}
                                    className="px-3 py-1 bg-navy-blue text-white rounded-full text-[10px] font-semibold border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition flex items-center space-x-1 cursor-pointer"
                                  >
                                    <span>Quick Release</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          {sortedItems.length > 3 && (
                            <div className="flex justify-center pt-2">
                              <button
                                type="button"
                                onClick={() => setShowAllRecommended(!showAllRecommended)}
                                className="px-4 py-1.5 border border-navy-blue/15 text-navy-blue hover:bg-navy-blue/5 rounded-full text-xs font-semibold transition cursor-pointer"
                              >
                                {showAllRecommended ? 'See Less' : 'See More'}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Full-width Stock Table Card */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between w-full">
                      <div id="inventory-table-container">
                        <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 mb-4">
                          Current Inventory Stock
                        </h3>

                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                                <th className="py-3 px-3">Item Details</th>
                                <th className="py-3 px-2">
                                  <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue cursor-pointer capitalize"
                                    style={{ height: '36px', minWidth: '130px' }}
                                  >
                                    <option value="all">Category (All)</option>
                                    {allCategories.map((cat) => (
                                      <option key={cat} value={cat}>
                                        {cat}
                                      </option>
                                    ))}
                                  </select>
                                </th>
                                <th className="py-3 px-2">
                                  <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue cursor-pointer capitalize"
                                    style={{ height: '36px', minWidth: '135px' }}
                                  >
                                    <option value="all">Stock Level (All)</option>
                                    <option value="available">Available</option>
                                    <option value="low stock">Low Stock</option>
                                    <option value="expired">Expired</option>
                                  </select>
                                </th>
                                <th className="py-3 px-2">Status</th>
                                <th className="py-3 px-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs">
                              {inventoryList
                                .filter(
                                  (item) =>
                                    categoryFilter === 'all' || item.category === categoryFilter
                                )
                                .filter(
                                  (item) => statusFilter === 'all' || item.status === statusFilter
                                )
                                .map((item) => (
                                  <tr
                                    key={item.id}
                                    className={`hover:bg-gray-50/50 transition ${item.isRecommendedForRelease && item.expiryDate ? 'bg-sig-green/5 font-medium' : ''}`}
                                  >
                                    <td className="py-3 px-3">
                                      <div className="font-bold text-navy-blue flex items-center space-x-1.5">
                                        <span>{item.name}</span>
                                        {item.isRecommendedForRelease && item.expiryDate && (
                                          <span className="bg-sig-green text-navy-blue text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-sig-green/35 flex items-center space-x-0.5">
                                            <span>Recommended Release</span>
                                          </span>
                                        )}
                                      </div>
                                      {item.expiryDate && (
                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                          <span className="text-red-500 flex items-center">
                                            <Clock className="w-3 h-3 shrink-0 mr-1" />
                                            Exp: {new Date(item.expiryDate).toLocaleDateString()}
                                          </span>
                                        </div>
                                      )}
                                      {item.description && (
                                        <p className="text-gray-400 mt-1 max-w-xs truncate">
                                          {item.description}
                                        </p>
                                      )}
                                    </td>
                                    <td className="py-3 px-2 capitalize text-gray-500">
                                      {item.category}
                                    </td>
                                    <td className="py-3 px-2 font-bold text-navy-blue">
                                      <span>
                                        {displayStock(
                                          item.quantity,
                                          item.unit,
                                          item.groupUnit,
                                          item.piecesPerUnit
                                        )}
                                      </span>
                                      {item.groupUnit &&
                                        item.groupUnit !== 'none' &&
                                        item.piecesPerUnit && (
                                          <div className="text-[9px] text-gray-400 font-normal mt-0.5">
                                            {formatUnit(item.quantity, item.unit)} |{' '}
                                            {item.piecesPerUnit}{' '}
                                            {formatUnit(item.piecesPerUnit, item.unit)} per{' '}
                                            {formatUnit(1, item.groupUnit)}
                                          </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-2">
                                      <span
                                        className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                          item.status === 'available'
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : item.status === 'low stock'
                                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                              : item.status === 'expired'
                                                ? 'bg-red-50 text-red-700 border border-red-200'
                                                : 'bg-red-50 text-red-700 border border-red-200'
                                        }`}
                                      >
                                        {item.status}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      <div className="flex justify-end space-x-2">
                                        <button
                                          onClick={() => {
                                            setItemEditing(item)
                                            setItemName(item.name)
                                            setItemCategory(item.category)
                                            setItemUnit(item.unit)
                                            setItemQty(item.quantity.toString())
                                            setItemExpiry(item.expiryDate || '')
                                            setItemPiecesPerUnit(
                                              item.piecesPerUnit
                                                ? item.piecesPerUnit.toString()
                                                : ''
                                            )
                                            setItemGroupUnit(item.groupUnit || 'none')
                                          }}
                                          className="p-1 text-gray-400 hover:text-navy-blue transition cursor-pointer"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteInventory(item.id)}
                                          className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              {inventoryList.length === 0 && (
                                <tr>
                                  <td colSpan="5" className="text-center py-6 text-gray-400">
                                    No inventory entries available.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Modal Overlay for Add Catalog Item */}
                    {isAddModalOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal-overlay animate-fade-in">
                        <div className="glass-modal rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-navy-blue text-sm">Add Catalog Item</h3>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddModalOpen(false)
                                setItemName('')
                                setItemUnit('')
                                setItemQty('')
                                setItemExpiry('')
                                setItemPiecesPerUnit('')
                                setItemGroupUnit('none')
                                setItemErrors({})
                              }}
                              className="text-gray-400 hover:text-navy-blue transition cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <form onSubmit={handleSaveInventory} className="space-y-4">
                            {/* Item Name Suggestions */}
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Item Name
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={itemName}
                                  onChange={(e) => {
                                    setItemName(e.target.value)
                                    setItemErrors((prev) => {
                                      const copy = { ...prev }
                                      delete copy.itemName
                                      return copy
                                    })
                                    setShowItemNameSuggestions(true)
                                  }}
                                  onFocus={() => setShowItemNameSuggestions(true)}
                                  onBlur={() =>
                                    setTimeout(() => setShowItemNameSuggestions(false), 200)
                                  }
                                  placeholder="e.g. Corned Beef, Notebooks"
                                  className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${itemErrors.itemName ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                  style={{ height: '40px' }}
                                />
                                {itemErrors.itemName && (
                                  <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                    {itemErrors.itemName}
                                  </p>
                                )}
                                {showItemNameSuggestions && itemName && (
                                  <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                    {(() => {
                                      const matching = inventoryList.filter((item) =>
                                        item.name.toLowerCase().includes(itemName.toLowerCase())
                                      )
                                      const uniqueNames = [
                                        ...new Set(matching.map((item) => item.name))
                                      ]
                                      if (uniqueNames.length === 0) return null
                                      return (
                                        <div className="py-1">
                                          {uniqueNames.map((name) => {
                                            const originalItem = matching.find(
                                              (item) => item.name === name
                                            )
                                            return (
                                              <div
                                                key={name}
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                  setItemName(name)
                                                  if (originalItem) {
                                                    setItemCategory(originalItem.category)
                                                    setItemUnit(originalItem.unit)
                                                    if (originalItem.piecesPerUnit) {
                                                      setItemPiecesPerUnit(
                                                        originalItem.piecesPerUnit.toString()
                                                      )
                                                    }
                                                    if (originalItem.groupUnit) {
                                                      setItemGroupUnit(originalItem.groupUnit)
                                                    }
                                                  }
                                                  setShowItemNameSuggestions(false)
                                                }}
                                                className="p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left animate-fade-in"
                                              >
                                                {name}{' '}
                                                {originalItem?.category && (
                                                  <span className="text-[10px] text-gray-400 font-normal">
                                                    ({originalItem.category})
                                                  </span>
                                                )}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Category Searchable Dropdown */}
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Category
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={itemCategory}
                                  onFocus={() => {
                                    prevAddCategoryRef.current = itemCategory
                                    setItemCategory('')
                                    setShowAddCategoryDropdown(true)
                                  }}
                                  onBlur={() =>
                                    setTimeout(() => {
                                      setShowAddCategoryDropdown(false)
                                      setItemCategory((current) =>
                                        current ? current : prevAddCategoryRef.current
                                      )
                                    }, 200)
                                  }
                                  onChange={(e) => {
                                    setItemCategory(e.target.value)
                                    setItemErrors((prev) => {
                                      const copy = { ...prev }
                                      delete copy.itemCategory
                                      return copy
                                    })
                                  }}
                                  placeholder="Select or type category"
                                  className={`w-full pl-2.5 pr-16 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${itemErrors.itemCategory ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                  style={{ height: '40px' }}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                  <div className="pointer-events-none text-gray-400">
                                    <ChevronRight className="w-4 h-4 transform rotate-90" />
                                  </div>
                                </div>
                                {showAddCategoryDropdown &&
                                  activeCategories.filter(
                                    (cat) =>
                                      !itemCategory ||
                                      cat.toLowerCase().includes(itemCategory.toLowerCase())
                                  ).length > 0 && (
                                    <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                      {activeCategories
                                        .filter(
                                          (cat) =>
                                            !itemCategory ||
                                            cat.toLowerCase().includes(itemCategory.toLowerCase())
                                        )
                                        .map((cat) => (
                                          <div
                                            key={cat}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                              setItemCategory(cat)
                                              prevAddCategoryRef.current = cat
                                              setShowAddCategoryDropdown(false)
                                              setItemErrors((prev) => {
                                                const copy = { ...prev }
                                                delete copy.itemCategory
                                                return copy
                                              })
                                            }}
                                            className="group flex items-center justify-between p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold capitalize text-left"
                                          >
                                            <span className="truncate">{cat}</span>
                                            <button
                                              type="button"
                                              onMouseDown={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteCategory(cat)
                                              }}
                                              className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5 rounded hover:bg-gray-100"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                              </div>
                              {itemErrors.itemCategory && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                  {itemErrors.itemCategory}
                                </p>
                              )}
                            </div>

                            {/* Unit Searchable Dropdown */}
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Unit
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={itemUnit}
                                  onFocus={() => {
                                    prevAddUnitRef.current = itemUnit
                                    setItemUnit('')
                                    setShowAddUnitDropdown(true)
                                  }}
                                  onBlur={() =>
                                    setTimeout(() => {
                                      setShowAddUnitDropdown(false)
                                      setItemUnit((current) =>
                                        current ? current : prevAddUnitRef.current
                                      )
                                    }, 200)
                                  }
                                  onChange={(e) => {
                                    setItemUnit(e.target.value)
                                    setItemErrors((prev) => {
                                      const copy = { ...prev }
                                      delete copy.itemUnit
                                      return copy
                                    })
                                  }}
                                  placeholder="Select or type unit"
                                  className={`w-full pl-2.5 pr-16 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${itemErrors.itemUnit ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                  style={{ height: '40px' }}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                  {itemUnit && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setItemUnit('')
                                        prevAddUnitRef.current = ''
                                      }}
                                      className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                      tabIndex={-1}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <div className="pointer-events-none text-gray-400">
                                    <ChevronRight className="w-4 h-4 transform rotate-90" />
                                  </div>
                                </div>
                                {showAddUnitDropdown &&
                                  activeUnits.filter(
                                    (u) =>
                                      !itemUnit || u.toLowerCase().includes(itemUnit.toLowerCase())
                                  ).length > 0 && (
                                    <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                      {activeUnits
                                        .filter(
                                          (u) =>
                                            !itemUnit ||
                                            u.toLowerCase().includes(itemUnit.toLowerCase())
                                        )
                                        .map((u) => (
                                          <div
                                            key={u}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                              setItemUnit(u)
                                              prevAddUnitRef.current = u
                                              setShowAddUnitDropdown(false)
                                              setItemErrors((prev) => {
                                                const copy = { ...prev }
                                                delete copy.itemUnit
                                                return copy
                                              })
                                            }}
                                            className="group flex items-center justify-between p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold capitalize text-left"
                                          >
                                            <span className="truncate">{u}</span>
                                            <button
                                              type="button"
                                              onMouseDown={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteUnit(u)
                                              }}
                                              className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5 rounded hover:bg-gray-100"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                              </div>
                              {itemErrors.itemUnit && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                  {itemErrors.itemUnit}
                                </p>
                              )}
                            </div>

                            {/* Quantity */}
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Quantity
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={itemQty}
                                  onFocus={() => {
                                    prevAddQtyRef.current = itemQty
                                    setItemQty('')
                                    setShowAddQtyDropdown(true)
                                  }}
                                  onBlur={() =>
                                    setTimeout(() => {
                                      setShowAddQtyDropdown(false)
                                      setItemQty((current) =>
                                        current ? current : prevAddQtyRef.current
                                      )
                                    }, 200)
                                  }
                                  onChange={(e) => {
                                    handleQtyChange(e.target.value)
                                    setItemErrors((prev) => {
                                      const copy = { ...prev }
                                      delete copy.itemQty
                                      return copy
                                    })
                                  }}
                                  placeholder="Select or enter quantity"
                                  className={`w-full pl-2.5 pr-8 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${itemErrors.itemQty ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                  style={{ height: '40px' }}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                  <ChevronRight className="w-4 h-4 transform rotate-90" />
                                </div>
                                {showAddQtyDropdown && (
                                  <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                    {[5, 10, 20, 50, 100, 250, 500]
                                      .filter((q) => !itemQty || q.toString().includes(itemQty))
                                      .map((q) => (
                                        <div
                                          key={q}
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => {
                                            setItemQty(q.toString())
                                            prevAddQtyRef.current = q.toString()
                                            setItemErrors((prev) => {
                                              const copy = { ...prev }
                                              delete copy.itemQty
                                              return copy
                                            })
                                            setShowAddQtyDropdown(false)
                                          }}
                                          className="p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left"
                                        >
                                          {q}
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                              {itemErrors.itemQty && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                  {itemErrors.itemQty}
                                </p>
                              )}
                            </div>

                            {/* Group Stock & Pieces (if Quantity >= 12) */}
                            {(() => {
                              const parsedQty = parseInt(itemQty, 10)
                              const unitLower = (itemUnit || '').toLowerCase().trim()
                              const isAlreadyGrouped = [
                                'pack',
                                'packs',
                                'box',
                                'boxes',
                                'bundle',
                                'bundles'
                              ].includes(unitLower)
                              if (!isNaN(parsedQty) && parsedQty >= 12 && !isAlreadyGrouped) {
                                return (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-gray-700 text-xs font-semibold mb-1">
                                        Group stock into (Optional)
                                      </label>
                                      <select
                                        value={itemGroupUnit}
                                        onChange={(e) => {
                                          setItemGroupUnit(e.target.value)
                                          if (e.target.value === 'none') {
                                            setItemPiecesPerUnit('')
                                          } else if (!itemPiecesPerUnit) {
                                            setItemPiecesPerUnit('12')
                                          }
                                        }}
                                        className="w-full px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue cursor-pointer"
                                        style={{ height: '40px' }}
                                      >
                                        <option value="none">
                                          Do not group (Individual pieces)
                                        </option>
                                        <option value="pack">Packs</option>
                                        <option value="box">Boxes</option>
                                        <option value="bundle">Bundles</option>
                                      </select>
                                    </div>
                                    {itemGroupUnit !== 'none' && (
                                      <div className="space-y-4">
                                        <div>
                                          <label className="block text-gray-700 text-xs font-semibold mb-1">
                                            Pieces per Pack/Box/Bundle
                                          </label>
                                          <input
                                            type="text"
                                            value={itemPiecesPerUnit}
                                            onChange={(e) =>
                                              handlePiecesPerUnitChange(e.target.value)
                                            }
                                            placeholder="e.g. 12"
                                            className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                                            style={{ height: '40px' }}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-gray-700 text-xs font-semibold mb-1">
                                            Remaining Pieces
                                          </label>
                                          <input
                                            type="text"
                                            readOnly
                                            value={getRemainingPiecesText(
                                              itemQty,
                                              itemPiecesPerUnit || '12',
                                              itemGroupUnit
                                            )}
                                            className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-bold text-navy-blue"
                                            style={{ height: '40px' }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              }
                              return null
                            })()}

                            {/* Pieces per Unit (if Unit is already a Pack, Box, or Bundle) */}
                            {(() => {
                              const unitLower = (itemUnit || '').toLowerCase().trim()
                              const isAlreadyGrouped = [
                                'pack',
                                'packs',
                                'box',
                                'boxes',
                                'bundle',
                                'bundles'
                              ].includes(unitLower)
                              if (isAlreadyGrouped) {
                                return (
                                  <div className="animate-fade-in">
                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                      Pieces per Unit <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={itemPiecesPerUnit}
                                      onChange={(e) => {
                                        handlePiecesPerUnitChange(e.target.value)
                                        setItemErrors((prev) => {
                                          const copy = { ...prev }
                                          delete copy.itemPiecesPerUnit
                                          return copy
                                        })
                                      }}
                                      placeholder="e.g. 12"
                                      className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${itemErrors.itemPiecesPerUnit ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                      style={{ height: '40px' }}
                                    />
                                    {itemErrors.itemPiecesPerUnit && (
                                      <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                        {itemErrors.itemPiecesPerUnit}
                                      </p>
                                    )}
                                  </div>
                                )
                              }
                              return null
                            })()}

                            {/* Expiration Date */}
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Expiration Date{' '}
                                {itemCategory.toLowerCase().trim() !== 'school supplies' && (
                                  <span className="text-red-500">*</span>
                                )}
                              </label>
                              <div
                                className={
                                  itemErrors.itemExpiry
                                    ? 'border border-red-500 rounded-xl p-0.5 ring-2 ring-red-500/10'
                                    : ''
                                }
                              >
                                <GlassDatePicker
                                  value={itemExpiry ? itemExpiry.split('T')[0] : ''}
                                  disabled={itemCategory.toLowerCase().trim() === 'school supplies'}
                                  onChange={(val) => {
                                    setItemExpiry(val)
                                    setItemErrors((prev) => {
                                      const copy = { ...prev }
                                      delete copy.itemExpiry
                                      return copy
                                    })
                                  }}
                                  showTime={false}
                                  placeholder="dd/mm/yyyy"
                                />
                              </div>
                              {itemErrors.itemExpiry && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                  {itemErrors.itemExpiry}
                                </p>
                              )}
                            </div>

                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition flex items-center justify-center cursor-pointer animate-fade-in"
                              style={{ height: '40px' }}
                            >
                              {loading ? 'Saving...' : 'Add Item'}
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* Modal Overlay for Edit */}
                    {itemEditing && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal-overlay animate-fade-in">
                        <div className="glass-modal rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-navy-blue text-sm">
                              Modify Catalog Item
                            </h3>
                            <button
                              type="button"
                              onClick={() => {
                                setItemEditing(null)
                                setItemName('')
                                setItemUnit('')
                                setItemQty('')
                                setItemExpiry('')
                                setItemPiecesPerUnit('')
                                setItemGroupUnit('none')
                                setItemErrors({})
                              }}
                              className="text-gray-400 hover:text-navy-blue transition cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <form onSubmit={handleSaveInventory} className="space-y-4">
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Item Name
                              </label>
                              <input
                                type="text"
                                value={itemName}
                                onChange={(e) => {
                                  setItemName(e.target.value)
                                  setItemErrors((prev) => {
                                    const copy = { ...prev }
                                    delete copy.itemName
                                    return copy
                                  })
                                }}
                                placeholder="e.g. Corned Beef, Notebooks"
                                className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${itemErrors.itemName ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                style={{ height: '40px' }}
                              />
                              {itemErrors.itemName && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                  {itemErrors.itemName}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Category
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={itemCategory}
                                  onFocus={() => {
                                    prevEditCategoryRef.current = itemCategory
                                    setItemCategory('')
                                    setShowEditCategoryDropdown(true)
                                  }}
                                  onBlur={() =>
                                    setTimeout(() => {
                                      setShowEditCategoryDropdown(false)
                                      setItemCategory((current) =>
                                        current ? current : prevEditCategoryRef.current
                                      )
                                    }, 200)
                                  }
                                  onChange={(e) => {
                                    setItemCategory(e.target.value)
                                    setItemErrors((prev) => {
                                      const copy = { ...prev }
                                      delete copy.itemCategory
                                      return copy
                                    })
                                  }}
                                  placeholder="Select or type category"
                                  className={`w-full pl-2.5 pr-16 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${itemErrors.itemCategory ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                  style={{ height: '40px' }}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                  <div className="pointer-events-none text-gray-400">
                                    <ChevronRight className="w-4 h-4 transform rotate-90" />
                                  </div>
                                </div>
                                {showEditCategoryDropdown &&
                                  activeCategories.filter(
                                    (cat) =>
                                      !itemCategory ||
                                      cat.toLowerCase().includes(itemCategory.toLowerCase())
                                  ).length > 0 && (
                                    <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                      {activeCategories
                                        .filter(
                                          (cat) =>
                                            !itemCategory ||
                                            cat.toLowerCase().includes(itemCategory.toLowerCase())
                                        )
                                        .map((cat) => (
                                          <div
                                            key={cat}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                              setItemCategory(cat)
                                              prevEditCategoryRef.current = cat
                                              setShowEditCategoryDropdown(false)
                                              setItemErrors((prev) => {
                                                const copy = { ...prev }
                                                delete copy.itemCategory
                                                return copy
                                              })
                                            }}
                                            className="group flex items-center justify-between p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold capitalize text-left"
                                          >
                                            <span className="truncate">{cat}</span>
                                            <button
                                              type="button"
                                              onMouseDown={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteCategory(cat)
                                              }}
                                              className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5 rounded hover:bg-gray-100"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                              </div>
                              {itemErrors.itemCategory && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                  {itemErrors.itemCategory}
                                </p>
                              )}
                            </div>

                            {/* Unit Searchable Dropdown */}
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Unit
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={itemUnit}
                                  onFocus={() => {
                                    prevEditUnitRef.current = itemUnit
                                    setItemUnit('')
                                    setShowEditUnitDropdown(true)
                                  }}
                                  onBlur={() =>
                                    setTimeout(() => {
                                      setShowEditUnitDropdown(false)
                                      setItemUnit((current) =>
                                        current ? current : prevEditUnitRef.current
                                      )
                                    }, 200)
                                  }
                                  onChange={(e) => {
                                    setItemUnit(e.target.value)
                                    setItemErrors((prev) => {
                                      const copy = { ...prev }
                                      delete copy.itemUnit
                                      return copy
                                    })
                                  }}
                                  placeholder="Select or type unit"
                                  className={`w-full pl-2.5 pr-16 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${itemErrors.itemUnit ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                  style={{ height: '40px' }}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                  {itemUnit && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setItemUnit('')
                                        prevEditUnitRef.current = ''
                                      }}
                                      className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                      tabIndex={-1}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <div className="pointer-events-none text-gray-400">
                                    <ChevronRight className="w-4 h-4 transform rotate-90" />
                                  </div>
                                </div>
                                {showEditUnitDropdown &&
                                  activeUnits.filter(
                                    (u) =>
                                      !itemUnit || u.toLowerCase().includes(itemUnit.toLowerCase())
                                  ).length > 0 && (
                                    <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                      {activeUnits
                                        .filter(
                                          (u) =>
                                            !itemUnit ||
                                            u.toLowerCase().includes(itemUnit.toLowerCase())
                                        )
                                        .map((u) => (
                                          <div
                                            key={u}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                              setItemUnit(u)
                                              prevEditUnitRef.current = u
                                              setShowEditUnitDropdown(false)
                                              setItemErrors((prev) => {
                                                const copy = { ...prev }
                                                delete copy.itemUnit
                                                return copy
                                              })
                                            }}
                                            className="group flex items-center justify-between p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold capitalize text-left"
                                          >
                                            <span className="truncate">{u}</span>
                                            <button
                                              type="button"
                                              onMouseDown={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteUnit(u)
                                              }}
                                              className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5 rounded hover:bg-gray-100"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                              </div>
                              {itemErrors.itemUnit && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                  {itemErrors.itemUnit}
                                </p>
                              )}
                            </div>

                            {/* Quantity (directly below Unit) */}
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Quantity
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={itemQty}
                                  onFocus={() => {
                                    prevEditQtyRef.current = itemQty
                                    setItemQty('')
                                    setShowEditQtyDropdown(true)
                                  }}
                                  onBlur={() =>
                                    setTimeout(() => {
                                      setShowEditQtyDropdown(false)
                                      setItemQty((current) =>
                                        current ? current : prevEditQtyRef.current
                                      )
                                    }, 200)
                                  }
                                  onChange={(e) => {
                                    handleQtyChange(e.target.value)
                                    setItemErrors((prev) => {
                                      const copy = { ...prev }
                                      delete copy.itemQty
                                      return copy
                                    })
                                  }}
                                  placeholder="Select or enter quantity"
                                  className={`w-full pl-2.5 pr-8 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${itemErrors.itemQty ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                  style={{ height: '40px' }}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                  <ChevronRight className="w-4 h-4 transform rotate-90" />
                                </div>
                                {showEditQtyDropdown && (
                                  <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                    {[5, 10, 20, 50, 100, 250, 500]
                                      .filter((q) => !itemQty || q.toString().includes(itemQty))
                                      .map((q) => (
                                        <div
                                          key={q}
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => {
                                            setItemQty(q.toString())
                                            prevEditQtyRef.current = q.toString()
                                            setItemErrors((prev) => {
                                              const copy = { ...prev }
                                              delete copy.itemQty
                                              return copy
                                            })
                                            setShowEditQtyDropdown(false)
                                          }}
                                          className="p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left"
                                        >
                                          {q}
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                              {itemErrors.itemQty && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                  {itemErrors.itemQty}
                                </p>
                              )}
                            </div>

                            {/* Group Stock & Pieces (if Quantity >= 12) */}
                            {(() => {
                              const parsedQty = parseInt(itemQty, 10)
                              const unitLower = (itemUnit || '').toLowerCase().trim()
                              const isAlreadyGrouped = [
                                'pack',
                                'packs',
                                'box',
                                'boxes',
                                'bundle',
                                'bundles'
                              ].includes(unitLower)
                              if (!isNaN(parsedQty) && parsedQty >= 12 && !isAlreadyGrouped) {
                                return (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-gray-700 text-xs font-semibold mb-1">
                                        Group stock into (Optional)
                                      </label>
                                      <select
                                        value={itemGroupUnit}
                                        onChange={(e) => {
                                          setItemGroupUnit(e.target.value)
                                          if (e.target.value === 'none') {
                                            setItemPiecesPerUnit('')
                                          } else if (!itemPiecesPerUnit) {
                                            setItemPiecesPerUnit('12')
                                          }
                                        }}
                                        className="w-full px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue cursor-pointer"
                                        style={{ height: '40px' }}
                                      >
                                        <option value="none">
                                          Do not group (Individual pieces)
                                        </option>
                                        <option value="pack">Packs</option>
                                        <option value="box">Boxes</option>
                                        <option value="bundle">Bundles</option>
                                      </select>
                                    </div>
                                    {itemGroupUnit !== 'none' && (
                                      <div className="space-y-4">
                                        <div>
                                          <label className="block text-gray-700 text-xs font-semibold mb-1">
                                            Pieces per Pack/Box/Bundle
                                          </label>
                                          <input
                                            type="text"
                                            value={itemPiecesPerUnit}
                                            onChange={(e) =>
                                              handlePiecesPerUnitChange(e.target.value)
                                            }
                                            placeholder="e.g. 12"
                                            className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                                            style={{ height: '40px' }}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-gray-700 text-xs font-semibold mb-1">
                                            Remaining Pieces
                                          </label>
                                          <input
                                            type="text"
                                            readOnly
                                            value={getRemainingPiecesText(
                                              itemQty,
                                              itemPiecesPerUnit || '12',
                                              itemGroupUnit
                                            )}
                                            className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-bold text-navy-blue"
                                            style={{ height: '40px' }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              }
                              return null
                            })()}

                            {/* Pieces per Unit (if Unit is already a Pack, Box, or Bundle) */}
                            {(() => {
                              const unitLower = (itemUnit || '').toLowerCase().trim()
                              const isAlreadyGrouped = [
                                'pack',
                                'packs',
                                'box',
                                'boxes',
                                'bundle',
                                'bundles'
                              ].includes(unitLower)
                              if (isAlreadyGrouped) {
                                return (
                                  <div className="animate-fade-in">
                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                      Pieces per Unit <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={itemPiecesPerUnit}
                                      onChange={(e) => {
                                        handlePiecesPerUnitChange(e.target.value)
                                        setItemErrors((prev) => {
                                          const copy = { ...prev }
                                          delete copy.itemPiecesPerUnit
                                          return copy
                                        })
                                      }}
                                      placeholder="e.g. 12"
                                      className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${itemErrors.itemPiecesPerUnit ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                      style={{ height: '40px' }}
                                    />
                                    {itemErrors.itemPiecesPerUnit && (
                                      <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                        {itemErrors.itemPiecesPerUnit}
                                      </p>
                                    )}
                                  </div>
                                )
                              }
                              return null
                            })()}

                            {/* Expiration Date */}
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Expiration Date{' '}
                                {itemCategory.toLowerCase().trim() !== 'school supplies' && (
                                  <span className="text-red-500">*</span>
                                )}
                              </label>
                              <div
                                className={
                                  itemErrors.itemExpiry
                                    ? 'border border-red-500 rounded-xl p-0.5 ring-2 ring-red-500/10'
                                    : ''
                                }
                              >
                                <GlassDatePicker
                                  value={itemExpiry ? itemExpiry.split('T')[0] : ''}
                                  disabled={itemCategory.toLowerCase().trim() === 'school supplies'}
                                  onChange={(val) => {
                                    setItemExpiry(val)
                                    setItemErrors((prev) => {
                                      const copy = { ...prev }
                                      delete copy.itemExpiry
                                      return copy
                                    })
                                  }}
                                  showTime={false}
                                  placeholder="dd/mm/yyyy"
                                />
                              </div>
                              {itemErrors.itemExpiry && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                  {itemErrors.itemExpiry}
                                </p>
                              )}
                            </div>

                            <div className="flex space-x-2 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setItemEditing(null)
                                  setItemName('')
                                  setItemUnit('')
                                  setItemQty('')
                                  setItemExpiry('')
                                  setItemPiecesPerUnit('')
                                  setItemGroupUnit('none')
                                  setItemErrors({})
                                }}
                                className="flex-1 py-2 border border-gray-200 text-gray-500 rounded-full text-xs font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition flex items-center justify-center cursor-pointer"
                              >
                                {loading ? 'Saving...' : 'Update Item'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* Modal Overlay for Release Item */}
                    {isReleaseModalOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal-overlay animate-fade-in">
                        <div className="glass-modal rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-navy-blue text-sm">Release Item</h3>
                            <button
                              type="button"
                              onClick={() => {
                                setIsReleaseModalOpen(false)
                                setReleaseItemId('')
                                setReleaseQty('')
                                setReleaseSearch('')
                                setReleaseUnitType('base')
                              }}
                              className="text-gray-400 hover:text-navy-blue transition cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <form onSubmit={handleAddPendingReleaseItem} className="space-y-4">
                            {/* Select Item */}
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Select Item
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={releaseSearch}
                                  onFocus={() => {
                                    prevReleaseSearchRef.current = releaseSearch
                                    setReleaseSearch('')
                                    setShowReleaseDropdown(true)
                                  }}
                                  onBlur={() =>
                                    setTimeout(() => {
                                      setShowReleaseDropdown(false)
                                      setReleaseSearch(() => {
                                        if (releaseItemId) {
                                          const item = inventoryList.find(
                                            (i) => i.id === releaseItemId
                                          )
                                          if (item) {
                                            return `${item.name} (${item.category}) - ${displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)} left ${item.expiryDate ? `(Exp: ${new Date(item.expiryDate).toLocaleDateString()})` : ''}`
                                          }
                                        }
                                        return ''
                                      })
                                    }, 200)
                                  }
                                  onChange={(e) => {
                                    setReleaseSearch(e.target.value)
                                    if (!e.target.value) {
                                      setReleaseItemId('')
                                    }
                                  }}
                                  placeholder="Type to search stock item..."
                                  className={`w-full pl-2.5 pr-16 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('releaseItemId') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                  style={{ height: '40px' }}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                  {releaseSearch && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReleaseSearch('')
                                        setReleaseItemId('')
                                        prevReleaseSearchRef.current = ''
                                      }}
                                      className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                      tabIndex={-1}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <div className="pointer-events-none text-gray-400">
                                    <ChevronRight className="w-4 h-4 transform rotate-90" />
                                  </div>
                                </div>
                                {showReleaseDropdown && (
                                  <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                    {inventoryList
                                      .filter((item) => item.quantity > 0)
                                      .filter(
                                        (item) =>
                                          !releaseSearch ||
                                          item.name
                                            .toLowerCase()
                                            .includes(releaseSearch.toLowerCase())
                                      )
                                      .map((item) => {
                                        const optionText = `${item.name} (${item.category}) - ${displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)} left ${item.expiryDate ? `(Exp: ${new Date(item.expiryDate).toLocaleDateString()})` : ''}`
                                        return (
                                          <div
                                            key={item.id}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                              setReleaseItemId(item.id)
                                              setReleaseSearch(optionText)
                                              prevReleaseSearchRef.current = optionText
                                              clearFieldValError('releaseItemId')
                                              setShowReleaseDropdown(false)
                                            }}
                                            className="p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left"
                                          >
                                            {item.name}{' '}
                                            <span className="text-gray-400 font-normal">
                                              ({item.category})
                                            </span>{' '}
                                            -{' '}
                                            <span className="text-navy-blue font-bold">
                                              {displayStock(
                                                item.quantity,
                                                item.unit,
                                                item.groupUnit,
                                                item.piecesPerUnit
                                              )}
                                            </span>{' '}
                                            left{' '}
                                            {item.expiryDate ? (
                                              <span className="text-red-500 font-semibold">
                                                (Exp:{' '}
                                                {new Date(item.expiryDate).toLocaleDateString()})
                                              </span>
                                            ) : (
                                              ''
                                            )}
                                          </div>
                                        )
                                      })}
                                    {inventoryList
                                      .filter((item) => item.quantity > 0)
                                      .filter((item) =>
                                        item.name
                                          .toLowerCase()
                                          .includes(releaseSearch.toLowerCase())
                                      ).length === 0 && (
                                      <div className="p-2.5 text-xs text-gray-400 text-left font-semibold">
                                        No matching items found
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Quantities to Release */}
                            {(() => {
                              const item = inventoryList.find((i) => i.id === releaseItemId)
                              const hasGroup =
                                item &&
                                item.groupUnit &&
                                item.groupUnit !== 'none' &&
                                item.piecesPerUnit
                              if (hasGroup) {
                                const groupLabel =
                                  item.groupUnit === 'box'
                                    ? 'Boxes'
                                    : item.groupUnit === 'bundle'
                                      ? 'Bundles'
                                      : 'Packs'
                                return (
                                  <div className="grid grid-cols-2 gap-3 animate-fade-in">
                                    <div>
                                      <label className="block text-gray-700 text-xs font-semibold mb-1">
                                        Quantity ({groupLabel})
                                      </label>
                                      <input
                                        type="text"
                                        value={releaseQtyGroup}
                                        onChange={(e) => {
                                          if (/^\d*$/.test(e.target.value)) {
                                            setReleaseQtyGroup(e.target.value)
                                            clearFieldValError('releaseQtyGroup')
                                          }
                                        }}
                                        placeholder="e.g. 2"
                                        className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('releaseQtyGroup') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                        style={{ height: '40px' }}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-gray-700 text-xs font-semibold mb-1">
                                        Quantity (Pieces)
                                      </label>
                                      <input
                                        type="text"
                                        value={releaseQtyPieces}
                                        onChange={(e) => {
                                          if (/^\d*$/.test(e.target.value)) {
                                            setReleaseQtyPieces(e.target.value)
                                            clearFieldValError('releaseQtyPieces')
                                          }
                                        }}
                                        placeholder="e.g. 2"
                                        className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('releaseQtyPieces') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                        style={{ height: '40px' }}
                                      />
                                    </div>
                                  </div>
                                )
                              }
                              return (
                                <div className="animate-fade-in">
                                  <label className="block text-gray-700 text-xs font-semibold mb-1">
                                    Quantity (Pieces)
                                  </label>
                                  <input
                                    type="text"
                                    value={releaseQtyPieces}
                                    onChange={(e) => {
                                      if (/^\d*$/.test(e.target.value)) {
                                        setReleaseQtyPieces(e.target.value)
                                        clearFieldValError('releaseQtyPieces')
                                      }
                                    }}
                                    placeholder="e.g. 10"
                                    className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('releaseQtyPieces') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                    style={{ height: '40px' }}
                                  />
                                </div>
                              )
                            })()}

                            <button
                              type="submit"
                              className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition flex items-center justify-center cursor-pointer animate-fade-in"
                              style={{ height: '40px' }}
                            >
                              Add to Release List
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* Modal Overlay for Review List */}
                    {isReviewModalOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal-overlay animate-fade-in">
                        <div className="glass-modal rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-sig-green"></div>
                          <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-3">
                            <h3 className="font-bold text-navy-blue text-sm flex items-center space-x-2">
                              <span>Release Review List</span>
                              <span className="text-[10px] bg-navy-blue/10 text-navy-blue px-2 py-0.5 rounded-full font-bold">
                                {pendingReleaseItems.length}
                              </span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => setIsReviewModalOpen(false)}
                              className="text-gray-400 hover:text-navy-blue transition cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {pendingReleaseItems.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-xs font-medium">
                              No items have been added to the Release Review List yet.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 pt-4">
                              {pendingReleaseItems.map((pItem) => (
                                <div
                                  key={pItem.id}
                                  className="flex justify-between items-center border border-gray-50 p-2.5 rounded-xl bg-gray-50/50 hover:bg-white transition"
                                >
                                  <div className="flex-1 min-w-0 pr-3">
                                    <div className="font-bold text-navy-blue text-xs truncate">
                                      {pItem.name}
                                    </div>
                                    <div className="text-[10px] text-gray-400 capitalize">
                                      {pItem.category}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3 shrink-0">
                                    <div className="text-right">
                                      <div className="text-xs font-bold text-navy-blue capitalize">
                                        {(() => {
                                          const hasGroup =
                                            pItem.groupUnit &&
                                            pItem.groupUnit !== 'none' &&
                                            pItem.piecesPerUnit
                                          if (hasGroup) {
                                            const groupName =
                                              pItem.qtyGroup === 1
                                                ? pItem.groupUnit
                                                : pItem.groupUnit === 'box'
                                                  ? 'boxes'
                                                  : pItem.groupUnit === 'bundle'
                                                    ? 'bundles'
                                                    : 'packs'
                                            const parts = []
                                            if (pItem.qtyGroup > 0)
                                              parts.push(`${pItem.qtyGroup} ${groupName}`)
                                            if (pItem.qtyPieces > 0)
                                              parts.push(`${pItem.qtyPieces} Pieces`)
                                            return parts.join(' + ') || '0 Pieces'
                                          }
                                          return `${pItem.qtyPieces} ${formatUnit(pItem.qtyPieces, pItem.baseUnit)}`
                                        })()}
                                      </div>
                                      <div className="text-[9px] text-gray-400 font-medium">
                                        ({pItem.baseQty} Total Pieces)
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePendingItem(pItem.id)}
                                      className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                      title="Remove item"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {pendingReleaseItems.length > 0 ? (
                            <div className="flex space-x-2 pt-3 border-t border-dashed border-gray-150 mt-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setPendingReleaseItems([])
                                  setIsReviewModalOpen(false)
                                }}
                                className="flex-1 py-2 border border-gray-200 text-gray-500 rounded-full text-xs font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition cursor-pointer text-center"
                              >
                                Clear List
                              </button>
                              <button
                                type="button"
                                disabled={loading}
                                onClick={handleConfirmRelease}
                                className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition cursor-pointer text-center"
                              >
                                {loading ? 'Confirming...' : 'Confirm Release'}
                              </button>
                            </div>
                          ) : (
                            <div className="flex pt-3 border-t border-dashed border-gray-150 mt-4">
                              <button
                                type="button"
                                onClick={() => setIsReviewModalOpen(false)}
                                className="w-full py-2 border border-gray-200 text-gray-500 rounded-full text-xs font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition cursor-pointer text-center"
                              >
                                Close
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ==================================================== */}
                {/* DONORS & DONATIONS TAB PANEL */}
                {/* ==================================================== */}
                {activeTab === 'donations' && user.role === 'admin' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
                      <div>
                        <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                          Donors & Donations Logs
                        </h1>
                      </div>
                      <button
                        type="button"
                        disabled={isAnyModalOpen}
                        onClick={() => {
                          setDonorName('')
                          setDonorType('')
                          setDonPurpose('')
                          setDonDesc('')
                          setDonDate('')
                          setDonItems([
                            { name: '', category: '', unit: '', quantity: '', expiryDate: '' }
                          ])
                          setIsDonationModalOpen(true)
                        }}
                        className={`flex items-center space-x-1.5 bg-navy-blue text-white rounded-lg text-xs font-semibold py-2 px-4 border border-navy-blue shadow-xs transition-all duration-150 ${
                          isAnyModalOpen
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-navy-blue-600 active:bg-navy-blue-700 cursor-pointer'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Register Donation Batch</span>
                      </button>
                    </div>

                    {/* Donations History log */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                      <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 mb-4">
                        Donation Audit History Logs
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                              <th className="py-3 px-3">Date</th>
                              <th className="py-3 px-2">Donor Source</th>
                              <th className="py-3 px-2">Purpose</th>
                              <th className="py-3 px-2">Items</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-xs">
                            {donationsList.map((d) => {
                              const donor = donorsList.find((donorObj) => donorObj.id === d.donorId)
                              return (
                                <tr key={d.id} className="hover:bg-gray-50/50 transition">
                                  <td className="py-3 px-3 font-semibold">
                                    {new Date(d.dateOfDonation).toLocaleDateString()}
                                  </td>
                                  <td className="py-3 px-2 text-navy-blue font-semibold">
                                    {donor ? donor.name : 'Unknown Donor'}
                                  </td>
                                  <td className="py-3 px-2 text-gray-600 font-medium">
                                    {d.purpose}
                                  </td>
                                  <td className="py-3 px-2">
                                    <div className="space-y-1">
                                      {d.items.map((i, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-block bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-lg border border-gray-200/50 mr-1.5"
                                        >
                                          {i.name} ({i.quantity} {formatUnit(i.quantity, i.unit)})
                                          {i.expiryDate && (
                                            <span className="text-red-500 font-bold ml-1">
                                              Exp: {new Date(i.expiryDate).toLocaleDateString()}
                                            </span>
                                          )}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                            {donationsList.length === 0 && (
                              <tr>
                                <td colSpan="4" className="text-center py-6 text-gray-400">
                                  No donations logs available.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'events' && user.role === 'admin' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Header section with top action bar button */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
                      <div>
                        <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                          Event Scheduler
                        </h1>
                      </div>
                      <div className="flex space-x-2 mt-4 md:mt-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEvent(null)
                            setEvtName('')
                            setEvtDesc('')
                            setEvtDate('')
                            setEvtLoc('')
                            setEvtOrgId('')
                            setEvtStatus('planned')
                            setEvtType('department')
                            setEvtOrgName('')
                            setEvtParentDeptId('')
                            setIsEventModalOpen(true)
                          }}
                          className="flex items-center gap-1.5 bg-navy-blue text-white rounded-full text-xs font-semibold px-4 py-2.5 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition cursor-pointer animate-fade-in"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Schedule Event</span>
                        </button>
                      </div>
                    </div>

                    {/* List of planned events (Full Width Content Board) */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                      <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 mb-4">
                        Scheduled Events & Status Board
                      </h3>

                      {/* Search & Month Filter Controls */}
                      <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search events by name, description, venue..."
                            value={eventSearchQuery}
                            onChange={(e) => setEventSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-medium text-navy-blue"
                            style={{ height: '38px' }}
                          />
                        </div>
                        <div className="relative w-full sm:w-48">
                          <select
                            value={eventMonthFilter}
                            onChange={(e) => setEventMonthFilter(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                            style={{ height: '38px' }}
                          >
                            <option value="">All Months</option>
                            <option value="0">January</option>
                            <option value="1">February</option>
                            <option value="2">March</option>
                            <option value="3">April</option>
                            <option value="4">May</option>
                            <option value="5">June</option>
                            <option value="6">July</option>
                            <option value="7">August</option>
                            <option value="8">September</option>
                            <option value="9">October</option>
                            <option value="10">November</option>
                            <option value="11">December</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(() => {
                          const filtered = eventsList.filter((evt) => {
                            const matchesSearch =
                              evt.name.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                              (evt.description &&
                                evt.description
                                  .toLowerCase()
                                  .includes(eventSearchQuery.toLowerCase())) ||
                              (evt.location &&
                                evt.location.toLowerCase().includes(eventSearchQuery.toLowerCase()))

                            let matchesMonth = true
                            if (eventMonthFilter !== '') {
                              const dateObj = new Date(evt.scheduleDate)
                              matchesMonth = dateObj.getMonth() === parseInt(eventMonthFilter)
                            }

                            return matchesSearch && matchesMonth
                          })

                          if (filtered.length === 0) {
                            return (
                              <div className="col-span-3 text-center py-12 text-gray-400 text-xs font-semibold">
                                {eventsList.length === 0
                                  ? 'No scheduled events.'
                                  : 'No events match your search or filter criteria.'}
                              </div>
                            )
                          }

                          return filtered.map((evt) => {
                            const org = orgsList.find((o) => o.id === evt.assignedOrganizationId)
                            return (
                              <div
                                key={evt.id}
                                className="border border-gray-100 p-5 rounded-2xl bg-gray-50/50 hover:bg-white hover:border-sig-green/30 transition duration-200 flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <span
                                      className={`inline-block text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                        evt.status === 'completed'
                                          ? 'bg-green-100 text-green-800'
                                          : evt.status === 'cancelled'
                                            ? 'bg-red-100 text-red-800'
                                            : evt.status === 'planned'
                                              ? 'bg-blue-100 text-blue-800'
                                              : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {evt.status}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[10px] text-navy-blue font-bold tracking-wider">
                                        {evt.eventType === 'organization'
                                          ? `${evt.organizationName} (${org ? org.abbreviation : 'All'})`
                                          : org
                                            ? org.abbreviation
                                            : 'All'}
                                      </span>
                                      <button
                                        onClick={() => handleEditClick(evt)}
                                        className="text-navy-blue hover:text-sig-green transition p-1 rounded hover:bg-gray-100 cursor-pointer"
                                        title="Edit Event"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteEventClick(evt)}
                                        className="text-red-550 hover:text-red-700 transition p-1 rounded hover:bg-red-50 cursor-pointer"
                                        title="Delete Event"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <h4 className="font-bold text-navy-blue text-sm mb-1 leading-tight">
                                    {evt.name}
                                  </h4>
                                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">
                                    {evt.description}
                                  </p>
                                </div>

                                <div className="border-t border-gray-100 pt-3 space-y-1.5 text-[10px] text-gray-400">
                                  <div className="flex items-center space-x-1.5">
                                    <Clock className="w-3.5 h-3.5 text-navy-blue" />
                                    <span>{new Date(evt.scheduleDate).toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center space-x-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-sig-green" />
                                    <span className="truncate">{evt.location}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </div>

                    {/* SCHEDULE / EDIT EVENT MODAL */}
                    {isEventModalOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal-overlay animate-fade-in">
                        <div className="glass-modal rounded-2xl max-w-lg w-full shadow-2xl border border-white/80 flex flex-col max-h-[80vh] overflow-hidden animate-fade-in-scale">
                          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
                            <h3 className="font-bold text-navy-blue text-base">
                              {editingEvent ? 'Edit Event' : 'Schedule Event'}
                            </h3>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEventModalOpen(false)
                                setEditingEvent(null)
                                setEvtName('')
                                setEvtDesc('')
                                setEvtDate('')
                                setEvtLoc('')
                                setEvtOrgId('')
                                setEvtStatus('planned')
                                setEvtType('department')
                                setEvtOrgName('')
                                setEvtParentDeptId('')
                                setEvtErrors({})
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <form
                            onSubmit={handleCreateEvent}
                            className="flex flex-col flex-1 min-h-0"
                          >
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                              <div>
                                <label className="block text-gray-700 text-xs font-semibold mb-1">
                                  Event Name
                                </label>
                                <input
                                  type="text"
                                  value={evtName}
                                  onChange={(e) => {
                                    setEvtName(e.target.value)
                                    setEvtErrors((prev) => {
                                      const copy = { ...prev }
                                      delete copy.evtName
                                      return copy
                                    })
                                  }}
                                  placeholder="Event name"
                                  className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${evtErrors.evtName ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                  style={{ height: '40px' }}
                                />
                                {evtErrors.evtName && (
                                  <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                    {evtErrors.evtName}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-gray-700 text-xs font-semibold mb-1">
                                  Description
                                </label>
                                <textarea
                                  value={evtDesc}
                                  onChange={(e) => setEvtDesc(e.target.value)}
                                  placeholder="Brief narrative of the event purpose..."
                                  className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none resize-none font-semibold text-navy-blue"
                                  rows="3"
                                ></textarea>
                              </div>

                              <div>
                                <label className="block text-gray-700 text-xs font-semibold mb-1">
                                  Scheduled Date & Time
                                </label>
                                <div
                                  className={
                                    evtErrors.evtDate
                                      ? 'border border-red-500 rounded-xl p-0.5 ring-2 ring-red-500/10'
                                      : ''
                                  }
                                >
                                  <GlassDatePicker
                                    value={evtDate}
                                    onChange={(val) => {
                                      setEvtDate(val)
                                      setEvtErrors((prev) => {
                                        const copy = { ...prev }
                                        delete copy.evtDate
                                        return copy
                                      })
                                    }}
                                    showTime={true}
                                    placeholder="dd/mm/yyyy, --:-- --"
                                  />
                                </div>
                                {evtErrors.evtDate && (
                                  <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                    {evtErrors.evtDate}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-gray-700 text-xs font-semibold mb-1">
                                  Target Location
                                </label>
                                <input
                                  type="text"
                                  value={evtLoc}
                                  onChange={(e) => {
                                    setEvtLoc(e.target.value)
                                    setEvtErrors((prev) => {
                                      const copy = { ...prev }
                                      delete copy.evtLoc
                                      return copy
                                    })
                                  }}
                                  placeholder="Location"
                                  className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${evtErrors.evtLoc ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                  style={{ height: '40px' }}
                                />
                                {evtErrors.evtLoc && (
                                  <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                    {evtErrors.evtLoc}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-gray-700 text-xs font-semibold mb-1">
                                  Event Type
                                </label>
                                <select
                                  value={evtType}
                                  onChange={(e) => {
                                    setEvtType(e.target.value)
                                    clearFieldValError('evtType')
                                  }}
                                  className="w-full px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                                  style={{ height: '40px' }}
                                >
                                  <option value="department">Department</option>
                                  <option value="organization">Organization</option>
                                </select>
                              </div>

                              {evtType === 'organization' ? (
                                <>
                                  <div>
                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                      Organization Name
                                    </label>
                                    <input
                                      type="text"
                                      value={evtOrgName}
                                      onChange={(e) => {
                                        setEvtOrgName(e.target.value)
                                        setEvtErrors((prev) => {
                                          const copy = { ...prev }
                                          delete copy.evtOrgName
                                          return copy
                                        })
                                      }}
                                      placeholder="Organization Name"
                                      className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${evtErrors.evtOrgName ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                      style={{ height: '40px' }}
                                    />
                                    {evtErrors.evtOrgName && (
                                      <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                        {evtErrors.evtOrgName}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                      Assigned Department
                                    </label>
                                    <SearchableDropdown
                                      value={evtParentDeptId}
                                      onChange={(val) => {
                                        setEvtParentDeptId(val)
                                        setEvtErrors((prev) => {
                                          const copy = { ...prev }
                                          delete copy.evtParentDeptId
                                          return copy
                                        })
                                      }}
                                      options={orgsList.filter(
                                        (o) => o.type === 'department' || !o.type
                                      )}
                                      onDelete={(o) => handleDeleteOrg(o.id)}
                                      placeholder="Select department..."
                                      className={
                                        evtErrors.evtParentDeptId
                                          ? 'border-red-500 ring-2 ring-red-500/10'
                                          : ''
                                      }
                                    />
                                    {evtErrors.evtParentDeptId && (
                                      <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                        {evtErrors.evtParentDeptId}
                                      </p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div>
                                  <label className="block text-gray-700 text-xs font-semibold mb-1">
                                    Assigned Department{' '}
                                  </label>
                                  <SearchableDropdown
                                    value={evtOrgId}
                                    onChange={(val) => {
                                      setEvtOrgId(val)
                                      setEvtErrors((prev) => {
                                        const copy = { ...prev }
                                        delete copy.evtOrgId
                                        return copy
                                      })
                                    }}
                                    options={orgsList}
                                    onDelete={(o) => handleDeleteOrg(o.id)}
                                    placeholder="Type to filter co-organizers..."
                                    className={
                                      evtErrors.evtOrgId
                                        ? 'border-red-500 ring-2 ring-red-500/10'
                                        : ''
                                    }
                                  />
                                  {evtErrors.evtOrgId && (
                                    <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                      {evtErrors.evtOrgId}
                                    </p>
                                  )}
                                </div>
                              )}

                              {editingEvent && (
                                <div>
                                  <label className="block text-gray-700 text-xs font-semibold mb-1">
                                    Status
                                  </label>
                                  <select
                                    value={evtStatus}
                                    onChange={(e) => setEvtStatus(e.target.value)}
                                    className="w-full px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                                    style={{ height: '40px' }}
                                  >
                                    <option value="planned">Planned</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 px-6 py-4 border-t border-gray-100 shrink-0 bg-white/40">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEventModalOpen(false)
                                  setEditingEvent(null)
                                  setEvtName('')
                                  setEvtDesc('')
                                  setEvtDate('')
                                  setEvtLoc('')
                                  setEvtOrgId('')
                                  setEvtStatus('planned')
                                  setEvtType('department')
                                  setEvtOrgName('')
                                  setEvtParentDeptId('')
                                  setEvtErrors({})
                                }}
                                className="flex-1 bg-gray-100 hover:bg-red-500 hover:text-white text-gray-700 font-semibold py-2 px-4 rounded-full text-xs transition cursor-pointer text-center"
                                style={{ height: '40px' }}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition cursor-pointer flex items-center justify-center gap-1.5"
                                style={{ height: '40px' }}
                              >
                                {editingEvent ? 'Save Changes' : 'Schedule Event'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ==================================================== */}
                {/* ORGANIZATION TAB PANEL */}
                {/* ==================================================== */}
                {activeTab === 'organization' && user.role === 'admin' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Organization Header Dashboard */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between justify-start gap-4 pb-1">
                      <div>
                        <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                          Organization & Departments
                        </h1>
                      </div>

                      {/* Top-Right Add Buttons */}
                      {selectedOrgSubTab === 'department' && (
                        <button
                          onClick={() => {
                            handleCancelOrgEdit()
                            setIsAddDeptModalOpen(true)
                          }}
                          className="flex items-center gap-1.5 bg-navy-blue text-white rounded-full text-xs font-semibold px-4 py-2.5 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition cursor-pointer self-start sm:self-auto"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Department
                        </button>
                      )}
                    </div>

                    {/* Department Tab View (Card Grid Layout) & Profile Panel with Motion Transitions */}
                    <AnimatePresence mode="wait">
                      {selectedOrgSubTab === 'department' && (
                        <motion.div
                          key="department-directory"
                          variants={pageVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={pageTransition}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <h3 className="font-bold text-navy-blue text-sm">
                              Registered Departments Directory
                            </h3>
                          </div>

                          {(() => {
                            const filtered = orgsList.filter(
                              (o) => o.type === 'department' || !o.type
                            )

                            if (filtered.length === 0) {
                              return (
                                <p className="text-center py-10 text-gray-400 text-xs font-semibold">
                                  No departments registered yet.
                                </p>
                              )
                            }

                            return (
                              <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center max-w-5xl mx-auto py-4"
                                variants={staggerContainer}
                                initial="initial"
                                animate="animate"
                              >
                                {filtered.map((org) => {
                                  return (
                                    <motion.div
                                      key={org.id}
                                      variants={staggerItem}
                                      whileHover={{ y: -2, scale: 1.01 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => setSelectedOrgSubTab(org.id)}
                                      className="bg-white rounded-3xl p-8 border border-gray-200/60 shadow-xs hover:shadow-md hover:border-sig-green/45 transition duration-200 cursor-pointer flex flex-col items-center justify-center text-center group space-y-5 relative h-72"
                                    >
                                      {/* Centered Logo */}
                                      <div className="w-32 h-32 flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105">
                                        {org.logo ? (
                                          <img
                                            src={org.logo}
                                            alt={`${org.name} logo`}
                                            className="w-full h-full object-contain"
                                          />
                                        ) : (
                                          <div className="w-24 h-24 rounded-full bg-navy-blue/5 border border-navy-blue/10 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-navy-blue/70">
                                              {org.abbreviation?.toUpperCase()}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Name below logo */}
                                      <div className="space-y-1">
                                        <h4 className="text-xs font-bold text-navy-blue group-hover:text-sig-green transition-colors duration-200 line-clamp-2 leading-tight px-2">
                                          {org.name}
                                        </h4>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                                          {org.abbreviation?.toUpperCase()}
                                        </span>
                                      </div>

                                      {/* Absolute controls to edit/delete */}
                                      <div
                                        className="absolute top-4 right-4 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          onClick={() => handleEditOrgClick(org)}
                                          className="p-1.5 text-navy-blue hover:bg-navy-blue/5 rounded-lg cursor-pointer transition"
                                          title="Edit"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteOrg(org.id)}
                                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </motion.div>
                                  )
                                })}
                              </motion.div>
                            )
                          })()}
                        </motion.div>
                      )}

                      {/* Specific Organization / Department Tab Panel Content */}
                      {selectedOrgSubTab !== 'organization' &&
                        selectedOrgSubTab !== 'department' && (
                          <motion.div
                            key={selectedOrgSubTab}
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={pageTransition}
                          >
                            {(() => {
                              const selectedOrgObj = orgsList.find(
                                (o) => o.id === selectedOrgSubTab
                              )
                              if (!selectedOrgObj)
                                return (
                                  <p className="text-center py-10 text-gray-400">
                                    Profile not found.
                                  </p>
                                )

                              const isDept = selectedOrgObj.type === 'department'
                              const coord = usersList.find(
                                (u) =>
                                  u.uid === selectedOrgObj.coordinatorId ||
                                  u.organizationId === selectedOrgObj.id
                              )

                              // Filters for events
                              const ongoingActivities = eventsList.filter((e) => {
                                const isAssigned = e.assignedOrganizationId === selectedOrgObj.id
                                const isUnderDept =
                                  isDept &&
                                  e.eventType === 'organization' &&
                                  e.parentDepartmentId === selectedOrgObj.id
                                return (isAssigned || isUnderDept) && e.status === 'ongoing'
                              })
                              const upcomingActivities = eventsList.filter((e) => {
                                const isAssigned = e.assignedOrganizationId === selectedOrgObj.id
                                const isUnderDept =
                                  isDept &&
                                  e.eventType === 'organization' &&
                                  e.parentDepartmentId === selectedOrgObj.id
                                return (
                                  (isAssigned || isUnderDept) &&
                                  (e.status === 'scheduled' || e.status === 'planned')
                                )
                              })
                              const completedActivities = eventsList.filter((e) => {
                                const isAssigned = e.assignedOrganizationId === selectedOrgObj.id
                                const isUnderDept =
                                  isDept &&
                                  e.eventType === 'organization' &&
                                  e.parentDepartmentId === selectedOrgObj.id
                                return (isAssigned || isUnderDept) && e.status === 'completed'
                              })

                              return (
                                <div className="space-y-6">
                                  {/* Profile Details Card (Full Width) */}
                                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col space-y-4 w-full relative overflow-hidden">
                                    {isDept && selectedOrgObj.logo && (
                                      <div className="absolute right-[-10px] bottom-[-26px] w-[500px] h-[270px] opacity-50 pointer-events-none select-none z-0 overflow-hidden">
                                        <img
                                          src={selectedOrgObj.logo}
                                          alt=""
                                          className="w-full h-[500px] object-contain object-top"
                                        />
                                      </div>
                                    )}

                                    <div className="pb-3 flex items-center justify-between flex-wrap gap-2 relative z-10">
                                      <h3 className="font-bold text-navy-blue text-sm flex items-center gap-2">
                                        {isDept ? (
                                          <Users className="w-4 h-4 text-sig-green" />
                                        ) : (
                                          <Sparkles className="w-4 h-4 text-sig-green" />
                                        )}
                                        {isDept
                                          ? 'Department Profile Details'
                                          : 'Organization Profile Details'}
                                      </h3>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() =>
                                            setSelectedOrgSubTab(
                                              isDept ? 'department' : 'organization'
                                            )
                                          }
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-blue text-white hover:opacity-90 text-xs font-semibold rounded-xl transition cursor-pointer"
                                        >
                                          Return to {isDept ? 'Department' : 'Organization'}{' '}
                                          Directory
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleEditOrgClick(selectedOrgObj)
                                          }}
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-blue/5 hover:bg-navy-blue/10 text-navy-blue text-xs font-semibold rounded-xl transition cursor-pointer"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                                        </button>
                                        <button
                                          onClick={() => handleDeleteOrg(selectedOrgObj.id)}
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold rounded-xl transition cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" /> Delete{' '}
                                          {isDept ? 'Department' : 'Organization'}
                                        </button>
                                      </div>
                                    </div>
                                    <div className="border-b border-gray-100 w-[60%] relative z-10" />

                                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
                                      {isDept && (
                                        <div className="w-24 h-24 rounded-3xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                                          {selectedOrgObj.logo ? (
                                            <img
                                              src={selectedOrgObj.logo}
                                              alt={`${selectedOrgObj.name} logo`}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <span className="text-2xl font-bold text-navy-blue/70">
                                              {selectedOrgObj.abbreviation?.toUpperCase()}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      <div className="flex flex-wrap gap-x-16 gap-y-4 flex-1">
                                        <div>
                                          <p className="text-[10px] uppercase font-bold text-gray-400">
                                            {isDept ? 'Department Name' : 'Organization Name'}
                                          </p>
                                          <p className="text-sm font-semibold text-navy-blue mt-0.5">
                                            {selectedOrgObj.name}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-[10px] uppercase font-bold text-gray-400">
                                            Abbreviation
                                          </p>
                                          <p className="text-sm font-semibold text-navy-blue mt-0.5">
                                            {selectedOrgObj.abbreviation?.toUpperCase()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="w-[45%] border-t border-gray-300 relative z-10" />
                                    <div className="pt-2 relative z-10">
                                      <p className="text-[10px] uppercase font-bold text-gray-400">
                                        Description
                                      </p>
                                      <p className="text-xs text-gray-600 mt-1 leading-relaxed font-medium max-w-sm wrap-break-word whitespace-pre-wrap">
                                        {selectedOrgObj.description || 'No description provided.'}
                                      </p>
                                    </div>

                                    {isDept && (
                                      <>
                                        <div className="w-[45%] border-t border-gray-300 relative z-10" />
                                        <div className="pt-2 relative z-10">
                                          <p className="text-[10px] uppercase font-bold text-gray-400">
                                            Organizations under this Department
                                          </p>
                                          {(() => {
                                            const orgsUnderDept = [
                                              ...new Set(
                                                eventsList
                                                  .filter(
                                                    (evt) =>
                                                      evt.eventType === 'organization' &&
                                                      evt.parentDepartmentId === selectedOrgObj.id
                                                  )
                                                  .map((evt) => evt.organizationName)
                                                  .filter(Boolean)
                                              )
                                            ]
                                            if (orgsUnderDept.length === 0) {
                                              return (
                                                <p className="text-xs text-gray-400 mt-1">
                                                  No organizations recorded under this department.
                                                </p>
                                              )
                                            }
                                            return (
                                              <div className="flex flex-wrap gap-2 mt-1.5">
                                                {orgsUnderDept.map((orgName, idx) => (
                                                  <span
                                                    key={idx}
                                                    className="bg-sig-green/10 text-navy-blue text-xs font-semibold px-2.5 py-1 rounded-full"
                                                  >
                                                    {orgName}
                                                  </span>
                                                ))}
                                              </div>
                                            )
                                          })()}
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* Activities & Statistics (Same Row Grid) */}
                                  <div
                                    className={`grid grid-cols-1 ${
                                      isDept ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
                                    } gap-6`}
                                  >
                                    {/* Ongoing Activities */}
                                    {!isDept && (
                                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                                        <h4 className="font-bold text-navy-blue text-xs border-b border-gray-100 pb-2 flex items-center justify-between">
                                          <span>Ongoing Activities</span>
                                          <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                                            {ongoingActivities.length} Active
                                          </span>
                                        </h4>
                                        {ongoingActivities.length === 0 ? (
                                          <p className="text-center py-6 text-gray-400 text-xs font-medium">
                                            No ongoing activities.
                                          </p>
                                        ) : (
                                          <div className="space-y-3">
                                            {ongoingActivities.map((act) => {
                                              const orgLabel =
                                                act.eventType === 'organization'
                                                  ? act.organizationName
                                                  : orgsList.find(
                                                      (o) => o.id === act.assignedOrganizationId
                                                    )?.abbreviation || 'CES'
                                              return (
                                                <div
                                                  key={act.id}
                                                  className="p-3 bg-gray-50/50 border border-gray-100 rounded-2xl flex justify-between items-center gap-2"
                                                >
                                                  <div className="min-w-0 flex-1 pr-1 text-left">
                                                    <p className="text-xs font-bold text-navy-blue truncate">
                                                      {act.title || act.name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-medium truncate">
                                                      {act.date ||
                                                        (act.scheduleDate
                                                          ? new Date(
                                                              act.scheduleDate
                                                            ).toLocaleDateString()
                                                          : '')}{' '}
                                                      • {act.location}
                                                    </p>
                                                  </div>
                                                  <span className="bg-navy-blue/5 text-navy-blue text-[8px] font-bold px-2 py-1 rounded shrink-0">
                                                    {orgLabel}
                                                  </span>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Upcoming Activities */}
                                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                                      <h4 className="font-bold text-navy-blue text-xs border-b border-gray-100 pb-2 flex items-center justify-between">
                                        <span>Upcoming Activities</span>
                                        <span className="bg-blue-100 text-blue-800 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                                          {upcomingActivities.length} Scheduled
                                        </span>
                                      </h4>
                                      {upcomingActivities.length === 0 ? (
                                        <p className="text-center py-6 text-gray-400 text-xs font-medium">
                                          No upcoming activities.
                                        </p>
                                      ) : (
                                        <div className="space-y-3">
                                          {upcomingActivities.map((act) => {
                                            const orgLabel =
                                              act.eventType === 'organization'
                                                ? act.organizationName
                                                : orgsList.find(
                                                    (o) => o.id === act.assignedOrganizationId
                                                  )?.abbreviation || 'CES'
                                            return (
                                              <div
                                                key={act.id}
                                                className="p-3 bg-gray-50/50 border border-gray-100 rounded-2xl flex justify-between items-center gap-2"
                                              >
                                                <div className="min-w-0 flex-1 pr-1 text-left">
                                                  <p className="text-xs font-bold text-navy-blue truncate">
                                                    {act.title || act.name}
                                                  </p>
                                                  <p className="text-[10px] text-gray-400 font-medium truncate">
                                                    {act.date ||
                                                      (act.scheduleDate
                                                        ? new Date(
                                                            act.scheduleDate
                                                          ).toLocaleDateString()
                                                        : '')}{' '}
                                                    • {act.location}
                                                  </p>
                                                </div>
                                                <span className="bg-navy-blue/5 text-navy-blue text-[8px] font-bold px-2 py-1 rounded shrink-0">
                                                  {orgLabel}
                                                </span>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>

                                    {/* Outreach Statistics */}
                                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                                      <h4 className="font-bold text-navy-blue text-xs border-b border-gray-100 pb-2 text-left">
                                        Outreach Statistics
                                      </h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-navy-blue/5 p-3 rounded-2xl flex flex-col justify-between h-20 text-left">
                                          <span className="text-[9px] font-bold text-navy-blue uppercase">
                                            Total Scheduled
                                          </span>
                                          <span className="text-xl font-bold text-navy-blue">
                                            {upcomingActivities.length + ongoingActivities.length}
                                          </span>
                                        </div>
                                        <div
                                          onClick={() => handleOpenCompletedModal(selectedOrgObj)}
                                          className="bg-sig-green/10 p-3 rounded-2xl flex flex-col justify-between h-20 text-left cursor-pointer hover:bg-sig-green/20 hover:shadow-xs transition duration-200"
                                        >
                                          <span className="text-[9px] font-bold text-navy-blue uppercase">
                                            Completed Activities
                                          </span>
                                          <span className="text-xl font-bold text-navy-blue">
                                            {completedActivities.length}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })()}
                          </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ADD / EDIT ORGANIZATION MODAL */}
                    <AnimatedModal
                      isOpen={isAddOrgModalOpen}
                      onClose={handleCancelOrgEdit}
                      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal-overlay"
                      contentClassName="glass-modal rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-navy-blue text-base">
                          {editingOrg ? 'Update Organization Profile' : 'Register New Organization'}
                        </h3>
                        <button
                          onClick={handleCancelOrgEdit}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <form onSubmit={handleCreateOrg} className="space-y-4">
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">
                            Organization Name
                          </label>
                          <input
                            type="text"
                            value={orgName}
                            onChange={(e) => {
                              setOrgName(e.target.value)
                              setOrgErrors((prev) => {
                                const copy = { ...prev }
                                delete copy.orgName
                                return copy
                              })
                            }}
                            placeholder="Supreme Student Council"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${orgErrors.orgName ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                          {orgErrors.orgName && (
                            <p className="text-red-500 text-[10px] mt-1 font-semibold">
                              {orgErrors.orgName}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">
                            Abbreviation
                          </label>
                          <input
                            type="text"
                            value={orgAbbr}
                            onChange={(e) => {
                              setOrgAbbr(e.target.value.toUpperCase())
                              setOrgErrors((prev) => {
                                const copy = { ...prev }
                                delete copy.orgAbbr
                                return copy
                              })
                            }}
                            placeholder="SSC"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${orgErrors.orgAbbr ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                          {orgErrors.orgAbbr && (
                            <p className="text-red-500 text-[10px] mt-1 font-semibold">
                              {orgErrors.orgAbbr}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">
                            Description
                          </label>
                          <textarea
                            value={orgDesc}
                            onChange={(e) => setOrgDesc(e.target.value)}
                            placeholder="Student leadership and outreach programs"
                            className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-medium text-navy-blue h-20 resize-none"
                          />
                        </div>

                        <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={handleCancelOrgEdit}
                            className="flex-1 bg-gray-100 hover:bg-red-500 hover:text-white text-gray-700 font-semibold py-2 px-4 rounded-full text-xs transition cursor-pointer text-center"
                            style={{ height: '40px' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition cursor-pointer flex items-center justify-center gap-1.5"
                            style={{ height: '40px' }}
                          >
                            {editingOrg ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            {editingOrg ? 'Save Changes' : 'Save Organization'}
                          </button>
                        </div>
                      </form>
                    </AnimatedModal>

                    {/* ADD / EDIT DEPARTMENT MODAL */}
                    <AnimatedModal
                      isOpen={isAddDeptModalOpen}
                      onClose={handleCancelOrgEdit}
                      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal-overlay"
                      contentClassName="glass-modal rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-navy-blue text-base">
                          {editingOrg ? 'Update Department Profile' : 'Register New Department'}
                        </h3>
                        <button
                          onClick={handleCancelOrgEdit}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <form onSubmit={handleCreateOrg} className="space-y-4">
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">
                            Department Name
                          </label>
                          <input
                            type="text"
                            value={orgName}
                            onChange={(e) => {
                              setOrgName(e.target.value)
                              setDeptErrors((prev) => {
                                const copy = { ...prev }
                                delete copy.orgName
                                return copy
                              })
                            }}
                            placeholder="College of Business Administration"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${deptErrors.orgName ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                          {deptErrors.orgName && (
                            <p className="text-red-500 text-[10px] mt-1 font-semibold">
                              {deptErrors.orgName}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">
                            Abbreviation
                          </label>
                          <input
                            type="text"
                            value={orgAbbr}
                            onChange={(e) => {
                              setOrgAbbr(e.target.value.toUpperCase())
                              setDeptErrors((prev) => {
                                const copy = { ...prev }
                                delete copy.orgAbbr
                                return copy
                              })
                            }}
                            placeholder="CBA"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${deptErrors.orgAbbr ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                          {deptErrors.orgAbbr && (
                            <p className="text-red-500 text-[10px] mt-1 font-semibold">
                              {deptErrors.orgAbbr}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">
                            Description
                          </label>
                          <textarea
                            value={orgDesc}
                            onChange={(e) => setOrgDesc(e.target.value)}
                            placeholder="IT Literacy Extension services"
                            className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-medium text-navy-blue h-20 resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">
                            Department Logo
                          </label>
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                              {deptLogo ? (
                                <img
                                  src={deptLogo}
                                  alt="Logo preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Users className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            <label
                              htmlFor="dept-logo-upload"
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-navy-blue text-xs font-bold rounded-xl transition cursor-pointer"
                            >
                              Upload Logo
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onloadend = () => {
                                    setDeptLogo(reader.result)
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }}
                              className="hidden"
                              id="dept-logo-upload"
                            />
                            {deptLogo && (
                              <button
                                type="button"
                                onClick={() => setDeptLogo('')}
                                className="text-red-500 text-xs font-bold cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={handleCancelOrgEdit}
                            className="flex-1 bg-gray-100 hover:bg-red-500 hover:text-white text-gray-700 font-semibold py-2 px-4 rounded-full text-xs transition cursor-pointer text-center"
                            style={{ height: '40px' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition cursor-pointer flex items-center justify-center gap-1.5"
                            style={{ height: '40px' }}
                          >
                            {editingOrg ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            {editingOrg ? 'Save Changes' : 'Save Department'}
                          </button>
                        </div>
                      </form>
                    </AnimatedModal>
                  </div>
                )}

                {/* ==================================================== */}
                {/* NARRATIVES REVIEW QUEUE TAB PANEL */}
                {/* ==================================================== */}
                {activeTab === 'reports' && user.role === 'admin' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="pb-1">
                      <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                        Narrative Reports Queue
                      </h1>
                    </div>

                    {/* List panel */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                      <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 mb-4">
                        Pending Review Queue
                      </h3>

                      <div className="space-y-3">
                        {reportsList
                          .filter(
                            (r) =>
                              r.status === 'submitted' ||
                              r.status === 'approved' ||
                              r.status === 'returned'
                          )
                          .map((rep) => {
                            const event = eventsList.find((e) => e.id === rep.eventId)
                            const org = orgsList.find((o) => o.id === rep.organizationId)
                            const author = usersList.find((u) => u.uid === rep.authorId)

                            return (
                              <div
                                key={rep.id}
                                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50/50 hover:bg-white border border-gray-100 hover:border-sig-green/30 rounded-2xl transition duration-200"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={`inline-block text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                        rep.status === 'approved'
                                          ? 'bg-green-100 text-green-800'
                                          : rep.status === 'submitted'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {rep.status}
                                    </span>
                                    <span className="text-[10px] text-navy-blue font-bold">
                                      {org
                                        ? org.name
                                        : rep.organizationId
                                          ? 'Unknown Department'
                                          : 'CES Office'}{' '}
                                      ({org ? org.abbreviation : rep.organizationId ? '' : 'CES'})
                                    </span>
                                    <span className="text-[10px] text-gray-400">·</span>
                                    <span className="text-[10px] text-gray-500">
                                      {rep.semester} | {rep.academicYear}
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-navy-blue text-sm">
                                    {event ? event.name : rep.activityTitle || 'Outreach Activity'}
                                  </h4>
                                  <div className="text-[10px] text-gray-400">
                                    Submitted by {author ? author.name : 'Coordinator'} on{' '}
                                    {new Date(rep.updatedAt).toLocaleDateString()}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                                  <button
                                    onClick={() => {
                                      setSelectedReport(rep)
                                      setFeedbackNote('')
                                    }}
                                    className="bg-white hover:bg-gray-50 text-navy-blue border border-gray-200 font-semibold py-1.5 px-3 rounded-full text-[11px] flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Inspect Report</span>
                                  </button>
                                  {rep.status === 'approved' && (
                                    <button
                                      onClick={() => compileReportPDF(rep)}
                                      className="bg-sig-green text-navy-blue font-semibold py-1.5 px-3 rounded-full text-[11px] flex items-center space-x-1 hover:opacity-90 cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Export PDF</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        {reportsList.filter(
                          (r) =>
                            r.status === 'submitted' ||
                            r.status === 'approved' ||
                            r.status === 'returned'
                        ).length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-xs">
                            No reports submitted for review yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================================================== */}
                {/* USER ACCOUNT MANAGEMENT TAB PANEL */}
                {/* ==================================================== */}
                {activeTab === 'accounts' && user.role === 'admin' && (
                  <div className="space-y-6 animate-fade-in w-full">
                    {/* Header section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
                      <div>
                        <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                          User Account Management
                        </h1>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          Manage system access, roles, and coordinator accounts.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingUser(null)
                          setCoordFirstName('')
                          setCoordLastName('')
                          setCoordEmail('')
                          setCoordRole('office_coordinator')
                          setCoordOrgId('')
                          setDeptSearchVal('')
                          setCoordErrors({})
                          setIsAddUserModalOpen(true)
                        }}
                        className="flex items-center space-x-1.5 bg-navy-blue hover:bg-navy-blue-600 text-white rounded-lg text-xs font-semibold py-2 px-4 border border-navy-blue shadow-xs transition-all duration-150 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add User</span>
                      </button>
                    </div>

                    {/* Full Width User Accounts Directory Table */}
                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="font-bold text-navy-blue text-sm border-b border-gray-200/60 pb-3 mb-4">
                        User Accounts Directory
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200/60 bg-gray-50/80 text-[10px] uppercase font-bold text-gray-500">
                              <th className="py-3 px-3">Full Name</th>
                              <th className="py-3 px-2">Role</th>
                              <th className="py-3 px-2">Assigned Org</th>
                              <th className="py-3 px-2">Status</th>
                              <th className="py-3 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-xs">
                            {usersList.map((u) => {
                              const org = orgsList.find((o) => o.id === u.organizationId)
                              const isSelf = u.uid === user.uid
                              return (
                                <tr key={u.uid} className="hover:bg-gray-50/60 transition">
                                  <td className="py-3.5 px-3 font-semibold text-navy-blue">
                                    <div>
                                      {u.name}{' '}
                                      {isSelf && (
                                        <span className="text-[9px] bg-navy-blue/10 text-navy-blue px-1.5 py-0.2 rounded font-bold ml-1">
                                          You
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-normal">
                                      {u.email}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-2 text-gray-600 font-medium capitalize">
                                    {u.role.replace('_', ' ')}
                                  </td>
                                  <td className="py-3.5 px-2 font-medium">
                                    {org
                                      ? org.abbreviation
                                      : u.organizationId
                                        ? u.organizationId
                                        : u.role === 'admin'
                                          ? 'System Admin'
                                          : 'CES Office'}
                                  </td>
                                  <td className="py-3.5 px-2">
                                    <span
                                      className={`inline-block text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                        u.status === 'inactive'
                                          ? 'bg-red-50 text-red-700 border border-red-200'
                                          : 'bg-green-50 text-green-700 border border-green-200'
                                      }`}
                                    >
                                      {u.status || 'active'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-3 text-right space-x-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingUser(u)
                                        const nameParts = (u.name || '').trim().split(' ')
                                        let first = ''
                                        let last = ''
                                        if (nameParts.length > 1) {
                                          last = nameParts.pop()
                                          first = nameParts.join(' ')
                                        } else {
                                          first = u.name || ''
                                          last = ''
                                        }
                                        setCoordFirstName(first)
                                        setCoordLastName(last)
                                        setCoordName(u.name || '')
                                        setCoordEmail(u.email || '')
                                        setCoordUsername(u.username || '')
                                        setCoordRole(u.role)
                                        setCoordOrgId(u.organizationId || '')
                                        const matchedOrg = orgsList.find(
                                          (o) => o.id === u.organizationId
                                        )
                                        setDeptSearchVal(
                                          matchedOrg ? matchedOrg.name : u.organizationId || ''
                                        )
                                        setCoordErrors({})
                                        setIsAddUserModalOpen(true)
                                      }}
                                      className="py-1 px-2.5 rounded-lg text-xs font-semibold border bg-white hover:bg-gray-50 text-navy-blue border-gray-200 shadow-2xs transition-all duration-150 cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    {u.role === 'office_coordinator' && (
                                      <button
                                        type="button"
                                        onClick={() => handleSendCoordinatorReset(u)}
                                        className="py-1 px-2.5 rounded-lg text-xs font-semibold border bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/80 shadow-2xs transition-all duration-150 cursor-pointer"
                                      >
                                        Reset Password
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      disabled={isSelf}
                                      onClick={() =>
                                        handleToggleStatus(u.uid, u.status || 'active')
                                      }
                                      className={`py-1 px-2.5 rounded-lg text-xs font-semibold border shadow-2xs transition-all duration-150 cursor-pointer ${
                                        isSelf
                                          ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200'
                                          : u.status === 'inactive'
                                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                      }`}
                                    >
                                      {u.status === 'inactive' ? 'Activate' : 'Deactivate'}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isSelf}
                                      onClick={() => handleDeleteUser(u)}
                                      className={`py-1 px-2.5 rounded-lg text-xs font-semibold border shadow-2xs transition-all duration-150 cursor-pointer ${
                                        isSelf
                                          ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200'
                                          : 'bg-red-50 hover:bg-red-500 hover:text-white text-red-600 border-red-200/80'
                                      }`}
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================================================== */}
                {/* ABOUT TAB PANEL */}
                {/* ==================================================== */}
                {activeTab === 'about' && (
                  <div className="space-y-6 animate-fade-in w-full text-left">
                    {/* Header section */}
                    <div className="pb-1">
                      <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                        About DommUnity
                      </h1>
                    </div>

                    {/* System & Office Info Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column - System and CES Details */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                          <h2 className="text-lg font-bold text-navy-blue border-b border-gray-100 pb-3">
                            System Information
                          </h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                                System Name
                              </span>
                              <span className="text-sm font-semibold text-navy-blue">
                                DommUnity
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                                Version
                              </span>
                              <span className="text-sm font-semibold text-navy-blue">1.0.0</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                              Project Description
                            </span>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                              DommUnity is a desktop-based management system developed for the
                              Community Extension & Services (CES) Office of Dominican College of
                              Tarlac, Inc. It streamlines community extension operations by
                              automating inventory tracking (with FIFO & expiration management),
                              donor records, event scheduling, and narrative report generation.
                            </p>
                          </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                          <h2 className="text-lg font-bold text-navy-blue border-b border-gray-100 pb-3">
                            Community Extension & Services (CES) Office
                          </h2>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                              Vision & Mission
                            </span>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                              The Community Extension & Services (CES) Office is responsible for
                              community involvement, engagement, and reform towards sustainable
                              development. It transforms both institutional and academic values into
                              ground-level exposure and applications, addressing significant and
                              relevant challenges and problems of the local community, making
                              education a pertinent medium for social and ecological improvement.
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                              Core Advocacy Areas (CEAP JEEPGY)
                            </span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {[
                                'Justice and Peace',
                                'Care for the Environment',
                                'Active Citizenship',
                                'Poverty Awareness',
                                'Gender Equality',
                                'Youth Empowerment'
                              ].map((adv, idx) => (
                                <span
                                  key={idx}
                                  className="bg-sig-green/10 text-navy-blue text-xs font-semibold px-3 py-1 rounded-full"
                                >
                                  {adv}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Org Chart & Proponents */}
                      <div className="space-y-6">
                        {/* CES Organizational Chart */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                          <h2 className="text-lg font-bold text-navy-blue border-b border-gray-100 pb-3">
                            CES Org Hierarchy
                          </h2>
                          <div className="space-y-3">
                            {[
                              { name: 'Sr. Lorna I. Ablog, O.P.', role: 'School Administrator' },
                              {
                                name: 'Dr. Augusto R. Dela Cruz',
                                role: 'Vice President of Academic Affairs'
                              },
                              {
                                name: 'Mrs. Faithful Anne F. Arugay',
                                role: 'Head of the CES Office'
                              },
                              { name: 'Mr. Jonnel B. Manio', role: 'Coordinator of the CES Office' }
                            ].map((person, idx) => (
                              <div
                                key={idx}
                                className="p-2 border-b border-gray-50 last:border-0 text-left"
                              >
                                <p className="text-xs font-bold text-navy-blue">{person.name}</p>
                                <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                                  {person.role}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Developers section */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                          <h2 className="text-lg font-bold text-navy-blue border-b border-gray-100 pb-3">
                            Development System
                          </h2>
                          <div className="space-y-3">
                            {[
                              { name: 'Benidict Justin Salunga', role: 'Lead Programmer' },
                              { name: 'Mc Harry Tolentino', role: 'Project Manager' },
                              { name: 'Aron Stefan Taruc', role: 'UI-UX Designer' },
                              { name: 'John Harold Santos', role: 'Tester' }
                            ].map((dev, idx) => (
                              <div
                                key={idx}
                                className="p-2 border-b border-gray-50 last:border-0 text-left"
                              >
                                <p className="text-xs font-bold text-navy-blue">{dev.name}</p>
                                <p className="text-[9px] text-gray-400 font-semibold mt-0.5">
                                  {dev.role}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AnimatedPage>
        </main>

        {/* ==================================================== */}
        {/* HIDDEN CES OFFICIAL PDF TEMPLATE CONVERTER */}
        {/* ==================================================== */}
        {exportingReport && (
          <div className="absolute top-[-9999px] left-[-9999px] pointer-events-none select-none opacity-0">
            <DocumentViewer
              report={exportingReport}
              onClose={() => setExportingReport(null)}
              eventsList={eventsList}
              orgsList={orgsList}
              usersList={usersList}
              isExportOnly={true}
              onExportFinished={() => setExportingReport(null)}
            />
          </div>
        )}

        {/* ==================================================== */}
        {/* CHRONOLOGICAL REPORT HISTORY PREVIEW OVERLAY */}
        {/* ==================================================== */}
        {showReportPreview && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-navy-blue/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 max-w-3xl w-full flex flex-col space-y-4 max-h-[85vh]">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-bold text-navy-blue text-sm uppercase tracking-wide">
                  Inventory History Report Preview
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReportPreview(false)}
                  className="text-gray-400 hover:text-navy-blue transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 min-h-[250px] max-h-[50vh] border border-gray-100 rounded-2xl p-4 bg-white">
                {/* Visual Preview Header (matches the PDF layout style) */}
                <div className="text-left mb-4 pb-2 border-b border-gray-100">
                  <h4 className="text-base font-bold text-gray-900 tracking-tight">
                    DOMINICAN COLLEGE OF TARLAC, INC.
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Community Extension & Services (CES) Office
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Inventory Transaction Log: {reportDate || new Date().toLocaleString()}
                  </p>
                  <div className="mt-3 border-t-2 border-[#8cc63f] w-full"></div>
                </div>

                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-bold text-[#0f2c59]">
                      <th className="py-2.5 px-2">Transaction Date</th>
                      <th className="py-2.5 px-2">Item Name</th>
                      <th className="py-2.5 px-2">Action Type</th>
                      <th className="py-2.5 px-2 text-right">Quantity</th>
                      <th className="py-2.5 px-2">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs">
                    {txHistory.map((tx, idx) => (
                      <tr key={tx.id || idx}>
                        <td className="py-2.5 px-2 text-gray-600">
                          {new Date(tx.date).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2 text-gray-800 font-semibold">{tx.itemName}</td>
                        <td className="py-2.5 px-2 font-medium">
                          {tx.action === 'added' ? (
                            <span className="text-[#2e7d32]">Added</span>
                          ) : tx.action === 'released' ? (
                            <span className="text-[#dc2626]">Released</span>
                          ) : (
                            <span className="text-[#dc2626] capitalize">{tx.action}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right text-gray-800 font-semibold">
                          {tx.quantity}
                        </td>
                        <td className="py-2.5 px-2 text-gray-600 capitalize">{tx.unit}</td>
                      </tr>
                    ))}
                    {txHistory.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-400">
                          No transaction history recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowReportPreview(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-full text-xs font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={handleConfirmDownloadPDF}
                  className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2.5 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition cursor-pointer"
                >
                  Confirm Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COMPLETED ACTIVITIES MODAL */}
        {completedActivitiesModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 w-full max-w-4xl shadow-2xl border border-gray-100 animate-scale-up space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-navy-blue text-lg">
                    Completed Outreach Activities
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    {completedActivitiesModal.selectedDeptId
                      ? `Showing activities for: ${completedActivitiesModal.selectedDeptName} (${completedActivitiesModal.selectedDeptAbbr})`
                      : 'Showing all completed activities across all departments'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCompletedActivitiesModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase font-bold text-gray-500 sticky top-0">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Event Name</th>
                      <th className="py-3 px-3">Assigned Department</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {(() => {
                      const completed = eventsList.filter((e) => {
                        const isMatch = e.status === 'completed'
                        if (!isMatch) return false
                        if (completedActivitiesModal.selectedDeptId) {
                          // Check if assigned or under department
                          const isAssigned =
                            e.assignedOrganizationId === completedActivitiesModal.selectedDeptId
                          const isUnderDept =
                            e.eventType === 'organization' &&
                            e.parentDepartmentId === completedActivitiesModal.selectedDeptId
                          return isAssigned || isUnderDept
                        }
                        return true
                      })

                      if (completed.length === 0) {
                        return (
                          <tr>
                            <td colSpan="5" className="text-center py-8 text-gray-400 font-medium">
                              No completed outreach activities found.
                            </td>
                          </tr>
                        )
                      }

                      return completed.map((evt) => {
                        const dept = orgsList.find((org) => org.id === evt.assignedOrganizationId)
                        return (
                          <tr key={evt.id} className="hover:bg-gray-50/50 transition">
                            <td className="py-3 px-3 font-semibold text-gray-600">
                              {evt.scheduleDate
                                ? new Date(evt.scheduleDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-navy-blue">{evt.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                                {evt.description}
                              </p>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-navy-blue">
                                {dept
                                  ? `${dept.name} (${dept.abbreviation})`
                                  : evt.organizationName || 'CES Office'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-gray-500 font-medium">
                              {evt.location || 'N/A'}
                            </td>
                            <td className="py-3 px-3">
                              <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                                {evt.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() =>
                    setCompletedActivitiesModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="px-5 py-2 border border-gray-200 text-gray-500 rounded-full text-xs font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* HIDDEN INVENTORY HISTORY PDF PRINT TARGET */}
        {/* ==================================================== */}
        <div className="absolute top-[-9999px] left-[-9999px]">
          <div
            id="inventory-history-pdf-target"
            className="w-[800px] bg-white p-10 text-gray-900 font-sans relative"
            style={{ boxSizing: 'border-box', backgroundColor: '#ffffff' }}
          >
            {/* Header Block */}
            <div className="text-left mb-4">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                DOMINICAN COLLEGE OF TARLAC, INC.
              </h1>
              <p className="text-sm text-gray-500 font-normal mt-1 leading-normal">
                Community Extension & Services (CES) Office
              </p>
              <p className="text-sm text-gray-500 font-normal mt-0.5 leading-normal">
                Inventory Transaction Log: {reportDate || new Date().toLocaleString()}
              </p>
              <div className="mt-4 border-t-2 border-[#8cc63f] w-full"></div>
            </div>

            <table className="w-full text-left border-collapse text-xs mt-6">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-bold text-[#0f2c59]">
                  <th className="py-3 px-2">Transaction Date</th>
                  <th className="py-3 px-2">Item Name</th>
                  <th className="py-3 px-2">Action Type</th>
                  <th className="py-3 px-2 text-right">Quantity</th>
                  <th className="py-3 px-2">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {txHistory.map((tx, idx) => (
                  <tr key={tx.id || idx} className="text-xs">
                    <td className="py-3 px-2 text-gray-700">
                      {new Date(tx.date).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-gray-800 font-semibold">{tx.itemName}</td>
                    <td className="py-3 px-2 font-medium">
                      {tx.action === 'added' ? (
                        <span className="text-[#2e7d32]">Added</span>
                      ) : tx.action === 'released' ? (
                        <span className="text-[#dc2626]">Released</span>
                      ) : (
                        <span className="text-[#dc2626] capitalize">{tx.action}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-800 font-semibold">
                      {tx.quantity}
                    </td>
                    <td className="py-3 px-2 text-gray-700 capitalize">{tx.unit}</td>
                  </tr>
                ))}
                {txHistory.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400">
                      No transaction records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* REGISTER DONATION BATCH MODAL */}
      {isDonationModalOpen && (
        <div className="fixed inset-0 glass-modal-overlay flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-modal rounded-2xl p-6 max-w-4xl w-full shadow-2xl border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in-scale">
            <div className="flex items-center justify-between border-b border-gray-200/60 pb-3 text-left">
              <h3 className="font-bold text-navy-blue text-base">Register Donation Batch</h3>
              <button
                type="button"
                onClick={handleCloseDonationModal}
                className="text-gray-400 hover:text-navy-blue transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 mb-4">
              Log Donation Batch
            </h3>

            <form onSubmit={handleCreateDonation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1">
                    Donor Name
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => {
                      setDonorName(e.target.value)
                      setDonErrors((prev) => {
                        const copy = { ...prev }
                        if (copy.fields) {
                          copy.fields = { ...copy.fields }
                          delete copy.fields.donorName
                        }
                        return copy
                      })
                    }}
                    placeholder="Donor Name"
                    className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${donErrors.fields?.donorName ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                    style={{ height: '40px' }}
                  />
                  {donErrors.fields?.donorName && (
                    <p className="text-red-500 text-[10px] mt-1 font-semibold">
                      {donErrors.fields.donorName}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-gray-700 text-xs font-semibold mb-1">
                    Donor Type
                  </label>
                  <input
                    type="text"
                    value={donorType}
                    onChange={(e) => {
                      setDonorType(e.target.value)
                      setDonErrors((prev) => {
                        const copy = { ...prev }
                        if (copy.fields) {
                          copy.fields = { ...copy.fields }
                          delete copy.fields.donorType
                        }
                        return copy
                      })
                    }}
                    onFocus={() => setIsDonorTypeSuggestionsOpen(true)}
                    onBlur={() => setTimeout(() => setIsDonorTypeSuggestionsOpen(false), 200)}
                    placeholder="Donor Type"
                    className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${donErrors.fields?.donorType ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                    style={{ height: '40px' }}
                  />
                  {donErrors.fields?.donorType && (
                    <p className="text-red-500 text-[10px] mt-1 font-semibold">
                      {donErrors.fields.donorType}
                    </p>
                  )}
                  {isDonorTypeSuggestionsOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                      <div className="py-1">
                        {(() => {
                          const suggestions = [
                            ...new Set([
                              'external_sponsor',
                              'internal_department',
                              'individual',
                              ...donorsList.map((d) => d.type)
                            ])
                          ]
                            .filter(Boolean)
                            .filter((type) => !deletedDonorTypes.includes(type))
                          const filtered = suggestions.filter(
                            (type) =>
                              !donorType || type.toLowerCase().includes(donorType.toLowerCase())
                          )
                          if (filtered.length === 0) {
                            return null
                          }
                          return filtered.map((type) => (
                            <div
                              key={type}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setDonorType(type)
                                setDonErrors((prev) => {
                                  const copy = { ...prev }
                                  if (copy.fields) {
                                    copy.fields = { ...copy.fields }
                                    delete copy.fields.donorType
                                  }
                                  return copy
                                })
                                setIsDonorTypeSuggestionsOpen(false)
                              }}
                              className="p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold flex justify-between items-center"
                            >
                              <span>{type}</span>
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const updated = [...deletedDonorTypes, type]
                                  setDeletedDonorTypes(updated)
                                  localStorage.setItem(
                                    'dommunity_deleted_donor_types',
                                    JSON.stringify(updated)
                                  )
                                }}
                                className="text-gray-400 hover:text-red-500 font-bold transition p-0.5 rounded hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  fontSize: '10px'
                                }}
                                title="Delete suggestion"
                              >
                                ✕
                              </button>
                            </div>
                          ))
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1">
                    Donation Date
                  </label>
                  <div
                    className={
                      donErrors.fields?.donDate
                        ? 'border border-red-500 rounded-xl p-0.5 ring-2 ring-red-500/10'
                        : ''
                    }
                  >
                    <GlassDatePicker
                      value={donDate}
                      onChange={(val) => {
                        setDonDate(val)
                        setDonErrors((prev) => {
                          const copy = { ...prev }
                          if (copy.fields) {
                            copy.fields = { ...copy.fields }
                            delete copy.fields.donDate
                          }
                          return copy
                        })
                      }}
                      showTime={false}
                      placeholder="dd/mm/yyyy"
                    />
                  </div>
                  {donErrors.fields?.donDate && (
                    <p className="text-red-500 text-[10px] mt-1 font-semibold">
                      {donErrors.fields.donDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1">
                    Purpose / Outreach
                  </label>
                  <input
                    type="text"
                    value={donPurpose}
                    onChange={(e) => {
                      setDonPurpose(e.target.value)
                      setDonErrors((prev) => {
                        const copy = { ...prev }
                        if (copy.fields) {
                          copy.fields = { ...copy.fields }
                          delete copy.fields.donPurpose
                        }
                        return copy
                      })
                    }}
                    placeholder="Purpose"
                    className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${donErrors.fields?.donPurpose ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                    style={{ height: '40px' }}
                  />
                  {donErrors.fields?.donPurpose && (
                    <p className="text-red-500 text-[10px] mt-1 font-semibold">
                      {donErrors.fields.donPurpose}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1">
                    General Description
                  </label>
                  <input
                    type="text"
                    value={donDesc}
                    onChange={(e) => setDonDesc(e.target.value)}
                    placeholder="Hygiene soap packages donated"
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none"
                    style={{ height: '40px' }}
                  />
                </div>
              </div>

              {/* Batch items list inputs */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-navy-blue">Items Contributed</h4>
                  <button
                    type="button"
                    onClick={handleAddDonItemLine}
                    className="flex items-center gap-1.5 bg-navy-blue text-white rounded-full text-xs font-semibold px-4 py-2 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Line</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {donItems.map((item, idx) => {
                    const parsedQty = parseInt(item.quantity, 10)
                    const unitLower = (item.unit || '').toLowerCase().trim()
                    const isAlreadyGrouped = [
                      'pack',
                      'packs',
                      'box',
                      'boxes',
                      'bundle',
                      'bundles'
                    ].includes(unitLower)
                    const isSchoolSupplies =
                      (item.category || '').toLowerCase().trim() === 'school supplies'

                    return (
                      <div
                        key={idx}
                        className="border border-gray-150 rounded-2xl p-4 bg-gray-50/30 space-y-4 relative shadow-sm"
                      >
                        {/* Card Header */}
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <span className="text-xs font-bold text-navy-blue">Item #{idx + 1}</span>
                          {donItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDonItemLine(idx)}
                              className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>

                        {/* Form Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Item Name */}
                          <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1">
                              Item Name
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  handleDonItemChange(idx, 'name', e.target.value)
                                  setDonErrors((prev) => {
                                    const copy = { ...prev }
                                    if (copy.items && copy.items[idx]) {
                                      copy.items = [...copy.items]
                                      copy.items[idx] = { ...copy.items[idx] }
                                      delete copy.items[idx].name
                                    }
                                    return copy
                                  })
                                  setActiveDonItemSuggestionsIdx(idx)
                                }}
                                onFocus={() => setActiveDonItemSuggestionsIdx(idx)}
                                onBlur={() =>
                                  setTimeout(() => setActiveDonItemSuggestionsIdx(null), 200)
                                }
                                placeholder="e.g. Corned Beef, Notebooks"
                                className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${donErrors?.items?.[idx]?.name ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                style={{ height: '40px' }}
                              />
                              {donErrors?.items?.[idx]?.name && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                  {donErrors.items[idx].name}
                                </p>
                              )}
                              {activeDonItemSuggestionsIdx === idx && item.name && (
                                <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                  {(() => {
                                    const matching = inventoryList.filter((invItem) =>
                                      invItem.name.toLowerCase().includes(item.name.toLowerCase())
                                    )
                                    const uniqueNames = [
                                      ...new Set(matching.map((invItem) => invItem.name))
                                    ]
                                    if (uniqueNames.length === 0) return null
                                    return (
                                      <div className="py-1">
                                        {uniqueNames.map((name) => {
                                          const originalItem = matching.find(
                                            (invItem) => invItem.name === name
                                          )
                                          return (
                                            <div
                                              key={name}
                                              onMouseDown={(e) => e.preventDefault()}
                                              onClick={() => {
                                                const list = [...donItems]
                                                list[idx].name = name
                                                if (originalItem) {
                                                  list[idx].category = originalItem.category || ''
                                                  list[idx].unit = originalItem.unit || ''
                                                  list[idx].piecesPerUnit =
                                                    originalItem.piecesPerUnit
                                                      ? originalItem.piecesPerUnit.toString()
                                                      : ''
                                                  list[idx].groupUnit =
                                                    originalItem.groupUnit || 'none'
                                                }
                                                setDonItems(list)
                                                setDonErrors((prev) => {
                                                  const copy = { ...prev }
                                                  if (copy.items && copy.items[idx]) {
                                                    copy.items = [...copy.items]
                                                    copy.items[idx] = {}
                                                  }
                                                  return copy
                                                })
                                                setActiveDonItemSuggestionsIdx(null)
                                              }}
                                              className="p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left animate-fade-in"
                                            >
                                              {name}{' '}
                                              {originalItem?.category && (
                                                <span className="text-[10px] text-gray-400 font-normal">
                                                  ({originalItem.category})
                                                </span>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Category Searchable Dropdown */}
                          <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1">
                              Category
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={item.category}
                                onFocus={() => {
                                  prevDonCategoryRef.current = {
                                    idx,
                                    value: item.category
                                  }
                                  handleDonItemChange(idx, 'category', '')
                                  setActiveDonItemCategoryIdx(idx)
                                }}
                                onBlur={() =>
                                  setTimeout(() => {
                                    setActiveDonItemCategoryIdx(null)
                                    if (prevDonCategoryRef.current.idx === idx) {
                                      const currentItem = donItems[idx]
                                      if (currentItem) {
                                        handleDonItemChange(
                                          idx,
                                          'category',
                                          currentItem.category
                                            ? currentItem.category
                                            : prevDonCategoryRef.current.value
                                        )
                                      }
                                    }
                                  }, 200)
                                }
                                onChange={(e) => {
                                  handleDonItemChange(idx, 'category', e.target.value)
                                  setDonErrors((prev) => {
                                    const copy = { ...prev }
                                    if (copy.items && copy.items[idx]) {
                                      copy.items = [...copy.items]
                                      copy.items[idx] = { ...copy.items[idx] }
                                      delete copy.items[idx].category
                                    }
                                    return copy
                                  })
                                }}
                                placeholder="Select or type category"
                                className={`w-full pl-2.5 pr-16 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${donErrors?.items?.[idx]?.category ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                style={{ height: '40px' }}
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                {item.category && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDonItemChange(idx, 'category', '')
                                      prevDonCategoryRef.current = { idx, value: '' }
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                    tabIndex={-1}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <div className="pointer-events-none text-gray-400">
                                  <ChevronRight className="w-4 h-4 transform rotate-90" />
                                </div>
                              </div>
                              {activeDonItemCategoryIdx === idx &&
                                activeCategories.filter(
                                  (cat) =>
                                    !item.category ||
                                    cat.toLowerCase().includes(item.category.toLowerCase())
                                ).length > 0 && (
                                  <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                    {activeCategories
                                      .filter(
                                        (cat) =>
                                          !item.category ||
                                          cat.toLowerCase().includes(item.category.toLowerCase())
                                      )
                                      .map((cat) => (
                                        <div
                                          key={cat}
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => {
                                            handleDonItemChange(idx, 'category', cat)
                                            prevDonCategoryRef.current = { idx, value: cat }
                                            setDonErrors((prev) => {
                                              const copy = { ...prev }
                                              if (copy.items && copy.items[idx]) {
                                                copy.items = [...copy.items]
                                                copy.items[idx] = { ...copy.items[idx] }
                                                delete copy.items[idx].category
                                              }
                                              return copy
                                            })
                                            setActiveDonItemCategoryIdx(null)
                                          }}
                                          className="flex items-center justify-between p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold capitalize text-left"
                                        >
                                          <span className="truncate">{cat}</span>
                                        </div>
                                      ))}
                                  </div>
                                )}
                            </div>
                            {donErrors?.items?.[idx]?.category && (
                              <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                {donErrors.items[idx].category}
                              </p>
                            )}
                          </div>

                          {/* Unit Searchable Dropdown */}
                          <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1">
                              Unit
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={item.unit}
                                onFocus={() => {
                                  prevDonUnitRef.current = { idx, value: item.unit }
                                  handleDonItemChange(idx, 'unit', '')
                                  setActiveDonItemUnitIdx(idx)
                                }}
                                onBlur={() =>
                                  setTimeout(() => {
                                    setActiveDonItemUnitIdx(null)
                                    if (prevDonUnitRef.current.idx === idx) {
                                      const currentItem = donItems[idx]
                                      if (currentItem) {
                                        handleDonItemChange(
                                          idx,
                                          'unit',
                                          currentItem.unit
                                            ? currentItem.unit
                                            : prevDonUnitRef.current.value
                                        )
                                      }
                                    }
                                  }, 200)
                                }
                                onChange={(e) => {
                                  handleDonItemChange(idx, 'unit', e.target.value)
                                  setDonErrors((prev) => {
                                    const copy = { ...prev }
                                    if (copy.items && copy.items[idx]) {
                                      copy.items = [...copy.items]
                                      copy.items[idx] = { ...copy.items[idx] }
                                      delete copy.items[idx].unit
                                    }
                                    return copy
                                  })
                                }}
                                placeholder="Select or type unit"
                                className={`w-full pl-2.5 pr-16 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${donErrors?.items?.[idx]?.unit ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                style={{ height: '40px' }}
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                {item.unit && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDonItemChange(idx, 'unit', '')
                                      prevDonUnitRef.current = { idx, value: '' }
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                    tabIndex={-1}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <div className="pointer-events-none text-gray-400">
                                  <ChevronRight className="w-4 h-4 transform rotate-90" />
                                </div>
                              </div>
                              {activeDonItemUnitIdx === idx &&
                                activeUnits.filter(
                                  (u) =>
                                    !item.unit || u.toLowerCase().includes(item.unit.toLowerCase())
                                ).length > 0 && (
                                  <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                    {activeUnits
                                      .filter(
                                        (u) =>
                                          !item.unit ||
                                          u.toLowerCase().includes(item.unit.toLowerCase())
                                      )
                                      .map((u) => (
                                        <div
                                          key={u}
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => {
                                            handleDonItemChange(idx, 'unit', u)
                                            prevDonUnitRef.current = { idx, value: u }
                                            setDonErrors((prev) => {
                                              const copy = { ...prev }
                                              if (copy.items && copy.items[idx]) {
                                                copy.items = [...copy.items]
                                                copy.items[idx] = { ...copy.items[idx] }
                                                delete copy.items[idx].unit
                                              }
                                              return copy
                                            })
                                            setActiveDonItemUnitIdx(null)
                                          }}
                                          className="flex items-center justify-between p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold capitalize text-left"
                                        >
                                          <span className="truncate">{u}</span>
                                        </div>
                                      ))}
                                  </div>
                                )}
                            </div>
                            {donErrors?.items?.[idx]?.unit && (
                              <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                {donErrors.items[idx].unit}
                              </p>
                            )}
                          </div>

                          {/* Quantity */}
                          <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1">
                              Quantity
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={item.quantity}
                                onFocus={() => {
                                  prevDonQtyRef.current = { idx, value: item.quantity }
                                  handleDonItemChange(idx, 'quantity', '')
                                  setActiveDonItemQtyIdx(idx)
                                }}
                                onBlur={() =>
                                  setTimeout(() => {
                                    setActiveDonItemQtyIdx(null)
                                    if (prevDonQtyRef.current.idx === idx) {
                                      const currentItem = donItems[idx]
                                      if (currentItem) {
                                        handleDonItemChange(
                                          idx,
                                          'quantity',
                                          currentItem.quantity
                                            ? currentItem.quantity
                                            : prevDonQtyRef.current.value
                                        )
                                      }
                                    }
                                  }, 200)
                                }
                                onChange={(e) => {
                                  handleDonItemChange(idx, 'quantity', e.target.value)
                                  setDonErrors((prev) => {
                                    const copy = { ...prev }
                                    if (copy.items && copy.items[idx]) {
                                      copy.items = [...copy.items]
                                      copy.items[idx] = { ...copy.items[idx] }
                                      delete copy.items[idx].quantity
                                    }
                                    return copy
                                  })
                                }}
                                placeholder="Select or enter quantity"
                                className={`w-full pl-2.5 pr-8 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${donErrors?.items?.[idx]?.quantity ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                style={{ height: '40px' }}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <ChevronRight className="w-4 h-4 transform rotate-90" />
                              </div>
                              {activeDonItemQtyIdx === idx && (
                                <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                  {[5, 10, 20, 50, 100, 250, 500]
                                    .filter(
                                      (q) => !item.quantity || q.toString().includes(item.quantity)
                                    )
                                    .map((q) => (
                                      <div
                                        key={q}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                          handleDonItemChange(idx, 'quantity', q.toString())
                                          prevDonQtyRef.current = {
                                            idx,
                                            value: q.toString()
                                          }
                                          setDonErrors((prev) => {
                                            const copy = { ...prev }
                                            if (copy.items && copy.items[idx]) {
                                              copy.items = [...copy.items]
                                              copy.items[idx] = { ...copy.items[idx] }
                                              delete copy.items[idx].quantity
                                            }
                                            return copy
                                          })
                                          setActiveDonItemQtyIdx(null)
                                        }}
                                        className="p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left"
                                      >
                                        {q}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                            {donErrors?.items?.[idx]?.quantity && (
                              <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                {donErrors.items[idx].quantity}
                              </p>
                            )}
                          </div>

                          {/* Pieces per Unit (if Unit is already pack/box/bundle) */}
                          {isAlreadyGrouped && (
                            <div className="animate-fade-in">
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Pieces per Unit <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={item.piecesPerUnit}
                                onChange={(e) => {
                                  if (/^\d*$/.test(e.target.value)) {
                                    handleDonItemChange(idx, 'piecesPerUnit', e.target.value)
                                    setDonErrors((prev) => {
                                      const copy = { ...prev }
                                      if (copy.items && copy.items[idx]) {
                                        copy.items = [...copy.items]
                                        copy.items[idx] = { ...copy.items[idx] }
                                        delete copy.items[idx].piecesPerUnit
                                      }
                                      return copy
                                    })
                                  }
                                }}
                                placeholder="e.g. 12"
                                className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${donErrors?.items?.[idx]?.piecesPerUnit ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                style={{ height: '40px' }}
                              />
                              {donErrors?.items?.[idx]?.piecesPerUnit && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                  {donErrors.items[idx].piecesPerUnit}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Group Stock Option (only if Quantity >= 12 and Unit is not pack/box/bundle) */}
                          {!isNaN(parsedQty) && parsedQty >= 12 && !isAlreadyGrouped && (
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Group stock into (Optional)
                              </label>
                              <select
                                value={item.groupUnit}
                                onChange={(e) => {
                                  const list = [...donItems]
                                  list[idx].groupUnit = e.target.value
                                  if (e.target.value === 'none') {
                                    list[idx].piecesPerUnit = ''
                                  } else if (!list[idx].piecesPerUnit) {
                                    list[idx].piecesPerUnit = '12'
                                  }
                                  setDonItems(list)
                                }}
                                className="w-full px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue cursor-pointer"
                                style={{ height: '40px' }}
                              >
                                <option value="none">Do not group (Individual pieces)</option>
                                <option value="pack">Packs</option>
                                <option value="box">Boxes</option>
                                <option value="bundle">Bundles</option>
                              </select>
                            </div>
                          )}

                          {/* Pieces per pack/box/bundle input and remaining pieces display */}
                          {!isAlreadyGrouped && item.groupUnit && item.groupUnit !== 'none' && (
                            <>
                              <div>
                                <label className="block text-gray-700 text-xs font-semibold mb-1">
                                  Pieces per Pack/Box/Bundle
                                </label>
                                <input
                                  type="text"
                                  value={item.piecesPerUnit}
                                  onChange={(e) => {
                                    if (/^\d*$/.test(e.target.value)) {
                                      handleDonItemChange(idx, 'piecesPerUnit', e.target.value)
                                    }
                                  }}
                                  placeholder="e.g. 12"
                                  className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                                  style={{ height: '40px' }}
                                />
                              </div>
                              <div>
                                <label className="block text-gray-700 text-xs font-semibold mb-1">
                                  Remaining Pieces
                                </label>
                                <input
                                  type="text"
                                  readOnly
                                  value={getRemainingPiecesText(
                                    item.quantity,
                                    item.piecesPerUnit || '12',
                                    item.groupUnit
                                  )}
                                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-bold text-navy-blue"
                                  style={{ height: '40px' }}
                                />
                              </div>
                            </>
                          )}

                          {/* Expiration Date */}
                          <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1">
                              Expiration Date{' '}
                              {!isSchoolSupplies && <span className="text-red-500">*</span>}
                            </label>
                            <div
                              className={
                                donErrors?.items?.[idx]?.expiryDate
                                  ? 'border border-red-500 rounded-xl p-0.5 ring-2 ring-red-500/10'
                                  : ''
                              }
                            >
                              <GlassDatePicker
                                value={item.expiryDate ? item.expiryDate.split('T')[0] : ''}
                                disabled={isSchoolSupplies}
                                onChange={(val) => {
                                  handleDonItemChange(idx, 'expiryDate', val)
                                  setDonErrors((prev) => {
                                    const copy = { ...prev }
                                    if (copy.items && copy.items[idx]) {
                                      copy.items = [...copy.items]
                                      copy.items[idx] = { ...copy.items[idx] }
                                      delete copy.items[idx].expiryDate
                                    }
                                    return copy
                                  })
                                }}
                                showTime={false}
                                placeholder="dd/mm/yyyy"
                              />
                            </div>
                            {donErrors?.items?.[idx]?.expiryDate && (
                              <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                {donErrors.items[idx].expiryDate}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition flex items-center justify-center cursor-pointer"
                style={{ height: '42px' }}
              >
                {loading ? 'Registering Batch...' : 'Register Donation Batch'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Centered Glassmorphic Add / Edit User Modal */}
      <AnimatedModal
        isOpen={isAddUserModalOpen}
        onClose={handleCloseUserModal}
        overlayClassName="fixed inset-0 z-[99999] flex items-center justify-center p-4 glass-modal-overlay"
        contentClassName="glass-modal rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
          <h3 className="font-bold text-navy-blue text-base">
            {editingUser ? 'Edit User Account' : 'Create User Account'}
          </h3>
          <button
            type="button"
            onClick={handleCloseUserModal}
            className="text-gray-400 hover:text-navy-blue transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveUser} className="space-y-4 text-left">
          <div>
            <label className="block text-navy-blue text-xs font-semibold mb-1">Role</label>
            <select
              value={coordRole}
              onChange={(e) => {
                setCoordRole(e.target.value)
                setCoordErrors((prev) => {
                  const copy = { ...prev }
                  delete copy.coordRole
                  return copy
                })
              }}
              className={`w-full px-3 py-2 text-xs glass-input rounded-xl focus:outline-none font-semibold text-navy-blue ${coordErrors.coordRole ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
            >
              <option value="admin">Admin</option>
              <option value="office_coordinator">Office Coordinator</option>
            </select>
            {coordErrors.coordRole && (
              <p className="text-red-500 text-[10px] mt-1 font-semibold">{coordErrors.coordRole}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-blue text-xs font-semibold mb-1">First Name</label>
              <input
                type="text"
                value={coordFirstName}
                onChange={(e) => {
                  setCoordFirstName(e.target.value)
                  if (coordErrors.coordFirstName) {
                    setCoordErrors((prev) => {
                      const copy = { ...prev }
                      delete copy.coordFirstName
                      return copy
                    })
                  }
                }}
                placeholder="Enter First Name"
                className={`w-full p-2.5 text-xs glass-input rounded-xl focus:outline-none font-semibold text-navy-blue ${coordErrors.coordFirstName ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
              />
              {coordErrors.coordFirstName && (
                <p className="text-red-500 text-[10px] mt-1 font-semibold">
                  {coordErrors.coordFirstName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-navy-blue text-xs font-semibold mb-1">Last Name</label>
              <input
                type="text"
                value={coordLastName}
                onChange={(e) => {
                  setCoordLastName(e.target.value)
                  if (coordErrors.coordLastName) {
                    setCoordErrors((prev) => {
                      const copy = { ...prev }
                      delete copy.coordLastName
                      return copy
                    })
                  }
                }}
                placeholder="Enter Last Name"
                className={`w-full p-2.5 text-xs glass-input rounded-xl focus:outline-none font-semibold text-navy-blue ${coordErrors.coordLastName ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
              />
              {coordErrors.coordLastName && (
                <p className="text-red-500 text-[10px] mt-1 font-semibold">
                  {coordErrors.coordLastName}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-navy-blue text-xs font-semibold mb-1">Email Address</label>
            <input
              type="email"
              value={coordEmail}
              onChange={(e) => {
                setCoordEmail(e.target.value)
                if (coordErrors.coordEmail) {
                  setCoordErrors((prev) => {
                    const copy = { ...prev }
                    delete copy.coordEmail
                    return copy
                  })
                }
              }}
              placeholder="Enter Email"
              className={`w-full p-2.5 text-xs glass-input rounded-xl focus:outline-none font-semibold text-navy-blue ${coordErrors.coordEmail ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
            />
            {coordErrors.coordEmail && (
              <p className="text-red-500 text-[10px] mt-1 font-semibold">
                {coordErrors.coordEmail}
              </p>
            )}
          </div>

          {!editingUser && (
            <>
              <div>
                <label className="block text-navy-blue text-xs font-semibold mb-1">Password</label>
                <input
                  type="password"
                  value={coordPassword}
                  onChange={(e) => {
                    setCoordPassword(e.target.value)
                    if (coordErrors.coordPassword) {
                      setCoordErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.coordPassword
                        return copy
                      })
                    }
                  }}
                  placeholder="Enter Password"
                  className={`w-full p-2.5 text-xs glass-input rounded-xl focus:outline-none font-semibold text-navy-blue ${coordErrors.coordPassword ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                />
                {coordErrors.coordPassword && (
                  <p className="text-red-500 text-[10px] mt-1 font-semibold">
                    {coordErrors.coordPassword}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-navy-blue text-xs font-semibold mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={coordConfirmPassword}
                  onChange={(e) => {
                    setCoordConfirmPassword(e.target.value)
                    if (coordErrors.coordConfirmPassword) {
                      setCoordErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.coordConfirmPassword
                        return copy
                      })
                    }
                  }}
                  placeholder="Confirm Password"
                  className={`w-full p-2.5 text-xs glass-input rounded-xl focus:outline-none font-semibold text-navy-blue ${coordErrors.coordConfirmPassword ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                />
                {coordErrors.coordConfirmPassword && (
                  <p className="text-red-500 text-[10px] mt-1 font-semibold">
                    {coordErrors.coordConfirmPassword}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-3">
            <button
              type="button"
              onClick={handleCloseUserModal}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-navy-blue hover:bg-navy-blue-600 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-glass-sm transition cursor-pointer border border-white/20"
            >
              {editingUser ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </AnimatedModal>

      {/* Inspect Report Document Viewer Modal (Fixed to Viewport Root) */}
      {selectedReport && (
        <DocumentViewer
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          eventsList={eventsList}
          orgsList={orgsList}
          usersList={usersList}
          feedbackNote={feedbackNote}
          setFeedbackNote={setFeedbackNote}
          handleReviewReport={handleReviewReport}
          compileReportPDF={compileReportPDF}
          loading={loading}
        />
      )}

      {/* Global Centered Pop-up Warning/Confirm/Success Dialogs */}
      <AnimatedModal
        isOpen={!!(actionError || validationError)}
        overlayClassName="fixed inset-0 z-[99999] flex items-center justify-center bg-navy-blue/40 backdrop-blur-sm p-4"
        contentClassName="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 max-w-sm w-full text-center space-y-4"
      >
        <div>
          <h4 className="font-bold text-navy-blue text-sm uppercase tracking-wide">
            {validationError ? validationError.title : 'Action Warning'}
          </h4>
          <p className="text-xs text-gray-500 font-semibold mt-2 leading-relaxed">
            {validationError ? validationError.message : actionError}
          </p>
        </div>
        <button
          ref={errorOkButtonRef}
          autoFocus
          type="button"
          onClick={() => {
            setActionError('')
            setValidationError(null)
          }}
          className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2.5 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer"
        >
          OK
        </button>
      </AnimatedModal>

      <AnimatedModal
        isOpen={!!confirmDialog}
        overlayClassName="fixed inset-0 z-[99999] flex items-center justify-center bg-navy-blue/40 backdrop-blur-xs p-4"
        contentClassName="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 max-w-sm w-full text-center space-y-4 font-poppins"
      >
        {confirmDialog && (
          <>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-2 shadow-xs">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h4 className="font-extrabold text-navy-blue text-sm uppercase tracking-wide">
                {confirmDialog.title}
              </h4>
              <p className="text-xs text-gray-500 font-semibold mt-1 leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full text-xs py-2.5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                ref={confirmButtonRef}
                autoFocus
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm()
                  setConfirmDialog(null)
                }}
                className="flex-1 bg-navy-blue hover:bg-navy-blue-600 text-white font-bold rounded-full text-xs py-2.5 shadow-md transition cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </>
        )}
      </AnimatedModal>

      <AnimatedModal
        isOpen={!!actionSuccess}
        overlayClassName="fixed inset-0 z-[99999] flex items-center justify-center bg-navy-blue/40 backdrop-blur-sm p-4"
        contentClassName="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 max-w-sm w-full text-center space-y-4"
      >
        <div>
          <h4 className="font-bold text-navy-blue text-sm uppercase tracking-wide">Success</h4>
          <p className="text-xs text-gray-500 font-semibold mt-2 leading-relaxed">
            {actionSuccess}
          </p>
        </div>
        <button
          autoFocus
          type="button"
          onClick={() => {
            setActionSuccess('')
          }}
          className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2.5 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer"
        >
          OK
        </button>
      </AnimatedModal>
    </div>
  )
}
