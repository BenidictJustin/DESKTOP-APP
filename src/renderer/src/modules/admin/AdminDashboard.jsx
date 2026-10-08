/* eslint-disable */
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import AboutVersionCard from '../../components/AboutVersionCard'
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
  computeInventoryStatus,
  sortInventory,
  getEarliestBatchExpiry,
  groupInventoryItems,
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
  sendCoordinatorResetEmail,
  areNamesSimilar,
  runInventoryDeduplicationMigration
} from '../../services/db'
import logo from '../../assets/logo.png'
import logo2Img from '../../assets/logo2.png'
import appIcon from '../../../../../resources/icon.png'
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
  CheckCircle,
  X,
  ShieldAlert,
  Download,
  Clock,
  ArrowRight,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Building2,
  FolderOpen,
  MapPin,
  Eye,
  EyeOff,
  Rocket,
  Target,
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
  ChevronDown,
  Home,
  Layers,
  CalendarDays,
  Grid,
  RotateCcw,
  PlusCircle,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import SearchableDropdown from '../../components/SearchableDropdown'
import CustomSelect from '../../components/CustomSelect'
import DocumentViewer from '../../components/DocumentViewer'
import GlassDatePicker from '../../components/GlassDatePicker'
import { isPastDate, DATE_ERROR_MESSAGES } from '../../utils/dateValidation'
import AnimatedSidebar from '../../components/AnimatedSidebar'
import EventCalendar from '../../components/EventCalendar'
import UpcomingEventsSchedule from '../../components/UpcomingEventsSchedule'
import OrganizationalChart from '../../components/OrganizationalChart'
import DevelopersChart from '../../components/DevelopersChart'
import {
  sanitizeOklchInDocument,
  exportElementToPDF,
  resolveHeaderHtml,
  parseNarrativePages,
  downloadFileFromUrl,
  exportDocxToPDF
} from '../../components/editor/utils/editorHelpers'
import { PAPER, MARGINS } from '../../components/editor/constants'
import { useNetworkStatus } from '../../context/NetworkContext'
import {
  DashboardSkeleton,
  InventorySkeleton,
  DonationsSkeleton,
  EventsSkeleton,
  OrganizationSkeleton,
  ReportsSkeleton,
  AccountsSkeleton,
  AboutSkeleton
} from '../../components/skeletons'

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
  const { isOffline, registerReconnectHandler } = useNetworkStatus()
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
  const [exportingDocxReport, setExportingDocxReport] = useState(null)

  const [deletedCategories, setDeletedCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('dommunity_deleted_categories')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const defaultCategories = ['School Supplies', 'Food Packs', 'Hygiene Kits']
  const rawCategories = [
    ...defaultCategories,
    ...inventoryList.map((i) => (i.category || '').trim()).filter(Boolean)
  ]
  const allCategories = rawCategories.reduce((acc, cat) => {
    if (!acc.some((c) => c.toLowerCase() === cat.toLowerCase())) {
      acc.push(cat)
    }
    return acc
  }, [])
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

  const [deletedItemNames, setDeletedItemNames] = useState(() => {
    try {
      const saved = localStorage.getItem('dommunity_deleted_item_names')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const defaultUnits = ['Pieces', 'Cans', 'Packs', 'Boxes', 'Bundles', 'Bars']
  const rawUnits = [
    ...defaultUnits,
    ...inventoryList.map((i) => (i.unit || '').trim()).filter(Boolean)
  ]
  const allUnits = rawUnits.reduce((acc, u) => {
    if (!acc.some((existing) => existing.toLowerCase() === u.toLowerCase())) {
      acc.push(u)
    }
    return acc
  }, [])
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
  const [showAddUserPassword, setShowAddUserPassword] = useState(false)
  const [showAddUserConfirmPassword, setShowAddUserConfirmPassword] = useState(false)
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
  const [unitFilter, setUnitFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expirationFilter, setExpirationFilter] = useState('all')
  const [invSearchQuery, setInvSearchQuery] = useState('')
  const [invCurrentPage, setInvCurrentPage] = useState(1)
  const [invItemsPerPage] = useState(10)

  // Add Stock Modal states
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false)
  const [addStockItemId, setAddStockItemId] = useState('')
  const [addStockSearch, setAddStockSearch] = useState('')
  const [showAddStockDropdown, setShowAddStockDropdown] = useState(false)
  const [addStockQty, setAddStockQty] = useState('')
  const [addStockQtyGroup, setAddStockQtyGroup] = useState('')
  const [addStockQtyPieces, setAddStockQtyPieces] = useState('')
  const [addStockExpiry, setAddStockExpiry] = useState('')
  const [addStockErrors, setAddStockErrors] = useState({})

  // Batch Details & Management States
  const [batchDetailsItemKey, setBatchDetailsItemKey] = useState(null)
  const [editingBatch, setEditingBatch] = useState(null)
  const [batchEditQty, setBatchEditQty] = useState('')
  const [batchEditQtyGroup, setBatchEditQtyGroup] = useState('')
  const [batchEditQtyPieces, setBatchEditQtyPieces] = useState('')
  const [batchEditExpiry, setBatchEditExpiry] = useState('')
  const [batchEditGroupUnit, setBatchEditGroupUnit] = useState('none')
  const [batchEditPiecesPerUnit, setBatchEditPiecesPerUnit] = useState('')
  const [batchEditErrors, setBatchEditErrors] = useState({})

  // Grouped inventory: one row per unique item (name + category), aggregating stock batches
  const groupedInventory = useMemo(() => {
    return groupInventoryItems(inventoryList)
  }, [inventoryList])

  // Active item for the centered batch details modal
  const activeBatchItem = useMemo(() => {
    if (!batchDetailsItemKey) return null
    return (
      groupedInventory.find(
        (item) => item.key === batchDetailsItemKey || item.id === batchDetailsItemKey
      ) || null
    )
  }, [groupedInventory, batchDetailsItemKey])

  const [releaseItemId, setReleaseItemId] = useState('')
  const [releaseQty, setReleaseQty] = useState('')
  const [releaseQtyGroup, setReleaseQtyGroup] = useState('')
  const [releaseQtyPieces, setReleaseQtyPieces] = useState('')
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
  const [reportsSubTab, setReportsSubTab] = useState('pending') // 'pending' | 'approved'
  const [approvedSearchQuery, setApprovedSearchQuery] = useState('')
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
    Boolean(isAddStockModalOpen) ||
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
    Boolean(completedActivitiesModal?.isOpen) ||
    Boolean(batchDetailsItemKey) ||
    Boolean(editingBatch)

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

  const isSuppliesCategory = (cat) => {
    if (!cat) return false
    const c = cat.toLowerCase().trim().replace(/ies$/, 'y')
    return c.includes('supply')
  }

  useEffect(() => {
    if (isSuppliesCategory(itemCategory)) {
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

  // Format packaging breakdown for an individual batch (e.g. 10 Boxes × 20 Pieces/Box or 2 Boxes × 20 Pieces/Box + 160 Pieces)
  const formatBatchPackagingBreakdown = (quantity, unitStr, groupUnit, piecesPerUnit) => {
    const qty = Number(quantity) || 0
    const pPerUnit = piecesPerUnit ? parseInt(piecesPerUnit, 10) : 0
    if (!groupUnit || groupUnit === 'none' || pPerUnit <= 0) {
      return null
    }
    const boxes = Math.floor(qty / pPerUnit)
    const remainder = qty % pPerUnit
    const groupLabel = formatUnit(boxes, groupUnit)
    const baseUnitLabel = formatUnit(pPerUnit, unitStr || 'pieces')
    const singleGroupLabel = formatUnit(1, groupUnit)

    if (boxes > 0 && remainder > 0) {
      return `${boxes} ${groupLabel} × ${pPerUnit} ${baseUnitLabel} per ${singleGroupLabel} + ${remainder} ${formatUnit(remainder, unitStr || 'pieces')}`
    } else if (boxes > 0) {
      return `${boxes} ${groupLabel} × ${pPerUnit} ${baseUnitLabel} per ${singleGroupLabel}`
    } else if (remainder > 0) {
      return `${remainder} ${formatUnit(remainder, unitStr || 'pieces')}`
    }
    return null
  }

  // 4-month expiration threshold indicator logic
  // More than 4 months before expiration -> normal/default status color
  // 4 months or less before expiration -> red expiration indicator
  // Already expired -> red as well
  const getExpirationInfo = (expiryDate) => {
    if (!expiryDate) return { isExpired: false, isNearExpiry: false, status: 'none', label: '' }
    const now = new Date()
    const exp = new Date(expiryDate)
    if (isNaN(exp.getTime())) return { isExpired: false, isNearExpiry: false, status: 'none', label: '' }

    if (exp < now) {
      return { isExpired: true, isNearExpiry: true, status: 'expired', label: 'Expired' }
    }

    // Threshold: exactly 4 calendar months from current date
    const fourMonthsFromNow = new Date(now)
    fourMonthsFromNow.setMonth(fourMonthsFromNow.getMonth() + 4)
    fourMonthsFromNow.setHours(23, 59, 59, 999)

    if (exp <= fourMonthsFromNow) {
      return { isExpired: false, isNearExpiry: true, status: 'expiring_soon', label: 'Expiring Soon' }
    }

    return { isExpired: false, isNearExpiry: false, status: 'good', label: 'Good' }
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
    const catStr =
      typeof catToDelete === 'object' && catToDelete !== null
        ? catToDelete.name || catToDelete.id || catToDelete.value || ''
        : String(catToDelete || '')
    const catLower = catStr.toLowerCase().trim()
    if (!catLower) return

    const updated = [...new Set([...deletedCategories, catLower])]
    setDeletedCategories(updated)
    localStorage.setItem('dommunity_deleted_categories', JSON.stringify(updated))
    triggerSuccess(`Category "${catStr}" has been permanently deleted from the list.`)

    // Clear selections matching the deleted category
    if ((prevAddCategoryRef.current || '').toLowerCase().trim() === catLower) {
      prevAddCategoryRef.current = ''
    }
    if ((prevEditCategoryRef.current || '').toLowerCase().trim() === catLower) {
      prevEditCategoryRef.current = ''
    }
    if ((itemCategory || '').toLowerCase().trim() === catLower) {
      setItemCategory('')
    }
  }

  const handleDeleteUnit = (unitToDelete) => {
    const unitStr =
      typeof unitToDelete === 'object' && unitToDelete !== null
        ? unitToDelete.name || unitToDelete.id || unitToDelete.value || ''
        : String(unitToDelete || '')
    const unitLower = unitStr.toLowerCase().trim()
    if (!unitLower) return

    const updated = [...new Set([...deletedUnits, unitLower])]
    setDeletedUnits(updated)
    localStorage.setItem('dommunity_deleted_units', JSON.stringify(updated))
    triggerSuccess(`Unit "${unitStr}" has been permanently deleted from the list.`)

    // Clear selections matching the deleted unit
    if ((prevAddUnitRef.current || '').toLowerCase().trim() === unitLower) {
      prevAddUnitRef.current = ''
    }
    if ((prevEditUnitRef.current || '').toLowerCase().trim() === unitLower) {
      prevEditUnitRef.current = ''
    }
    if ((itemUnit || '').toLowerCase().trim() === unitLower) {
      setItemUnit('')
    }
  }

  const handleDeleteItemName = (nameToDelete) => {
    const nameLower = nameToDelete.toLowerCase().trim()
    const updated = [...deletedItemNames, nameLower]
    setDeletedItemNames(updated)
    localStorage.setItem('dommunity_deleted_item_names', JSON.stringify(updated))
    triggerSuccess(`Item name "${nameToDelete}" has been removed from the suggestions list.`)
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
  const [orgLogo, setOrgLogo] = useState('')
  const [orgDepartmentId, setOrgDepartmentId] = useState('')
  const [orgSearchQuery, setOrgSearchQuery] = useState('')
  const [selectedOrgSubTab, setSelectedOrgSubTab] = useState('department')
  const [deptLogo, setDeptLogo] = useState('')
  const [deptCoordinatorId, setDeptCoordinatorId] = useState('')
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false)
  const addOrgDropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutsideOrgDropdown(event) {
      if (addOrgDropdownRef.current && !addOrgDropdownRef.current.contains(event.target)) {
        setIsAddDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutsideOrgDropdown)
    return () => document.removeEventListener('mousedown', handleClickOutsideOrgDropdown)
  }, [])

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
  const [selectedViewEvent, setSelectedViewEvent] = useState(null)
  const [isViewEventModalOpen, setIsViewEventModalOpen] = useState(false)
  const [evtType, setEvtType] = useState('department')
  const [evtOrgName, setEvtOrgName] = useState('')
  const [evtParentDeptId, setEvtParentDeptId] = useState('')
  const [eventsDisplayMode, setEventsDisplayMode] = useState('calendar') // 'calendar' | 'board'

  // Organization / Department Classification Helpers
  const isOrgItem = (o) =>
    Boolean(o) &&
    (o.type === 'organization' || (typeof o.id === 'string' && o.id.startsWith('org-')))
  const isDeptItem = (o) => Boolean(o) && !isOrgItem(o)
  const normalizeOrg = (o) =>
    o
      ? {
        ...o,
        type:
          o.type ||
          (typeof o.id === 'string' && o.id.startsWith('org-') ? 'organization' : 'department')
      }
      : o

  // Sync data from DB
  const loadData = async () => {
    try {
      await runInventoryDeduplicationMigration()
      const u = await getUsers()
      const o = await getOrganizations()
      const inv = await getInventory()
      const d = await getDonors()
      const dn = await getDonations()
      const ev = await getEvents()
      const rep = await getReports()
      const reset = await getResetRequests()

      setUsersList(u)
      setOrgsList((o || []).map(normalizeOrg))
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
    const unsubReconnect = registerReconnectHandler(() => {
      loadData()
    })
    const unsubUsers = subscribeUsers((u) => setUsersList(u))
    const unsubOrgs = subscribeOrganizations((o) => setOrgsList((o || []).map(normalizeOrg)))
    const unsubInv = subscribeInventory((inv) => setInventoryList(inv))
    const unsubDonors = subscribeDonors((d) => setDonorsList(d))
    const unsubDonations = subscribeDonations((dn) => setDonationsList(dn))
    const unsubEvents = subscribeEvents((ev) => setEventsList(ev))
    const unsubReports = subscribeReports((rep) => setReportsList(rep))

    return () => {
      if (typeof unsubReconnect === 'function') unsubReconnect()
      if (typeof unsubUsers === 'function') unsubUsers()
      if (typeof unsubOrgs === 'function') unsubOrgs()
      if (typeof unsubInv === 'function') unsubInv()
      if (typeof unsubDonors === 'function') unsubDonors()
      if (typeof unsubDonations === 'function') unsubDonations()
      if (typeof unsubEvents === 'function') unsubEvents()
      if (typeof unsubReports === 'function') unsubReports()
    }
  }, [registerReconnectHandler])

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

    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }

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
      } else if (
        !/[A-Z]/.test(coordPassword) ||
        !/[a-z]/.test(coordPassword) ||
        !/\d/.test(coordPassword) ||
        !/[^A-Za-z0-9]/.test(coordPassword)
      ) {
        errors.coordPassword =
          'Password must combine letters (uppercase and lowercase), numbers, and special characters.'
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
        const isCoordinator = coordRole === 'office_coordinator'
        await registerUser(
          coordEmail,
          username,
          initialPassword,
          fullName,
          coordRole,
          assignedOrg,
          isCoordinator
        )
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
      setShowAddUserPassword(false)
      setShowAddUserConfirmPassword(false)
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
    setShowAddUserPassword(false)
    setShowAddUserConfirmPassword(false)
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
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }
    if (targetUser.uid === user.uid) {
      triggerError('Cannot delete your own administrator session.')
      return
    }
    setConfirmDialog({
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete the account of ${targetUser.name}? This action is irreversible.`,
      onConfirm: async () => {
        if (isOffline) {
          triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
          return
        }
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
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }
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
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }
    setConfirmDialog({
      title: 'Send Password Reset Link',
      message: `Are you sure you want to send a password reset email to ${targetUser.name} (${targetUser.email})? They will receive a secure link from Firebase to set their new password.`,
      onConfirm: async () => {
        if (isOffline) {
          triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
          return
        }
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
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }
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
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }
    const isSchoolSupplies = isSuppliesCategory(itemCategory)

    const unitLower = (itemUnit || '').toLowerCase().trim()
    const isAlreadyGrouped = ['pack', 'packs', 'box', 'boxes', 'bundle', 'bundles'].includes(
      unitLower
    )

    const errors = {}
    if (!itemName.trim()) errors.itemName = 'Item name is required.'
    if (!itemCategory.trim()) errors.itemCategory = 'Category is required.'
    if (!itemUnit.trim()) errors.itemUnit = 'Unit of measurement is required.'
    if (!itemQty) errors.itemQty = 'Quantity is required.'

    if (!isSchoolSupplies && !itemExpiry) {
      errors.itemExpiry = 'Expiration date is required.'
    } else if (itemExpiry && isPastDate(itemExpiry)) {
      errors.itemExpiry = DATE_ERROR_MESSAGES.EXPIRY_PAST
    }
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
        if (Array.isArray(itemEditing.batches) && itemEditing.batches.length > 0) {
          if (payload.quantity === itemEditing.quantity) {
            payload.batches = itemEditing.batches
          } else if (itemEditing.batches.length === 1) {
            payload.batches = [
              {
                ...itemEditing.batches[0],
                quantity: payload.quantity,
                expiryDate: payload.expiryDate
              }
            ]
          } else {
            payload.batches = itemEditing.batches
          }
        }
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
        // Find existing similar
        const cleanExpiry = payload.expiryDate
          ? new Date(payload.expiryDate).toISOString().split('T')[0]
          : null
        const cleanCategory = (payload.category || '').toLowerCase().trim()
        const cleanUnit = (payload.unit || '').toLowerCase().trim()

        const existingSimilar = inventoryList.find((i) => {
          const existingName = i.name.toLowerCase().trim()
          const existingCategory = (i.category || '').toLowerCase().trim()
          const existingUnit = (i.unit || '').toLowerCase().trim()
          const existingExpiry = i.expiryDate
            ? new Date(i.expiryDate).toISOString().split('T')[0]
            : null
          return (
            areNamesSimilar(existingName, payload.name) &&
            existingCategory === cleanCategory &&
            existingUnit === cleanUnit &&
            existingExpiry === cleanExpiry
          )
        })

        await addInventoryItem(payload, user.uid)

        const targetName = existingSimilar ? existingSimilar.name : payload.name
        const targetUnit = existingSimilar ? existingSimilar.unit : payload.unit
        const message = existingSimilar
          ? `Duplicate detected. Stock of existing "${existingSimilar.name}" updated successfully.`
          : 'Item added successfully'

        await logInventoryTransaction(
          'added',
          targetName,
          payload.quantity,
          targetUnit,
          existingSimilar
            ? 'Stock updated automatically (duplicate detection)'
            : 'New item cataloged'
        )
        triggerSuccess(message)
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

  const handleDeleteInventory = async (target) => {
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }

    const itemObj =
      typeof target === 'object' && target !== null
        ? target
        : inventoryList.find((i) => i.id === target)

    const itemName = itemObj?.name || 'this item'
    const docIds =
      Array.isArray(itemObj?.allDocIds) && itemObj.allDocIds.length > 0
        ? itemObj.allDocIds
        : [itemObj?.id || target]

    setConfirmDialog({
      title: 'Delete Inventory Item',
      message: `Are you sure you want to delete "${itemName}" and all of its batches? This action is permanent.`,
      onConfirm: async () => {
        if (isOffline) {
          triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
          return
        }
        try {
          for (const docId of docIds) {
            await deleteInventoryItem(docId)
          }
          if (itemObj) {
            await logInventoryTransaction(
              'deleted',
              itemObj.name,
              itemObj.quantity,
              itemObj.unit,
              'Removed from inventory catalog'
            )
          }
          if (
            batchDetailsItemKey &&
            (batchDetailsItemKey === itemObj?.key || batchDetailsItemKey === itemObj?.id)
          ) {
            setBatchDetailsItemKey(null)
          }
          triggerSuccess('Item deleted successfully')
          loadData()
        } catch (err) {
          triggerError(err.message)
        }
      }
    })
  }

  // Open Edit Batch Modal
  const handleOpenEditBatch = (batch, parentItem) => {
    setEditingBatch({ ...batch, parentItem })
    const hasGroup = batch.groupUnit && batch.groupUnit !== 'none' && batch.piecesPerUnit
    const factor = parseInt(batch.piecesPerUnit, 10) || 12
    if (hasGroup) {
      setBatchEditQtyGroup(Math.floor(batch.quantity / factor).toString())
      setBatchEditQtyPieces((batch.quantity % factor).toString())
      setBatchEditQty(batch.quantity.toString())
    } else {
      setBatchEditQty(batch.quantity.toString())
      setBatchEditQtyGroup('')
      setBatchEditQtyPieces('')
    }
    setBatchEditExpiry(
      batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : ''
    )
    setBatchEditGroupUnit(batch.groupUnit || 'none')
    setBatchEditPiecesPerUnit(batch.piecesPerUnit ? batch.piecesPerUnit.toString() : '')
    setBatchEditErrors({})
  }

  // Save changes to an individual batch
  const handleSaveEditBatch = async (e) => {
    e.preventDefault()
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }
    if (!editingBatch) return

    const errors = {}
    const hasGroup = batchEditGroupUnit && batchEditGroupUnit !== 'none' && batchEditPiecesPerUnit
    const factor = parseInt(batchEditPiecesPerUnit, 10) || 12

    let newBatchQty = 0
    if (hasGroup) {
      const grp = parseInt(batchEditQtyGroup, 10) || 0
      const pcs = parseInt(batchEditQtyPieces, 10) || 0
      newBatchQty = grp * factor + pcs
    } else {
      newBatchQty = parseInt(batchEditQty, 10) || 0
    }

    if (newBatchQty <= 0) {
      errors.qty = 'Please enter a valid quantity greater than 0.'
    }

    const isSupplies = isSuppliesCategory(editingBatch.category)
    if (!isSupplies) {
      if (!batchEditExpiry) {
        errors.expiry = 'Please specify an expiration date for this batch.'
      } else if (isPastDate(batchEditExpiry)) {
        errors.expiry = DATE_ERROR_MESSAGES.EXPIRY_PAST
      }
    }

    if (Object.keys(errors).length > 0) {
      setBatchEditErrors(errors)
      return
    }

    setLoading(true)
    try {
      const targetDoc = inventoryList.find((i) => i.id === editingBatch.parentDocId)
      if (!targetDoc) {
        throw new Error('Parent stock document not found.')
      }

      let existingBatches =
        Array.isArray(targetDoc.batches) && targetDoc.batches.length > 0
          ? [...targetDoc.batches]
          : [
              {
                id: editingBatch.id || `batch-${targetDoc.id}-init`,
                quantity: targetDoc.quantity,
                expiryDate: targetDoc.expiryDate || null,
                receivedDate:
                  targetDoc.receivedDate || targetDoc.createdAt || new Date().toISOString(),
                unit: targetDoc.unit || 'pieces',
                groupUnit: targetDoc.groupUnit || 'none',
                piecesPerUnit: targetDoc.piecesPerUnit || null
              }
            ]

      let batchIdx = existingBatches.findIndex((b) => b.id === editingBatch.id)
      if (
        batchIdx === -1 &&
        editingBatch.batchIndex >= 0 &&
        editingBatch.batchIndex < existingBatches.length
      ) {
        batchIdx = editingBatch.batchIndex
      }
      if (batchIdx === -1) {
        batchIdx = 0
      }

      existingBatches[batchIdx] = {
        ...existingBatches[batchIdx],
        quantity: newBatchQty,
        expiryDate: isSupplies || !batchEditExpiry ? null : new Date(batchEditExpiry).toISOString(),
        groupUnit: batchEditGroupUnit,
        piecesPerUnit: batchEditPiecesPerUnit ? parseInt(batchEditPiecesPerUnit, 10) : null
      }

      const newTotalQty = existingBatches.reduce((s, b) => s + (Number(b.quantity) || 0), 0)
      const earliestExpiry = getEarliestBatchExpiry(existingBatches)
      const newStatus = computeInventoryStatus(newTotalQty, earliestExpiry)

      await updateInventoryItem(
        targetDoc.id,
        {
          quantity: newTotalQty,
          batches: existingBatches,
          expiryDate: earliestExpiry,
          status: newStatus
        },
        user.uid
      )

      await logInventoryTransaction(
        'updated',
        editingBatch.name,
        newBatchQty,
        editingBatch.unit || targetDoc.unit || 'pieces',
        `Updated batch: ${newBatchQty} ${editingBatch.unit || targetDoc.unit || 'pieces'}${batchEditExpiry ? ` (Exp: ${new Date(batchEditExpiry).toLocaleDateString()})` : ''}`
      )

      triggerSuccess(`Batch for "${editingBatch.name}" updated successfully.`)
      setEditingBatch(null)
      loadData()
    } catch (err) {
      triggerError(err.message || 'Failed to update batch')
    } finally {
      setLoading(false)
    }
  }

  // Delete an individual batch
  const handleDeleteBatch = (batch, parentItem) => {
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }

    const totalBatchesForItem = parentItem?.batches?.length || 1

    setConfirmDialog({
      title: 'Delete Stock Batch',
      message:
        totalBatchesForItem <= 1
          ? `This is the only remaining batch for "${batch.name}". Deleting it will remove the item from inventory. Are you sure you want to proceed?`
          : `Are you sure you want to delete this batch of ${batch.quantity} ${formatUnit(batch.quantity, batch.unit || 'pieces')}${batch.expiryDate ? ` (Exp: ${new Date(batch.expiryDate).toLocaleDateString()})` : ''}? Other batches will remain intact.`,
      onConfirm: async () => {
        if (isOffline) {
          triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
          return
        }
        setLoading(true)
        try {
          const targetDoc = inventoryList.find((i) => i.id === batch.parentDocId)
          if (!targetDoc) {
            throw new Error('Stock document not found.')
          }

          const existingBatches =
            Array.isArray(targetDoc.batches) && targetDoc.batches.length > 0
              ? targetDoc.batches
              : [
                  {
                    id: batch.id,
                    quantity: targetDoc.quantity,
                    expiryDate: targetDoc.expiryDate || null
                  }
                ]

          const remainingBatches = existingBatches.filter((b) => b.id !== batch.id)

          if (remainingBatches.length === 0) {
            await deleteInventoryItem(targetDoc.id)
            if (totalBatchesForItem <= 1 && batchDetailsItemKey) {
              setBatchDetailsItemKey(null)
            }
          } else {
            const newTotalQty = remainingBatches.reduce((s, b) => s + (Number(b.quantity) || 0), 0)
            const earliestExpiry = getEarliestBatchExpiry(remainingBatches)
            const newStatus = computeInventoryStatus(newTotalQty, earliestExpiry)

            await updateInventoryItem(
              targetDoc.id,
              {
                quantity: newTotalQty,
                batches: remainingBatches,
                expiryDate: earliestExpiry,
                status: newStatus
              },
              user.uid
            )
          }

          await logInventoryTransaction(
            'deleted',
            batch.name,
            batch.quantity,
            batch.unit || targetDoc.unit || 'pieces',
            `Deleted batch of ${batch.quantity} ${batch.unit || targetDoc.unit || 'pieces'}${batch.expiryDate ? ` (Exp: ${new Date(batch.expiryDate).toLocaleDateString()})` : ''}`
          )

          triggerSuccess(`Batch for "${batch.name}" deleted successfully.`)
          loadData()
        } catch (err) {
          triggerError(err.message || 'Failed to delete batch')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // Add Stock to Existing Item (Adds additional stock without creating duplicate records)
  const handleOpenAddStockModal = (item = null) => {
    if (item) {
      setAddStockItemId(item.id)
      setAddStockSearch(
        `${item.name} (${item.category}) - ${displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)} in stock`
      )
      setAddStockQty('')
      setAddStockQtyGroup('')
      setAddStockQtyPieces('')
      setAddStockExpiry('')
      setAddStockErrors({})
      setIsAddStockModalOpen(true)
    } else {
      setAddStockItemId('')
      setAddStockSearch('')
      setAddStockQty('')
      setAddStockQtyGroup('')
      setAddStockQtyPieces('')
      setAddStockExpiry('')
      setAddStockErrors({})
      setIsAddStockModalOpen(true)
    }
  }

  const handleSaveAddStock = async (e) => {
    e.preventDefault()
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }

    const errors = {}
    if (!addStockItemId) {
      errors.itemId = 'Please select an existing inventory item.'
    }

    const targetItem =
      groupedInventory.find((g) => g.id === addStockItemId || g.key === addStockItemId) ||
      inventoryList.find((i) => i.id === addStockItemId)
    if (!targetItem) {
      errors.itemId = 'Selected inventory item was not found.'
    }

    let addedBaseQty = 0
    if (targetItem) {
      const hasGroup = targetItem.groupUnit && targetItem.groupUnit !== 'none' && targetItem.piecesPerUnit
      const factor = parseInt(targetItem.piecesPerUnit, 10) || 12

      if (hasGroup) {
        const grp = parseInt(addStockQtyGroup, 10) || 0
        const pcs = parseInt(addStockQtyPieces, 10) || 0
        addedBaseQty = grp * factor + pcs
      } else {
        addedBaseQty = parseInt(addStockQty, 10) || 0
      }

      const isSupplies = isSuppliesCategory(targetItem.category)
      if (!isSupplies) {
        if (!addStockExpiry) {
          errors.expiry = 'Please specify an expiration date for the new stock batch.'
        } else if (isPastDate(addStockExpiry)) {
          errors.expiry = DATE_ERROR_MESSAGES.EXPIRY_PAST
        }
      }
    }

    if (addedBaseQty <= 0) {
      errors.qty = 'Please enter a valid quantity greater than 0.'
    }

    if (Object.keys(errors).length > 0) {
      setAddStockErrors(errors)
      return
    }

    setLoading(true)
    try {
      const targetDoc =
        inventoryList.find((i) => i.id === (targetItem.primaryDocId || targetItem.id)) ||
        inventoryList.find(
          (i) =>
            areNamesSimilar(i.name, targetItem.name) &&
            (i.category || '').toLowerCase().trim() ===
              (targetItem.category || '').toLowerCase().trim()
        ) ||
        targetItem

      // 1. Retrieve existing batches without modifying their expiration dates
      const existingBatches =
        Array.isArray(targetDoc.batches) && targetDoc.batches.length > 0
          ? targetDoc.batches.filter((b) => b.quantity > 0)
          : targetDoc.quantity > 0
            ? [
                {
                  id: `batch-${targetDoc.id}-initial`,
                  quantity: targetDoc.quantity,
                  expiryDate: targetDoc.expiryDate || null,
                  receivedDate:
                    targetDoc.receivedDate || targetDoc.createdAt || new Date().toISOString(),
                  unit: targetDoc.unit || targetItem.unit || 'pieces',
                  groupUnit: targetDoc.groupUnit || targetItem.groupUnit || 'none',
                  piecesPerUnit: targetDoc.piecesPerUnit || targetItem.piecesPerUnit || null
                }
              ]
            : []

      // 2. Create distinct new stock batch
      const newBatch = {
        id: 'batch-' + Math.random().toString(36).substr(2, 9),
        quantity: addedBaseQty,
        expiryDate:
          isSuppliesCategory(targetItem.category) || !addStockExpiry
            ? null
            : new Date(addStockExpiry).toISOString(),
        receivedDate: new Date().toISOString(),
        unit: targetItem.unit || targetDoc.unit || 'pieces',
        groupUnit: targetItem.groupUnit || targetDoc.groupUnit || 'none',
        piecesPerUnit: targetItem.piecesPerUnit || targetDoc.piecesPerUnit || null
      }

      // 3. Append new batch to existing batches (existing batch expiration dates are fully preserved)
      const updatedBatches = [...existingBatches, newBatch]
      const newQty = targetDoc.quantity + addedBaseQty

      // 4. Determine earliest active expiry date for FEFO release and status indicator
      const earliestExpiry = getEarliestBatchExpiry(updatedBatches)
      const newStatus = computeInventoryStatus(newQty, earliestExpiry)

      await updateInventoryItem(
        targetDoc.id,
        {
          quantity: newQty,
          expiryDate: earliestExpiry,
          batches: updatedBatches,
          status: newStatus,
          hasBeenReleased: false
        },
        user.uid
      )

      const expLog = addStockExpiry ? ` (Exp: ${new Date(addStockExpiry).toLocaleDateString()})` : ''
      await logInventoryTransaction(
        'added',
        targetItem.name,
        addedBaseQty,
        targetItem.unit || 'pieces',
        `Stock replenished via Add Stock [Batch: +${addedBaseQty} ${formatUnit(addedBaseQty, targetItem.unit || 'pieces')}${expLog}]`
      )

      triggerSuccess(
        `Added ${addedBaseQty} ${formatUnit(addedBaseQty, targetItem.unit || 'pieces')} to "${targetItem.name}". New total: ${newQty} ${formatUnit(newQty, targetItem.unit || 'pieces')}.`
      )
      setIsAddStockModalOpen(false)
      setAddStockItemId('')
      setAddStockSearch('')
      setAddStockQty('')
      setAddStockQtyGroup('')
      setAddStockQtyPieces('')
      setAddStockExpiry('')
      setAddStockErrors({})
      loadData()
    } catch (err) {
      triggerError(err.message || 'Failed to add stock')
    } finally {
      setLoading(false)
    }
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
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }
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
        const targetGroupItem =
          groupedInventory.find((g) => g.id === pending.id || g.key === pending.id) ||
          inventoryList.find((i) => i.id === pending.id)
        if (!targetGroupItem) {
          throw new Error(`Item "${pending.name}" not found in inventory.`)
        }
        const baseQtyToRelease = parseInt(pending.baseQty, 10)
        if (baseQtyToRelease > targetGroupItem.quantity) {
          throw new Error(
            `Insufficient stock for "${targetGroupItem.name}". Only ${displayStock(targetGroupItem.quantity, targetGroupItem.unit, targetGroupItem.groupUnit, targetGroupItem.piecesPerUnit)} available.`
          )
        }

        // Find all underlying documents matching this item
        const targetDocs = inventoryList.filter(
          (i) =>
            i.id === targetGroupItem.id ||
            (areNamesSimilar(i.name, targetGroupItem.name) &&
              (i.category || '').toLowerCase().trim() ===
                (targetGroupItem.category || '').toLowerCase().trim())
        )

        // Gather all batches across targetDocs
        const allCandidateBatches = []
        for (const doc of targetDocs) {
          if (Array.isArray(doc.batches) && doc.batches.length > 0) {
            doc.batches.forEach((b, bIdx) => {
              if (Number(b.quantity) > 0) {
                allCandidateBatches.push({
                  ...b,
                  parentDocId: doc.id,
                  batchIdx: bIdx,
                  receivedDate: b.receivedDate || doc.receivedDate || doc.createdAt || 0
                })
              }
            })
          } else if (Number(doc.quantity) > 0) {
            allCandidateBatches.push({
              id: `batch-${doc.id}-initial`,
              parentDocId: doc.id,
              batchIdx: -1,
              quantity: Number(doc.quantity),
              expiryDate: doc.expiryDate || null,
              receivedDate: doc.receivedDate || doc.createdAt || 0
            })
          }
        }

        // Sort by FEFO:
        // 1. Earliest expiryDate first
        // 2. Non-perishables by oldest receivedDate first (FIFO)
        allCandidateBatches.sort((a, b) => {
          if (a.expiryDate && b.expiryDate) {
            return new Date(a.expiryDate) - new Date(b.expiryDate)
          }
          if (a.expiryDate) return -1
          if (b.expiryDate) return 1
          return new Date(a.receivedDate) - new Date(b.receivedDate)
        })

        let remainingToDeduct = baseQtyToRelease
        for (const b of allCandidateBatches) {
          if (remainingToDeduct <= 0) break
          if (b.quantity <= remainingToDeduct) {
            remainingToDeduct -= b.quantity
            b.quantity = 0
          } else {
            b.quantity -= remainingToDeduct
            remainingToDeduct = 0
          }
        }

        // Apply changes back to each underlying document
        for (const doc of targetDocs) {
          const docRemainingBatches = allCandidateBatches
            .filter((b) => b.parentDocId === doc.id && b.quantity > 0)
            .map(({ parentDocId, batchIdx, ...rest }) => rest)
          const newDocQty = docRemainingBatches.reduce((s, b) => s + b.quantity, 0)
          const newEarliestExpiry = getEarliestBatchExpiry(docRemainingBatches)
          const newStatus = computeInventoryStatus(newDocQty, newEarliestExpiry)

          await updateInventoryItem(
            doc.id,
            {
              quantity: newDocQty,
              batches: docRemainingBatches,
              expiryDate: newEarliestExpiry,
              status: newStatus,
              hasBeenReleased: true
            },
            user.uid
          )
        }

        await logInventoryTransaction(
          'released',
          targetGroupItem.name,
          baseQtyToRelease,
          pending.baseUnit || targetGroupItem.unit || 'pieces',
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
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }
    const donor = donorsList.find((d) => d.id === donorId)
    if (!donor) return

    setConfirmDialog({
      title: 'Delete Donor Profile',
      message: `Are you sure you want to delete ${donor.name}? This will permanently remove the donor profile.`,
      onConfirm: async () => {
        if (isOffline) {
          triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
          return
        }
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
    if (field === 'category' && isSuppliesCategory(val)) {
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

    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }

    const errors = {}
    if (!donorName.trim()) errors.donorName = 'Donor name is required.'
    if (!donPurpose.trim()) errors.donPurpose = 'Purpose is required.'
    if (!donDate) {
      errors.donDate = 'Donation date is required.'
    } else if (isPastDate(donDate)) {
      errors.donDate = DATE_ERROR_MESSAGES.DONATION_PAST
    }

    // Check donation items
    const itemErrors = []
    let hasItemErrors = false
    donItems.forEach((item, idx) => {
      const itemErr = {}
      const isSchoolSupplies = isSuppliesCategory(item.category)
      const unitLower = (item.unit || '').toLowerCase().trim()
      const isAlreadyGrouped = ['pack', 'packs', 'box', 'boxes', 'bundle', 'bundles'].includes(
        unitLower
      )

      if (!item.category) itemErr.category = 'Category is required.'
      if (!item.name || !item.name.trim()) itemErr.name = 'Item name is required.'
      if (!item.quantity) itemErr.quantity = 'Quantity is required.'
      if (!item.unit) itemErr.unit = 'Unit is required.'
      if (!isSchoolSupplies && !item.expiryDate) {
        itemErr.expiryDate = 'Expiration date is required.'
      } else if (item.expiryDate && isPastDate(item.expiryDate)) {
        itemErr.expiryDate = DATE_ERROR_MESSAGES.EXPIRY_PAST
      }
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
      } else {
        const newDonor = await addDonor({
          name: donorName.trim(),
          type: 'individual',
          createdAt: new Date().toISOString()
        })
        finalDonorId = newDonor.id
      }

      // Process and convert grouped items to base units (pieces)
      const processedItems = donItems.map((i) => {
        const isSchoolSupplies = isSuppliesCategory(i.category)
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
        const cleanExpiry = item.expiryDate
          ? new Date(item.expiryDate).toISOString().split('T')[0]
          : null
        const cleanCategory = (item.category || '').toLowerCase().trim()
        const cleanUnit = (item.unit || '').toLowerCase().trim()

        const existingSimilar = inventoryList.find((i) => {
          const existingName = i.name.toLowerCase().trim()
          const existingCategory = (i.category || '').toLowerCase().trim()
          const existingUnit = (i.unit || '').toLowerCase().trim()
          const existingExpiry = i.expiryDate
            ? new Date(i.expiryDate).toISOString().split('T')[0]
            : null
          return (
            areNamesSimilar(existingName, item.name) &&
            existingCategory === cleanCategory &&
            existingUnit === cleanUnit &&
            existingExpiry === cleanExpiry
          )
        })

        const targetName = existingSimilar ? existingSimilar.name : item.name
        const targetUnit = existingSimilar ? existingSimilar.unit : item.unit

        await logInventoryTransaction(
          'added',
          targetName,
          item.quantity,
          targetUnit,
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

    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }

    const isEditing = editingOrg !== null
    const determinedType = isEditing
      ? editingOrg.type || (editingOrg.id?.startsWith('org-') ? 'organization' : 'department')
      : isAddOrgModalOpen
        ? 'organization'
        : selectedOrgSubTab === 'organization'
          ? 'organization'
          : 'department'

    const upperAbbr = orgAbbr.toUpperCase().trim()
    let finalOrgId = orgId

    const errors = {}
    if (!orgName.trim()) errors.orgName = 'Name is required.'
    if (!upperAbbr) errors.orgAbbr = 'Abbreviation is required.'

    if (determinedType === 'organization') {
      if (!orgDesc.trim()) errors.orgDesc = 'Description is required.'

      // Check unique organization name
      const duplicateOrg = orgsList.find(
        (org) =>
          org.id !== (isEditing ? editingOrg.id : null) &&
          isOrgItem(org) &&
          isFuzzyDuplicate(org.name, orgName)
      )
      if (duplicateOrg) {
        errors.orgName = `The organization name "${duplicateOrg.name}" is already in use.`
      }
    } else {
      // Check unique department name
      const duplicateDept = orgsList.find(
        (org) =>
          org.id !== (isEditing ? editingOrg.id : null) &&
          isDeptItem(org) &&
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
          name: orgName.trim(),
          abbreviation: upperAbbr,
          description: orgDesc.trim(),
          type: determinedType
        }
        if (determinedType === 'department') {
          updates.logo = deptLogo || null
          updates.coordinatorId = deptCoordinatorId || null
        } else {
          updates.logo = orgLogo || null
          updates.departmentId = orgDepartmentId || null
          updates.parentDepartmentId = orgDepartmentId || null
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
          name: orgName.trim(),
          abbreviation: upperAbbr,
          description: orgDesc.trim(),
          type: determinedType
        }
        if (determinedType === 'department') {
          newOrg.logo = deptLogo || null
          newOrg.coordinatorId = deptCoordinatorId || null
        } else {
          newOrg.logo = orgLogo || null
          newOrg.departmentId = orgDepartmentId || null
          newOrg.parentDepartmentId = orgDepartmentId || null
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
      setOrgLogo('')
      setOrgDepartmentId('')
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
    setOrgLogo(org.logo || '')
    setOrgDepartmentId(org.departmentId || org.parentDepartmentId || '')
    setDeptCoordinatorId(org.coordinatorId || '')
    setOrgErrors({})
    setDeptErrors({})
    if (isOrgItem(org)) {
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
    setOrgLogo('')
    setOrgDepartmentId('')
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
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }
    const org = orgsList.find((o) => o.id === orgId)
    if (!org) return

    const orgIsOrg = isOrgItem(org)
    setConfirmDialog({
      title: `Delete ${orgIsOrg ? 'Organization' : 'Department'} Profile`,
      message: `Are you sure you want to delete ${org.name}? This will permanently remove the profile.`,
      onConfirm: async () => {
        if (isOffline) {
          triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
          return
        }
        setLoading(true)
        try {
          await deleteOrganization(orgId)
          triggerSuccess(
            `${orgIsOrg ? 'Organization' : 'Department'} ${org.name} successfully deleted.`
          )
          if (editingOrg?.id === orgId) {
            handleCancelOrgEdit()
          }
          if (selectedOrgSubTab === orgId) {
            setSelectedOrgSubTab(orgIsOrg ? 'organization' : 'department')
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

  // Event schedule helper to open schedule modal
  const handleOpenScheduleModal = (targetDate = null) => {
    setEditingEvent(null)
    setEvtName('')
    setEvtDesc('')
    if (targetDate) {
      if (isPastDate(targetDate)) {
        triggerError('Cannot schedule events on past dates. Please select today or a future date.')
        return
      }
      try {
        const localDate = new Date(targetDate)
        const offset = localDate.getTimezoneOffset()
        const adjustedDate = new Date(localDate.getTime() - offset * 60 * 1000)
        setEvtDate(adjustedDate.toISOString().slice(0, 16))
      } catch (err) {
        setEvtDate('')
      }
    } else {
      setEvtDate('')
    }
    setEvtLoc('')
    setEvtOrgId('')
    setEvtStatus('planned')
    setEvtType('department')
    setEvtOrgName('')
    setEvtParentDeptId('')
    setEvtErrors({})
    setIsEventModalOpen(true)
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
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }
    setConfirmDialog({
      title: 'Delete Event Profile',
      message: `Are you sure you want to permanently delete event "${evt.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        if (isOffline) {
          triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
          return
        }
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

  const handleQuickCompleteEvent = (evt) => {
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }
    setConfirmDialog({
      title: 'Mark Event as Completed',
      message: `Are you sure you want to mark event "${evt.name}" as Completed? It will be moved to the assigned organization/department history.`,
      onConfirm: async () => {
        if (isOffline) {
          triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
          return
        }
        setLoading(true)
        try {
          await updateEvent(evt.id, { status: 'completed' })
          triggerSuccess(`Event "${evt.name}" marked as completed and moved to organization history.`)
          loadData()
        } catch (err) {
          triggerError(err.message || 'Failed to complete event.')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // Event schedule / update handler
  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }
    const isOrg = evtType === 'organization'

    const errors = {}
    if (!evtName.trim()) errors.evtName = 'Activity name is required.'
    if (!evtDate) {
      errors.evtDate = 'Schedule date is required.'
    } else {
      const isOriginalDate =
        editingEvent?.scheduleDate &&
        (new Date(evtDate).getTime() === new Date(editingEvent.scheduleDate).getTime() ||
          evtDate === editingEvent.scheduleDate ||
          evtDate.split('T')[0] ===
            new Date(editingEvent.scheduleDate).toISOString().split('T')[0])
      if (!isOriginalDate && isPastDate(evtDate)) {
        errors.evtDate = DATE_ERROR_MESSAGES.EVENT_PAST
      }
    }
    if (!evtLoc.trim()) errors.evtLoc = 'Target location is required.'
    if (isOrg) {
      if (!evtOrgId) errors.evtOrgId = 'Assigned Organization is required.'
    } else {
      if (!evtOrgId) errors.evtOrgId = 'Assigned Department is required.'
    }

    if (Object.keys(errors).length > 0) {
      setEvtErrors(errors)
      return
    }

    setLoading(true)
    try {
      const selectedOrg = orgsList.find((o) => o.id === evtOrgId)
      const payload = {
        name: evtName.trim(),
        description: evtDesc.trim(),
        scheduleDate: new Date(evtDate).toISOString(),
        location: evtLoc.trim(),
        assignedOrganizationId: evtOrgId,
        eventType: evtType,
        organizationName: isOrg ? (selectedOrg ? selectedOrg.name : '') : null,
        parentDepartmentId: isOrg
          ? selectedOrg?.departmentId || selectedOrg?.parentDepartmentId || null
          : null
      }

      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          ...payload,
          status: editingEvent.status || 'planned'
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
    if (isOffline) {
      triggerError('Cannot perform action: No internet connection. Please wait until connection is restored.')
      return
    }
    if (!selectedReport) return
    const trimmedFeedback = (feedbackNote || '').trim()
    if (status === 'returned' && !trimmedFeedback) {
      triggerError('Feedback notes are mandatory to return reports for revision. Please type your feedback before returning.')
      return
    }

    setLoading(true)
    try {
      await updateReport(
        selectedReport.id,
        {
          status,
          adminFeedback: status === 'returned' ? trimmedFeedback : null
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

  // Compile Approved Report to PDF (standard format) or directly convert/download uploaded file
  const compileReportPDF = async (report) => {
    const isBuiltInTemplate = Boolean(
      report?.documentSource === 'built_in_template' ||
      report?.submissionType === 'template' ||
      (report?.isTemplateActive && !report?.originalDocxUrl && report?.submissionType !== 'gdoc_submission')
    )

    if (!isBuiltInTemplate && (report?.submissionType === 'docx_upload' || report?.originalDocxUrl)) {
      if (report.fileType === 'pdf' || report.originalDocxName?.toLowerCase().endsWith('.pdf')) {
        downloadFileFromUrl(
          report.originalDocxUrl,
          report.originalDocxName || `${report.activityTitle || 'Report'}.pdf`
        )
        return
      }
      try {
        await exportDocxToPDF(
          report.originalDocxUrl,
          report.originalDocxName || report.activityTitle || 'Report'
        )
      } catch (err) {
        console.error('Failed to export DOCX as PDF, falling back to original DOCX download:', err)
        downloadFileFromUrl(
          report.originalDocxUrl,
          report.originalDocxName || `${report.activityTitle || 'Report'}.docx`
        )
      }
      return
    }

    if (!isBuiltInTemplate && report?.googleDocsUrl) {
      const match = report.googleDocsUrl.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
      if (match) {
        const docId = match[1]
        downloadFileFromUrl(
          `https://docs.google.com/document/d/${docId}/export?format=pdf`,
          `${(report.activityTitle || 'Report').replace(/[^a-zA-Z0-9_-]+/g, '_')}.pdf`
        )
        return
      }
    }

    setExportingReport(report)
  }

  // Compile Approved Report to DOCX (standard format) or directly download uploaded file
  const compileReportDOCX = async (report) => {
    const isBuiltInTemplate = Boolean(
      report?.documentSource === 'built_in_template' ||
      report?.submissionType === 'template' ||
      (report?.isTemplateActive && !report?.originalDocxUrl && report?.submissionType !== 'gdoc_submission')
    )

    if (!isBuiltInTemplate && (report?.submissionType === 'docx_upload' || report?.originalDocxUrl)) {
      downloadFileFromUrl(
        report.originalDocxUrl,
        report.originalDocxName || `${report.activityTitle || 'Report'}.${report.fileType === 'pdf' ? 'pdf' : 'docx'}`
      )
      return
    }

    if (!isBuiltInTemplate && report?.googleDocsUrl) {
      const match = report.googleDocsUrl.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
      if (match) {
        const docId = match[1]
        downloadFileFromUrl(
          `https://docs.google.com/document/d/${docId}/export?format=docx`,
          `${(report.activityTitle || 'Report').replace(/[^a-zA-Z0-9_-]+/g, '_')}.docx`
        )
        return
      }
    }

    setExportingDocxReport(report)
  }

  // Helper to get consistent submission timestamp for pending queue chronological sorting (newest first)
  const getPendingReportTimestamp = (rep) => {
    if (!rep) return 0
    if (rep.submittedAt) {
      const t = new Date(rep.submittedAt).getTime()
      if (!isNaN(t)) return t
    }
    if (Array.isArray(rep.history) && rep.history.length > 0) {
      const actionEntry = [...rep.history]
        .reverse()
        .find((h) => h.status === 'submitted' || h.status === 'returned')
      if (actionEntry?.timestamp) {
        const t = new Date(actionEntry.timestamp).getTime()
        if (!isNaN(t)) return t
      }
    }
    if (rep.updatedAt) {
      const t = new Date(rep.updatedAt).getTime()
      if (!isNaN(t)) return t
    }
    if (rep.createdAt) {
      const t = new Date(rep.createdAt).getTime()
      if (!isNaN(t)) return t
    }
    return 0
  }

  // Helper to extract all metadata & content text for deep search on approved reports
  const getReportSearchableText = (rep) => {
    if (!rep) return ''
    const event = eventsList.find((e) => e.id === rep.eventId)
    const org = orgsList.find((o) => o.id === rep.organizationId)
    const author = usersList.find((u) => u.uid === rep.authorId)

    const rawNarrativeText = rep.narrative ? rep.narrative.replace(/<[^>]*>/g, ' ') : ''

    const fields = [
      rep.activityTitle,
      rep.title,
      rep.narrativeReportName,
      event?.name,
      event?.venue,
      event?.description,
      event?.department,
      event?.program,
      author?.name,
      rep.submittedBy,
      rep.authorName,
      rep.venue,
      rep.location,
      rep.program,
      rep.department,
      org?.name,
      org?.abbreviation,
      rep.organizationName,
      rep.beneficiaries,
      rep.targetBeneficiaries,
      rep.objectives,
      rep.objective,
      rep.summary,
      rep.description,
      rep.academicYear,
      rep.semester,
      rawNarrativeText
    ]

    return fields.filter(Boolean).join(' ').toLowerCase()
  }

  return (
    <div className="h-screen max-h-screen flex flex-col font-poppins selection:bg-sig-green/20 selection:text-navy-blue overflow-hidden bg-[#F1EFEC]">
      {/* Top Glass Header Bar */}
      <header className="mx-2 sm:mx-4 mt-2 sm:mt-4 glass-header rounded-2xl flex items-center justify-between px-3 sm:px-6 py-2 sm:py-2.5 shrink-0 shadow-glass-sm gap-2">
        {/* Left: Logo and Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 bg-white/60 backdrop-blur-sm p-1.5 sm:p-2 pr-3 sm:pr-4 rounded-xl border border-white/60 min-w-0">
          <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg bg-white/90 flex items-center justify-center border border-white/80 overflow-hidden shrink-0 shadow-2xs">
            <img src={logo} alt="CES Logo" className="h-7 w-7 sm:h-9 sm:w-9 object-contain" />
          </div>
          <div className="flex flex-col text-left leading-none min-w-0">
            <span className="text-xs sm:text-[13px] font-bold text-navy-blue tracking-wide uppercase leading-tight truncate">
              Community Extension & Services
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-sig-green tracking-wide uppercase mt-0.5 leading-tight truncate">
              Dominican College of Tarlac
            </span>
          </div>
        </div>

        {/* Right: Info, Home, Profile info */}
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          <button
            type="button"
            disabled={isAnyModalOpen}
            onClick={() => setActiveTab('about')}
            className={`text-navy-blue transition-all duration-150 p-1 ${isAnyModalOpen ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-85 cursor-pointer'}`}
            title="About DommUnity"
          >
            <Info className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 sm:space-x-3 bg-white/60 backdrop-blur-sm p-1.5 sm:p-2 pr-3 sm:pr-4 pl-2 sm:pl-3 rounded-xl border border-white/60">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-navy-blue/15 flex items-center justify-center text-navy-blue bg-white shadow-2xs shrink-0">
              <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="text-left leading-none">
              <div className="text-sm font-bold text-navy-blue truncate max-w-[120px] sm:max-w-[160px]">
                {user.username || user.name || 'admin123'}
              </div>
              <div className="text-xs text-gray-400 font-medium mt-0.5 truncate max-w-[120px] sm:max-w-[160px] hidden sm:block">{user.email}</div>
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
          className="flex-1 my-2 sm:my-4 mx-2 sm:mx-4 p-3 sm:p-5 overflow-y-auto glass-panel rounded-2xl shadow-glass-md min-w-0"
        >
          <AnimatedPage pageKey={activeTab}>
            <div className="flex flex-col xl:flex-row gap-4 sm:gap-5 max-w-[1600px] mx-auto items-start w-full min-w-0">
              {/* Left / Center Content Column */}
              <div className="flex-1 w-full space-y-4 sm:space-y-5 min-w-0">
                {/* Banner Alert Prompts */}

                {/* ==================================================== */}
                {/* DASHBOARD TAB PANEL */}
                {/* ==================================================== */}
                {activeTab === 'dashboard' && user.role === 'admin' && (
                  isOffline ? (
                    <DashboardSkeleton />
                  ) : (
                    <div className="space-y-4 min-w-0">
                      {/* Header row */}
                      <div>
                        <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                          Dashboard
                        </h1>
                      </div>

                      {/* Quick Stats Grid */}
                      <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                      >
                        <motion.div
                          variants={staggerItem}
                          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md hover:border-sig-green/30 transition-all duration-200"
                        >
                          <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl shrink-0">
                            <Users className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block leading-none mb-1">
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
                          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md hover:border-sig-green/30 transition-all duration-200"
                        >
                          <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl shrink-0">
                            <Package className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block leading-none mb-1">
                              Stock Items
                            </span>
                            <span className="text-xl font-black text-navy-blue leading-none">
                              {inventoryList.reduce((sum, item) => sum + item.quantity, 0)}
                            </span>
                          </div>
                        </motion.div>

                        <motion.div
                          variants={staggerItem}
                          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md hover:border-sig-green/30 transition-all duration-200"
                        >
                          <div className="p-2.5 bg-navy-blue/5 text-navy-blue rounded-xl shrink-0">
                            <FolderOpen className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block leading-none mb-1">
                              Departments
                            </span>
                            <span className="text-xl font-black text-navy-blue leading-none">
                              {orgsList.filter(isDeptItem).length}
                            </span>
                          </div>
                        </motion.div>

                        <motion.div
                          variants={staggerItem}
                          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md hover:border-sig-green/30 transition-all duration-200"
                        >
                          <div className="p-2.5 bg-sig-green/10 text-sig-green rounded-xl shrink-0">
                            <Calendar className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block leading-none mb-1">
                              Scheduled
                            </span>
                            <span className="text-xl font-black text-navy-blue leading-none">
                              {
                                eventsList.filter((e) => {
                                  const o = orgsList.find(
                                    (org) => org.id === e.assignedOrganizationId
                                  )
                                  const isMatch = !o || isDeptItem(o)
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
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block leading-none mb-1">
                              Completed
                            </span>
                            <span className="text-xl font-black text-navy-blue leading-none">
                              {
                                eventsList.filter((e) => {
                                  const o = orgsList.find(
                                    (org) => org.id === e.assignedOrganizationId
                                  )
                                  const isMatch = !o || isDeptItem(o)
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
                            <FileText className="w-4 h-4 text-navy-blue" />
                            <h3 className="font-bold text-navy-blue text-sm">
                              Pending Submitted Reports
                            </h3>
                            {reportsList.filter((r) => r.status === 'submitted').length > 0 && (
                              <span className="bg-amber-500 text-white rounded-full px-2 py-0.5 text-xs font-bold leading-none">
                                {reportsList.filter((r) => r.status === 'submitted').length}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setActiveTab('reports')}
                            className="text-xs text-sig-green-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Review All Reports</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {reportsList.filter((r) => r.status === 'submitted').length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {reportsList
                              .filter((r) => r.status === 'submitted')
                              .sort(
                                (a, b) =>
                                  getPendingReportTimestamp(b) - getPendingReportTimestamp(a)
                              )
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
                                        <span className="text-[10px] font-extrabold text-navy-blue uppercase bg-navy-blue/8 px-2 py-0.5 rounded">
                                          {org ? org.abbreviation : 'CES'}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">
                                          {new Date(rep.updatedAt || Date.now()).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <h4 className="font-bold text-navy-blue text-sm truncate">
                                        {ev ? ev.name : rep.activityTitle || 'Submitted Report'}
                                      </h4>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        Submitted by {author ? author.name : rep.authorName || rep.submittedBy || 'Coordinator'}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        onClick={() => {
                                          setSelectedReport(rep)
                                          setFeedbackNote(rep.adminFeedback || '')
                                        }}
                                        className="bg-navy-blue hover:bg-navy-blue-600 text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Inspect Report</span>
                                      </button>
                                      {Boolean(rep.submissionType === 'docx_upload' || rep.originalDocxUrl) ? (
                                        <button
                                          onClick={() =>
                                            downloadFileFromUrl(
                                              rep.originalDocxUrl,
                                              rep.originalDocxName || `${rep.activityTitle || 'Report'}.${rep.fileType === 'pdf' || rep.originalDocxName?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx'}`
                                            )
                                          }
                                          className="bg-sig-green hover:bg-sig-green-600 text-navy-blue font-semibold py-1.5 px-2.5 rounded-lg text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
                                          title="Download Submitted Document"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          <span>{rep.fileType === 'pdf' || rep.originalDocxName?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Download'}</span>
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => compileReportPDF(rep)}
                                          className="bg-sig-green hover:bg-sig-green-600 text-navy-blue font-semibold py-1.5 px-2.5 rounded-lg text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
                                          title="Export Report PDF"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          <span>Export</span>
                                        </button>
                                      )}
                                    </div>
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

                      {/* Upcoming Events Calendar Schedule Widget */}
                      <UpcomingEventsSchedule
                        events={eventsList}
                        orgs={orgsList}
                        onViewEvent={(evt) => {
                          setSelectedViewEvent(evt)
                          setIsViewEventModalOpen(true)
                        }}
                        onViewAll={() => setActiveTab('events')}
                      />
                    </div>
                  )
                )}

                {/* ==================================================== */}
                {/* INVENTORY TAB PANEL */}
                {/* ==================================================== */}
                {activeTab === 'inventory' && user.role === 'admin' && (
                  isOffline ? (
                    <InventorySkeleton />
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      {/* Header section */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
                        <div>
                          <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                            Inventory Management
                          </h1>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={handleOpenReportPreview}
                            className="flex items-center space-x-2 bg-navy-blue text-white border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green font-semibold py-2 px-4 rounded-full text-xs cursor-pointer transition shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Report PDF</span>
                          </button>
                        </div>
                      </div>

                      {/* Recommended Release Items Section */}
                      {(() => {
                        const recommendedItems = inventoryList.filter(
                          (item) =>
                            item.isRecommendedForRelease && item.expiryDate && item.quantity > 0
                        )

                        // Sort by nearest expiration date
                        const sortedItems = [...recommendedItems].sort(
                          (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
                        )
                        const displayedItems = showAllRecommended
                          ? sortedItems
                          : sortedItems.slice(0, 3)

                        return (
                          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 w-full animate-fade-in">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                              <h3 className="font-bold text-navy-blue text-sm">
                                Recommended Release Items
                              </h3>
                              <div className="flex items-center space-x-2.5">
                                <button
                                  type="button"
                                  onClick={() => setIsReleaseModalOpen(true)}
                                  className="flex items-center space-x-1.5 bg-navy-blue text-white border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green font-semibold py-2 px-4 rounded-full text-xs cursor-pointer transition shadow-xs"
                                >
                                  <Share className="w-3.5 h-3.5 transform rotate-180" />
                                  <span>Release Item</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsReviewModalOpen(true)}
                                  className="flex items-center space-x-1.5 bg-navy-blue text-white border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green font-bold py-2 px-4 rounded-full text-xs cursor-pointer transition shadow-xs"
                                >
                                  <ListFilter className="w-3.5 h-3.5" />
                                  <span>Release Review List ({pendingReleaseItems.length})</span>
                                </button>
                              </div>
                            </div>

                            {recommendedItems.length === 0 ? (
                              <p className="text-center py-6 text-gray-400 text-xs font-medium">
                                No items recommended for release.
                              </p>
                            ) : (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {displayedItems.map((item) => (
                                    <div
                                      key={item.id}
                                      className="border border-red-200 bg-red-50/40 rounded-2xl p-4 flex flex-col justify-between hover:border-red-300 transition"
                                    >
                                      <div>
                                        <div className="flex justify-between items-start gap-2">
                                          <h4 className="font-bold text-navy-blue text-sm leading-snug">
                                            {item.name}
                                          </h4>
                                          <span className="text-xs bg-white border border-red-200 text-red-700 font-bold px-2.5 py-0.5 rounded-full capitalize shrink-0">
                                            {item.category}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2.5 space-y-1">
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
                                          <div
                                            className={`flex items-center ${
                                              getExpirationInfo(item.expiryDate).isNearExpiry
                                                ? 'text-red-500 font-semibold'
                                                : 'text-gray-500 font-medium'
                                            }`}
                                          >
                                            <Clock className="w-3.5 h-3.5 mr-1 shrink-0" />
                                            Exp: {new Date(item.expiryDate).toLocaleDateString()}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="mt-3.5 flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReleaseItemId(item.id)
                                            const optionText = `${item.name} (${item.category}) - ${displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)} left ${item.expiryDate ? `(Exp: ${new Date(item.expiryDate).toLocaleDateString()})` : ''}`
                                            setReleaseSearch(optionText)
                                            setReleaseUnitType('base')
                                            setIsReleaseModalOpen(true)
                                          }}
                                          className="px-3.5 py-1.5 bg-navy-blue text-white rounded-full text-xs font-semibold border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition flex items-center space-x-1 cursor-pointer"
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
                                      className="px-4 py-1.5 border border-navy-blue/15 text-navy-blue hover:bg-navy-blue/5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer"
                                    >
                                      {showAllRecommended ? 'See Less' : 'See More'}
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )
                      })()}

                      {/* Full-width Stock Table Card with Filtering & Pagination */}
                      {(() => {
                        const filteredInventory = groupedInventory.filter((item) => {
                          // 1. Search Query filter (item name, description, or category)
                          if (invSearchQuery.trim()) {
                            const q = invSearchQuery.toLowerCase().trim()
                            const nameMatch = (item.name || '').toLowerCase().includes(q)
                            const descMatch = (item.description || '').toLowerCase().includes(q)
                            const catMatch = (item.category || '').toLowerCase().includes(q)
                            if (!nameMatch && !descMatch && !catMatch) return false
                          }

                          // 2. Category Filter
                          if (categoryFilter !== 'all') {
                            const itemCat = (item.category || '').toLowerCase().trim()
                            const filterCat = categoryFilter.toLowerCase().trim()
                            if (itemCat !== filterCat) return false
                          }

                          // 3. Unit / Packaging Type Filter
                          if (unitFilter !== 'all') {
                            const targetUnit = unitFilter.toLowerCase().trim()
                            const itemUnitLower = (item.unit || '').toLowerCase().trim()
                            const itemGroupLower = (item.groupUnit || '').toLowerCase().trim()
                            const batchesMatch = (item.batches || []).some((b) => {
                              const bUnit = (b.unit || '').toLowerCase().trim()
                              const bGroup = (b.groupUnit || '').toLowerCase().trim()
                              return bUnit.includes(targetUnit) || bGroup.includes(targetUnit)
                            })

                            if (targetUnit === 'pieces') {
                              const isPiece = itemUnitLower.includes('piece')
                              if (!isPiece && itemGroupLower !== 'none' && itemGroupLower !== '' && !batchesMatch)
                                return false
                            } else if (['pack', 'box', 'bundle'].includes(targetUnit)) {
                              const matchUnit =
                                itemUnitLower.includes(targetUnit) ||
                                itemGroupLower.includes(targetUnit) ||
                                batchesMatch
                              if (!matchUnit) return false
                            } else {
                              if (
                                !itemUnitLower.includes(targetUnit) &&
                                !itemGroupLower.includes(targetUnit) &&
                                !batchesMatch
                              )
                                return false
                            }
                          }

                          // 4. Stock Status Filter
                          if (statusFilter !== 'all') {
                            const itemStatus = (item.status || '').toLowerCase().trim()
                            const filterStatus = statusFilter.toLowerCase().trim()
                            if (itemStatus !== filterStatus) return false
                          }

                          // 5. Expiration Status Filter
                          if (expirationFilter !== 'all') {
                            const expInfo = getExpirationInfo(item.expiryDate)
                            if (expirationFilter === 'non_expiring') {
                              if (item.expiryDate) return false
                            } else if (expirationFilter === 'expired') {
                              if (!expInfo.isExpired) return false
                            } else if (expirationFilter === 'expiring_soon') {
                              if (expInfo.isExpired || !expInfo.isNearExpiry) return false
                            } else if (expirationFilter === 'good') {
                              if (!item.expiryDate || expInfo.isNearExpiry || expInfo.isExpired) return false
                            }
                          }

                          return true
                        })

                        const totalPages = Math.max(1, Math.ceil(filteredInventory.length / invItemsPerPage))
                        const safeCurrentPage = Math.min(Math.max(1, invCurrentPage), totalPages)
                        const startIndex = (safeCurrentPage - 1) * invItemsPerPage
                        const endIndex = Math.min(startIndex + invItemsPerPage, filteredInventory.length)
                        const paginatedInventory = filteredInventory.slice(startIndex, endIndex)

                        const hasActiveFilters =
                          invSearchQuery.trim() !== '' ||
                          categoryFilter !== 'all' ||
                          unitFilter !== 'all' ||
                          statusFilter !== 'all' ||
                          expirationFilter !== 'all'

                        return (
                          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between w-full">
                            <div id="inventory-table-container">
                              {/* Header with Title and Add Buttons */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 mb-4 gap-3">
                                <div>
                                  <h3 className="font-bold text-navy-blue text-base">
                                    Current Inventory Stock
                                  </h3>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Monitor stock levels, expirations, and replenish inventory
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddStockModal()}
                                    className="flex items-center space-x-1.5 bg-navy-blue text-white border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green font-semibold py-2 px-4 rounded-full text-xs cursor-pointer transition shadow-xs"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Stock</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="flex items-center space-x-1.5 bg-white text-navy-blue border border-navy-blue/30 hover:border-navy-blue hover:bg-navy-blue hover:text-white font-semibold py-2 px-4 rounded-full text-xs cursor-pointer transition shadow-xs"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Item</span>
                                  </button>
                                </div>
                              </div>

                              {/* Filtering Controls Bar */}
                              <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-3 mb-4 space-y-2.5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                                  {/* Search Input */}
                                  <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                      type="text"
                                      value={invSearchQuery}
                                      onChange={(e) => {
                                        setInvSearchQuery(e.target.value)
                                        setInvCurrentPage(1)
                                      }}
                                      placeholder="Search by name, category..."
                                      className="w-full pl-8 pr-7 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-navy-blue placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-blue/15 transition"
                                      style={{ height: '36px' }}
                                    />
                                    {invSearchQuery && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setInvSearchQuery('')
                                          setInvCurrentPage(1)
                                        }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-blue p-0.5 rounded cursor-pointer"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>

                                  {/* Category Filter */}
                                  <div>
                                    <CustomSelect
                                      value={categoryFilter}
                                      onChange={(e) => {
                                        setCategoryFilter(e.target.value)
                                        setInvCurrentPage(1)
                                      }}
                                      options={[
                                        { value: 'all', label: 'All Categories' },
                                        ...allCategories.map((cat) => ({ value: cat, label: cat }))
                                      ]}
                                      placeholder="All Categories"
                                      style={{ height: '36px' }}
                                      usePortal={true}
                                      menuMinWidth={180}
                                    />
                                  </div>

                                  {/* Unit / Packaging Type Filter */}
                                  <div>
                                    <CustomSelect
                                      value={unitFilter}
                                      onChange={(e) => {
                                        setUnitFilter(e.target.value)
                                        setInvCurrentPage(1)
                                      }}
                                      options={[
                                        { value: 'all', label: 'All Packaging Types' },
                                        { value: 'pieces', label: 'Pieces (Individual)' },
                                        { value: 'pack', label: 'Packs' },
                                        { value: 'box', label: 'Boxes' },
                                        { value: 'bundle', label: 'Bundles' },
                                        { value: 'cans', label: 'Cans' },
                                        { value: 'bottles', label: 'Bottles' },
                                        { value: 'bars', label: 'Bars' }
                                      ]}
                                      placeholder="All Packaging Types"
                                      style={{ height: '36px' }}
                                      usePortal={true}
                                      menuMinWidth={190}
                                    />
                                  </div>

                                  {/* Stock Status Filter */}
                                  <div>
                                    <CustomSelect
                                      value={statusFilter}
                                      onChange={(e) => {
                                        setStatusFilter(e.target.value)
                                        setInvCurrentPage(1)
                                      }}
                                      options={[
                                        { value: 'all', label: 'All Stock Levels' },
                                        { value: 'available', label: 'Available' },
                                        { value: 'low stock', label: 'Low Stock' },
                                        { value: 'expired', label: 'Expired' },
                                        { value: 'out of stock', label: 'Out of Stock' }
                                      ]}
                                      placeholder="All Stock Levels"
                                      style={{ height: '36px' }}
                                      usePortal={true}
                                      menuMinWidth={170}
                                    />
                                  </div>

                                  {/* Expiration Status Filter */}
                                  <div>
                                    <CustomSelect
                                      value={expirationFilter}
                                      onChange={(e) => {
                                        setExpirationFilter(e.target.value)
                                        setInvCurrentPage(1)
                                      }}
                                      options={[
                                        { value: 'all', label: 'All Expiration' },
                                        { value: 'good', label: 'Good (> 4 Months)' },
                                        { value: 'expiring_soon', label: 'Expiring Soon (≤ 4 Mos)' },
                                        { value: 'expired', label: 'Expired' },
                                        { value: 'non_expiring', label: 'Non-perishable (No Exp)' }
                                      ]}
                                      placeholder="All Expiration"
                                      style={{ height: '36px' }}
                                      usePortal={true}
                                      menuMinWidth={190}
                                    />
                                  </div>
                                </div>

                                {/* Active Filters and Clear Button */}
                                {hasActiveFilters && (
                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/60 text-xs">
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                      <Filter className="w-3.5 h-3.5 text-navy-blue" />
                                      <span>
                                        Filtered: <strong className="text-navy-blue font-bold">{filteredInventory.length}</strong> of {inventoryList.length} total items
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setInvSearchQuery('')
                                        setCategoryFilter('all')
                                        setUnitFilter('all')
                                        setStatusFilter('all')
                                        setExpirationFilter('all')
                                        setInvCurrentPage(1)
                                      }}
                                      className="flex items-center space-x-1 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-2.5 py-1 rounded-lg transition cursor-pointer"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Clear Filters</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Table */}
                              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase font-bold text-gray-500">
                                      <th className="py-3 px-3">Item Details</th>
                                      <th className="py-3 px-2">Category</th>
                                      <th className="py-3 px-2">Stock Level</th>
                                      <th className="py-3 px-2">Status</th>
                                      <th className="py-3 px-3 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50 text-xs">
                                    {paginatedInventory.map((item) => (
                                      <tr
                                        key={item.id}
                                        className={`hover:bg-gray-50/50 transition ${item.isRecommendedForRelease && item.expiryDate ? 'bg-red-50/30 font-medium' : ''}`}
                                      >
                                        <td className="py-3 px-3">
                                          <div className="font-bold text-navy-blue text-sm">
                                            <span>{item.name}</span>
                                          </div>
                                          {item.description && (
                                            <p className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                              {item.description}
                                            </p>
                                          )}
                                        </td>
                                        <td className="py-3 px-2 capitalize text-gray-600 font-medium text-xs">
                                          {item.category}
                                        </td>
                                        <td className="py-3 px-2 font-bold text-navy-blue">
                                          <span className="text-sm font-bold text-navy-blue">
                                            {item.quantity} {formatUnit(item.quantity, item.unit || 'pieces')}
                                          </span>
                                        </td>
                                        <td className="py-3 px-2">
                                          <span
                                            className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${item.status === 'available'
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
                                          <div className="flex justify-end items-center space-x-1.5">
                                            <button
                                              type="button"
                                              onClick={() => setBatchDetailsItemKey(item.key || item.id)}
                                              className="p-1.5 text-navy-blue hover:text-navy-blue/80 hover:bg-navy-blue/10 rounded-lg transition-all duration-150 cursor-pointer"
                                              title="View Stock Batches & Expirations (...)"
                                            >
                                              <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenAddStockModal(item)}
                                              className="p-1.5 text-gray-400 hover:text-sig-green hover:bg-sig-green/10 rounded-lg transition-all duration-150 cursor-pointer"
                                              title="Add Stock to this item"
                                            >
                                              <PlusCircle className="w-4 h-4" />
                                            </button>
                                            <button
                                              type="button"
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
                                                setItemErrors({})
                                              }}
                                              className="p-1.5 text-gray-400 hover:text-navy-blue hover:bg-navy-blue/10 rounded-lg transition-all duration-150 cursor-pointer"
                                              title="Edit item"
                                            >
                                              <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteInventory(item)}
                                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150 cursor-pointer"
                                              title="Delete item"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                    {groupedInventory.length === 0 && (
                                      <tr>
                                        <td colSpan="5" className="text-center py-8 text-gray-400 text-xs font-medium">
                                          No inventory entries available.
                                        </td>
                                      </tr>
                                    )}
                                    {groupedInventory.length > 0 && filteredInventory.length === 0 && (
                                      <tr>
                                        <td colSpan="5" className="text-center py-8 text-gray-400 text-xs font-medium">
                                          <div>No items match the selected filter criteria.</div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setInvSearchQuery('')
                                              setCategoryFilter('all')
                                              setUnitFilter('all')
                                              setStatusFilter('all')
                                              setExpirationFilter('all')
                                              setInvCurrentPage(1)
                                            }}
                                            className="mt-2 text-xs font-bold text-navy-blue hover:underline cursor-pointer"
                                          >
                                            Reset Filters
                                          </button>
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {/* Pagination Controls */}
                              {filteredInventory.length > 0 && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100 mt-2 text-xs">
                                  <div className="text-gray-500 font-medium">
                                    Showing <span className="font-bold text-navy-blue">{startIndex + 1}</span> to{' '}
                                    <span className="font-bold text-navy-blue">{endIndex}</span> of{' '}
                                    <span className="font-bold text-navy-blue">{filteredInventory.length}</span> records
                                    {filteredInventory.length !== inventoryList.length && (
                                      <span className="text-gray-400 ml-1">
                                        (filtered from {inventoryList.length} total)
                                      </span>
                                    )}
                                  </div>

                                  {totalPages > 1 && (
                                    <div className="flex items-center space-x-1 self-center sm:self-auto">
                                      {/* Previous Button */}
                                      <button
                                        type="button"
                                        disabled={safeCurrentPage <= 1}
                                        onClick={() => setInvCurrentPage((p) => Math.max(1, p - 1))}
                                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                                          safeCurrentPage <= 1
                                            ? 'opacity-40 cursor-not-allowed text-gray-400 bg-gray-100'
                                            : 'text-navy-blue hover:bg-gray-100 cursor-pointer border border-gray-200'
                                        }`}
                                      >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        <span>Previous</span>
                                      </button>

                                      {/* Page Numbers */}
                                      <div className="flex items-center space-x-1">
                                        {(() => {
                                          const pages = []
                                          let startPage = Math.max(1, safeCurrentPage - 2)
                                          let endPage = Math.min(totalPages, startPage + 4)
                                          if (endPage - startPage < 4) {
                                            startPage = Math.max(1, endPage - 4)
                                          }

                                          if (startPage > 1) {
                                            pages.push(
                                              <button
                                                key={1}
                                                type="button"
                                                onClick={() => setInvCurrentPage(1)}
                                                className="w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer text-navy-blue hover:bg-gray-100 border border-gray-200"
                                              >
                                                1
                                              </button>
                                            )
                                            if (startPage > 2) {
                                              pages.push(
                                                <span key="ellipsis-start" className="px-1 text-gray-400 font-bold">
                                                  ...
                                                </span>
                                              )
                                            }
                                          }

                                          for (let p = startPage; p <= endPage; p++) {
                                            pages.push(
                                              <button
                                                key={p}
                                                type="button"
                                                onClick={() => setInvCurrentPage(p)}
                                                className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                                  safeCurrentPage === p
                                                    ? 'bg-navy-blue text-white shadow-2xs'
                                                    : 'text-navy-blue hover:bg-gray-100 border border-gray-200'
                                                }`}
                                              >
                                                {p}
                                              </button>
                                            )
                                          }

                                          if (endPage < totalPages) {
                                            if (endPage < totalPages - 1) {
                                              pages.push(
                                                <span key="ellipsis-end" className="px-1 text-gray-400 font-bold">
                                                  ...
                                                </span>
                                              )
                                            }
                                            pages.push(
                                              <button
                                                key={totalPages}
                                                type="button"
                                                onClick={() => setInvCurrentPage(totalPages)}
                                                className="w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer text-navy-blue hover:bg-gray-100 border border-gray-200"
                                              >
                                                {totalPages}
                                              </button>
                                            )
                                          }

                                          return pages
                                        })()}
                                      </div>

                                      {/* Next Button */}
                                      <button
                                        type="button"
                                        disabled={safeCurrentPage >= totalPages}
                                        onClick={() => setInvCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                                          safeCurrentPage >= totalPages
                                            ? 'opacity-40 cursor-not-allowed text-gray-400 bg-gray-100'
                                            : 'text-navy-blue hover:bg-gray-100 cursor-pointer border border-gray-200'
                                        }`}
                                      >
                                        <span>Next</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Modal Overlay for Add Catalog Item */}
                      {isAddModalOpen &&
                        createPortal(
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal-overlay animate-fade-in">
                            <div className="glass-modal rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto">
                              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <h3 className="font-bold text-navy-blue text-sm">Add Item</h3>
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
                                  className="text-gray-400 hover:text-navy-blue transition-all duration-150 cursor-pointer"
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
                                          const matching = inventoryList.filter(
                                            (item) =>
                                              item.name
                                                .toLowerCase()
                                                .includes(itemName.toLowerCase()) &&
                                              !deletedItemNames.includes(
                                                item.name.toLowerCase().trim()
                                              )
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
                                                    className="group flex items-center justify-between p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left animate-fade-in"
                                                  >
                                                    <span className="truncate">
                                                      {name}{' '}
                                                      {originalItem?.category && (
                                                        <span className="text-[10px] text-gray-400 font-normal">
                                                          ({originalItem.category})
                                                        </span>
                                                      )}
                                                    </span>
                                                    <button
                                                      type="button"
                                                      onMouseDown={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                      }}
                                                      onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteItemName(name)
                                                      }}
                                                      className="text-gray-400 hover:text-red-500 transition-all duration-150 cursor-pointer p-0.5 rounded hover:bg-gray-100 shrink-0 ml-2"
                                                    >
                                                      <X className="w-3 h-3" />
                                                    </button>
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
                                  <SearchableDropdown
                                    value={itemCategory}
                                    onChange={(val) => {
                                      setItemCategory(val)
                                      setItemErrors((prev) => {
                                        const copy = { ...prev }
                                        delete copy.itemCategory
                                        return copy
                                      })
                                    }}
                                    options={activeCategories}
                                    onDelete={(cat) => handleDeleteCategory(cat)}
                                    allowCustom={true}
                                    placeholder="Select or type category"
                                    className={itemErrors.itemCategory ? 'border-red-500 ring-2 ring-red-500/10' : ''}
                                  />
                                </div>

                                {/* Unit Searchable Dropdown */}
                                <div>
                                  <label className="block text-gray-700 text-xs font-semibold mb-1">
                                    Unit
                                  </label>
                                  <SearchableDropdown
                                    value={itemUnit}
                                    onChange={(val) => {
                                      setItemUnit(val)
                                      setItemErrors((prev) => {
                                        const copy = { ...prev }
                                        delete copy.itemUnit
                                        return copy
                                      })
                                    }}
                                    options={activeUnits}
                                    onDelete={(u) => handleDeleteUnit(u)}
                                    allowCustom={true}
                                    placeholder="Select or type unit"
                                    className={itemErrors.itemUnit ? 'border-red-500 ring-2 ring-red-500/10' : ''}
                                  />
                                </div>

                                {/* Quantity */}
                                <div>
                                  <label className="block text-gray-700 text-xs font-semibold mb-1">
                                    Quantity
                                  </label>
                                  <SearchableDropdown
                                    value={itemQty}
                                    onChange={(val) => {
                                      handleQtyChange(val)
                                      setItemErrors((prev) => {
                                        const copy = { ...prev }
                                        delete copy.itemQty
                                        return copy
                                      })
                                    }}
                                    options={[5, 10, 20, 50, 100, 250, 500]}
                                    allowCustom={true}
                                    placeholder="Select or enter quantity"
                                    className={itemErrors.itemQty ? 'border-red-500 ring-2 ring-red-500/10' : ''}
                                  />
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
                                          <CustomSelect
                                            value={itemGroupUnit}
                                            onChange={(e) => {
                                              setItemGroupUnit(e.target.value)
                                              if (e.target.value === 'none') {
                                                setItemPiecesPerUnit('')
                                              } else if (!itemPiecesPerUnit) {
                                                setItemPiecesPerUnit('12')
                                              }
                                            }}
                                            options={[
                                              { value: 'none', label: 'Do not group (Individual pieces)' },
                                              { value: 'pack', label: 'Packs' },
                                              { value: 'box', label: 'Boxes' },
                                              { value: 'bundle', label: 'Bundles' }
                                            ]}
                                            placeholder="Do not group (Individual pieces)"
                                            style={{ height: '40px' }}
                                          />
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
                                    {!isSuppliesCategory(itemCategory) && (
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
                                      disabled={isSuppliesCategory(itemCategory)}
                                      disablePast={true}
                                      onChange={(val) => {
                                        setItemExpiry(val)
                                        if (val && isPastDate(val)) {
                                          setItemErrors((prev) => ({
                                            ...prev,
                                            itemExpiry: DATE_ERROR_MESSAGES.EXPIRY_PAST
                                          }))
                                        } else {
                                          setItemErrors((prev) => {
                                            const copy = { ...prev }
                                            delete copy.itemExpiry
                                            return copy
                                          })
                                        }
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
                          </div>,
                          document.body
                        )}

                      {/* Modal Overlay for Edit */}
                      {itemEditing &&
                        createPortal(
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
                                  className="text-gray-400 hover:text-navy-blue transition-all duration-150 cursor-pointer"
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
                                  <SearchableDropdown
                                    value={itemCategory}
                                    onChange={(val) => {
                                      setItemCategory(val)
                                      setItemErrors((prev) => {
                                        const copy = { ...prev }
                                        delete copy.itemCategory
                                        return copy
                                      })
                                    }}
                                    options={activeCategories}
                                    onDelete={(cat) => handleDeleteCategory(cat)}
                                    allowCustom={true}
                                    placeholder="Select or type category"
                                    className={itemErrors.itemCategory ? 'border-red-500 ring-2 ring-red-500/10' : ''}
                                  />
                                </div>

                                {/* Unit Searchable Dropdown */}
                                <div>
                                  <label className="block text-gray-700 text-xs font-semibold mb-1">
                                    Unit
                                  </label>
                                  <SearchableDropdown
                                    value={itemUnit}
                                    onChange={(val) => {
                                      setItemUnit(val)
                                      setItemErrors((prev) => {
                                        const copy = { ...prev }
                                        delete copy.itemUnit
                                        return copy
                                      })
                                    }}
                                    options={activeUnits}
                                    onDelete={(u) => handleDeleteUnit(u)}
                                    allowCustom={true}
                                    placeholder="Select or type unit"
                                    className={itemErrors.itemUnit ? 'border-red-500 ring-2 ring-red-500/10' : ''}
                                  />
                                </div>

                                {/* Quantity (directly below Unit) */}
                                <div>
                                  <label className="block text-gray-700 text-xs font-semibold mb-1">
                                    Quantity
                                  </label>
                                  <SearchableDropdown
                                    value={itemQty}
                                    onChange={(val) => {
                                      handleQtyChange(val)
                                      setItemErrors((prev) => {
                                        const copy = { ...prev }
                                        delete copy.itemQty
                                        return copy
                                      })
                                    }}
                                    options={[5, 10, 20, 50, 100, 250, 500]}
                                    allowCustom={true}
                                    placeholder="Select or enter quantity"
                                    className={itemErrors.itemQty ? 'border-red-500 ring-2 ring-red-500/10' : ''}
                                  />
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
                                          <CustomSelect
                                            value={itemGroupUnit}
                                            onChange={(e) => {
                                              setItemGroupUnit(e.target.value)
                                              if (e.target.value === 'none') {
                                                setItemPiecesPerUnit('')
                                              } else if (!itemPiecesPerUnit) {
                                                setItemPiecesPerUnit('12')
                                              }
                                            }}
                                            options={[
                                              { value: 'none', label: 'Do not group (Individual pieces)' },
                                              { value: 'pack', label: 'Packs' },
                                              { value: 'box', label: 'Boxes' },
                                              { value: 'bundle', label: 'Bundles' }
                                            ]}
                                            placeholder="Do not group (Individual pieces)"
                                            style={{ height: '40px' }}
                                          />
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

                                {/* Inventory Batches Details */}
                                {Array.isArray(itemEditing.batches) &&
                                  itemEditing.batches.filter((b) => b.quantity > 0).length > 1 && (
                                    <div className="bg-navy-blue/5 border border-navy-blue/10 rounded-xl p-3 text-xs space-y-2">
                                      <div className="font-bold text-navy-blue flex items-center justify-between">
                                        <span>Inventory Batches ({itemEditing.batches.filter((b) => b.quantity > 0).length}):</span>
                                        <span className="text-[10px] text-gray-500 font-normal">FEFO Tracked</span>
                                      </div>
                                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                        {itemEditing.batches
                                          .filter((b) => b.quantity > 0)
                                          .map((b, idx) => (
                                            <div
                                              key={b.id || idx}
                                              className="flex justify-between items-center text-[11px] text-gray-600 bg-white px-2.5 py-1.5 rounded-lg border border-gray-100"
                                            >
                                              <span className="font-semibold text-navy-blue">
                                                Batch {idx + 1}: {b.quantity} {formatUnit(b.quantity, itemEditing.unit || 'pieces')}
                                              </span>
                                              <span className={b.expiryDate && getExpirationInfo(b.expiryDate).isNearExpiry ? 'text-red-500 font-bold' : 'text-gray-500'}>
                                                {b.expiryDate ? `Exp: ${new Date(b.expiryDate).toLocaleDateString()}` : 'No Expiry'}
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                      <p className="text-[10px] text-gray-400">
                                        Each stock replenishment maintains its distinct expiration date.
                                      </p>
                                    </div>
                                  )}

                                {/* Expiration Date */}
                                <div>
                                  <label className="block text-gray-700 text-xs font-semibold mb-1">
                                    Expiration Date{' '}
                                    {!isSuppliesCategory(itemCategory) && (
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
                                      disabled={isSuppliesCategory(itemCategory)}
                                      disablePast={true}
                                      onChange={(val) => {
                                        setItemExpiry(val)
                                        if (val && isPastDate(val)) {
                                          setItemErrors((prev) => ({
                                            ...prev,
                                            itemExpiry: DATE_ERROR_MESSAGES.EXPIRY_PAST
                                          }))
                                        } else {
                                          setItemErrors((prev) => {
                                            const copy = { ...prev }
                                            delete copy.itemExpiry
                                            return copy
                                          })
                                        }
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
                                    className="flex-1 py-2 border border-gray-200 text-gray-500 rounded-full text-xs font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-150 cursor-pointer"
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
                          </div>,
                          document.body
                        )}

                      {/* Modal Overlay for Add Stock to Existing Item */}
                      {isAddStockModalOpen &&
                        createPortal(
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal-overlay animate-fade-in">
                            <div className="glass-modal rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto">
                              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="p-2 bg-navy-blue/5 rounded-xl text-navy-blue">
                                    <Plus className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-navy-blue text-sm">Add Stock to Existing Item</h3>
                                    <p className="text-[11px] text-gray-400">Replenish stock without creating duplicate records</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddStockModalOpen(false)
                                    setAddStockItemId('')
                                    setAddStockSearch('')
                                    setAddStockQty('')
                                    setAddStockQtyGroup('')
                                    setAddStockQtyPieces('')
                                    setAddStockExpiry('')
                                    setAddStockErrors({})
                                  }}
                                  className="text-gray-400 hover:text-navy-blue transition-all duration-150 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <form onSubmit={handleSaveAddStock} className="space-y-4">
                                {/* Select Item */}
                                <div>
                                  <label className="block text-gray-700 text-xs font-semibold mb-1">
                                    Select Inventory Item <span className="text-red-500">*</span>
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={addStockSearch}
                                      onFocus={() => setShowAddStockDropdown(true)}
                                      onBlur={() => setTimeout(() => setShowAddStockDropdown(false), 200)}
                                      onChange={(e) => {
                                        setAddStockSearch(e.target.value)
                                        if (!e.target.value) {
                                          setAddStockItemId('')
                                        }
                                      }}
                                      placeholder="Type to search existing item..."
                                      className={`w-full pl-2.5 pr-16 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${addStockErrors.itemId ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                      style={{ height: '40px' }}
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                      {addStockSearch && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAddStockSearch('')
                                            setAddStockItemId('')
                                          }}
                                          className="text-gray-400 hover:text-red-500 transition p-0.5 rounded cursor-pointer"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      <div className="pointer-events-none text-gray-400">
                                        <ChevronRight className="w-4 h-4 transform rotate-90" />
                                      </div>
                                    </div>

                                    {showAddStockDropdown && (
                                      <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto">
                                        {groupedInventory
                                          .filter((item) =>
                                            !addStockSearch ||
                                            item.name.toLowerCase().includes(addStockSearch.toLowerCase()) ||
                                            (item.category || '').toLowerCase().includes(addStockSearch.toLowerCase())
                                          )
                                          .map((item) => {
                                            const optText = `${item.name} (${item.category}) - ${displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)} in stock`
                                            return (
                                              <div
                                                key={item.id}
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                  setAddStockItemId(item.id)
                                                  setAddStockSearch(optText)
                                                  setAddStockErrors((prev) => {
                                                    const copy = { ...prev }
                                                    delete copy.itemId
                                                    return copy
                                                  })
                                                  setShowAddStockDropdown(false)
                                                }}
                                                className="p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left"
                                              >
                                                <div className="flex justify-between items-center">
                                                  <span className="font-bold text-navy-blue">{item.name}</span>
                                                  <span className="text-[10px] text-gray-400 font-normal capitalize">
                                                    {item.category}
                                                  </span>
                                                </div>
                                                <div className="text-[11px] text-gray-500 mt-0.5">
                                                  Current Stock: <span className="font-bold text-navy-blue">{displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)}</span>
                                                  {item.expiryDate && (
                                                    <span className="ml-2 text-gray-400">
                                                      (Exp: {new Date(item.expiryDate).toLocaleDateString()})
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          })}
                                        {groupedInventory.filter((item) =>
                                          !addStockSearch ||
                                          item.name.toLowerCase().includes(addStockSearch.toLowerCase()) ||
                                          (item.category || '').toLowerCase().includes(addStockSearch.toLowerCase())
                                        ).length === 0 && (
                                          <div className="p-3 text-xs text-gray-400 text-center font-medium">
                                            No matching inventory items
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {addStockErrors.itemId && (
                                    <p className="text-red-500 text-[10px] mt-1 font-semibold">{addStockErrors.itemId}</p>
                                  )}
                                </div>

                                {/* Selected Item Info & Inputs */}
                                {(() => {
                                  const selected =
                                    groupedInventory.find(
                                      (i) => i.id === addStockItemId || i.key === addStockItemId
                                    ) || inventoryList.find((i) => i.id === addStockItemId)
                                  if (!selected) return null

                                  const hasGroup = selected.groupUnit && selected.groupUnit !== 'none' && selected.piecesPerUnit
                                  const pPerUnit = parseInt(selected.piecesPerUnit, 10) || 12
                                  const groupName = selected.groupUnit === 'box' ? 'Boxes' : selected.groupUnit === 'bundle' ? 'Bundles' : 'Packs'
                                  const expInfo = getExpirationInfo(selected.expiryDate)

                                  // Calculate preview of added stock
                                  let addedTotal = 0
                                  if (hasGroup) {
                                    const grp = parseInt(addStockQtyGroup, 10) || 0
                                    const pcs = parseInt(addStockQtyPieces, 10) || 0
                                    addedTotal = grp * pPerUnit + pcs
                                  } else {
                                    addedTotal = parseInt(addStockQty, 10) || 0
                                  }
                                  const newTotalQty = selected.quantity + addedTotal

                                  return (
                                    <div className="space-y-4 animate-fade-in">
                                      {/* Item Details Summary Card */}
                                      <div className="bg-navy-blue/5 border border-navy-blue/10 rounded-xl p-3 text-xs space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="font-bold text-navy-blue text-sm">{selected.name}</span>
                                          <span className="text-[10px] font-bold uppercase bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                            {selected.category}
                                          </span>
                                        </div>
                                        <div className="text-gray-600">
                                          Current Total Stock:{' '}
                                          <strong className="text-navy-blue">
                                            {displayStock(selected.quantity, selected.unit, selected.groupUnit, selected.piecesPerUnit)}
                                          </strong>
                                          {' '}({selected.quantity} total {selected.unit || 'pieces'})
                                        </div>

                                        {/* Existing Batches List */}
                                        {(() => {
                                          const activeBatches = (Array.isArray(selected.batches) && selected.batches.length > 0)
                                            ? selected.batches.filter((b) => b.quantity > 0)
                                            : (selected.quantity > 0
                                                ? [{
                                                    id: `batch-${selected.id}-init`,
                                                    quantity: selected.quantity,
                                                    expiryDate: selected.expiryDate || null
                                                  }]
                                                : [])

                                          if (activeBatches.length === 0) return null

                                          return (
                                            <div className="bg-white/90 rounded-lg p-2 border border-navy-blue/10 space-y-1">
                                              <div className="text-[11px] font-bold text-navy-blue flex items-center justify-between">
                                                <span>Current Batches ({activeBatches.length}):</span>
                                                <span className="text-[10px] text-gray-400 font-normal">FEFO Tracked</span>
                                              </div>
                                              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                                {activeBatches.map((b, idx) => (
                                                  <div key={b.id || idx} className="flex justify-between items-center text-[11px] text-gray-600 bg-gray-50/80 px-2 py-1 rounded">
                                                    <span className="font-medium text-navy-blue">
                                                      Batch {idx + 1}: {b.quantity} {formatUnit(b.quantity, selected.unit || 'pieces')}
                                                    </span>
                                                    <span className={b.expiryDate && getExpirationInfo(b.expiryDate).isNearExpiry ? 'text-red-500 font-bold' : 'text-gray-500'}>
                                                      {b.expiryDate ? `Exp: ${new Date(b.expiryDate).toLocaleDateString()}` : 'No Expiry'}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )
                                        })()}

                                        {selected.expiryDate && (
                                          <div className={`flex items-center text-[11px] ${expInfo.isNearExpiry ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                                            <Clock className="w-3 h-3 mr-1" />
                                            Earliest Expiry: {new Date(selected.expiryDate).toLocaleDateString()}
                                            {expInfo.isExpired && <span className="ml-1 text-[10px] font-bold text-red-600 bg-red-100 px-1 rounded">Expired</span>}
                                            {!expInfo.isExpired && expInfo.isNearExpiry && <span className="ml-1 text-[10px] font-bold text-red-600 bg-red-100 px-1 rounded">≤ 4 mos remaining</span>}
                                          </div>
                                        )}
                                      </div>

                                      {/* Stock Addition Inputs */}
                                      {hasGroup ? (
                                        <div className="space-y-3">
                                          <label className="block text-gray-700 text-xs font-semibold">
                                            Stock to Add ({groupName} & Pieces)
                                          </label>
                                          <div className="grid grid-cols-2 gap-3">
                                            <div>
                                              <label className="block text-gray-500 text-[11px] font-medium mb-1">
                                                Add in {groupName}
                                              </label>
                                              <input
                                                type="text"
                                                value={addStockQtyGroup}
                                                onChange={(e) => {
                                                  if (/^\d*$/.test(e.target.value)) {
                                                    setAddStockQtyGroup(e.target.value)
                                                    setAddStockErrors((prev) => {
                                                      const c = { ...prev }
                                                      delete c.qty
                                                      return c
                                                    })
                                                  }
                                                }}
                                                placeholder="0"
                                                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                                                style={{ height: '40px' }}
                                              />
                                              <p className="text-[10px] text-gray-400 mt-0.5">({pPerUnit} pieces per {selected.groupUnit})</p>
                                            </div>
                                            <div>
                                              <label className="block text-gray-500 text-[11px] font-medium mb-1">
                                                Add in {selected.unit || 'Pieces'}
                                              </label>
                                              <input
                                                type="text"
                                                value={addStockQtyPieces}
                                                onChange={(e) => {
                                                  if (/^\d*$/.test(e.target.value)) {
                                                    setAddStockQtyPieces(e.target.value)
                                                    setAddStockErrors((prev) => {
                                                      const c = { ...prev }
                                                      delete c.qty
                                                      return c
                                                    })
                                                  }
                                                }}
                                                placeholder="0"
                                                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                                                style={{ height: '40px' }}
                                              />
                                              <p className="text-[10px] text-gray-400 mt-0.5">Individual units</p>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div>
                                          <label className="block text-gray-700 text-xs font-semibold mb-1">
                                            Quantity to Add ({selected.unit || 'Pieces'}) <span className="text-red-500">*</span>
                                          </label>
                                          <input
                                            type="text"
                                            value={addStockQty}
                                            onChange={(e) => {
                                              if (/^\d*$/.test(e.target.value)) {
                                                setAddStockQty(e.target.value)
                                                setAddStockErrors((prev) => {
                                                  const c = { ...prev }
                                                  delete c.qty
                                                  return c
                                                })
                                              }
                                            }}
                                            placeholder="e.g. 30"
                                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${addStockErrors.qty ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                            style={{ height: '40px' }}
                                          />
                                        </div>
                                      )}
                                      {addStockErrors.qty && (
                                        <p className="text-red-500 text-[10px] font-semibold">{addStockErrors.qty}</p>
                                      )}

                                      {/* Expiration Date for New Stock Batch */}
                                      <div>
                                        <label className="block text-gray-700 text-xs font-semibold mb-1">
                                          Expiration Date (New Stock Batch){' '}
                                          {!isSuppliesCategory(selected.category) ? (
                                            <span className="text-red-500">*</span>
                                          ) : (
                                            <span className="text-gray-400 font-normal">(Optional for supplies)</span>
                                          )}
                                        </label>
                                        <div
                                          className={
                                            addStockErrors.expiry
                                              ? 'border border-red-500 rounded-xl p-0.5 ring-2 ring-red-500/10'
                                              : ''
                                          }
                                        >
                                          <GlassDatePicker
                                            value={addStockExpiry ? addStockExpiry.split('T')[0] : ''}
                                            disabled={isSuppliesCategory(selected.category)}
                                            disablePast={true}
                                            onChange={(val) => {
                                              setAddStockExpiry(val)
                                              if (val && isPastDate(val)) {
                                                setAddStockErrors((prev) => ({
                                                  ...prev,
                                                  expiry: DATE_ERROR_MESSAGES.EXPIRY_PAST
                                                }))
                                              } else {
                                                setAddStockErrors((prev) => {
                                                  const copy = { ...prev }
                                                  delete copy.expiry
                                                  return copy
                                                })
                                              }
                                            }}
                                            showTime={false}
                                            placeholder={isSuppliesCategory(selected.category) ? 'Not applicable for supplies' : 'dd/mm/yyyy'}
                                          />
                                        </div>
                                        {addStockErrors.expiry && (
                                          <p className="text-red-500 text-[10px] mt-1 font-semibold">{addStockErrors.expiry}</p>
                                        )}
                                        <p className="text-[10px] text-gray-400 mt-1">
                                          Applies exclusively to this new batch. Existing stock expiration dates are never changed.
                                        </p>
                                      </div>

                                      {/* Live Stock Calculation Preview */}
                                      {addedTotal > 0 && (
                                        <div className="bg-sig-green/10 border border-sig-green/20 rounded-xl p-3 text-xs space-y-1.5 animate-fade-in">
                                          <div className="flex justify-between text-gray-600">
                                            <span>Existing Stock:</span>
                                            <span className="font-semibold text-navy-blue">{selected.quantity} {selected.unit || 'pieces'}</span>
                                          </div>
                                          <div className="flex justify-between text-sig-green font-bold">
                                            <span>+ New Stock Batch:</span>
                                            <span>
                                              +{addedTotal} {selected.unit || 'pieces'}
                                              {addStockExpiry ? ` (Exp: ${new Date(addStockExpiry).toLocaleDateString()})` : ''}
                                            </span>
                                          </div>
                                          <div className="border-t border-sig-green/20 pt-1.5 flex justify-between items-center text-navy-blue font-extrabold text-sm">
                                            <span>Resulting Total Stock:</span>
                                            <span>
                                              {displayStock(newTotalQty, selected.unit, selected.groupUnit, selected.piecesPerUnit)}
                                              <span className="text-xs font-normal text-gray-500 ml-1">({newTotalQty} {selected.unit || 'pieces'})</span>
                                            </span>
                                          </div>
                                          <div className="text-[10px] text-gray-500 flex items-center pt-0.5">
                                            <span className="font-semibold text-sig-green mr-1">✓ Multi-Batch FEFO:</span>
                                            <span>Batch expiration dates are preserved separately under this item.</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsAddStockModalOpen(false)
                                      setAddStockItemId('')
                                      setAddStockSearch('')
                                      setAddStockQty('')
                                      setAddStockQtyGroup('')
                                      setAddStockQtyPieces('')
                                      setAddStockExpiry('')
                                      setAddStockErrors({})
                                    }}
                                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={loading || !addStockItemId}
                                    className={`px-5 py-2 bg-navy-blue text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm ${
                                      loading || !addStockItemId
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-white hover:text-sig-green border border-navy-blue hover:border-sig-green cursor-pointer'
                                    }`}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Confirm & Add Stock</span>
                                  </button>
                                </div>
                              </form>
                            </div>
                          </div>,
                          document.body
                        )}

                      {/* Modal Overlay for Release Item */}
                      {isReleaseModalOpen &&
                        createPortal(
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
                                  className="text-gray-400 hover:text-navy-blue transition-all duration-150 cursor-pointer"
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
                                              const item =
                                                groupedInventory.find(
                                                  (i) => i.id === releaseItemId || i.key === releaseItemId
                                                ) || inventoryList.find((i) => i.id === releaseItemId)
                                              if (item) {
                                                return `${item.name} (${item.category}) - ${displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)} left ${item.expiryDate ? `(Exp: ${new Date(item.expiryDate).toLocaleDateString()})` : ''}`
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
                                          className="text-gray-400 hover:text-red-500 transition-all duration-150 cursor-pointer p-0.5 rounded hover:bg-gray-100"
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
                                        {groupedInventory
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
                          </div>,
                          document.body
                        )}

                      {/* Modal Overlay for Review List */}
                      {isReviewModalOpen &&
                        createPortal(
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal-overlay animate-fade-in">
                            <div className="glass-modal rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto">
                              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <h3 className="font-bold text-navy-blue text-sm flex items-center space-x-2">
                                  <span>Release Review List</span>
                                  <span className="text-[10px] bg-navy-blue/10 text-navy-blue px-2 py-0.5 rounded-full font-bold">
                                    {pendingReleaseItems.length}
                                  </span>
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => setIsReviewModalOpen(false)}
                                  className="text-gray-400 hover:text-navy-blue transition-all duration-150 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {pendingReleaseItems.length === 0 ? (
                                <div className="py-8 text-center text-gray-400 text-xs font-medium">
                                  No items have been added to the Release Review List yet.
                                </div>
                              ) : (
                                <>
                                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                    {pendingReleaseItems.map((pItem) => (
                                      <div
                                        key={pItem.id}
                                        className="flex justify-between items-center border border-gray-50 p-2.5 rounded-xl bg-gray-50/50 hover:bg-white transition"
                                      >
                                        <div className="flex-1 min-w-0 pr-3">
                                          <div className="font-bold text-navy-blue text-sm truncate">
                                            {pItem.name}
                                          </div>
                                          <div className="text-xs text-gray-500 capitalize">
                                            {pItem.category}
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-3 shrink-0">
                                          <div className="text-right">
                                            <div className="text-sm font-bold text-navy-blue capitalize">
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
                                            <div className="text-xs text-gray-500 font-medium">
                                              ({pItem.baseQty} Total Pieces)
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleRemovePendingItem(pItem.id)}
                                            className="text-gray-400 hover:text-red-500 transition-all duration-150 cursor-pointer p-0.5 rounded hover:bg-gray-100"
                                            title="Remove item"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex space-x-2 pt-3 border-t border-gray-100 mt-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPendingReleaseItems([])
                                        setIsReviewModalOpen(false)
                                      }}
                                      className="flex-1 py-2 border border-gray-200 text-gray-500 rounded-full text-xs font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-150 cursor-pointer text-center"
                                    >
                                      Clear List
                                    </button>
                                    <button
                                      type="button"
                                      disabled={loading}
                                      onClick={handleConfirmRelease}
                                      className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition-all duration-150 cursor-pointer text-center"
                                    >
                                      {loading ? 'Confirming...' : 'Confirm Release'}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>,
                          document.body
                        )}

                      {/* ==================================================== */}
                      {/* BATCH DETAILS MODAL (THREE-DOT DETAILS) */}
                      {/* ==================================================== */}
                      {activeBatchItem &&
                        createPortal(
                          <div
                            className="fixed inset-0 z-50 bg-navy-blue/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
                            onClick={() => setBatchDetailsItemKey(null)}
                          >
                            <div
                              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Modal Header */}
                              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-white">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-navy-blue/5 border border-navy-blue/10 flex items-center justify-center text-navy-blue">
                                    <Layers className="w-5 h-5 text-navy-blue" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h2 className="text-lg font-bold text-navy-blue">
                                        {activeBatchItem.name}
                                      </h2>
                                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sig-green/10 text-sig-green border border-sig-green/20">
                                        {activeBatchItem.category}
                                      </span>
                                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-navy-blue/5 text-navy-blue border border-navy-blue/10">
                                        Total Stock: {displayStock(activeBatchItem.quantity, activeBatchItem.unit, activeBatchItem.groupUnit, activeBatchItem.piecesPerUnit)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Stock batches & expiration dates sorted by FEFO (First Expired, First Out)
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setBatchDetailsItemKey(null)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                                  title="Close"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>

                              {/* Modal Table Content */}
                              <div className="p-6 overflow-y-auto flex-1">
                                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider text-[11px]">
                                        <th className="py-3 px-4">Item Details</th>
                                        <th className="py-3 px-4">Category</th>
                                        <th className="py-3 px-4">Stock Level</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {activeBatchItem.batches && activeBatchItem.batches.length > 0 ? (
                                        activeBatchItem.batches.map((batch, idx) => {
                                          const expInfo = getExpirationInfo(batch.expiryDate)
                                          const isSupplies = isSuppliesCategory(activeBatchItem.category)
                                          const breakdown = formatBatchPackagingBreakdown(
                                            batch.quantity,
                                            batch.unit || activeBatchItem.unit,
                                            batch.groupUnit || activeBatchItem.groupUnit,
                                            batch.piecesPerUnit || activeBatchItem.piecesPerUnit
                                          )
                                          const batchStatus =
                                            batch.quantity <= 0
                                              ? 'out of stock'
                                              : expInfo.isExpired
                                                ? 'expired'
                                                : batch.quantity <= 10
                                                  ? 'low stock'
                                                  : 'available'

                                          return (
                                            <React.Fragment key={batch.id || `batch-${idx}`}>
                                              {/* 1. Corresponding Item Row */}
                                              <tr className="hover:bg-gray-50/50 transition-colors">
                                                {/* Item Details */}
                                                <td className="pt-4 pb-1 px-4 font-bold text-navy-blue text-sm align-top">
                                                  {activeBatchItem.name}
                                                </td>

                                                {/* Category */}
                                                <td className="pt-4 pb-1 px-4 text-xs font-semibold text-gray-700 capitalize align-top">
                                                  {activeBatchItem.category}
                                                </td>

                                                {/* Stock Level */}
                                                <td className="pt-4 pb-1 px-4 font-bold text-navy-blue text-sm align-top">
                                                  {batch.quantity} {formatUnit(batch.quantity, batch.unit || activeBatchItem.unit || 'pieces')}
                                                </td>

                                                {/* Status */}
                                                <td className="pt-4 pb-1 px-4 align-top">
                                                  <span
                                                    className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                                                      batchStatus === 'available'
                                                        ? expInfo.isNearExpiry
                                                          ? 'bg-red-50 text-red-700 border border-red-200'
                                                          : 'bg-sig-green/10 text-sig-green'
                                                        : batchStatus === 'low stock'
                                                          ? 'bg-amber-50 text-amber-600'
                                                          : 'bg-red-50 text-red-700 border border-red-200'
                                                    }`}
                                                  >
                                                    {batchStatus}
                                                  </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="pt-4 pb-1 px-4 text-right align-top">
                                                  <div className="flex items-center justify-end space-x-1.5">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleOpenEditBatch(batch, activeBatchItem)}
                                                      className="p-1.5 text-gray-400 hover:text-navy-blue hover:bg-navy-blue/10 rounded-lg transition-all duration-150 cursor-pointer"
                                                      title="Edit batch"
                                                    >
                                                      <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleDeleteBatch(batch, activeBatchItem)}
                                                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150 cursor-pointer"
                                                      title="Delete batch"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                                </td>
                                              </tr>

                                              {/* 2. Expiration Date and Packaging Details directly below the corresponding item row */}
                                              <tr className="border-b border-gray-100 last:border-b-0">
                                                <td colSpan="5" className="pt-0.5 pb-4 px-4">
                                                  <div className="space-y-1 text-xs text-gray-600 font-medium">
                                                    {!isSupplies && batch.expiryDate && (
                                                      <div className={`font-medium ${expInfo.isNearExpiry ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                                                        Exp: {new Date(batch.expiryDate).toLocaleDateString('en-US', {
                                                          month: '2-digit',
                                                          day: '2-digit',
                                                          year: 'numeric'
                                                        })}
                                                      </div>
                                                    )}
                                                    {isSupplies && (
                                                      <div className="text-gray-500">
                                                        No Expiration (Supplies)
                                                      </div>
                                                    )}
                                                    {breakdown && (
                                                      <div className="text-gray-600">
                                                        {breakdown}
                                                      </div>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                            </React.Fragment>
                                          )
                                        })
                                      ) : (
                                        <tr>
                                          <td colSpan="5" className="text-center py-8 text-gray-400 text-xs">
                                            No batches available for this item.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Modal Footer */}
                              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                  Showing {activeBatchItem.batches?.length || 0} batch{(activeBatchItem.batches?.length || 0) === 1 ? '' : 'es'}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const target = activeBatchItem
                                      setBatchDetailsItemKey(null)
                                      handleOpenAddStockModal(target)
                                    }}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-navy-blue bg-white border border-gray-200 hover:bg-gray-100 transition cursor-pointer shadow-xs"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-sig-green" />
                                    <span>Add Stock Batch</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setBatchDetailsItemKey(null)}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-navy-blue hover:bg-navy-blue/90 transition cursor-pointer shadow-xs"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>,
                          document.body
                        )}

                      {/* ==================================================== */}
                      {/* EDIT BATCH MODAL */}
                      {/* ==================================================== */}
                      {editingBatch &&
                        createPortal(
                          <div
                            className="fixed inset-0 z-60 bg-navy-blue/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
                            onClick={() => setEditingBatch(null)}
                          >
                            <div
                              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-gray-100 overflow-hidden animate-scale-up"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-white">
                                <div>
                                  <h2 className="text-lg font-bold text-navy-blue">Edit Stock Batch</h2>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {editingBatch.name} • {editingBatch.category}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingBatch(null)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                                  title="Close"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>

                              <form onSubmit={handleSaveEditBatch} className="p-6 space-y-4">
                                {/* Packaging Configuration */}
                                <div>
                                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Packaging / Group Unit
                                  </label>
                                  <div className="grid grid-cols-4 gap-2">
                                    {['none', 'box', 'pack', 'bundle'].map((u) => (
                                      <button
                                        key={u}
                                        type="button"
                                        onClick={() => {
                                          setBatchEditGroupUnit(u)
                                          if (u === 'none') {
                                            setBatchEditPiecesPerUnit('')
                                            setBatchEditQtyGroup('')
                                            setBatchEditQtyPieces('')
                                          } else if (!batchEditPiecesPerUnit) {
                                            setBatchEditPiecesPerUnit('12')
                                          }
                                        }}
                                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer capitalize text-center ${
                                          batchEditGroupUnit === u
                                            ? 'bg-navy-blue text-white border-navy-blue shadow-xs'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                      >
                                        {u === 'none' ? 'None (Loose)' : u}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Group Unit details if selected */}
                                {batchEditGroupUnit !== 'none' ? (
                                  <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200/60">
                                    <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Pieces per {formatUnit(1, batchEditGroupUnit)}
                                      </label>
                                      <input
                                        type="text"
                                        value={batchEditPiecesPerUnit}
                                        onChange={(e) => {
                                          if (/^\d*$/.test(e.target.value)) {
                                            setBatchEditPiecesPerUnit(e.target.value)
                                          }
                                        }}
                                        placeholder="e.g. 20"
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:border-navy-blue bg-white"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1 capitalize">
                                          {formatUnit(2, batchEditGroupUnit)}
                                        </label>
                                        <input
                                          type="text"
                                          value={batchEditQtyGroup}
                                          onChange={(e) => {
                                            if (/^\d*$/.test(e.target.value)) {
                                              setBatchEditQtyGroup(e.target.value)
                                            }
                                          }}
                                          placeholder="0"
                                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:border-navy-blue bg-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                          Loose Pieces
                                        </label>
                                        <input
                                          type="text"
                                          value={batchEditQtyPieces}
                                          onChange={(e) => {
                                            if (/^\d*$/.test(e.target.value)) {
                                              setBatchEditQtyPieces(e.target.value)
                                            }
                                          }}
                                          placeholder="0"
                                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:border-navy-blue bg-white"
                                        />
                                      </div>
                                    </div>

                                    {/* Total preview */}
                                    <div className="text-xs text-navy-blue font-bold flex items-center justify-between pt-1 border-t border-gray-200">
                                      <span>Total Quantity:</span>
                                      <span>
                                        {(() => {
                                          const factor = parseInt(batchEditPiecesPerUnit, 10) || 12
                                          const grp = parseInt(batchEditQtyGroup, 10) || 0
                                          const pcs = parseInt(batchEditQtyPieces, 10) || 0
                                          const total = grp * factor + pcs
                                          return `${total} ${formatUnit(total, editingBatch.unit || 'pieces')}`
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                      Quantity ({formatUnit(2, editingBatch.unit || 'pieces')})
                                    </label>
                                    <input
                                      type="text"
                                      value={batchEditQty}
                                      onChange={(e) => {
                                        if (/^\d*$/.test(e.target.value)) {
                                          setBatchEditQty(e.target.value)
                                        }
                                      }}
                                      placeholder="0"
                                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:border-navy-blue"
                                    />
                                  </div>
                                )}
                                {batchEditErrors.qty && (
                                  <p className="text-red-500 text-[11px] font-semibold">
                                    {batchEditErrors.qty}
                                  </p>
                                )}

                                {/* Expiration Date */}
                                {!isSuppliesCategory(editingBatch.category) && (
                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                      Expiration Date
                                    </label>
                                    <div
                                      className={
                                        batchEditErrors.expiry
                                          ? 'border border-red-500 rounded-xl p-0.5 ring-2 ring-red-500/10'
                                          : ''
                                      }
                                    >
                                      <GlassDatePicker
                                        value={batchEditExpiry ? batchEditExpiry.split('T')[0] : ''}
                                        disablePast={true}
                                        onChange={(val) => {
                                          setBatchEditExpiry(val)
                                          if (val && isPastDate(val)) {
                                            setBatchEditErrors((prev) => ({
                                              ...prev,
                                              expiry: DATE_ERROR_MESSAGES.EXPIRY_PAST
                                            }))
                                          } else {
                                            setBatchEditErrors((prev) => {
                                              const copy = { ...prev }
                                              delete copy.expiry
                                              return copy
                                            })
                                          }
                                        }}
                                        showTime={false}
                                        placeholder="dd/mm/yyyy"
                                      />
                                    </div>
                                    {batchEditErrors.expiry && (
                                      <p className="text-red-500 text-[11px] font-semibold mt-1">
                                        {batchEditErrors.expiry}
                                      </p>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingBatch(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-navy-blue hover:bg-navy-blue/90 transition cursor-pointer shadow-xs disabled:opacity-50"
                                  >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                  </button>
                                </div>
                              </form>
                            </div>
                          </div>,
                          document.body
                        )}
                    </div>
                  )
                )}

                {/* ==================================================== */}
                {/* DONORS & DONATIONS TAB PANEL */}
                {/* ==================================================== */}
                {activeTab === 'donations' && user.role === 'admin' && (
                  isOffline ? (
                    <DonationsSkeleton />
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
                        <div>
                          <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                            Donors & Donations
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
                          className={`flex items-center space-x-1.5 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border border-navy-blue shadow-xs transition-all duration-150 ${isAnyModalOpen
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-white hover:text-sig-green hover:border-sig-green cursor-pointer'
                            }`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Donate</span>
                        </button>
                      </div>

                      {/* Donations History log */}
                      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 min-w-0">
                        <h3 className="font-bold text-navy-blue text-base border-b border-gray-100 pb-3 mb-4">
                          Donation Audit History Logs
                        </h3>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                          <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead>
                              <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase font-bold text-gray-500">
                                <th className="py-3 px-3">Date</th>
                                <th className="py-3 px-2">Donor</th>
                                <th className="py-3 px-2">Purpose</th>
                                <th className="py-3 px-2">Items</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs">
                              {donationsList.map((d) => {
                                const donor = donorsList.find((donorObj) => donorObj.id === d.donorId)
                                return (
                                  <tr key={d.id} className="hover:bg-gray-50/50 transition">
                                    <td className="py-3 px-3 font-semibold text-xs text-gray-600">
                                      {new Date(d.dateOfDonation).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-2 text-navy-blue font-bold text-sm">
                                      {donor ? donor.name : 'Unknown Donor'}
                                    </td>
                                    <td className="py-3 px-2 text-gray-600 font-medium text-xs">
                                      {d.purpose}
                                    </td>
                                    <td className="py-3 px-2">
                                      <div className="space-y-1">
                                        {d.items.map((i, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200/50 mr-1.5 mb-1"
                                          >
                                            {i.name} ({i.quantity} {formatUnit(i.quantity, i.unit)})
                                            {i.expiryDate && (
                                              <span className="text-red-500 font-bold ml-1.5">
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
                  )
                )}

                {activeTab === 'events' && user.role === 'admin' && (
                  isOffline ? (
                    <EventsSkeleton />
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      {/* Header section with top action bar button & view mode switcher */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
                        <div>
                          <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                            Event Scheduler & Calendar
                          </h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5 mt-2 md:mt-0">
                          {/* Display Mode Toggle (Calendar vs Board) */}
                          <div className="flex items-center bg-gray-100 p-1 rounded-full border border-gray-200/80 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setEventsDisplayMode('calendar')}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition duration-150 cursor-pointer ${eventsDisplayMode === 'calendar'
                                ? 'bg-navy-blue text-white shadow-xs'
                                : 'text-gray-600 hover:text-navy-blue'
                                }`}
                            >
                              <CalendarDays className="w-3.5 h-3.5" />
                              <span>Calendar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEventsDisplayMode('board')}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition duration-150 cursor-pointer ${eventsDisplayMode === 'board'
                                ? 'bg-navy-blue text-white shadow-xs'
                                : 'text-gray-600 hover:text-navy-blue'
                                }`}
                            >
                              <Grid className="w-3.5 h-3.5" />
                              <span>Status Board</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenScheduleModal()}
                            className="flex items-center gap-1.5 bg-navy-blue text-white rounded-full text-xs font-semibold px-4 py-2.5 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition-all duration-150 cursor-pointer animate-fade-in shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Schedule Event</span>
                          </button>
                        </div>
                      </div>

                      {/* CALENDAR VIEW */}
                      {eventsDisplayMode === 'calendar' && (
                        <div className="animate-fade-in">
                          <EventCalendar
                            events={eventsList}
                            orgs={orgsList}
                            onViewEvent={(evt) => {
                              setSelectedViewEvent(evt)
                              setIsViewEventModalOpen(true)
                            }}
                            onEditEvent={(evt) => handleEditClick(evt)}
                            onDeleteEvent={(evt) => handleDeleteEventClick(evt)}
                            onCompleteEvent={(evt) => handleQuickCompleteEvent(evt)}
                            onScheduleEvent={(targetDate) => handleOpenScheduleModal(targetDate)}
                          />
                        </div>
                      )}

                      {/* LIST / STATUS BOARD VIEW (Full Width Content Board) */}
                      {eventsDisplayMode === 'board' && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-fade-in">
                          <h3 className="font-bold text-navy-blue text-base border-b border-gray-100 pb-3 mb-4">
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
                              <CustomSelect
                                value={eventMonthFilter}
                                onChange={(e) => setEventMonthFilter(e.target.value)}
                                options={[
                                  { value: '', label: 'All Months' },
                                  { value: '0', label: 'January' },
                                  { value: '1', label: 'February' },
                                  { value: '2', label: 'March' },
                                  { value: '3', label: 'April' },
                                  { value: '4', label: 'May' },
                                  { value: '5', label: 'June' },
                                  { value: '6', label: 'July' },
                                  { value: '7', label: 'August' },
                                  { value: '8', label: 'September' },
                                  { value: '9', label: 'October' },
                                  { value: '10', label: 'November' },
                                  { value: '11', label: 'December' }
                                ]}
                                placeholder="All Months"
                                style={{ height: '38px' }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(() => {
                              const filtered = eventsList.filter((evt) => {
                                const isCompleted = (evt.status || '').toLowerCase().trim() === 'completed'
                                if (isCompleted) return false

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
                                    {eventsList.filter(e => (e.status || '').toLowerCase().trim() !== 'completed').length === 0
                                      ? 'No scheduled active events.'
                                      : 'No active events match your search or filter criteria.'}
                                  </div>
                                )
                              }

                              return filtered.map((evt) => {
                                const org = orgsList.find((o) => o.id === evt.assignedOrganizationId)
                                return (
                                  <div
                                    key={evt.id}
                                    onClick={() => {
                                      setSelectedViewEvent(evt)
                                      setIsViewEventModalOpen(true)
                                    }}
                                    className="border border-gray-100 p-5 rounded-2xl bg-gray-50/50 hover:bg-white hover:border-sig-green/30 transition duration-200 flex flex-col justify-between cursor-pointer"
                                  >
                                    <div>
                                      <div className="flex justify-between items-start mb-2">
                                        <span
                                          className={`inline-block text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${evt.status === 'completed'
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
                                          <span className="text-xs text-navy-blue font-bold tracking-wider">
                                            {evt.eventType === 'organization'
                                              ? `${evt.organizationName} (${org ? org.abbreviation : 'All'})`
                                              : org
                                                ? org.abbreviation
                                                : 'All'}
                                          </span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleQuickCompleteEvent(evt)
                                            }}
                                            className="text-emerald-600 hover:text-emerald-700 transition p-1 rounded hover:bg-emerald-50 cursor-pointer"
                                            title="Mark as Completed"
                                          >
                                            <CheckCircle className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleEditClick(evt)
                                            }}
                                            className="text-navy-blue hover:text-sig-green transition p-1 rounded hover:bg-gray-100 cursor-pointer"
                                            title="Edit Event"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDeleteEventClick(evt)
                                            }}
                                            className="text-red-550 hover:text-red-700 transition p-1 rounded hover:bg-red-50 cursor-pointer"
                                            title="Delete Event"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                      <h4 className="font-bold text-navy-blue text-sm mb-1 leading-tight">
                                        {evt.name}
                                      </h4>
                                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3 font-medium">
                                        {evt.description}
                                      </p>
                                    </div>

                                    <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs text-gray-500 font-medium">
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
                      )}

                      {/* Event Details View Modal */}
                      <AnimatedModal
                        isOpen={isViewEventModalOpen}
                        onClose={() => {
                          setIsViewEventModalOpen(false)
                          setSelectedViewEvent(null)
                        }}
                        overlayClassName="fixed inset-0 z-[99999] flex items-center justify-center p-4 glass-modal-overlay"
                        contentClassName="glass-modal rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-white/80 space-y-5 max-h-[90vh] overflow-y-auto"
                      >
                        {selectedViewEvent &&
                          (() => {
                            const org = orgsList.find(
                              (o) => o.id === selectedViewEvent.assignedOrganizationId
                            )
                            const dateObj = new Date(selectedViewEvent.scheduleDate)
                            return (
                              <>
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-gray-200/60 pb-3.5">
                                  <div className="flex items-center space-x-2">
                                    <div className="p-1.5 bg-navy-blue/5 text-navy-blue rounded-xl">
                                      <Calendar className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-extrabold text-navy-blue text-base">
                                      Event Details
                                    </h3>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsViewEventModalOpen(false)
                                      setSelectedViewEvent(null)
                                    }}
                                    className="text-gray-400 hover:text-navy-blue transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-gray-100"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>

                                {/* Event Details Content */}
                                <div className="space-y-4 text-left">
                                  {/* Event Name */}
                                  <div>
                                    <h4 className="text-lg font-black text-navy-blue leading-snug break-words whitespace-normal">
                                      {selectedViewEvent.name}
                                    </h4>
                                  </div>

                                  {/* Status & Type Badges */}
                                  <div className="flex flex-wrap gap-2">
                                    <span
                                      className={`inline-flex items-center text-xs font-bold uppercase px-2.5 py-1 rounded-full ${selectedViewEvent.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : selectedViewEvent.status === 'cancelled'
                                          ? 'bg-red-100 text-red-800'
                                          : selectedViewEvent.status === 'planned'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                      Status: {selectedViewEvent.status}
                                    </span>
                                    <span className="inline-flex items-center text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-navy-blue/5 text-navy-blue">
                                      Type: {selectedViewEvent.eventType}
                                    </span>
                                  </div>

                                  {/* Info Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                    {/* Department / Org */}
                                    <div className="space-y-1">
                                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                                        Assigned Department / Org
                                      </span>
                                      <span className="text-sm text-navy-blue font-bold flex items-center space-x-1.5">
                                        <Users className="w-4 h-4 text-navy-blue shrink-0" />
                                        <span className="break-words whitespace-normal">
                                          {selectedViewEvent.eventType === 'organization'
                                            ? `${selectedViewEvent.organizationName} (${org ? org.abbreviation : 'All'})`
                                            : org
                                              ? `${org.name} (${org.abbreviation})`
                                              : 'All'}
                                        </span>
                                      </span>
                                    </div>

                                    {/* Location/Venue */}
                                    <div className="space-y-1">
                                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                                        Venue / Location
                                      </span>
                                      <span className="text-sm text-navy-blue font-bold flex items-center space-x-1.5">
                                        <MapPin className="w-4 h-4 text-sig-green shrink-0" />
                                        <span className="break-words whitespace-normal">
                                          {selectedViewEvent.location}
                                        </span>
                                      </span>
                                    </div>

                                    {/* Scheduled Date */}
                                    <div className="space-y-1 md:col-span-2">
                                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                                        Date & Time
                                      </span>
                                      <span className="text-sm text-navy-blue font-bold flex items-center space-x-1.5">
                                        <Clock className="w-4 h-4 text-navy-blue shrink-0" />
                                        <span>{dateObj.toLocaleString()}</span>
                                      </span>
                                    </div>
                                  </div>

                                  {/* Description */}
                                  {selectedViewEvent.description && (
                                    <div className="space-y-1.5">
                                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                                        Description / Narrative
                                      </span>
                                      <div className="bg-white border border-gray-150 rounded-xl p-3 text-xs text-gray-650 leading-relaxed font-medium break-words whitespace-pre-wrap">
                                        {selectedViewEvent.description}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Footer */}
                                <div className="flex justify-end border-t border-gray-100 pt-3 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsViewEventModalOpen(false)
                                      setSelectedViewEvent(null)
                                    }}
                                    className="bg-navy-blue hover:bg-navy-blue/90 text-white rounded-xl text-xs font-semibold py-2 px-5 shadow-sm transition-all duration-150 cursor-pointer"
                                  >
                                    Close
                                  </button>
                                </div>
                              </>
                            )
                          })()}
                      </AnimatedModal>

                      {/* SCHEDULE / EDIT EVENT MODAL */}
                      {isEventModalOpen &&
                        createPortal(
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
                                          const isOriginalDate =
                                            editingEvent?.scheduleDate &&
                                            val &&
                                            (new Date(val).getTime() ===
                                              new Date(editingEvent.scheduleDate).getTime() ||
                                              val === editingEvent.scheduleDate ||
                                              val.split('T')[0] ===
                                                new Date(editingEvent.scheduleDate)
                                                  .toISOString()
                                                  .split('T')[0])
                                          if (val && !isOriginalDate && isPastDate(val)) {
                                            setEvtErrors((prev) => ({
                                              ...prev,
                                              evtDate: DATE_ERROR_MESSAGES.EVENT_PAST
                                            }))
                                          } else {
                                            setEvtErrors((prev) => {
                                              const copy = { ...prev }
                                              delete copy.evtDate
                                              return copy
                                            })
                                          }
                                        }}
                                        disablePast={
                                          !(
                                            editingEvent?.scheduleDate &&
                                            isPastDate(editingEvent.scheduleDate)
                                          )
                                        }
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
                                    <CustomSelect
                                      value={evtType}
                                      onChange={(e) => {
                                        const nextType = e.target.value
                                        setEvtType(nextType)
                                        setEvtOrgId('')
                                        setEvtErrors((prev) => {
                                          const copy = { ...prev }
                                          delete copy.evtOrgId
                                          return copy
                                        })
                                        clearFieldValError('evtType')
                                      }}
                                      options={[
                                        { value: 'department', label: 'Department' },
                                        { value: 'organization', label: 'Organization' }
                                      ]}
                                      placeholder="Select Event Type"
                                      style={{ height: '40px' }}
                                    />
                                  </div>

                                  {evtType === 'organization' ? (
                                    <div>
                                      <label className="block text-gray-700 text-xs font-semibold mb-1">
                                        Assigned Organization
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
                                        options={orgsList.filter(isOrgItem)}
                                        placeholder="Select organization..."
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
                                        options={orgsList.filter(isDeptItem)}
                                        placeholder="Select department..."
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
                                    className="flex-1 bg-gray-100 hover:bg-red-500 hover:text-white text-gray-700 font-semibold py-2 px-4 rounded-full text-xs transition-all duration-150 cursor-pointer text-center"
                                    style={{ height: '40px' }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5"
                                    style={{ height: '40px' }}
                                  >
                                    {editingEvent ? 'Save Changes' : 'Schedule Event'}
                                  </button>
                                </div>
                              </form>
                            </div>
                          </div>,
                          document.body
                        )}
                    </div>
                  )
                )}

                {/* ==================================================== */}
                {/* ORGANIZATION TAB PANEL */}
                {/* ==================================================== */}
                {activeTab === 'organization' && user.role === 'admin' && (
                  isOffline ? (
                    <OrganizationSkeleton />
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      {/* Organization Header Dashboard */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between justify-start gap-4 pb-1">
                        <div>
                          <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                            Organization & Departments
                          </h1>
                        </div>

                        {/* Top-Right Add New Dropdown Button */}
                        {(selectedOrgSubTab === 'department' ||
                          selectedOrgSubTab === 'organization') && (
                            <div className="relative self-start sm:self-auto" ref={addOrgDropdownRef}>
                              <button
                                type="button"
                                onClick={() => setIsAddDropdownOpen((prev) => !prev)}
                                className="flex items-center gap-1.5 bg-navy-blue text-white rounded-full text-xs font-semibold px-4 py-2.5 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition-all duration-150 cursor-pointer shadow-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add New</span>
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isAddDropdownOpen ? 'rotate-180' : ''}`}
                                />
                              </button>

                              <AnimatePresence>
                                {isAddDropdownOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-30 overflow-hidden"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsAddDropdownOpen(false)
                                        handleCancelOrgEdit()
                                        setIsAddOrgModalOpen(true)
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-navy-blue hover:bg-navy-blue/5 hover:text-sig-green transition flex items-center gap-2 cursor-pointer"
                                    >
                                      <Building2 className="w-3.5 h-3.5 text-sig-green" />
                                      <span>Organization</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsAddDropdownOpen(false)
                                        handleCancelOrgEdit()
                                        setIsAddDeptModalOpen(true)
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-navy-blue hover:bg-navy-blue/5 hover:text-sig-green transition flex items-center gap-2 cursor-pointer"
                                    >
                                      <Users className="w-3.5 h-3.5 text-sig-green" />
                                      <span>Department</span>
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                      </div>

                      {/* Directory Navigation Bar & Directory Card Grids */}
                      {(selectedOrgSubTab === 'department' ||
                        selectedOrgSubTab === 'organization') && (
                          <div className="space-y-4">
                            {/* Tab Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-3">
                              <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-2xl w-fit">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrgSubTab('department')}
                                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${selectedOrgSubTab === 'department'
                                    ? 'bg-navy-blue text-white shadow-xs'
                                    : 'text-gray-600 hover:text-navy-blue hover:bg-white/60'
                                    }`}
                                >
                                  Departments
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrgSubTab('organization')}
                                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${selectedOrgSubTab === 'organization'
                                    ? 'bg-navy-blue text-white shadow-xs'
                                    : 'text-gray-600 hover:text-navy-blue hover:bg-white/60'
                                    }`}
                                >
                                  Organizations
                                </button>
                              </div>

                              <h3 className="font-bold text-navy-blue text-base">
                                {selectedOrgSubTab === 'department'
                                  ? 'Registered Departments Directory'
                                  : 'Registered Organizations Directory'}
                              </h3>
                            </div>

                            {/* Directory Views with Motion Transitions */}
                            <AnimatePresence mode="wait">
                              {selectedOrgSubTab === 'department' && (
                                <motion.div
                                  key="department-directory"
                                  variants={pageVariants}
                                  initial="initial"
                                  animate="animate"
                                  exit="exit"
                                  transition={pageTransition}
                                >
                                  {(() => {
                                    const filtered = orgsList.filter(isDeptItem)

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
                                                <h4 className="text-sm font-bold text-navy-blue group-hover:text-sig-green transition-colors duration-200 line-clamp-2 leading-tight px-2">
                                                  {org.name}
                                                </h4>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
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

                              {selectedOrgSubTab === 'organization' && (
                                <motion.div
                                  key="organization-directory"
                                  variants={pageVariants}
                                  initial="initial"
                                  animate="animate"
                                  exit="exit"
                                  transition={pageTransition}
                                >
                                  {(() => {
                                    const filtered = orgsList.filter(isOrgItem)

                                    if (filtered.length === 0) {
                                      return (
                                        <p className="text-center py-10 text-gray-400 text-xs font-semibold">
                                          No organizations registered yet.
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
                                                <h4 className="text-sm font-bold text-navy-blue group-hover:text-sig-green transition-colors duration-200 line-clamp-2 leading-tight px-2">
                                                  {org.name}
                                                </h4>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
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
                            </AnimatePresence>
                          </div>
                        )}

                      {/* Specific Organization / Department Profile Panel Content */}
                      <AnimatePresence mode="wait">
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

                                const isDept = isDeptItem(selectedOrgObj)
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
                                    (e.parentDepartmentId === selectedOrgObj.id ||
                                      e.assignedOrganizationId === selectedOrgObj.id)
                                  return (isAssigned || isUnderDept) && e.status === 'ongoing'
                                })
                                const upcomingActivities = eventsList.filter((e) => {
                                  const isAssigned = e.assignedOrganizationId === selectedOrgObj.id
                                  const isUnderDept =
                                    isDept &&
                                    e.eventType === 'organization' &&
                                    (e.parentDepartmentId === selectedOrgObj.id ||
                                      e.assignedOrganizationId === selectedOrgObj.id)
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
                                    (e.parentDepartmentId === selectedOrgObj.id ||
                                      e.assignedOrganizationId === selectedOrgObj.id)
                                  return (isAssigned || isUnderDept) && e.status === 'completed'
                                })

                                return (
                                  <div className="space-y-6">
                                    {/* Profile Details Card (Full Width) */}
                                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col space-y-4 w-full relative overflow-hidden">
                                      {selectedOrgObj.logo && (
                                        <div className="absolute right-[-10px] bottom-[-26px] w-[500px] h-[270px] opacity-50 pointer-events-none select-none z-0 overflow-hidden">
                                          <img
                                            src={selectedOrgObj.logo}
                                            alt=""
                                            className="w-full h-[500px] object-contain object-top"
                                          />
                                        </div>
                                      )}

                                      <div className="pb-3 flex items-center justify-between flex-wrap gap-2 relative z-10">
                                        <h3 className="font-bold text-navy-blue text-base flex items-center gap-2">
                                          {isDept ? (
                                            <Users className="w-4 h-4 text-sig-green" />
                                          ) : (
                                            <Building2 className="w-4 h-4 text-sig-green" />
                                          )}
                                          {isDept
                                            ? 'Department Profile Details'
                                            : 'Organization Profile Details'}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                          <button
                                            onClick={() =>
                                              setSelectedOrgSubTab(
                                                isDept ? 'department' : 'organization'
                                              )
                                            }
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-blue text-white hover:bg-navy-blue/90 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer"
                                          >
                                            Return to {isDept ? 'Department' : 'Organization'}{' '}
                                            Directory
                                          </button>
                                          <button
                                            onClick={() => {
                                              handleEditOrgClick(selectedOrgObj)
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-blue/5 hover:bg-navy-blue/10 text-navy-blue text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                                          </button>
                                          <button
                                            onClick={() => handleDeleteOrg(selectedOrgObj.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete{' '}
                                            {isDept ? 'Department' : 'Organization'}
                                          </button>
                                        </div>
                                      </div>
                                      <div className="border-b border-gray-100 w-full max-w-md relative z-10" />

                                      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
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
                                        <div className="flex flex-wrap gap-x-16 gap-y-4 flex-1">
                                          <div>
                                            <p className="text-xs uppercase font-bold text-gray-400">
                                              {isDept ? 'Department Name' : 'Organization Name'}
                                            </p>
                                            <p className="text-base font-bold text-navy-blue mt-0.5">
                                              {selectedOrgObj.name}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs uppercase font-bold text-gray-400">
                                              Abbreviation
                                            </p>
                                            <p className="text-base font-bold text-navy-blue mt-0.5">
                                              {selectedOrgObj.abbreviation?.toUpperCase()}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="w-[45%] border-t border-gray-300 relative z-10" />
                                      <div className="pt-2 relative z-10">
                                        <p className="text-xs uppercase font-bold text-gray-400">
                                          Description
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1 leading-relaxed font-medium max-w-sm wrap-break-word whitespace-pre-wrap">
                                          {selectedOrgObj.description || 'No description provided.'}
                                        </p>
                                      </div>

                                      {/* Department link for organizations */}
                                      {!isDept &&
                                        (selectedOrgObj.departmentId ||
                                          selectedOrgObj.parentDepartmentId) && (
                                          <>
                                            <div className="w-[45%] border-t border-gray-300 relative z-10" />
                                            <div className="pt-2 relative z-10">
                                              <p className="text-xs uppercase font-bold text-gray-400">
                                                Department
                                              </p>
                                              <p className="text-sm font-bold text-navy-blue mt-1">
                                                {(() => {
                                                  const pDept = orgsList.find(
                                                    (o) =>
                                                      o.id ===
                                                      (selectedOrgObj.departmentId ||
                                                        selectedOrgObj.parentDepartmentId)
                                                  )
                                                  return pDept
                                                    ? `${pDept.name} (${pDept.abbreviation?.toUpperCase()})`
                                                    : 'N/A'
                                                })()}
                                              </p>
                                            </div>
                                          </>
                                        )}

                                      {isDept && (
                                        <>
                                          <div className="w-[45%] border-t border-gray-300 relative z-10" />
                                          <div className="pt-2 relative z-10">
                                            <p className="text-xs uppercase font-bold text-gray-400">
                                              Organizations under this Department
                                            </p>
                                            {(() => {
                                              const orgsUnderDept = [
                                                ...new Set([
                                                  ...orgsList
                                                    .filter(
                                                      (o) =>
                                                        isOrgItem(o) &&
                                                        (o.departmentId === selectedOrgObj.id ||
                                                          o.parentDepartmentId === selectedOrgObj.id)
                                                    )
                                                    .map((o) => o.name),
                                                  ...eventsList
                                                    .filter(
                                                      (evt) =>
                                                        evt.eventType === 'organization' &&
                                                        evt.parentDepartmentId === selectedOrgObj.id
                                                    )
                                                    .map((evt) => evt.organizationName)
                                                    .filter(Boolean)
                                                ])
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
                                      className={`grid grid-cols-1 ${isDept ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
                                        } gap-6`}
                                    >
                                      {/* Ongoing Activities */}
                                      {!isDept && (
                                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                                          <h4 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-2 flex items-center justify-between">
                                            <span>Ongoing Activities</span>
                                            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase">
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
                                                      <p className="text-xs text-gray-400 font-medium truncate">
                                                        {act.date ||
                                                          (act.scheduleDate
                                                            ? new Date(
                                                              act.scheduleDate
                                                            ).toLocaleDateString()
                                                            : '')}{' '}
                                                        • {act.location}
                                                      </p>
                                                    </div>
                                                    <span className="bg-navy-blue/5 text-navy-blue text-[10px] font-bold px-2 py-1 rounded shrink-0">
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
                                        <h4 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-2 flex items-center justify-between">
                                          <span>Upcoming Activities</span>
                                          <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase">
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
                                                    <p className="text-xs text-gray-400 font-medium truncate">
                                                      {act.date ||
                                                        (act.scheduleDate
                                                          ? new Date(
                                                            act.scheduleDate
                                                          ).toLocaleDateString()
                                                          : '')}{' '}
                                                      • {act.location}
                                                    </p>
                                                  </div>
                                                  <span className="bg-navy-blue/5 text-navy-blue text-[10px] font-bold px-2 py-1 rounded shrink-0">
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
                                        <h4 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-2 text-left">
                                          Outreach Statistics
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="bg-navy-blue/5 p-3 rounded-2xl flex flex-col justify-between h-20 text-left">
                                            <span className="text-xs font-bold text-navy-blue uppercase">
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
                                            <span className="text-xs font-bold text-navy-blue uppercase">
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
                            {editingOrg ? 'Update Organization Profile' : 'Add New Organization'}
                          </h3>
                          <button
                            onClick={handleCancelOrgEdit}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <form onSubmit={handleCreateOrg} className="space-y-4">
                          {/* Organization Name (Required) */}
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

                          {/* Abbreviation (Required) */}
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

                          {/* Description (Required) */}
                          <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1">
                              Description
                            </label>
                            <textarea
                              value={orgDesc}
                              onChange={(e) => {
                                setOrgDesc(e.target.value)
                                setOrgErrors((prev) => {
                                  const copy = { ...prev }
                                  delete copy.orgDesc
                                  return copy
                                })
                              }}
                              placeholder="Student leadership and outreach programs"
                              className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-medium text-navy-blue h-20 resize-none ${orgErrors.orgDesc ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            />
                            {orgErrors.orgDesc && (
                              <p className="text-red-500 text-[10px] mt-1 font-semibold">
                                {orgErrors.orgDesc}
                              </p>
                            )}
                          </div>

                          {/* Organization Logo (Optional) */}
                          <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1">
                              Organization Logo
                            </label>
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                {orgLogo ? (
                                  <img
                                    src={orgLogo}
                                    alt="Logo preview"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Building2 className="w-8 h-8 text-gray-400" />
                                )}
                              </div>
                              <label
                                htmlFor="org-logo-upload"
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-navy-blue text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer"
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
                                      setOrgLogo(reader.result)
                                      setOrgErrors((prev) => {
                                        const copy = { ...prev }
                                        delete copy.orgLogo
                                        return copy
                                      })
                                    }
                                    reader.readAsDataURL(file)
                                  }
                                }}
                                className="hidden"
                                id="org-logo-upload"
                              />
                              {orgLogo && (
                                <button
                                  type="button"
                                  onClick={() => setOrgLogo('')}
                                  className="text-red-500 text-xs font-bold cursor-pointer"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Department (Optional) */}
                          <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1">
                              Department (optional, if organization is under a department)
                            </label>
                            <SearchableDropdown
                              value={orgDepartmentId}
                              onChange={(val) => setOrgDepartmentId(val)}
                              options={orgsList.filter(isDeptItem)}
                              placeholder="Select department (optional)..."
                            />
                          </div>

                          <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={handleCancelOrgEdit}
                              className="flex-1 bg-gray-100 hover:bg-red-500 hover:text-white text-gray-700 font-semibold py-2 px-4 rounded-full text-xs transition-all duration-150 cursor-pointer text-center"
                              style={{ height: '40px' }}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5"
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
                            {editingOrg ? 'Update Department Profile' : 'Add New Department'}
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
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-navy-blue text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer"
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
                              className="flex-1 bg-gray-100 hover:bg-red-500 hover:text-white text-gray-700 font-semibold py-2 px-4 rounded-full text-xs transition-all duration-150 cursor-pointer text-center"
                              style={{ height: '40px' }}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5"
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
                  )
                )}

                {/* ==================================================== */}
                {/* NARRATIVES REVIEW QUEUE TAB PANEL */}
                {/* ==================================================== */}
                {activeTab === 'reports' && user.role === 'admin' && (
                  isOffline ? (
                    <ReportsSkeleton />
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      <div className="pb-1">
                        <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                          Narrative Reports
                        </h1>
                      </div>

                      {/* View Mode Switching Container with Motion Animation */}
                      <AnimatePresence mode="wait">
                        {reportsSubTab === 'pending' ? (
                          <motion.div
                            key="pending-queue"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4"
                          >
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
                              <h3 className="font-bold text-navy-blue text-base">
                                Pending Review
                              </h3>
                              <button
                                onClick={() => setReportsSubTab('approved')}
                                className="bg-navy-blue hover:bg-navy-blue/90 text-white font-semibold py-1.5 px-4 rounded-full text-xs transition-all duration-150 cursor-pointer flex items-center space-x-1.5 shadow-xs"
                              >
                                <span>Approved</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="space-y-3">
                              {reportsList
                                .filter(
                                  (r) => r.status === 'submitted' || r.status === 'returned'
                                )
                                .sort(
                                  (a, b) =>
                                    getPendingReportTimestamp(b) - getPendingReportTimestamp(a)
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
                                            className={`inline-block text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${rep.status === 'submitted'
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-red-100 text-red-800'
                                              }`}
                                          >
                                            {rep.status}
                                          </span>
                                          <span className="text-xs text-navy-blue font-bold">
                                            {org
                                              ? org.name
                                              : rep.organizationId
                                                ? 'Unknown Department'
                                                : 'CES Office'}{' '}
                                            ({org ? org.abbreviation : rep.organizationId ? '' : 'CES'})
                                          </span>
                                        </div>
                                        <h4 className="font-bold text-navy-blue text-sm">
                                          {event ? event.name : rep.activityTitle || rep.title || 'Outreach Activity'}
                                        </h4>
                                        <div className="text-xs text-gray-400 font-medium">
                                          Submitted by {author ? author.name : rep.authorName || rep.submittedBy || 'Coordinator'} on{' '}
                                          {new Date(getPendingReportTimestamp(rep)).toLocaleDateString()}
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2 mt-4 md:mt-0">
                                        <button
                                          onClick={() => {
                                            setSelectedReport(rep)
                                            setFeedbackNote(rep.adminFeedback || '')
                                          }}
                                          className="bg-white hover:bg-gray-50 text-navy-blue border border-gray-200 font-semibold py-1.5 px-3.5 rounded-full text-xs flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>Inspect Report</span>
                                        </button>
                                        {Boolean(rep.submissionType === 'docx_upload' || rep.originalDocxUrl) ? (
                                          <div className="flex items-center gap-1.5">
                                            {Boolean(rep.fileType !== 'pdf' && !rep.originalDocxName?.toLowerCase().endsWith('.pdf')) && (
                                              <button
                                                onClick={() =>
                                                  downloadFileFromUrl(
                                                    rep.originalDocxUrl,
                                                    rep.originalDocxName || `${rep.activityTitle || 'Report'}.docx`
                                                  )
                                                }
                                                className="bg-white hover:bg-gray-50 text-navy-blue border border-gray-200 font-semibold py-1.5 px-3 rounded-full text-xs flex items-center space-x-1 cursor-pointer shadow-2xs"
                                                title="Download Original DOCX Document"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>DOCX</span>
                                              </button>
                                            )}
                                            <button
                                              onClick={() => compileReportPDF(rep)}
                                              className="bg-sig-green text-navy-blue font-semibold py-1.5 px-3.5 rounded-full text-xs flex items-center space-x-1.5 hover:bg-sig-green-600 transition-all duration-150 cursor-pointer shadow-2xs"
                                              title="Export and Download as PDF"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>Export PDF</span>
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center space-x-1.5">
                                            <button
                                              onClick={() => compileReportDOCX(rep)}
                                              className="bg-white hover:bg-gray-50 text-navy-blue border border-gray-200 font-semibold py-1.5 px-3 rounded-full text-xs flex items-center space-x-1 cursor-pointer shadow-2xs"
                                              title="Download DOCX Document"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>DOCX</span>
                                            </button>
                                            <button
                                              onClick={() => compileReportPDF(rep)}
                                              className="bg-sig-green text-navy-blue font-semibold py-1.5 px-3.5 rounded-full text-xs flex items-center space-x-1.5 hover:bg-sig-green-600 transition-all duration-150 cursor-pointer shadow-2xs"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>Export PDF</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}

                              {reportsList.filter(
                                (r) => r.status === 'submitted' || r.status === 'returned'
                              ).length === 0 && (
                                  <div className="text-center py-8 text-gray-400 text-xs font-medium">
                                    No reports pending review.
                                  </div>
                                )}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="approved-queue"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-2">
                              <h3 className="font-bold text-navy-blue text-base">
                                Approved Reports
                              </h3>
                              <button
                                onClick={() => setReportsSubTab('pending')}
                                className="bg-gray-100 hover:bg-gray-200 text-navy-blue font-semibold py-1.5 px-3.5 rounded-full text-xs transition-all duration-150 cursor-pointer flex items-center space-x-1.5"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Pending Review Queue</span>
                              </button>
                            </div>

                            {/* Search Input Field */}
                            <div className="relative">
                              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={approvedSearchQuery}
                                onChange={(e) => setApprovedSearchQuery(e.target.value)}
                                placeholder="Search approved reports by title, author, venue, program, department, beneficiaries, objectives..."
                                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-navy-blue placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-blue/20 focus:border-navy-blue transition duration-150"
                              />
                              {approvedSearchQuery && (
                                <button
                                  onClick={() => setApprovedSearchQuery('')}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-blue p-0.5 rounded-full"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="space-y-3 pt-1">
                              {reportsList
                                .filter((r) => r.status === 'approved')
                                .sort(
                                  (a, b) =>
                                    getPendingReportTimestamp(b) - getPendingReportTimestamp(a)
                                )
                                .filter((rep) => {
                                  if (!approvedSearchQuery.trim()) return true
                                  const query = approvedSearchQuery.toLowerCase().trim()
                                  const searchableText = getReportSearchableText(rep)
                                  return searchableText.includes(query)
                                })
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
                                          <span className="inline-block text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                                            Approved
                                          </span>
                                          <span className="text-xs text-navy-blue font-bold">
                                            {org
                                              ? org.name
                                              : rep.organizationId
                                                ? 'Unknown Department'
                                                : 'CES Office'}{' '}
                                            ({org ? org.abbreviation : rep.organizationId ? '' : 'CES'})
                                          </span>
                                        </div>
                                        <h4 className="font-bold text-navy-blue text-sm">
                                          {event ? event.name : rep.activityTitle || rep.title || 'Outreach Activity'}
                                        </h4>
                                        <div className="text-xs text-gray-400 font-medium">
                                          Submitted by {author ? author.name : rep.authorName || rep.submittedBy || 'Coordinator'} on{' '}
                                          {new Date(rep.updatedAt || rep.createdAt).toLocaleDateString()}
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2 mt-4 md:mt-0">
                                        <button
                                          onClick={() => {
                                            setSelectedReport(rep)
                                            setFeedbackNote(rep.adminFeedback || '')
                                          }}
                                          className="bg-white hover:bg-gray-50 text-navy-blue border border-gray-200 font-semibold py-1.5 px-3.5 rounded-full text-xs flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>Inspect Report</span>
                                        </button>
                                        {Boolean(rep.submissionType === 'docx_upload' || rep.originalDocxUrl) ? (
                                          <div className="flex items-center gap-1.5">
                                            {Boolean(rep.fileType !== 'pdf' && !rep.originalDocxName?.toLowerCase().endsWith('.pdf')) && (
                                              <button
                                                onClick={() =>
                                                  downloadFileFromUrl(
                                                    rep.originalDocxUrl,
                                                    rep.originalDocxName || `${rep.activityTitle || 'Report'}.docx`
                                                  )
                                                }
                                                className="bg-white hover:bg-gray-50 text-navy-blue border border-gray-200 font-semibold py-1.5 px-3 rounded-full text-xs flex items-center space-x-1 cursor-pointer shadow-2xs"
                                                title="Download Original DOCX Document"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>DOCX</span>
                                              </button>
                                            )}
                                            <button
                                              onClick={() => compileReportPDF(rep)}
                                              className="bg-sig-green text-navy-blue font-semibold py-1.5 px-3.5 rounded-full text-xs flex items-center space-x-1.5 hover:bg-sig-green-600 transition-all duration-150 cursor-pointer shadow-2xs"
                                              title="Export and Download as PDF"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>Export PDF</span>
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center space-x-1.5">
                                            <button
                                              onClick={() => compileReportDOCX(rep)}
                                              className="bg-white hover:bg-gray-50 text-navy-blue border border-gray-200 font-semibold py-1.5 px-3 rounded-full text-xs flex items-center space-x-1 cursor-pointer shadow-2xs"
                                              title="Download DOCX Document"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>DOCX</span>
                                            </button>
                                            <button
                                              onClick={() => compileReportPDF(rep)}
                                              className="bg-sig-green text-navy-blue font-semibold py-1.5 px-3.5 rounded-full text-xs flex items-center space-x-1.5 hover:bg-sig-green-600 transition-all duration-150 cursor-pointer shadow-2xs"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>Export PDF</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}

                              {reportsList.filter((r) => r.status === 'approved').length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-xs">
                                  No approved reports found.
                                </div>
                              )}

                              {reportsList.filter((r) => r.status === 'approved').length > 0 &&
                                reportsList
                                  .filter((r) => r.status === 'approved')
                                  .filter((rep) => {
                                    if (!approvedSearchQuery.trim()) return true
                                    const query = approvedSearchQuery.toLowerCase().trim()
                                    const searchableText = getReportSearchableText(rep)
                                    return searchableText.includes(query)
                                  }).length === 0 && (
                                  <div className="text-center py-8 text-gray-400 text-xs">
                                    No approved reports match your search criteria &quot;{approvedSearchQuery}&quot;.
                                  </div>
                                )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                )}

                {/* ==================================================== */}
                {/* USER ACCOUNT MANAGEMENT TAB PANEL */}
                {/* ==================================================== */}
                {activeTab === 'accounts' && user.role === 'admin' && (
                  isOffline ? (
                    <AccountsSkeleton />
                  ) : (
                    <div className="space-y-6 animate-fade-in w-full">
                      {/* Header section */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
                        <div>
                          <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                            User Account Management
                          </h1>
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
                          className="flex items-center space-x-1.5 bg-navy-blue text-white border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green font-semibold py-2 px-4 rounded-full text-xs cursor-pointer transition-all duration-150 shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add User</span>
                        </button>
                      </div>

                      {/* Full Width User Accounts Directory Table */}
                      <div className="glass-card rounded-2xl p-4 sm:p-6 min-w-0">
                        <h3 className="font-bold text-navy-blue text-base border-b border-gray-200/60 pb-3 mb-4">
                          User Accounts Directory
                        </h3>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                          <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead>
                              <tr className="border-b border-gray-200/60 bg-gray-50/80 text-xs uppercase font-bold text-gray-500">
                                <th className="py-3 px-4">Full Name</th>
                                <th className="py-3 px-3">Role</th>
                                <th className="py-3 px-3">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                              {usersList.map((u) => {
                                const isSelf = u.uid === user.uid
                                return (
                                  <tr key={u.uid} className="hover:bg-gray-50/60 transition">
                                    <td className="py-3.5 px-4 font-bold text-navy-blue text-sm">
                                      <div>
                                        {u.name}{' '}
                                        {isSelf && (
                                          <span className="text-[10px] bg-navy-blue/10 text-navy-blue px-2 py-0.5 rounded-full font-bold ml-1">
                                            You
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs text-gray-400 font-medium">
                                        {u.email}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-3 text-gray-600 font-medium text-xs capitalize">
                                      {u.role.replace('_', ' ')}
                                    </td>
                                    <td className="py-3.5 px-3">
                                      <span
                                        className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${u.status === 'inactive'
                                          ? 'bg-red-50 text-red-700 border border-red-200'
                                          : 'bg-green-50 text-green-700 border border-green-200'
                                          }`}
                                      >
                                        {u.status || 'active'}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-right space-x-1.5 shrink-0">
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
                                        className={`py-1 px-2.5 rounded-lg text-xs font-semibold border shadow-2xs transition-all duration-150 cursor-pointer ${isSelf
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
                                        className={`py-1 px-2.5 rounded-lg text-xs font-semibold border shadow-2xs transition-all duration-150 cursor-pointer ${isSelf
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
                  )
                )}

                {/* ==================================================== */}
                {/* ABOUT TAB PANEL */}
                {/* ==================================================== */}
                {activeTab === 'about' && (
                  isOffline ? (
                    <AboutSkeleton />
                  ) : (
                    <div className="space-y-6 animate-fade-in w-full text-left">

                      {/* ── 1. PAGE HEADER ─────────────────────────────── */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                          About DommUnity
                        </h1>
                        <AboutVersionCard />
                      </div>

                      {/* ── 2. SYSTEM DESCRIPTION (full-width) ─────────── */}
                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 relative overflow-hidden">
                        <div className="absolute right-[-158px] bottom-[-20px] w-[400px] h-[260px] opacity-50 pointer-events-none select-none z-0 overflow-hidden">

                        </div>
                        <div className="relative z-10 space-y-4">
                          <h2 className="text-lg font-bold text-navy-blue border-b border-gray-100 pb-3 w-[280px]">
                            System Description
                          </h2>
                          <div>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                              Project Overview
                            </span>
                            <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                              DommUnity is a desktop-based management system developed for the
                              Community Extension & Services (CES) Office of Dominican College of
                              Tarlac, Inc. It is designed to simplify inventory management,
                              donor management, organization management, and report generation for the
                              Community Extension Services Office.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ── 3. CES OFFICE — Vision / Mission / Goal ────── */}
                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
                        <h2 className="text-lg font-bold text-navy-blue border-b border-gray-100 pb-3">
                          Community Extension & Services (CES) Office
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          {/* Vision */}
                          <div className="group bg-gradient-to-b from-slate-50/80 via-white to-white rounded-2xl p-6 border border-gray-100 shadow-2xs hover:shadow-md hover:border-navy-blue/20 transition-all duration-300 flex flex-col items-center text-center">
                            {/* Main Icon Badge */}
                            <div className="w-14 h-14 rounded-full bg-navy-blue flex items-center justify-center mb-4 shadow-sm transition-transform duration-300 group-hover:scale-105">
                              <Eye className="w-7 h-7 text-sig-green" />
                            </div>
                            <h3 className="text-base font-extrabold text-navy-blue uppercase tracking-wider mb-2.5">
                              Vision
                            </h3>
                            <p className="text-sm text-gray-700 leading-relaxed flex-1">
                              The Community Extensions Services (CES) Office of the Dominican College of Tarlac envisions socially awareness,
                              sensitive and responsive students through active involvement in community extensions, service learning and outreach
                              activities towards community development.
                            </p>
                          </div>

                          {/* Mission */}
                          <div className="group bg-gradient-to-b from-slate-50/80 via-white to-white rounded-2xl p-6 border border-gray-100 shadow-2xs hover:shadow-md hover:border-sig-green/30 transition-all duration-300 flex flex-col items-center text-center">
                            {/* Main Icon Badge */}
                            <div className="w-14 h-14 rounded-full bg-sig-green flex items-center justify-center mb-4 shadow-sm transition-transform duration-300 group-hover:scale-105">
                              <Rocket className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-base font-extrabold text-navy-blue uppercase tracking-wider mb-2.5">
                              Mission
                            </h3>
                            <p className="text-sm text-gray-700 leading-relaxed flex-1">
                              The Community and Extension Services Office Shall: Participate in optimistic and relevant social activities for the
                              promotion of passion for truth and compassion for humanity. Sustain holistic development of communities which are humane,
                              self-reliant, and sustainable. Encourage volunteerism among the DCT Community for the noble and worthwhile extension activities
                              thereby cultivating the same spirit in the client partner communities.
                            </p>
                          </div>

                          {/* Goal */}
                          <div className="group bg-gradient-to-b from-slate-50/80 via-white to-white rounded-2xl p-6 border border-gray-100 shadow-2xs hover:shadow-md hover:border-navy-blue/20 transition-all duration-300 flex flex-col items-center text-center">
                            {/* Main Icon Badge */}
                            <div className="w-14 h-14 rounded-full bg-navy-blue flex items-center justify-center mb-4 shadow-sm transition-transform duration-300 group-hover:scale-105">
                              <Target className="w-7 h-7 text-sig-green" />
                            </div>
                            <h3 className="text-base font-extrabold text-navy-blue uppercase tracking-wider mb-2.5">
                              Goal
                            </h3>
                            <p className="text-sm text-gray-700 leading-relaxed flex-1">
                              We aim to provide Community Extension Services program for the improvement of our target clientele in accordance with the
                              Gospel Values to become a productive, self-reliant, and sustainable member of the society.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ── 4. Organizational Chart ─────── */}
                      <OrganizationalChart />

                      {/* ── 5. Developers ─────── */}
                      <DevelopersChart />
                    </div>
                  )
                )}
              </div>
            </div>
          </AnimatedPage>
        </main>

        {/* ==================================================== */}
        {/* HIDDEN CES OFFICIAL PDF TEMPLATE CONVERTER */}
        {/* ==================================================== */}
        {exportingReport && (
          <div className="fixed top-0 left-0 w-[816px] h-screen pointer-events-none select-none opacity-0 z-[-9999] overflow-hidden">
            <DocumentViewer
              report={exportingReport}
              onClose={() => setExportingReport(null)}
              eventsList={eventsList}
              orgsList={orgsList}
              usersList={usersList}
              isExportOnly={true}
              exportFormat="pdf"
              onExportFinished={() => setExportingReport(null)}
            />
          </div>
        )}

        {exportingDocxReport && (
          <div className="fixed top-0 left-0 w-[816px] h-screen pointer-events-none select-none opacity-0 z-[-9999] overflow-hidden">
            <DocumentViewer
              report={exportingDocxReport}
              onClose={() => setExportingDocxReport(null)}
              eventsList={eventsList}
              orgsList={orgsList}
              usersList={usersList}
              isExportOnly={true}
              exportFormat="docx"
              onExportFinished={() => setExportingDocxReport(null)}
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
                  className="text-gray-400 hover:text-navy-blue transition-all duration-150 cursor-pointer"
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
                    {txHistory.map((tx, idx) => {
                      const act = (tx.action || tx.type || '').toLowerCase().trim()
                      return (
                        <tr key={tx.id || idx}>
                          <td className="py-2.5 px-2 text-gray-600">
                            {new Date(tx.date).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-gray-800 font-semibold">{tx.itemName}</td>
                          <td className="py-2.5 px-2 font-medium">
                            {act === 'added' || act === 'item added' ? (
                              <span className="text-[#2e7d32]">Added</span>
                            ) : act === 'released' || act === 'item released' || act === 'release' ? (
                              <span className="text-[#dc2626]">Released</span>
                            ) : act === 'deleted' || act === 'item deleted' || act === 'delete' ? (
                              <span className="text-[#dc2626]">Deleted</span>
                            ) : (
                              <span className="text-gray-700 capitalize">{tx.action || tx.type}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right text-gray-800 font-semibold">
                            {tx.quantity}
                          </td>
                          <td className="py-2.5 px-2 text-gray-600 capitalize">{tx.unit || tx.baseUnit || 'pieces'}</td>
                        </tr>
                      )
                    })}
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
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-full text-xs font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={handleConfirmDownloadPDF}
                  className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2.5 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition-all duration-150 cursor-pointer"
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
                    <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase font-bold text-gray-500 sticky top-0">
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
                              <p className="font-bold text-navy-blue text-sm">{evt.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                {evt.description}
                              </p>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-navy-blue text-xs">
                                {dept
                                  ? `${dept.name} (${dept.abbreviation})`
                                  : evt.organizationName || 'CES Office'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-gray-500 font-medium">
                              {evt.location || 'N/A'}
                            </td>
                            <td className="py-3 px-3">
                              <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
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
                  className="px-5 py-2 border border-gray-200 text-gray-500 rounded-full text-xs font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-150 cursor-pointer"
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
                {txHistory.map((tx, idx) => {
                  const act = (tx.action || tx.type || '').toLowerCase().trim()
                  return (
                    <tr key={tx.id || idx} className="text-xs">
                      <td className="py-3 px-2 text-gray-700">
                        {new Date(tx.date).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-gray-800 font-semibold">{tx.itemName}</td>
                      <td className="py-3 px-2 font-medium">
                        {act === 'added' || act === 'item added' ? (
                          <span className="text-[#2e7d32]">Added</span>
                        ) : act === 'released' || act === 'item released' || act === 'release' ? (
                          <span className="text-[#dc2626]">Released</span>
                        ) : act === 'deleted' || act === 'item deleted' || act === 'delete' ? (
                          <span className="text-[#dc2626]">Deleted</span>
                        ) : (
                          <span className="text-gray-700 capitalize">{tx.action || tx.type}</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-800 font-semibold">
                        {tx.quantity}
                      </td>
                      <td className="py-3 px-2 text-gray-700 capitalize">{tx.unit || tx.baseUnit || 'pieces'}</td>
                    </tr>
                  )
                })}
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
      {isDonationModalOpen &&
        createPortal(
          <div className="fixed inset-0 glass-modal-overlay flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass-modal rounded-2xl p-6 max-w-4xl w-full shadow-2xl border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in-scale">
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-3 text-left">
                <h3 className="font-bold text-navy-blue text-base">Record Donation</h3>
                <button
                  type="button"
                  onClick={handleCloseDonationModal}
                  className="text-gray-400 hover:text-navy-blue transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 mb-4">
                Log Donation
              </h3>

              <form onSubmit={handleCreateDonation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        disablePast={true}
                        onChange={(val) => {
                          setDonDate(val)
                          if (val && isPastDate(val)) {
                            setDonErrors((prev) => ({
                              ...prev,
                              fields: {
                                ...(prev.fields || {}),
                                donDate: DATE_ERROR_MESSAGES.DONATION_PAST
                              }
                            }))
                          } else {
                            setDonErrors((prev) => {
                              const copy = { ...prev }
                              if (copy.fields) {
                                copy.fields = { ...copy.fields }
                                delete copy.fields.donDate
                              }
                              return copy
                            })
                          }
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
                      className="flex items-center gap-1.5 bg-navy-blue text-white rounded-full text-xs font-semibold px-4 py-2 border border-navy-blue hover:bg-white hover:text-sig-green hover:border-sig-green transition-all duration-150 cursor-pointer"
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
                            <span className="text-xs font-bold text-navy-blue">
                              Item #{idx + 1}
                            </span>
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
                              <SearchableDropdown
                                value={item.name}
                                onChange={(val) => {
                                  const list = [...donItems]
                                  list[idx].name = val
                                  const originalItem = inventoryList.find(
                                    (invItem) => invItem.name === val &&
                                      !deletedItemNames.includes(invItem.name.toLowerCase().trim())
                                  )
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
                                }}
                                options={(() => {
                                  const matching = inventoryList.filter(
                                    (invItem) =>
                                      !deletedItemNames.includes(
                                        invItem.name.toLowerCase().trim()
                                      )
                                  )
                                  const uniqueNames = [
                                    ...new Set(matching.map((invItem) => invItem.name))
                                  ]
                                  return uniqueNames.map(name => {
                                    const originalItem = matching.find(invItem => invItem.name === name)
                                    return {
                                      id: name,
                                      name: name,
                                      abbreviation: originalItem?.category || ''
                                    }
                                  })
                                })()}
                                allowCustom={true}
                                placeholder="e.g. Corned Beef, Notebooks"
                                className={donErrors?.items?.[idx]?.name ? 'border-red-500 ring-2 ring-red-500/10' : ''}
                              />
                            </div>

                            {/* Category Searchable Dropdown */}
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Category
                              </label>
                              <SearchableDropdown
                                value={item.category}
                                onChange={(val) => {
                                  handleDonItemChange(idx, 'category', val)
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
                                options={activeCategories}
                                allowCustom={true}
                                placeholder="Select or type category"
                                className={donErrors?.items?.[idx]?.category ? 'border-red-500 ring-2 ring-red-500/10' : ''}
                              />
                            </div>

                            {/* Unit Searchable Dropdown */}
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Unit
                              </label>
                              <SearchableDropdown
                                value={item.unit}
                                onChange={(val) => {
                                  handleDonItemChange(idx, 'unit', val)
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
                                options={activeUnits}
                                allowCustom={true}
                                placeholder="Select or type unit"
                                className={donErrors?.items?.[idx]?.unit ? 'border-red-500 ring-2 ring-red-500/10' : ''}
                              />
                            </div>

                            {/* Quantity */}
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">
                                Quantity
                              </label>
                              <SearchableDropdown
                                value={item.quantity}
                                onChange={(val) => {
                                  handleDonItemChange(idx, 'quantity', val)
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
                                options={[5, 10, 20, 50, 100, 250, 500]}
                                allowCustom={true}
                                placeholder="Select or enter quantity"
                                className={donErrors?.items?.[idx]?.quantity ? 'border-red-500 ring-2 ring-red-500/10' : ''}
                              />
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
                                <CustomSelect
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
                                  options={[
                                    { value: 'none', label: 'Do not group (Individual pieces)' },
                                    { value: 'pack', label: 'Packs' },
                                    { value: 'box', label: 'Boxes' },
                                    { value: 'bundle', label: 'Bundles' }
                                  ]}
                                  placeholder="Do not group"
                                  style={{ height: '40px' }}
                                />
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
                                  disablePast={true}
                                  onChange={(val) => {
                                    handleDonItemChange(idx, 'expiryDate', val)
                                    if (val && isPastDate(val)) {
                                      setDonErrors((prev) => {
                                        const copy = { ...prev }
                                        const itemsCopy = [...(copy.items || [])]
                                        itemsCopy[idx] = {
                                          ...(itemsCopy[idx] || {}),
                                          expiryDate: DATE_ERROR_MESSAGES.EXPIRY_PAST
                                        }
                                        return { ...copy, items: itemsCopy }
                                      })
                                    } else {
                                      setDonErrors((prev) => {
                                        const copy = { ...prev }
                                        if (copy.items && copy.items[idx]) {
                                          copy.items = [...copy.items]
                                          copy.items[idx] = { ...copy.items[idx] }
                                          delete copy.items[idx].expiryDate
                                        }
                                        return copy
                                      })
                                    }
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
                  {loading ? 'Adding Donations...' : 'Add Donation'}
                </button>
              </form>
            </div>
          </div>,
          document.body
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
            <CustomSelect
              value={coordRole}
              onChange={(e) => {
                setCoordRole(e.target.value)
                setCoordErrors((prev) => {
                  const copy = { ...prev }
                  delete copy.coordRole
                  return copy
                })
              }}
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'office_coordinator', label: 'Office Coordinator' }
              ]}
              placeholder="Select Role"
              error={!!coordErrors.coordRole}
            />
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
                <div className="relative">
                  <input
                    type={showAddUserPassword ? 'text' : 'password'}
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
                    className={`w-full p-2.5 pr-10 text-xs glass-input rounded-xl focus:outline-none font-semibold text-navy-blue ${coordErrors.coordPassword ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddUserPassword(!showAddUserPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-navy-blue focus:outline-none transition-colors duration-150 cursor-pointer"
                  >
                    {showAddUserPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
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
                <div className="relative">
                  <input
                    type={showAddUserConfirmPassword ? 'text' : 'password'}
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
                    className={`w-full p-2.5 pr-10 text-xs glass-input rounded-xl focus:outline-none font-semibold text-navy-blue ${coordErrors.coordConfirmPassword ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddUserConfirmPassword(!showAddUserConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-navy-blue focus:outline-none transition-colors duration-150 cursor-pointer"
                  >
                    {showAddUserConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
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
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-navy-blue hover:bg-navy-blue-600 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-glass-sm transition-all duration-150 cursor-pointer border border-white/20"
            >
              {editingUser ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </AnimatedModal>

      {/* Event Details View Modal */}
      <AnimatedModal
        isOpen={isViewEventModalOpen}
        onClose={() => {
          setIsViewEventModalOpen(false)
          setSelectedViewEvent(null)
        }}
        overlayClassName="fixed inset-0 z-[99999] flex items-center justify-center p-4 glass-modal-overlay"
        contentClassName="glass-modal rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-white/80 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {selectedViewEvent &&
          (() => {
            const org = orgsList.find((o) => o.id === selectedViewEvent.assignedOrganizationId)
            const dateObj = new Date(selectedViewEvent.scheduleDate)
            return (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-3.5">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-navy-blue/5 text-navy-blue rounded-xl">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-navy-blue text-base">Event Details</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewEventModalOpen(false)
                      setSelectedViewEvent(null)
                    }}
                    className="text-gray-400 hover:text-navy-blue transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Event Details Content */}
                <div className="space-y-4 text-left">
                  {/* Event Name */}
                  <div>
                    <h4 className="text-lg font-black text-navy-blue leading-snug break-words whitespace-normal">
                      {selectedViewEvent.name}
                    </h4>
                  </div>

                  {/* Status & Type Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center text-xs font-bold uppercase px-2.5 py-1 rounded-full ${selectedViewEvent.status === 'completed' ||
                        selectedViewEvent.status === 'successful'
                        ? 'bg-green-100 text-green-800'
                        : selectedViewEvent.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : selectedViewEvent.status === 'planned'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      Status: {selectedViewEvent.status || 'planned'}
                    </span>
                    <span className="inline-flex items-center text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-navy-blue/5 text-navy-blue">
                      Type: {selectedViewEvent.eventType || 'department'}
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    {/* Department / Org */}
                    <div className="space-y-1">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                        Assigned Department / Org
                      </span>
                      <span className="text-sm text-navy-blue font-bold flex items-center space-x-1.5">
                        <Users className="w-4 h-4 text-navy-blue shrink-0" />
                        <span className="break-words whitespace-normal">
                          {selectedViewEvent.eventType === 'organization'
                            ? `${selectedViewEvent.organizationName || 'Organization'} (${org ? org.abbreviation : 'All'})`
                            : org
                              ? `${org.name} (${org.abbreviation})`
                              : 'All'}
                        </span>
                      </span>
                    </div>

                    {/* Location/Venue */}
                    <div className="space-y-1">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                        Venue / Location
                      </span>
                      <span className="text-sm text-navy-blue font-bold flex items-center space-x-1.5">
                        <MapPin className="w-4 h-4 text-sig-green shrink-0" />
                        <span className="break-words whitespace-normal">
                          {selectedViewEvent.location || 'No venue specified'}
                        </span>
                      </span>
                    </div>

                    {/* Scheduled Date */}
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                        Date & Time
                      </span>
                      <span className="text-sm text-navy-blue font-bold flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-navy-blue shrink-0" />
                        <span>{!isNaN(dateObj.getTime()) ? dateObj.toLocaleString() : 'N/A'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedViewEvent.description && (
                    <div className="space-y-1.5">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                        Description / Narrative
                      </span>
                      <div className="bg-white border border-gray-150 rounded-xl p-3 text-xs text-gray-650 leading-relaxed font-medium break-words whitespace-pre-wrap">
                        {selectedViewEvent.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-gray-100 pt-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewEventModalOpen(false)
                      setSelectedViewEvent(null)
                    }}
                    className="bg-navy-blue hover:bg-navy-blue/90 text-white rounded-xl text-xs font-semibold py-2 px-5 shadow-sm transition-all duration-150 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </>
            )
          })()}
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
          className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2.5 border-b-2 border-sig-green hover:bg-navy-blue/95 transition-all duration-150 cursor-pointer"
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
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full text-xs py-2.5 transition-all duration-150 cursor-pointer"
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
                className="flex-1 bg-navy-blue hover:bg-navy-blue-600 text-white font-bold rounded-full text-xs py-2.5 shadow-md transition-all duration-150 cursor-pointer"
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
        contentClassName="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 max-w-sm w-full text-center space-y-4 font-poppins"
      >
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-sig-green/15 text-sig-green flex items-center justify-center mb-1 shadow-xs">
            <CheckCircle className="w-7 h-7 text-sig-green stroke-[2.2]" />
          </div>
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
          className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2.5 border-b-2 border-sig-green hover:bg-navy-blue/95 transition-all duration-150 cursor-pointer"
        >
          OK
        </button>
      </AnimatedModal>
    </div>
  )
}
