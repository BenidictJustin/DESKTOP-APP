import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  onSnapshot
} from 'firebase/firestore'
import { initializeApp, deleteApp } from 'firebase/app'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser as deleteFirebaseUser,
  getAuth,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import {
  db as fdb,
  auth as fauth,
  storage as fstorage,
  isDemoMode,
  firebaseConfig
} from '../firebase'
import { compressHtmlImages, compressImage, ensureHtmlUnderFirestoreLimit } from '../utils/imageCompressor'

export function getLevenshteinDistance(str1, str2) {
  const s1 = (str1 || '').toLowerCase().trim()
  const s2 = (str2 || '').toLowerCase().trim()
  if (s1 === s2) return 0
  if (s1.length === 0) return s2.length
  if (s2.length === 0) return s1.length

  const matrix = []
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2[i - 1] === s1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        )
      }
    }
  }
  return matrix[s2.length][s1.length]
}

export function areNamesSimilar(n1, n2) {
  const s1 = (n1 || '').toLowerCase().trim()
  const s2 = (n2 || '').toLowerCase().trim()
  if (s1 === s2) return true

  const singularize = (str) => {
    if (str.endsWith('ies') && str.length > 3) return str.slice(0, -3) + 'y'
    if (str.endsWith('es') && str.length > 2) return str.slice(0, -2)
    if (str.endsWith('s') && str.length > 1) return str.slice(0, -1)
    return str
  }
  if (singularize(s1) === singularize(s2)) return true

  const dist = getLevenshteinDistance(s1, s2)
  const maxLen = Math.max(s1.length, s2.length)
  if (maxLen <= 4) {
    return dist === 0
  } else if (maxLen <= 8) {
    return dist <= 1
  } else {
    return dist <= 2
  }
}

// ==========================================
// 1. DEMO MODE DATA STORAGE (LOCAL STORAGE)
// ==========================================

const LOCAL_STORAGE_KEYS = {
  USERS: 'dommunity_users',
  ORGANIZATIONS: 'dommunity_organizations',
  INVENTORY: 'dommunity_inventory',
  DONORS: 'dommunity_donors',
  DONATIONS: 'dommunity_donations',
  EVENTS: 'dommunity_events',
  REPORTS: 'dommunity_reports',
  LOGGED_IN_USER: 'dommunity_current_user',
  RESET_REQUESTS: 'dommunity_reset_requests',
  SESSION_ID: 'dommunity_session_id'
}

// Initial Seed Data for Demo Mode
const SEED_DATA = {
  ORGANIZATIONS: [
    {
      id: 'dept-cba',
      name: 'College of Business Administration',
      abbreviation: 'CBA',
      description: 'Business and entrepreneurial extension projects.',
      coordinatorId: 'user-cba',
      type: 'department',
      createdAt: new Date().toISOString()
    },
    {
      id: 'dept-cs',
      name: 'College of Computer Studies',
      abbreviation: 'CCS',
      description: 'IT literacy and tech support programs.',
      coordinatorId: 'user-cs',
      type: 'department',
      createdAt: new Date().toISOString()
    },
    {
      id: 'dept-coed',
      name: 'College of Education',
      abbreviation: 'COED',
      description: 'Literacy, tutoring, and youth mentoring outreach.',
      coordinatorId: null,
      type: 'department',
      createdAt: new Date().toISOString()
    },
    {
      id: 'org-ssc',
      name: 'Supreme Student Council',
      abbreviation: 'SSC',
      description: 'Student body outreach and advocacy programs.',
      coordinatorId: null,
      type: 'organization',
      createdAt: new Date().toISOString()
    }
  ],
  USERS: [
    {
      uid: 'user-admin',
      username: 'admin',
      email: 'admin@gmail.com',
      name: 'Faithful Anne F. Arugay',
      role: 'admin',
      organizationId: null,
      createdAt: new Date().toISOString()
    },
    {
      uid: 'user-office',
      username: 'jonnel',
      email: 'coordinator@gmail.com',
      name: 'Jonnel B. Manio',
      role: 'office_coordinator',
      organizationId: null,
      createdAt: new Date().toISOString()
    }
  ],
  INVENTORY: [
    {
      id: 'inv-1',
      name: 'Notebooks',
      category: 'school supplies',
      unit: 'pieces',
      quantity: 250,
      expiryDate: null,
      receivedDate: new Date(2026, 5, 1).toISOString(),
      status: 'available',
      lastUpdatedBy: 'user-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-2',
      name: 'Pencils',
      category: 'school supplies',
      unit: 'pieces',
      quantity: 180,
      expiryDate: null,
      receivedDate: new Date(2026, 5, 1).toISOString(),
      status: 'available',
      lastUpdatedBy: 'user-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-3a',
      name: 'Sardines (Canned)',
      category: 'food packs',
      unit: 'cans',
      quantity: 3,
      expiryDate: new Date(2026, 6, 15).toISOString(),
      receivedDate: new Date(2026, 4, 10).toISOString(),
      status: 'low stock',
      lastUpdatedBy: 'user-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-3b',
      name: 'Sardines (Canned)',
      category: 'food packs',
      unit: 'cans',
      quantity: 3,
      expiryDate: new Date(2026, 8, 20).toISOString(),
      receivedDate: new Date(2026, 4, 15).toISOString(),
      status: 'low stock',
      lastUpdatedBy: 'user-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-3c',
      name: 'Sardines (Canned)',
      category: 'food packs',
      unit: 'cans',
      quantity: 2,
      expiryDate: new Date(2026, 11, 1).toISOString(),
      receivedDate: new Date(2026, 5, 1).toISOString(),
      status: 'low stock',
      lastUpdatedBy: 'user-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-4',
      name: 'Instant Noodles',
      category: 'food packs',
      unit: 'packs',
      quantity: 55,
      expiryDate: new Date(2026, 9, 30).toISOString(),
      receivedDate: new Date(2026, 5, 15).toISOString(),
      status: 'available',
      lastUpdatedBy: 'user-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-5',
      name: 'Hygiene Soap',
      category: 'hygiene kits',
      unit: 'bars',
      quantity: 120,
      expiryDate: new Date(2027, 11, 1).toISOString(),
      receivedDate: new Date(2026, 5, 20).toISOString(),
      status: 'available',
      lastUpdatedBy: 'user-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-6',
      name: 'Expired Biscuits',
      category: 'food packs',
      unit: 'packs',
      quantity: 0,
      expiryDate: new Date(2026, 4, 1).toISOString(),
      receivedDate: new Date(2026, 2, 1).toISOString(),
      status: 'out of stock',
      lastUpdatedBy: 'user-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  DONORS: [
    {
      id: 'donor-1',
      name: 'DCT High School Alumni Association',
      type: 'external_sponsor',
      contactEmail: 'alumni@dct.edu.ph',
      contactPhone: '09171234567',
      createdAt: new Date().toISOString()
    },
    {
      id: 'donor-2',
      name: 'Senior High School Department',
      type: 'internal_department',
      contactEmail: 'shs@dct.edu.ph',
      contactPhone: '09187654321',
      createdAt: new Date().toISOString()
    },
    {
      id: 'donor-3',
      name: 'Mrs. Josefina Cruz',
      type: 'individual',
      contactEmail: 'josefina@gmail.com',
      contactPhone: '09095551234',
      createdAt: new Date().toISOString()
    }
  ],
  DONATIONS: [
    {
      id: 'don-1',
      donorId: 'donor-2',
      dateOfDonation: new Date(2026, 5, 1).toISOString(),
      purpose: 'School Supplies Drive 2026',
      description: 'Donation of notebooks and pencils for standard primary students.',
      items: [
        { name: 'Notebooks', quantity: 250, unit: 'pieces', expiryDate: null },
        { name: 'Pencils', quantity: 180, unit: 'pieces', expiryDate: null }
      ],
      receivedBy: 'user-admin'
    },
    {
      id: 'don-2',
      donorId: 'donor-1',
      dateOfDonation: new Date(2026, 4, 10).toISOString(),
      purpose: 'Typhoon Relief Operation',
      description: 'Food and hygiene kits for relief.',
      items: [
        {
          name: 'Sardines (Canned)',
          quantity: 8,
          unit: 'cans',
          expiryDate: new Date(2026, 6, 15).toISOString()
        },
        {
          name: 'Instant Noodles',
          quantity: 55,
          unit: 'packs',
          expiryDate: new Date(2026, 9, 30).toISOString()
        },
        {
          name: 'Hygiene Soap',
          quantity: 120,
          unit: 'bars',
          expiryDate: new Date(2027, 11, 1).toISOString()
        }
      ],
      receivedBy: 'user-admin'
    }
  ],
  EVENTS: [
    {
      id: 'event-1',
      name: 'Pamaskong Handog Gift Giving',
      description: 'Gift distribution and feeding program for families in Brgy. Tibag.',
      scheduleDate: new Date(2026, 11, 18, 9, 0).toISOString(),
      location: 'Brgy. Tibag, Tarlac City',
      assignedOrganizationId: 'dept-cba',
      status: 'planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'event-2',
      name: 'Basic Computer Literacy Training',
      description: 'Teaching high school students basic HTML and MS Office tools.',
      scheduleDate: new Date(2026, 6, 10, 13, 0).toISOString(),
      location: 'DCT CCS Computer Lab 2',
      assignedOrganizationId: 'dept-cs',
      status: 'planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'event-3',
      name: 'CES Annual Blood Donation Drive',
      description: 'Blood letting activity in coordination with Red Cross Tarlac.',
      scheduleDate: new Date(2026, 7, 5, 8, 0).toISOString(),
      location: 'DCT Gymnasium',
      assignedOrganizationId: 'dept-coed',
      status: 'planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  REPORTS: [
    {
      id: 'report-1',
      eventId: 'event-3',
      authorId: 'user-admin',
      organizationId: 'dept-coed',
      type: 'blood_donation',
      semester: '1st Semester',
      academicYear: '2025-2026',
      narrative:
        '<h1>DCT Annual Blood Letting Activity Report</h1><p>The annual blood drive was successfully held on August 5, 2025, yielding 45 units of blood. Participants included faculty, staff, and students.</p>',
      photos: [],
      status: 'approved',
      adminFeedback: null,
      history: [
        {
          status: 'draft',
          changedBy: 'user-admin',
          timestamp: new Date(2025, 7, 5).toISOString(),
          notes: 'Report started.'
        },
        {
          status: 'approved',
          changedBy: 'user-admin',
          timestamp: new Date(2025, 7, 10).toISOString(),
          notes: 'Approved by Head of CES.'
        }
      ],
      createdAt: new Date(2025, 7, 5).toISOString(),
      updatedAt: new Date(2025, 7, 10).toISOString()
    },
    {
      id: 'report-2',
      eventId: 'event-2',
      authorId: 'user-cs',
      organizationId: 'dept-cs',
      type: 'department_program',
      semester: '1st Semester',
      academicYear: '2026-2027',
      narrative:
        '<h2>Computer Training for Brgy. San Sebastian Youth</h2><p>Our initial training draft has been compiled. We covered basic Windows interface navigation.</p>',
      photos: [],
      status: 'returned',
      adminFeedback:
        'Please add photos showing the students at their desks and expand the description of the training syllabus.',
      history: [
        {
          status: 'draft',
          changedBy: 'user-cs',
          timestamp: new Date(2026, 6, 12).toISOString(),
          notes: 'First draft.'
        },
        {
          status: 'submitted',
          changedBy: 'user-cs',
          timestamp: new Date(2026, 6, 13).toISOString(),
          notes: 'Submitted for review.'
        },
        {
          status: 'returned',
          changedBy: 'user-admin',
          timestamp: new Date(2026, 6, 14).toISOString(),
          notes: 'Returned for adding images.'
        }
      ],
      createdAt: new Date(2026, 6, 12).toISOString(),
      updatedAt: new Date(2026, 6, 14).toISOString()
    }
  ],
  RESET_REQUESTS: []
}

// Initialize Local Storage helper
const initLocalStorage = () => {
  const storedUsers = localStorage.getItem(LOCAL_STORAGE_KEYS.USERS)
  if (storedUsers) {
    try {
      const parsed = JSON.parse(storedUsers)
      const adminUser = parsed.find((u) => u.role === 'admin')
      const coordUser = parsed.find((u) => u.role === 'office_coordinator')
      let updated = false
      if (adminUser && adminUser.email !== 'admin@gmail.com') {
        adminUser.email = 'admin@gmail.com'
        updated = true
      }
      if (coordUser && coordUser.email !== 'coordinator@gmail.com') {
        coordUser.email = 'coordinator@gmail.com'
        updated = true
      }
      if (updated) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(parsed))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const storedOrgs = localStorage.getItem(LOCAL_STORAGE_KEYS.ORGANIZATIONS)
  if (storedOrgs) {
    try {
      const parsedOrgs = JSON.parse(storedOrgs)
      let orgsUpdated = false
      parsedOrgs.forEach((o) => {
        if (!o.type) {
          o.type = o.id && o.id.startsWith('org-') ? 'organization' : 'department'
          orgsUpdated = true
        }
      })
      if (orgsUpdated) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.ORGANIZATIONS, JSON.stringify(parsedOrgs))
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.USERS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(SEED_DATA.USERS))
    localStorage.setItem(LOCAL_STORAGE_KEYS.ORGANIZATIONS, JSON.stringify(SEED_DATA.ORGANIZATIONS))
    localStorage.setItem(LOCAL_STORAGE_KEYS.INVENTORY, JSON.stringify(SEED_DATA.INVENTORY))
    localStorage.setItem(LOCAL_STORAGE_KEYS.DONORS, JSON.stringify(SEED_DATA.DONORS))
    localStorage.setItem(LOCAL_STORAGE_KEYS.DONATIONS, JSON.stringify(SEED_DATA.DONATIONS))
    localStorage.setItem(LOCAL_STORAGE_KEYS.EVENTS, JSON.stringify(SEED_DATA.EVENTS))
    localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify(SEED_DATA.REPORTS))
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.RESET_REQUESTS,
      JSON.stringify(SEED_DATA.RESET_REQUESTS)
    )
  }
}

if (isDemoMode) {
  initLocalStorage()
}

/**
 * Automatically purges transient/legacy large caches from localStorage
 * (such as legacy multi-megabyte base64 PDF and DOCX blobs) to keep storage well within 5MB quota.
 */
export const purgeTransientLocalStorage = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith('dommunity_gdoc_pdf_') ||
          key.startsWith('dommunity_gdoc_buffer_') ||
          key === 'dommunity_gdoc_dirty')
      ) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k)
      } catch {}
    })
  } catch (err) {
    console.warn('[db.js] Failed during localStorage transient purge:', err)
  }
}

// Run immediate startup purge to liberate storage space on app launch
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  purgeTransientLocalStorage()
  // Clean up any legacy oversized pending report in dommunity_reports
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.REPORTS)
    if (raw && (raw.includes('report-im3uyh93p') || raw.length > 2000000)) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        let changed = false
        const cleaned = parsed.map((r) => {
          if (r && r.narrative && r.narrative.length > 900000) {
            changed = true
            // Strip large images from local storage copy to fit quota
            return {
              ...r,
              narrative: r.narrative.replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]{1000,}/g, '[cached-image]')
            }
          }
          return r
        })
        if (changed) {
          localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify(cleaned))
        }
      }
    }
  } catch {}
}

const getLocalData = (key) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error(`Failed to parse localStorage key "${key}":`, e)
    return null
  }
}

/**
 * Prepares the reports list for safe local storage caching.
 * Prevents QuotaExceededError by stripping oversized inline base64 images
 * from already-synced reports in the global list cache.
 */
const prepareReportsForLocalStorage = (reports) => {
  if (!Array.isArray(reports)) return reports
  return reports.map((rep) => {
    if (!rep || typeof rep !== 'object') return rep
    const copy = { ...rep }
    // For already synced reports, strip giant inline base64 images from the local reports list cache
    if (copy.syncStatus !== 'local_pending' && typeof copy.narrative === 'string' && copy.narrative.includes('data:image/')) {
      copy.narrative = copy.narrative.replace(
        /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]{1000,}/g,
        '[cached-image]'
      )
    }
    // Limit large photos in local storage list cache
    if (Array.isArray(copy.photos) && copy.photos.length > 0 && copy.syncStatus !== 'local_pending') {
      copy.photos = copy.photos.map((p) => {
        if (typeof p === 'string' && p.startsWith('data:image/') && p.length > 30000) {
          return '[cached-photo]'
        }
        return p
      })
    }
    delete copy.pdfBase64
    delete copy.docxBase64
    return copy
  })
}

const saveLocalData = (key, data) => {
  try {
    let payload = data
    if (key === LOCAL_STORAGE_KEYS.REPORTS) {
      payload = prepareReportsForLocalStorage(data)
    }
    localStorage.setItem(key, JSON.stringify(payload))
  } catch (e) {
    // If quota exceeded, clean up transient caches and retry
    if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.number === -2147024882)) {
      console.warn(`[db.js] QuotaExceededError encountered for "${key}". Purging transient cache and retrying...`)
      purgeTransientLocalStorage()
      try {
        let payload = data
        if (key === LOCAL_STORAGE_KEYS.REPORTS) {
          payload = prepareReportsForLocalStorage(data)
        }
        localStorage.setItem(key, JSON.stringify(payload))
        return
      } catch (retryErr) {
        console.warn(`[db.js] Retry save failed for "${key}", compacting to minimal metadata:`, retryErr)
        if (key === LOCAL_STORAGE_KEYS.REPORTS && Array.isArray(data)) {
          try {
            const minimalReports = data.map((r) => ({
              id: r.id,
              activityTitle: r.activityTitle,
              activityDate: r.activityDate,
              status: r.status,
              type: r.type,
              semester: r.semester,
              academicYear: r.academicYear,
              authorId: r.authorId,
              authorName: r.authorName,
              organizationId: r.organizationId,
              eventId: r.eventId,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
              syncStatus: r.syncStatus
            }))
            localStorage.setItem(key, JSON.stringify(minimalReports))
            return
          } catch {}
        }
      }
    }
    console.warn(`[db.js] Handled non-fatal localStorage save error for "${key}":`, e)
  }
}

// ==========================================
// 2. EXPOSED API SERVICES
// ==========================================

// --- SESSION MANAGEMENT ---
let currentSessionId = null
let isLoggingIn = false

export const generateSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return 'sess_' + Date.now() + '_' + crypto.randomUUID()
  }
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11)
}

export const getLocalSessionId = () => {
  if (currentSessionId) return currentSessionId
  try {
    if (typeof sessionStorage !== 'undefined') {
      const sid = sessionStorage.getItem(LOCAL_STORAGE_KEYS.SESSION_ID)
      if (sid) {
        currentSessionId = sid
        return sid
      }
    }
  } catch {
    // Ignore storage access error
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const sid = localStorage.getItem(LOCAL_STORAGE_KEYS.SESSION_ID)
      if (sid) {
        currentSessionId = sid
        return sid
      }
    }
  } catch {
    // Ignore storage access error
  }
  return null
}

export const setLocalSessionId = (id) => {
  currentSessionId = id
  try {
    if (typeof sessionStorage !== 'undefined') {
      if (id) {
        sessionStorage.setItem(LOCAL_STORAGE_KEYS.SESSION_ID, id)
      } else {
        sessionStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION_ID)
      }
    }
  } catch {}
  try {
    if (typeof localStorage !== 'undefined') {
      if (id) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.SESSION_ID, id)
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION_ID)
      }
    }
  } catch {}
}

export const clearLocalSessionId = () => {
  setLocalSessionId(null)
}

// --- AUTH SERVICES ---

export const login = async (email, password) => {
  if (isDemoMode) {
    const users = getLocalData(LOCAL_STORAGE_KEYS.USERS)
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() ||
        (u.username && u.username.toLowerCase() === email.toLowerCase())
    )

    // Simulate passwords: we will check simple passwords matches
    // admin -> admin12345, office -> coordinator123/coordniator123, cba -> cbapassword, cs -> cspassword
    let valid = false
    if (user) {
      if (user.role === 'admin' && password === 'admin12345') valid = true
      else if (
        user.role === 'office_coordinator' &&
        (password === 'coordinator123' || password === 'coordniator123')
      )
        valid = true
      else if (user.organizationId === 'dept-cba' && password === 'cbapassword') valid = true
      else if (user.organizationId === 'dept-cs' && password === 'cspassword') valid = true
      else if (user.password && password === user.password) valid = true
      else if (password === 'password') valid = true // generic backup password
    }

    if (valid) {
      // Inactive check
      if (user.status === 'inactive') {
        throw new Error('This account is inactive. Please contact the CES Admin.')
      }
      const newSessionId = generateSessionId()
      setLocalSessionId(newSessionId)
      user.currentSessionId = newSessionId
      const updatedUsers = users.map((u) =>
        u.uid === user.uid ? { ...u, currentSessionId: newSessionId } : u
      )
      saveLocalData(LOCAL_STORAGE_KEYS.USERS, updatedUsers)
      saveLocalData(LOCAL_STORAGE_KEYS.LOGGED_IN_USER, user)
      window.dispatchEvent(new Event('dommunity_users_updated'))
      return user
    } else {
      throw new Error('Invalid email or password credentials.')
    }
  } else {
    isLoggingIn = true
    const newSessionId = generateSessionId()
    setLocalSessionId(newSessionId)

    let loginEmail = (email || '').trim().toLowerCase()
    if (!loginEmail.includes('@')) {
      try {
        const q = query(collection(fdb, 'users'), where('username', '==', loginEmail))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          loginEmail = querySnapshot.docs[0].data().email.toLowerCase()
        } else {
          const q2 = query(
            collection(fdb, 'users'),
            where('username', '==', loginEmail.toLowerCase())
          )
          const querySnapshot2 = await getDocs(q2)
          if (!querySnapshot2.empty) {
            loginEmail = querySnapshot2.docs[0].data().email.toLowerCase()
          }
        }
      } catch {
        // Ignore Firestore lookup error for unauthenticated client
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(fauth, loginEmail, password)

      // Immediately register active session token in Firestore
      const userDocRef = doc(fdb, 'users', userCredential.user.uid)
      await setDoc(
        userDocRef,
        {
          currentSessionId: newSessionId,
          lastLoginAt: Timestamp.now()
        },
        { merge: true }
      )

      let userData = null

      try {
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          userData = userDoc.data()
        }
      } catch (e) {
        console.warn('Direct user doc fetch by UID failed:', e)
      }

      if (!userData) {
        try {
          const q = query(
            collection(fdb, 'users'),
            where('email', '==', loginEmail.toLowerCase())
          )
          const qSnap = await getDocs(q)
          if (!qSnap.empty) {
            userData = qSnap.docs[0].data()
          }
        } catch (e) {
          console.warn('Fallback user query by email failed:', e)
        }
      }

      if (userData) {
        if (userData.status === 'inactive') {
          clearLocalSessionId()
          isLoggingIn = false
          await signOut(fauth)
          throw new Error('This account is inactive. Please contact the CES Admin.')
        }
        userData.currentSessionId = newSessionId
        isLoggingIn = false
        return userData
      }

      // Fail-safe: User successfully authenticated via Firebase Auth
      // Construct valid user session object if Firestore document fetch was restricted
      const fallbackUser = {
        uid: userCredential.user.uid,
        email: loginEmail,
        username: loginEmail.split('@')[0],
        name: loginEmail.split('@')[0],
        role: 'admin',
        status: 'active',
        currentSessionId: newSessionId
      }
      isLoggingIn = false
      return fallbackUser
    } catch (err) {
      isLoggingIn = false
      clearLocalSessionId()
      throw err
    }
  }
}

export const logout = async () => {
  clearLocalSessionId()
  if (isDemoMode) {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.LOGGED_IN_USER)
    return true
  } else {
    await signOut(fauth)
    return true
  }
}

export const getCurrentUser = () => {
  if (isDemoMode) {
    return getLocalData(LOCAL_STORAGE_KEYS.LOGGED_IN_USER) || null
  } else {
    // In real mode we track from listener, but can return current direct state
    return fauth.currentUser
  }
}

export const migrateLocalDataToFirebase = async () => {
  if (isDemoMode) return
  if (!fauth.currentUser) return

  try {
    const migrationDocRef = doc(fdb, 'system', 'migration')
    const migrationDoc = await getDoc(migrationDocRef)
    if (migrationDoc.exists() && migrationDoc.data().completed) {
      console.log('Firebase migration already completed previously.')
      return
    }

    console.log('Starting local data migration to Firebase...')

    // Load data from LocalStorage or SEED_DATA
    const localUsers = getLocalData(LOCAL_STORAGE_KEYS.USERS) || SEED_DATA.USERS || []
    const localOrgs =
      getLocalData(LOCAL_STORAGE_KEYS.ORGANIZATIONS) || SEED_DATA.ORGANIZATIONS || []
    const localInventory = getLocalData(LOCAL_STORAGE_KEYS.INVENTORY) || SEED_DATA.INVENTORY || []
    const localDonors = getLocalData(LOCAL_STORAGE_KEYS.DONORS) || SEED_DATA.DONORS || []
    const localDonations = getLocalData(LOCAL_STORAGE_KEYS.DONATIONS) || SEED_DATA.DONATIONS || []
    const localEvents = getLocalData(LOCAL_STORAGE_KEYS.EVENTS) || SEED_DATA.EVENTS || []
    const localReports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || SEED_DATA.REPORTS || []
    const localTransactions = getLocalData('dommunity_inventory_transactions') || []

    const uidMap = {}

    // Initialize a secondary Firebase App to create users without signing out current admin session
    const secondaryAppName = 'MigrationApp_' + Date.now()
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName)
    const secondaryAuth = getAuth(secondaryApp)

    console.log('Migrating users to Firebase Auth and Firestore...')
    for (const user of localUsers) {
      const pwd =
        user.email === 'admin@gmail.com'
          ? 'admin12345'
          : user.email === 'coordinator@gmail.com'
            ? 'coordinator123'
            : user.password || 'password123'

      let authUid = null
      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, user.email, pwd)
        authUid = cred.user.uid
        console.log(`Created Auth user for ${user.email}: ${authUid}`)
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            const cred = await signInWithEmailAndPassword(secondaryAuth, user.email, pwd)
            authUid = cred.user.uid
            console.log(`Auth user for ${user.email} already exists: ${authUid}`)
          } catch (signInErr) {
            console.error(`Sign in failed for existing user ${user.email}:`, signInErr.message)
          }
        } else {
          console.error(`Error creating Auth user for ${user.email}:`, authErr.message)
        }
      }

      // If we couldn't create/find auth user, fallback to using their old uid
      const finalUid = authUid || user.uid
      uidMap[user.uid] = finalUid

      // Save user doc to Firestore
      const userDocData = {
        uid: finalUid,
        username: user.username || user.email.split('@')[0],
        email: user.email,
        name: user.name || user.username || 'User',
        role: user.role || 'office_coordinator',
        organizationId: user.organizationId || null,
        status: user.status || 'active',
        createdAt: user.createdAt ? Timestamp.fromDate(new Date(user.createdAt)) : Timestamp.now(),
        updatedAt: user.updatedAt ? Timestamp.fromDate(new Date(user.updatedAt)) : Timestamp.now()
      }
      await setDoc(doc(fdb, 'users', finalUid), userDocData)
    }

    // Clean up secondary app
    await deleteApp(secondaryApp)

    const mapUid = (id) => uidMap[id] || id

    // 2. Migrate Organizations
    console.log('Migrating organizations...')
    for (const org of localOrgs) {
      const orgData = {
        id: org.id,
        name: org.name,
        abbreviation: org.abbreviation,
        description: org.description || '',
        coordinatorId: org.coordinatorId ? mapUid(org.coordinatorId) : null,
        type: org.type || 'department',
        logo: org.logo || null,
        createdAt: org.createdAt ? Timestamp.fromDate(new Date(org.createdAt)) : Timestamp.now()
      }
      await setDoc(doc(fdb, 'organizations', org.id), orgData)
    }

    // 3. Migrate Inventory
    console.log('Migrating inventory...')
    for (const inv of localInventory) {
      const invData = {
        name: inv.name,
        category: inv.category,
        unit: inv.unit,
        quantity: inv.quantity,
        expiryDate: inv.expiryDate ? Timestamp.fromDate(new Date(inv.expiryDate)) : null,
        receivedDate: inv.receivedDate
          ? Timestamp.fromDate(new Date(inv.receivedDate))
          : Timestamp.now(),
        status: inv.status || 'available',
        lastUpdatedBy: inv.lastUpdatedBy ? mapUid(inv.lastUpdatedBy) : null,
        createdAt: inv.createdAt ? Timestamp.fromDate(new Date(inv.createdAt)) : Timestamp.now(),
        updatedAt: inv.updatedAt ? Timestamp.fromDate(new Date(inv.updatedAt)) : Timestamp.now()
      }
      await setDoc(doc(fdb, 'inventory', inv.id), invData)
    }

    // 4. Migrate Donors
    console.log('Migrating donors...')
    for (const donor of localDonors) {
      const donorData = {
        id: donor.id,
        name: donor.name,
        type: donor.type,
        contactPerson: donor.contactPerson || '',
        email: donor.email || '',
        phone: donor.phone || '',
        address: donor.address || '',
        createdAt: donor.createdAt ? Timestamp.fromDate(new Date(donor.createdAt)) : Timestamp.now()
      }
      await setDoc(doc(fdb, 'donors', donor.id), donorData)
    }

    // 5. Migrate Donations
    console.log('Migrating donations...')
    for (const don of localDonations) {
      const donData = {
        id: don.id,
        donorId: don.donorId,
        donorName: don.donorName,
        dateOfDonation: don.dateOfDonation
          ? Timestamp.fromDate(new Date(don.dateOfDonation))
          : Timestamp.now(),
        notes: don.notes || '',
        items: (don.items || []).map((item) => ({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          expiryDate: item.expiryDate ? Timestamp.fromDate(new Date(item.expiryDate)) : null
        }))
      }
      await setDoc(doc(fdb, 'donations', don.id), donData)
    }

    // 6. Migrate Events
    console.log('Migrating events...')
    for (const ev of localEvents) {
      const evData = {
        id: ev.id,
        title: ev.title,
        description: ev.description || '',
        scheduleDate: ev.scheduleDate
          ? Timestamp.fromDate(new Date(ev.scheduleDate))
          : Timestamp.now(),
        status: ev.status || 'pending',
        organizationId: ev.organizationId || null,
        coordinatorId: ev.coordinatorId ? mapUid(ev.coordinatorId) : null,
        createdAt: ev.createdAt ? Timestamp.fromDate(new Date(ev.createdAt)) : Timestamp.now()
      }
      await setDoc(doc(fdb, 'events', ev.id), evData)
    }

    // 7. Migrate Reports
    console.log('Migrating narrative reports...')
    for (const rep of localReports) {
      const repData = {
        id: rep.id,
        eventId: rep.eventId,
        title: rep.title,
        academicYear: rep.academicYear,
        venue: rep.venue || '',
        attendance: rep.attendance || 0,
        narrative: rep.narrative || '',
        photos: rep.photos || [],
        status: rep.status || 'draft',
        adminFeedback: rep.adminFeedback || null,
        history: (rep.history || []).map((h) => ({
          status: h.status,
          changedBy: h.changedBy ? mapUid(h.changedBy) : null,
          timestamp: h.timestamp ? Timestamp.fromDate(new Date(h.timestamp)) : Timestamp.now(),
          notes: h.notes || ''
        })),
        createdAt: rep.createdAt ? Timestamp.fromDate(new Date(rep.createdAt)) : Timestamp.now(),
        updatedAt: rep.updatedAt ? Timestamp.fromDate(new Date(rep.updatedAt)) : Timestamp.now()
      }
      await setDoc(doc(fdb, 'narrative_reports', rep.id), repData)
    }

    // 8. Migrate Transactions
    console.log('Migrating inventory transactions...')
    for (const tx of localTransactions) {
      const txData = {
        itemId: tx.itemId,
        itemName: tx.itemName,
        type: tx.type,
        quantity: tx.quantity,
        date: tx.date ? Timestamp.fromDate(new Date(tx.date)) : Timestamp.now(),
        notes: tx.notes || ''
      }
      const txId = tx.id || 'tx-' + Math.random().toString(36).substr(2, 9)
      await setDoc(doc(fdb, 'inventory_transactions', txId), txData)
    }

    // Mark migration as completed in Firestore
    await setDoc(migrationDocRef, { completed: true, migratedAt: Timestamp.now() })
    console.log('Firebase migration completed successfully!')
  } catch (err) {
    if (err?.code === 'permission-denied') {
      // Ignore permission-denied gracefully (e.g. non-admin or restricted rules)
      return
    }
    console.error('Error during Firebase migration:', err)
  }
}

export const listenToAuthChanges = (callback) => {
  if (isDemoMode) {
    const checkAndCallback = () => {
      try {
        const loggedUser = getLocalData(LOCAL_STORAGE_KEYS.LOGGED_IN_USER)
        if (!loggedUser) {
          callback(null)
          return
        }
        const users = getLocalData(LOCAL_STORAGE_KEYS.USERS) || []
        const currentInDb = users.find((u) => u.uid === loggedUser.uid)
        if (!currentInDb || currentInDb.status === 'inactive') {
          clearLocalSessionId()
          localStorage.removeItem(LOCAL_STORAGE_KEYS.LOGGED_IN_USER)
          callback(null, { deactivated: true })
        } else {
          const localSessionId = getLocalSessionId()
          if (
            currentInDb.currentSessionId &&
            localSessionId &&
            currentInDb.currentSessionId !== localSessionId
          ) {
            clearLocalSessionId()
            localStorage.removeItem(LOCAL_STORAGE_KEYS.LOGGED_IN_USER)
            callback(null, { concurrentSession: true })
            return
          }
          callback(currentInDb)
        }
      } catch (e) {
        console.error('Auth change listener failed in Demo Mode:', e)
        callback(null)
      }
    }

    checkAndCallback()

    const handleUserUpdate = (e) => {
      if (!e || e.key === LOCAL_STORAGE_KEYS.LOGGED_IN_USER || e.key === LOCAL_STORAGE_KEYS.USERS) {
        checkAndCallback()
      }
    }

    window.addEventListener('storage', handleUserUpdate)
    window.addEventListener('dommunity_users_updated', handleUserUpdate)

    return () => {
      window.removeEventListener('storage', handleUserUpdate)
      window.removeEventListener('dommunity_users_updated', handleUserUpdate)
    }
  } else {
    try {
      let unsubscribeUserSnapshot = null

      const unsubscribeAuth = onAuthStateChanged(fauth, (firebaseUser) => {
        if (unsubscribeUserSnapshot) {
          unsubscribeUserSnapshot()
          unsubscribeUserSnapshot = null
        }

        if (firebaseUser) {
          // Attempt background data migration safely once authenticated
          migrateLocalDataToFirebase().catch(() => {})

          const userDocRef = doc(fdb, 'users', firebaseUser.uid)
          unsubscribeUserSnapshot = onSnapshot(
            userDocRef,
            async (snapshot) => {
              try {
                if (isLoggingIn) {
                  // Device actively logging in; wait for login routine to conclude session storage
                  return
                }

                if (snapshot.exists()) {
                  const userData = snapshot.data()
                  if (userData.status === 'inactive') {
                    if (unsubscribeUserSnapshot) {
                      unsubscribeUserSnapshot()
                      unsubscribeUserSnapshot = null
                    }
                    clearLocalSessionId()
                    await signOut(fauth)
                    callback(null, { deactivated: true })
                    return
                  }

                  const localSessionId = getLocalSessionId()

                  // Check if another device claimed the active session
                  if (
                    userData.currentSessionId &&
                    localSessionId &&
                    userData.currentSessionId !== localSessionId
                  ) {
                    if (unsubscribeUserSnapshot) {
                      unsubscribeUserSnapshot()
                      unsubscribeUserSnapshot = null
                    }
                    clearLocalSessionId()
                    await signOut(fauth)
                    callback(null, { concurrentSession: true })
                    return
                  }

                  // If user doc in Firestore has no session ID yet (e.g. legacy/seed user)
                  if (!userData.currentSessionId) {
                    const sid = localSessionId || generateSessionId()
                    setLocalSessionId(sid)
                    try {
                      await setDoc(userDocRef, { currentSessionId: sid }, { merge: true })
                      userData.currentSessionId = sid
                    } catch (e) {
                      console.warn('Could not initialize session ID on user doc:', e)
                    }
                  } else if (!localSessionId) {
                    // Document has an active session ID, but this device has none stored
                    if (unsubscribeUserSnapshot) {
                      unsubscribeUserSnapshot()
                      unsubscribeUserSnapshot = null
                    }
                    clearLocalSessionId()
                    await signOut(fauth)
                    callback(null, { concurrentSession: true })
                    return
                  }

                  callback(userData)
                } else {
                  if (unsubscribeUserSnapshot) {
                    unsubscribeUserSnapshot()
                    unsubscribeUserSnapshot = null
                  }
                  clearLocalSessionId()
                  await signOut(fauth)
                  callback(null, { deactivated: true })
                }
              } catch (err) {
                console.error('Firestore user snapshot handling error:', err)
                callback(null)
              }
            },
            (err) => {
              console.warn('Firestore user snapshot listener warning (possible network loss):', err)
              // Do NOT call callback(null) on network or listener errors to avoid accidental logout during offline state
            }
          )
        } else {
          clearLocalSessionId()
          callback(null)
        }
      })

      return () => {
        if (unsubscribeUserSnapshot) {
          unsubscribeUserSnapshot()
        }
        unsubscribeAuth()
      }
    } catch (e) {
      console.error('Auth listener registration failed:', e)
      callback(null)
      return () => {}
    }
  }
}

export const registerUser = async (
  email,
  username,
  password,
  name,
  role = 'office_coordinator',
  organizationId = null,
  mustChangePassword = null
) => {
  const normalizedRole = role === 'admin' ? 'admin' : 'office_coordinator'
  const assignedOrg = normalizedRole === 'admin' ? organizationId || null : organizationId || null
  const shouldRequirePasswordChange =
    mustChangePassword !== null
      ? Boolean(mustChangePassword)
      : normalizedRole === 'office_coordinator'

  if (isDemoMode) {
    const users = getLocalData(LOCAL_STORAGE_KEYS.USERS)

    const newUid = 'user-' + Math.random().toString(36).substr(2, 9)
    const newUser = {
      uid: newUid,
      username: username || email.split('@')[0] || '',
      email,
      password,
      name,
      role: normalizedRole,
      organizationId: assignedOrg,
      status: 'active',
      mustChangePassword: shouldRequirePasswordChange,
      photoURL: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    users.push(newUser)
    saveLocalData(LOCAL_STORAGE_KEYS.USERS, users)

    return newUser
  } else {
    // Real mode (Admin registers using Firebase Auth)
    // To prevent logging out the admin, we initialize a secondary Firebase app instance.
    const cleanEmail = (email || '').trim().toLowerCase()
    const secondaryAppName = 'SecondaryApp_' + Date.now()
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName)
    const secondaryAuth = getAuth(secondaryApp)
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password)
      const newUid = userCredential.user.uid

      const userDocRef = doc(fdb, 'users', newUid)
      const userData = {
        uid: newUid,
        username: username || cleanEmail.split('@')[0] || '',
        email: cleanEmail,
        password,
        name,
        role: normalizedRole,
        organizationId: assignedOrg,
        status: 'active',
        mustChangePassword: shouldRequirePasswordChange,
        photoURL: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await setDoc(userDocRef, userData)
      registerAccountRole(cleanEmail, normalizedRole)
      try {
        await setDoc(doc(fdb, 'public_user_roles', cleanEmail), {
          email: cleanEmail,
          role: normalizedRole
        })
      } catch {
        // Ignore fallback write error if rules restrict
      }

      return userData
    } finally {
      await deleteApp(secondaryApp)
    }
  }
}

export const updateCoordinatorStatus = async (uid, status) => {
  if (isDemoMode) {
    const users = getLocalData(LOCAL_STORAGE_KEYS.USERS)
    const userIdx = users.findIndex((u) => u.uid === uid)
    if (userIdx !== -1) {
      users[userIdx].status = status
      users[userIdx].updatedAt = new Date().toISOString()
      saveLocalData(LOCAL_STORAGE_KEYS.USERS, users)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dommunity_users_updated'))
      }
      return users[userIdx]
    }
    throw new Error('Coordinator account not found.')
  } else {
    await updateDoc(doc(fdb, 'users', uid), {
      status,
      updatedAt: new Date()
    })
  }
}

export const getUsers = async () => {
  if (isDemoMode) {
    return getLocalData(LOCAL_STORAGE_KEYS.USERS)
  } else {
    const qSnap = await getDocs(collection(fdb, 'users'))
    const users = qSnap.docs.map((d) => ({ ...d.data(), uid: d.id }))
    saveLocalData(LOCAL_STORAGE_KEYS.USERS, users)
    users.forEach((u) => {
      if (u.email && u.role) registerAccountRole(u.email, u.role)
    })
    return users
  }
}

export const subscribeUsers = (callback) => {
  if (isDemoMode) {
    const fetchAndCallback = () => callback(getLocalData(LOCAL_STORAGE_KEYS.USERS) || [])
    fetchAndCallback()
    const handleStorage = (e) => {
      if (!e || e.key === LOCAL_STORAGE_KEYS.USERS) fetchAndCallback()
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('dommunity_users_updated', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('dommunity_users_updated', handleStorage)
    }
  } else {
    const q = collection(fdb, 'users')
    return onSnapshot(
      q,
      (snapshot) => {
        const users = snapshot.docs.map((d) => ({ ...d.data(), uid: d.id }))
        saveLocalData(LOCAL_STORAGE_KEYS.USERS, users)
        users.forEach(async (u) => {
          if (u.email && u.role) {
            registerAccountRole(u.email, u.role)
            try {
              await setDoc(doc(fdb, 'public_user_roles', u.email.trim().toLowerCase()), {
                email: u.email.trim().toLowerCase(),
                role: u.role
              })
            } catch {
              // Ignore public role index write errors
            }
          }
        })
        callback(users)
      },
      (err) => {
        console.warn('Users snapshot listener restricted, falling back to local cache:', err?.message || err)
        callback(getLocalData(LOCAL_STORAGE_KEYS.USERS) || [])
      }
    )
  }
}

export const updateUser = async (uid, updatedData) => {
  if (isDemoMode) {
    const users = getLocalData(LOCAL_STORAGE_KEYS.USERS)
    const userIdx = users.findIndex((u) => u.uid === uid)
    if (userIdx !== -1) {
      const updatedUser = { ...users[userIdx], ...updatedData, updatedAt: new Date().toISOString() }

      users[userIdx] = updatedUser
      saveLocalData(LOCAL_STORAGE_KEYS.USERS, users)
      return updatedUser
    }
    throw new Error('User account not found.')
  } else {
    await updateDoc(doc(fdb, 'users', uid), {
      ...updatedData,
      updatedAt: Timestamp.now()
    })
  }
}

export const deleteUser = async (uid, email = null, password = null) => {
  if (isDemoMode) {
    let users = getLocalData(LOCAL_STORAGE_KEYS.USERS)
    users = users.filter((u) => u.uid !== uid)
    saveLocalData(LOCAL_STORAGE_KEYS.USERS, users)
    return true
  } else {
    // 1. Fetch user doc from Firestore to ensure email and password exist if not provided
    let targetEmail = email
    let targetPassword = password

    try {
      const userSnap = await getDoc(doc(fdb, 'users', uid))
      if (userSnap.exists()) {
        const uData = userSnap.data()
        if (!targetEmail) targetEmail = uData.email
        if (!targetPassword) targetPassword = uData.password
      }
    } catch (e) {
      console.warn('Unable to fetch user doc prior to deletion:', e.message)
    }

    // 2. Delete from Firebase Authentication via secondary app auth
    if (targetEmail) {
      const passwordsToTry = []
      if (targetPassword) passwordsToTry.push(targetPassword)
      passwordsToTry.push(
        'Dommunity@123',
        'coordinator123',
        'admin12345',
        'password123',
        'Dommunity123'
      )

      const secondaryAppName = 'DeleteApp_' + Date.now()
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName)
      const secondaryAuth = getAuth(secondaryApp)

      let deletedAuth = false
      for (const pwd of passwordsToTry) {
        try {
          const userCred = await signInWithEmailAndPassword(secondaryAuth, targetEmail, pwd)
          await deleteFirebaseUser(userCred.user)
          deletedAuth = true
          console.log(`Successfully deleted Firebase Auth user for ${targetEmail}`)
          break
        } catch {
          // Continue attempting remaining fallback passwords
        }
      }

      if (!deletedAuth) {
        console.warn(
          `Could not sign in to delete Firebase Auth account for ${targetEmail}. Proceeding with database deletion.`
        )
      }

      await deleteApp(secondaryApp)
    }

    // 3. Delete document from Firestore database
    await deleteDoc(doc(fdb, 'users', uid))
    return true
  }
}

export const registerAccountRole = (email, role) => {
  if (!email || !role) return
  const normalizedEmail = email.trim().toLowerCase()
  const registry = getLocalData('dommunity_user_roles_registry') || {}
  registry[normalizedEmail] = role.toLowerCase()
  saveLocalData('dommunity_user_roles_registry', registry)
}

export const getAccountRole = async (email) => {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail) return null

  // 1. Seed initial default accounts if registry is empty
  let registry = getLocalData('dommunity_user_roles_registry') || {}
  if (Object.keys(registry).length === 0 && SEED_DATA.USERS) {
    SEED_DATA.USERS.forEach((u) => {
      if (u.email && u.role) {
        registry[u.email.trim().toLowerCase()] = u.role.toLowerCase()
      }
    })
    saveLocalData('dommunity_user_roles_registry', registry)
  }

  // 2. Check persistent role registry in localStorage
  if (registry[normalizedEmail]) {
    return registry[normalizedEmail]
  }

  // 3. Check local users storage
  const localUsers = getLocalData(LOCAL_STORAGE_KEYS.USERS) || []
  const foundLocal = localUsers.find(
    (u) => (u.email || '').trim().toLowerCase() === normalizedEmail
  )
  if (foundLocal && foundLocal.role) {
    registerAccountRole(foundLocal.email, foundLocal.role)
    return foundLocal.role.toLowerCase()
  }

  // 4. Check seed users
  const seedUsers = SEED_DATA.USERS || []
  const foundSeed = seedUsers.find(
    (u) => (u.email || '').trim().toLowerCase() === normalizedEmail
  )
  if (foundSeed && foundSeed.role) {
    registerAccountRole(foundSeed.email, foundSeed.role)
    return foundSeed.role.toLowerCase()
  }

  // 5. In Cloud Mode, attempt Firestore reads if accessible
  if (!isDemoMode) {
    try {
      const publicRoleSnap = await getDoc(doc(fdb, 'public_user_roles', normalizedEmail))
      if (publicRoleSnap.exists() && publicRoleSnap.data().role) {
        const role = publicRoleSnap.data().role.toLowerCase()
        registerAccountRole(normalizedEmail, role)
        return role
      }
    } catch {
      // Ignore read error if restricted
    }

    try {
      const q = query(collection(fdb, 'users'), where('email', '==', email.trim()))
      const qSnap = await getDocs(q)
      if (!qSnap.empty && qSnap.docs[0].data().role) {
        const role = qSnap.docs[0].data().role.toLowerCase()
        registerAccountRole(normalizedEmail, role)
        return role
      }
    } catch {
      // Ignore read error if restricted
    }
  }

  return null
}

// Coordinator password reset requests
export const requestPasswordReset = async (email) => {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail) {
    throw new Error('Please enter a valid email address.')
  }

  // 1. Check if account is a verified Admin account
  const matchedRole = await getAccountRole(email)
  const isAdmin = matchedRole === 'admin'

  // 2. If it is a confirmed Admin account, send Firebase reset email
  if (isAdmin) {
    if (isDemoMode) {
      return true
    } else {
      try {
        await sendPasswordResetEmail(fauth, email.trim())
        return true
      } catch (err) {
        const msg = (err.message || '').toLowerCase()
        const code = (err.code || '').toLowerCase()
        if (
          code.includes('user-not-found') ||
          code.includes('invalid-email') ||
          msg.includes('user-not-found') ||
          msg.includes('user_not_found')
        ) {
          throw new Error('No account was found with this email address.')
        }
        throw err
      }
    }
  }

  // 3. For non-Admin accounts: evaluate if account exists in system / Firebase Auth
  if (isDemoMode) {
    const localUsers = getLocalData(LOCAL_STORAGE_KEYS.USERS) || []
    const seedUsers = SEED_DATA.USERS || []
    const combined = [...localUsers, ...seedUsers]
    const found = combined.find(
      (u) => (u.email || '').trim().toLowerCase() === normalizedEmail
    )
    if (found) {
      throw new Error('Please contact the Admin to reset your password.')
    } else {
      throw new Error('No account was found with this email address.')
    }
  } else {
    try {
      const methods = await fetchSignInMethodsForEmail(fauth, email.trim())
      if (methods && methods.length > 0) {
        // Account exists in Firebase Auth as a Coordinator (non-admin)
        registerAccountRole(normalizedEmail, 'office_coordinator')
        throw new Error('Please contact the Admin to reset your password.')
      } else {
        // Account does not exist in Firebase Auth
        throw new Error('No account was found with this email address.')
      }
    } catch (err) {
      if (err.message === 'Please contact the Admin to reset your password.') {
        throw err
      }
      const msg = (err.message || '').toLowerCase()
      const code = (err.code || '').toLowerCase()
      if (
        code.includes('user-not-found') ||
        code.includes('invalid-email') ||
        msg.includes('user-not-found') ||
        msg.includes('user_not_found')
      ) {
        throw new Error('No account was found with this email address.')
      }
      // If fetchSignInMethodsForEmail is restricted by Firebase Email Enumeration Protection settings:
      // Show Coordinator restriction to keep password reset authority with Admin.
      throw new Error('Please contact the Admin to reset your password.')
    }
  }
}

export const sendCoordinatorResetEmail = async (email) => {
  if (isDemoMode) {
    const users = getLocalData(LOCAL_STORAGE_KEYS.USERS)
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user) throw new Error('Email address not found in system directory.')
    return true
  } else {
    try {
      const usersRef = collection(fdb, 'users')
      const q = query(usersRef, where('email', '==', email))
      await getDocs(q)
    } catch {
      // Ignore Firestore read permission errors if logged-in user context varies
    }

    await sendPasswordResetEmail(fauth, email)
    return true
  }
}

export const verifyResetCode = async (oobCode) => {
  if (isDemoMode) {
    return 'user@example.com'
  }
  return await verifyPasswordResetCode(fauth, oobCode)
}

export const resetPasswordWithCode = async (oobCode, newPassword) => {
  if (!newPassword) {
    throw new Error('Password is required.')
  }
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }
  if (
    !/[A-Z]/.test(newPassword) ||
    !/[a-z]/.test(newPassword) ||
    !/\d/.test(newPassword) ||
    !/[^A-Za-z0-9]/.test(newPassword)
  ) {
    throw new Error('Password must combine letters (uppercase and lowercase), numbers, and special characters.')
  }
  if (isDemoMode) {
    return true
  }
  let resetEmail = null
  try {
    resetEmail = await verifyPasswordResetCode(fauth, oobCode)
  } catch {
    // If verify code failed, confirmPasswordReset will throw proper error
  }
  const result = await confirmPasswordReset(fauth, oobCode, newPassword)
  if (resetEmail) {
    try {
      const q = query(
        collection(fdb, 'users'),
        where('email', '==', resetEmail.trim().toLowerCase())
      )
      const snap = await getDocs(q)
      snap.forEach(async (d) => {
        await setDoc(
          d.ref,
          {
            password: newPassword,
            mustChangePassword: false,
            updatedAt: Timestamp.now()
          },
          { merge: true }
        )
      })
    } catch (e) {
      console.warn('Could not reset mustChangePassword in Firestore for reset user:', e)
    }
  }
  return result
}

export const changeFirstLoginPassword = async (currentPassword, newPassword) => {
  if (!currentPassword) {
    throw new Error('Current or temporary password is required.')
  }
  if (!newPassword) {
    throw new Error('New password is required.')
  }
  if (newPassword.length < 8) {
    throw new Error('The new password must contain at least 8 characters.')
  }
  if (currentPassword === newPassword) {
    throw new Error('New password cannot be the same as the temporary password.')
  }

  if (isDemoMode) {
    const currentUser = getLocalData(LOCAL_STORAGE_KEYS.LOGGED_IN_USER)
    if (!currentUser) throw new Error('No user is currently logged in.')
    if (currentUser.password && currentUser.password !== currentPassword) {
      throw new Error('Current/Temporary password is incorrect.')
    }
    const users = getLocalData(LOCAL_STORAGE_KEYS.USERS) || []
    const idx = users.findIndex((u) => u.uid === currentUser.uid)
    if (idx !== -1) {
      users[idx].password = newPassword
      users[idx].mustChangePassword = false
      users[idx].updatedAt = new Date().toISOString()
      saveLocalData(LOCAL_STORAGE_KEYS.USERS, users)
    }
    const updatedUser = {
      ...currentUser,
      password: newPassword,
      mustChangePassword: false,
      updatedAt: new Date().toISOString()
    }
    setLocalData(LOCAL_STORAGE_KEYS.LOGGED_IN_USER, updatedUser)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dommunity_users_updated'))
    }
    return updatedUser
  } else {
    const user = fauth.currentUser
    if (!user || !user.email) {
      throw new Error('No active authenticated session found. Please log in again.')
    }

    // 1. Re-authenticate with current/temporary password to verify credentials
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
    } catch (authErr) {
      const msg = (authErr.message || '').toLowerCase()
      const code = (authErr.code || '').toLowerCase()
      if (
        code.includes('wrong-password') ||
        code.includes('invalid-credential') ||
        code.includes('invalid-password') ||
        msg.includes('wrong-password') ||
        msg.includes('invalid-credential') ||
        msg.includes('invalid-password')
      ) {
        throw new Error('Current/Temporary password is incorrect.')
      }
      throw authErr
    }

    // 2. Update Firebase Authentication password
    await updatePassword(user, newPassword)

    // 3. Update Firestore user profile
    const userDocRef = doc(fdb, 'users', user.uid)
    await setDoc(
      userDocRef,
      {
        password: newPassword,
        mustChangePassword: false,
        updatedAt: Timestamp.now()
      },
      { merge: true }
    )

    // 4. Return updated user object
    let updatedData = { uid: user.uid, email: user.email, mustChangePassword: false }
    try {
      const userSnap = await getDoc(userDocRef)
      if (userSnap.exists()) {
        updatedData = { ...userSnap.data(), mustChangePassword: false }
      }
    } catch (e) {
      console.warn('Could not re-fetch user document after password update:', e)
    }

    return updatedData
  }
}

export const getResetRequests = async () => {
  if (isDemoMode) {
    return getLocalData(LOCAL_STORAGE_KEYS.RESET_REQUESTS) || []
  } else {
    // Simulated database call or dummy
    return []
  }
}

export const handleResetRequest = async (reqId, action) => {
  if (isDemoMode) {
    const requests = getLocalData(LOCAL_STORAGE_KEYS.RESET_REQUESTS) || []
    const reqIdx = requests.findIndex((r) => r.id === reqId)
    if (reqIdx !== -1) {
      requests[reqIdx].status = action === 'approve' ? 'reset_completed' : 'dismissed'
      saveLocalData(LOCAL_STORAGE_KEYS.RESET_REQUESTS, requests)

      // If approved, update user password mock
      // (In mock mode, the user logs in using password matches, but we will make it simpler)
      return true
    }
    return false
  } else {
    return false
  }
}

// --- ORGANIZATION SERVICES ---

export const getOrganizations = async () => {
  if (isDemoMode) {
    return getLocalData(LOCAL_STORAGE_KEYS.ORGANIZATIONS)
  } else {
    const qSnap = await getDocs(collection(fdb, 'organizations'))
    return qSnap.docs.map((d) => ({ ...d.data(), id: d.id }))
  }
}

export const subscribeOrganizations = (callback) => {
  if (isDemoMode) {
    const fetchAndCallback = () => callback(getLocalData(LOCAL_STORAGE_KEYS.ORGANIZATIONS) || [])
    fetchAndCallback()
    const handleStorage = (e) => {
      if (!e || e.key === LOCAL_STORAGE_KEYS.ORGANIZATIONS) fetchAndCallback()
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('dommunity_orgs_updated', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('dommunity_orgs_updated', handleStorage)
    }
  } else {
    const q = collection(fdb, 'organizations')
    return onSnapshot(
      q,
      (snapshot) => {
        const orgs = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }))
        callback(orgs)
      },
      (err) => {
        console.warn('Organizations snapshot listener restricted, falling back to local cache:', err?.message || err)
        callback(getLocalData(LOCAL_STORAGE_KEYS.ORGANIZATIONS) || [])
      }
    )
  }
}

export const addOrganization = async (org) => {
  const resolvedType = org.type || (org.id && org.id.startsWith('org-') ? 'organization' : 'department')
  if (isDemoMode) {
    const orgs = getLocalData(LOCAL_STORAGE_KEYS.ORGANIZATIONS) || []
    const newOrg = {
      ...org,
      type: resolvedType,
      coordinatorId: org.coordinatorId || null,
      logo: org.logo || null,
      createdAt: new Date().toISOString()
    }
    orgs.push(newOrg)
    saveLocalData(LOCAL_STORAGE_KEYS.ORGANIZATIONS, orgs)
    return newOrg
  } else {
    await setDoc(doc(fdb, 'organizations', org.id), {
      ...org,
      type: resolvedType,
      coordinatorId: org.coordinatorId || null,
      logo: org.logo || null,
      createdAt: new Date()
    })
    return { ...org, type: resolvedType }
  }
}

// --- INVENTORY SERVICES (FIFO & Expiration prioritized release algorithm) ---

export const getInventory = async () => {
  if (isDemoMode) {
    const inventory = getLocalData(LOCAL_STORAGE_KEYS.INVENTORY) || []
    return sortInventory(inventory)
  } else {
    const qSnap = await getDocs(collection(fdb, 'inventory'))
    const items = qSnap.docs.map((d) => {
      const data = d.data()
      return {
        ...data,
        id: d.id,
        expiryDate: data.expiryDate?.toDate
          ? data.expiryDate.toDate().toISOString()
          : data.expiryDate || null,
        receivedDate: data.receivedDate?.toDate
          ? data.receivedDate.toDate().toISOString()
          : data.receivedDate || new Date().toISOString(),
        batches: Array.isArray(data.batches)
          ? data.batches.map((b) => ({
              ...b,
              quantity: Number(b.quantity) || 0,
              expiryDate: b.expiryDate?.toDate
                ? b.expiryDate.toDate().toISOString()
                : b.expiryDate || null,
              receivedDate: b.receivedDate?.toDate
                ? b.receivedDate.toDate().toISOString()
                : b.receivedDate || null
            }))
          : data.quantity > 0
            ? [
                {
                  id: `batch-${d.id}-init`,
                  quantity: Number(data.quantity) || 0,
                  expiryDate: data.expiryDate?.toDate
                    ? data.expiryDate.toDate().toISOString()
                    : data.expiryDate || null,
                  receivedDate: data.receivedDate?.toDate
                    ? data.receivedDate.toDate().toISOString()
                    : data.receivedDate || null
                }
              ]
            : []
      }
    })
    return sortInventory(items)
  }
}

export const subscribeInventory = (callback) => {
  if (isDemoMode) {
    const fetchAndCallback = () => {
      const items = getLocalData(LOCAL_STORAGE_KEYS.INVENTORY) || []
      callback(sortInventory(items))
    }
    fetchAndCallback()
    const handleStorage = (e) => {
      if (!e || e.key === LOCAL_STORAGE_KEYS.INVENTORY) fetchAndCallback()
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('dommunity_inventory_updated', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('dommunity_inventory_updated', handleStorage)
    }
  } else {
    const q = collection(fdb, 'inventory')
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data()
          return {
            ...data,
            id: d.id,
            expiryDate: data.expiryDate?.toDate
              ? data.expiryDate.toDate().toISOString()
              : data.expiryDate || null,
            receivedDate: data.receivedDate?.toDate
              ? data.receivedDate.toDate().toISOString()
              : data.receivedDate,
            batches: Array.isArray(data.batches)
              ? data.batches.map((b) => ({
                  ...b,
                  quantity: Number(b.quantity) || 0,
                  expiryDate: b.expiryDate?.toDate
                    ? b.expiryDate.toDate().toISOString()
                    : b.expiryDate || null,
                  receivedDate: b.receivedDate?.toDate
                    ? b.receivedDate.toDate().toISOString()
                    : b.receivedDate || null
                }))
              : data.quantity > 0
                ? [
                    {
                      id: `batch-${d.id}-init`,
                      quantity: Number(data.quantity) || 0,
                      expiryDate: data.expiryDate?.toDate
                        ? data.expiryDate.toDate().toISOString()
                        : data.expiryDate || null,
                      receivedDate: data.receivedDate?.toDate
                        ? data.receivedDate.toDate().toISOString()
                        : data.receivedDate || null
                    }
                  ]
                : []
          }
        })
        callback(sortInventory(items))
      },
      (err) => {
        console.warn('Inventory snapshot listener restricted, falling back to local cache:', err?.message || err)
        callback(sortInventory(getLocalData(LOCAL_STORAGE_KEYS.INVENTORY) || []))
      }
    )
  }
}

// Helper: Determine earliest active expiration date among batches
export const getEarliestBatchExpiry = (batches) => {
  if (!Array.isArray(batches) || batches.length === 0) return null
  const activeWithExpiry = batches.filter((b) => (Number(b.quantity) || 0) > 0 && b.expiryDate)
  if (activeWithExpiry.length === 0) return null
  activeWithExpiry.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
  return activeWithExpiry[0].expiryDate
}

// Helper: Determine inventory status including expired detection
export const computeInventoryStatus = (quantity, expiryDate) => {
  if (quantity === 0) return 'out of stock'
  if (expiryDate && new Date(expiryDate) < new Date()) return 'expired'
  if (quantity <= 10) return 'low stock'
  return 'available'
}

// Algorithmic sorting:
// 1. Prioritize consumables with expiryDates. Sort by nearest expiry first.
// 2. For non-consumables (no expiryDate), sort by FIFO (oldest receivedDate first).
// 3. Exclude Out of Stock (quantity = 0) and Expired items to separate sections.
export const sortInventory = (items) => {
  // Recompute status and effective earliest expiryDate for all items (catches multi-batch & newly expired items)
  const updatedItems = items.map((item) => {
    let effectiveExpiry = item.expiryDate || null
    if (Array.isArray(item.batches) && item.batches.length > 0) {
      const activeBatches = item.batches.filter((b) => b.quantity > 0 && b.expiryDate)
      if (activeBatches.length > 0) {
        activeBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
        effectiveExpiry = activeBatches[0].expiryDate
      }
    }
    return {
      ...item,
      expiryDate: effectiveExpiry,
      status: computeInventoryStatus(item.quantity, effectiveExpiry)
    }
  })

  const active = updatedItems.filter((i) => i.quantity > 0 && i.status !== 'expired')
  const expired = updatedItems.filter((i) => i.status === 'expired')
  const outOfStock = updatedItems.filter((i) => i.quantity === 0)

  const sortFunc = (a, b) => {
    // If both have expiry date, sort by earliest expiry date first
    if (a.expiryDate && b.expiryDate) {
      return new Date(a.expiryDate) - new Date(b.expiryDate)
    }
    // If only one has expiry date, that one is prioritized (consumable first)
    if (a.expiryDate) return -1
    if (b.expiryDate) return 1

    // Both are non-consumable, sort by FIFO (receivedDate oldest first)
    return new Date(a.receivedDate) - new Date(b.receivedDate)
  }

  active.sort(sortFunc)

  const today = new Date()
  const maxRecommendedDate = new Date()
  maxRecommendedDate.setMonth(today.getMonth() + 5)

  const finalItems = [...active, ...expired, ...outOfStock].map((item) => {
    let recommended = false
    if (item.expiryDate && item.quantity > 0 && item.status !== 'expired') {
      const expDate = new Date(item.expiryDate)
      if (expDate >= today && expDate <= maxRecommendedDate) {
        recommended = true
      }
    }
    return {
      ...item,
      isRecommendedForRelease: recommended
    }
  })

  return finalItems
}

// Group inventory items by unique name + category, aggregating stock batches
export const groupInventoryItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) return []

  const groups = new Map()

  for (const item of items) {
    const normName = (item.name || '').trim().toLowerCase()
    const normCategory = (item.category || '').trim().toLowerCase()
    const key = `${normName}:::${normCategory}`

    // Extract individual batches
    let docBatches = []
    if (Array.isArray(item.batches) && item.batches.length > 0) {
      docBatches = item.batches.map((b, idx) => ({
        id: b.id || `batch-${item.id}-${idx}`,
        parentDocId: item.id,
        batchIndex: idx,
        name: item.name,
        category: item.category,
        quantity: Number(b.quantity) || 0,
        expiryDate: b.expiryDate || null,
        receivedDate: b.receivedDate || item.receivedDate || item.createdAt || null,
        unit: b.unit || item.unit || 'pieces',
        groupUnit: b.groupUnit || item.groupUnit || 'none',
        piecesPerUnit: b.piecesPerUnit || item.piecesPerUnit || null
      }))
    } else {
      docBatches = [
        {
          id: `batch-${item.id}-root`,
          parentDocId: item.id,
          batchIndex: -1,
          name: item.name,
          category: item.category,
          quantity: Number(item.quantity) || 0,
          expiryDate: item.expiryDate || null,
          receivedDate: item.receivedDate || item.createdAt || null,
          unit: item.unit || 'pieces',
          groupUnit: item.groupUnit || 'none',
          piecesPerUnit: item.piecesPerUnit || null
        }
      ]
    }

    if (!groups.has(key)) {
      groups.set(key, {
        id: item.id,
        primaryDocId: item.id,
        allDocIds: [item.id],
        key,
        name: item.name,
        category: item.category,
        unit: item.unit || 'pieces',
        groupUnit: item.groupUnit || 'none',
        piecesPerUnit: item.piecesPerUnit || null,
        description: item.description || '',
        receivedDate: item.receivedDate || item.createdAt || null,
        batches: [...docBatches],
        rawDocs: [item]
      })
    } else {
      const g = groups.get(key)
      if (!g.allDocIds.includes(item.id)) {
        g.allDocIds.push(item.id)
        g.rawDocs.push(item)
      }
      g.batches.push(...docBatches)
      if (!g.description && item.description) {
        g.description = item.description
      }
    }
  }

  const groupedList = []
  const now = new Date()

  for (const g of groups.values()) {
    // Sort batches by FEFO:
    // 1. Earliest expiryDate first
    // 2. Non-consumable by oldest receivedDate first
    g.batches.sort((a, b) => {
      if (a.expiryDate && b.expiryDate) {
        return new Date(a.expiryDate) - new Date(b.expiryDate)
      }
      if (a.expiryDate) return -1
      if (b.expiryDate) return 1
      return new Date(a.receivedDate || 0) - new Date(b.receivedDate || 0)
    })

    const totalQty = g.batches.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0)
    g.quantity = totalQty

    // Determine earliest active expiry among batches with quantity > 0
    const activeWithExpiry = g.batches.filter((b) => (Number(b.quantity) || 0) > 0 && b.expiryDate)
    let earliestExpiry = null
    if (activeWithExpiry.length > 0) {
      const sortedActiveExp = [...activeWithExpiry].sort(
        (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
      )
      earliestExpiry = sortedActiveExp[0].expiryDate
    } else {
      const anyWithExpiry = g.batches.filter((b) => b.expiryDate)
      if (anyWithExpiry.length > 0) {
        earliestExpiry = anyWithExpiry[0].expiryDate
      }
    }
    g.expiryDate = earliestExpiry

    // Status:
    // 1. Total qty === 0 -> out of stock
    // 2. All batches with quantity > 0 are expired -> expired
    // 3. Otherwise usable quantity <= 10 -> low stock
    // 4. Else -> available
    const activeUsable = g.batches.filter((b) => {
      const q = Number(b.quantity) || 0
      if (q <= 0) return false
      if (b.expiryDate && new Date(b.expiryDate) < now) return false
      return true
    })
    const usableQty = activeUsable.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0)

    if (totalQty === 0) {
      g.status = 'out of stock'
    } else if (
      usableQty === 0 &&
      g.batches.some(
        (b) => (Number(b.quantity) || 0) > 0 && b.expiryDate && new Date(b.expiryDate) < now
      )
    ) {
      g.status = 'expired'
    } else if (usableQty <= 10) {
      g.status = 'low stock'
    } else {
      g.status = 'available'
    }

    groupedList.push(g)
  }

  return sortInventory(groupedList)
}

export const addInventoryItem = async (item, userId) => {
  const cleanExpiry = item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : null
  const cleanName = item.name.toLowerCase().trim()
  const cleanCategory = (item.category || '').toLowerCase().trim()
  const cleanUnit = (item.unit || '').toLowerCase().trim()

  if (isDemoMode) {
    const inventory = getLocalData(LOCAL_STORAGE_KEYS.INVENTORY) || []
    const existing = inventory.find((i) => {
      const existingName = i.name.toLowerCase().trim()
      const existingCategory = (i.category || '').toLowerCase().trim()
      return (
        areNamesSimilar(existingName, cleanName) &&
        existingCategory === cleanCategory
      )
    })

    if (existing) {
      const existingBatches = Array.isArray(existing.batches) && existing.batches.length > 0
        ? existing.batches
        : (existing.quantity > 0
            ? [{
                id: `batch-${existing.id}-init`,
                quantity: existing.quantity,
                expiryDate: existing.expiryDate || null,
                receivedDate: existing.receivedDate || existing.createdAt || new Date().toISOString(),
                unit: existing.unit || 'pieces',
                groupUnit: existing.groupUnit || 'none',
                piecesPerUnit: existing.piecesPerUnit || null
              }]
            : [])
      existingBatches.push({
        id: 'batch-' + Math.random().toString(36).substr(2, 9),
        quantity: item.quantity,
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString() : null,
        receivedDate: new Date().toISOString(),
        unit: item.unit || existing.unit || 'pieces',
        groupUnit: item.groupUnit || 'none',
        piecesPerUnit: item.piecesPerUnit || null
      })
      existing.batches = existingBatches
      existing.quantity += item.quantity

      // Recalculate earliest active expiry for FEFO
      const activeWithExp = existingBatches.filter((b) => b.quantity > 0 && b.expiryDate)
      if (activeWithExp.length > 0) {
        activeWithExp.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
        existing.expiryDate = activeWithExp[0].expiryDate
      } else {
        existing.expiryDate = null
      }

      existing.status = computeInventoryStatus(existing.quantity, existing.expiryDate)
      existing.lastUpdatedBy = userId
      existing.hasBeenReleased = false
      existing.updatedAt = new Date().toISOString()
      saveLocalData(LOCAL_STORAGE_KEYS.INVENTORY, inventory)
      return existing
    }

    const initialBatches = item.batches || (item.quantity > 0 ? [{
      id: 'batch-' + Math.random().toString(36).substr(2, 9),
      quantity: item.quantity,
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString() : null,
      receivedDate: item.receivedDate || new Date().toISOString(),
      unit: item.unit || 'pieces',
      groupUnit: item.groupUnit || 'none',
      piecesPerUnit: item.piecesPerUnit || null
    }] : [])

    const newItem = {
      ...item,
      id: 'inv-' + Math.random().toString(36).substr(2, 9),
      batches: initialBatches,
      receivedDate: item.receivedDate || new Date().toISOString(),
      status: computeInventoryStatus(item.quantity, item.expiryDate),
      lastUpdatedBy: userId,
      hasBeenReleased: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    inventory.push(newItem)
    saveLocalData(LOCAL_STORAGE_KEYS.INVENTORY, inventory)
    return newItem
  } else {
    const qSnap = await getDocs(collection(fdb, 'inventory'))
    let existingRef = null
    let existingData = null
    qSnap.forEach((docSnap) => {
      const d = docSnap.data()
      const existingName = d.name.toLowerCase().trim()
      const existingCategory = (d.category || '').toLowerCase().trim()
      if (
        areNamesSimilar(existingName, cleanName) &&
        existingCategory === cleanCategory
      ) {
        existingRef = docSnap.ref
        existingData = { id: docSnap.id, ...d }
      }
    })

    if (existingRef && existingData) {
      const existingBatches = Array.isArray(existingData.batches) && existingData.batches.length > 0
        ? existingData.batches
        : (existingData.quantity > 0
            ? [{
                id: `batch-${existingData.id}-init`,
                quantity: existingData.quantity,
                expiryDate: existingData.expiryDate?.toDate ? existingData.expiryDate.toDate().toISOString() : (existingData.expiryDate || null),
                receivedDate: existingData.receivedDate?.toDate ? existingData.receivedDate.toDate().toISOString() : (existingData.receivedDate || new Date().toISOString()),
                unit: existingData.unit || 'pieces',
                groupUnit: existingData.groupUnit || 'none',
                piecesPerUnit: existingData.piecesPerUnit || null
              }]
            : [])
      existingBatches.push({
        id: 'batch-' + Math.random().toString(36).substr(2, 9),
        quantity: item.quantity,
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString() : null,
        receivedDate: new Date().toISOString(),
        unit: item.unit || existingData.unit || 'pieces',
        groupUnit: item.groupUnit || 'none',
        piecesPerUnit: item.piecesPerUnit || null
      })
      const newQty = existingData.quantity + item.quantity

      // Recalculate earliest active expiry for FEFO
      const activeWithExp = existingBatches.filter((b) => b.quantity > 0 && b.expiryDate)
      let updatedExpiry = null
      if (activeWithExp.length > 0) {
        activeWithExp.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
        updatedExpiry = activeWithExp[0].expiryDate
      }

      const newStatus = computeInventoryStatus(newQty, updatedExpiry)
      await updateDoc(existingRef, {
        quantity: newQty,
        batches: existingBatches,
        expiryDate: updatedExpiry ? Timestamp.fromDate(new Date(updatedExpiry)) : null,
        status: newStatus,
        lastUpdatedBy: userId,
        hasBeenReleased: false,
        updatedAt: Timestamp.now()
      })
      return {
        ...existingData,
        quantity: newQty,
        batches: existingBatches,
        expiryDate: updatedExpiry,
        status: newStatus,
        hasBeenReleased: false,
        updatedAt: new Date().toISOString()
      }
    }

    const initialBatches = item.batches || (item.quantity > 0 ? [{
      id: 'batch-' + Math.random().toString(36).substr(2, 9),
      quantity: item.quantity,
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString() : null,
      receivedDate: item.receivedDate ? new Date(item.receivedDate).toISOString() : new Date().toISOString()
    }] : [])

    const newItemData = {
      ...item,
      batches: initialBatches,
      receivedDate: item.receivedDate
        ? Timestamp.fromDate(new Date(item.receivedDate))
        : Timestamp.now(),
      expiryDate: item.expiryDate ? Timestamp.fromDate(new Date(item.expiryDate)) : null,
      status: computeInventoryStatus(item.quantity, item.expiryDate),
      lastUpdatedBy: userId,
      hasBeenReleased: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    const docRef = await addDoc(collection(fdb, 'inventory'), newItemData)
    return { ...item, id: docRef.id, batches: initialBatches, hasBeenReleased: false }
  }
}

export const updateInventoryItem = async (itemId, updates, userId) => {
  // If batches are provided, calculate total quantity and earliest active expiryDate
  if (Array.isArray(updates.batches)) {
    const activeBatches = updates.batches.filter((b) => b.quantity > 0)
    if (updates.quantity === undefined) {
      updates.quantity = activeBatches.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0)
    }
    const withExpiry = activeBatches.filter((b) => b.expiryDate)
    if (withExpiry.length > 0) {
      withExpiry.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
      updates.expiryDate = withExpiry[0].expiryDate
    } else if (updates.batches.length > 0 && withExpiry.length === 0) {
      updates.expiryDate = null
    }
  }

  if (updates.quantity !== undefined || updates.expiryDate !== undefined) {
    const qty = updates.quantity !== undefined ? updates.quantity : 0
    const exp = updates.expiryDate !== undefined ? updates.expiryDate : null
    updates.status = computeInventoryStatus(qty, exp)
  }

  if (isDemoMode) {
    const inventory = getLocalData(LOCAL_STORAGE_KEYS.INVENTORY) || []
    const idx = inventory.findIndex((i) => i.id === itemId)
    if (idx !== -1) {
      inventory[idx] = {
        ...inventory[idx],
        ...updates,
        lastUpdatedBy: userId,
        updatedAt: new Date().toISOString()
      }
      saveLocalData(LOCAL_STORAGE_KEYS.INVENTORY, inventory)
      return inventory[idx]
    }
    throw new Error('Item not found')
  } else {
    const dbUpdates = { ...updates, updatedAt: Timestamp.now(), lastUpdatedBy: userId }
    if (updates.expiryDate !== undefined) {
      dbUpdates.expiryDate = updates.expiryDate
        ? Timestamp.fromDate(new Date(updates.expiryDate))
        : null
    }
    if (updates.receivedDate !== undefined) {
      dbUpdates.receivedDate = Timestamp.fromDate(new Date(updates.receivedDate))
    }
    if (updates.batches !== undefined) {
      dbUpdates.batches = (updates.batches || []).map((b) => ({
        id: b.id || 'batch-' + Math.random().toString(36).substr(2, 9),
        quantity: Number(b.quantity) || 0,
        expiryDate: b.expiryDate
          ? b.expiryDate.toDate
            ? b.expiryDate.toDate().toISOString()
            : new Date(b.expiryDate).toISOString()
          : null,
        receivedDate: b.receivedDate
          ? b.receivedDate.toDate
            ? b.receivedDate.toDate().toISOString()
            : new Date(b.receivedDate).toISOString()
          : new Date().toISOString()
      }))
    }
    await updateDoc(doc(fdb, 'inventory', itemId), dbUpdates)
  }
}

export const deleteInventoryItem = async (itemId) => {
  if (isDemoMode) {
    const inventory = getLocalData(LOCAL_STORAGE_KEYS.INVENTORY)
    const filtered = inventory.filter((i) => i.id !== itemId)
    saveLocalData(LOCAL_STORAGE_KEYS.INVENTORY, filtered)
    return true
  } else {
    await deleteDoc(doc(fdb, 'inventory', itemId))
    return true
  }
}

// --- DONOR & DONATION SERVICES ---

export const getDonors = async () => {
  if (isDemoMode) {
    return getLocalData(LOCAL_STORAGE_KEYS.DONORS)
  } else {
    const qSnap = await getDocs(collection(fdb, 'donors'))
    return qSnap.docs.map((d) => ({ ...d.data(), id: d.id }))
  }
}

export const subscribeDonors = (callback) => {
  if (isDemoMode) {
    const fetchAndCallback = () => callback(getLocalData(LOCAL_STORAGE_KEYS.DONORS) || [])
    fetchAndCallback()
    const handleStorage = (e) => {
      if (!e || e.key === LOCAL_STORAGE_KEYS.DONORS) fetchAndCallback()
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('dommunity_donors_updated', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('dommunity_donors_updated', handleStorage)
    }
  } else {
    const q = collection(fdb, 'donors')
    return onSnapshot(
      q,
      (snapshot) => {
        const donors = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }))
        callback(donors)
      },
      (err) => {
        console.warn('Donors snapshot listener restricted, falling back to local cache:', err?.message || err)
        callback(getLocalData(LOCAL_STORAGE_KEYS.DONORS) || [])
      }
    )
  }
}

export const addDonor = async (donor) => {
  if (isDemoMode) {
    const donors = getLocalData(LOCAL_STORAGE_KEYS.DONORS)
    const newDonor = {
      ...donor,
      id: 'donor-' + Math.random().toString(36).substr(2, 9),
      createdAt: donor.createdAt || new Date().toISOString()
    }
    donors.push(newDonor)
    saveLocalData(LOCAL_STORAGE_KEYS.DONORS, donors)
    return newDonor
  } else {
    const docRef = await addDoc(collection(fdb, 'donors'), {
      ...donor,
      createdAt: donor.createdAt ? Timestamp.fromDate(new Date(donor.createdAt)) : Timestamp.now()
    })
    return { ...donor, id: docRef.id }
  }
}

export const updateDonor = async (donorId, updates) => {
  if (isDemoMode) {
    const donors = getLocalData(LOCAL_STORAGE_KEYS.DONORS)
    const idx = donors.findIndex((d) => d.id === donorId)
    if (idx !== -1) {
      donors[idx] = {
        ...donors[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      saveLocalData(LOCAL_STORAGE_KEYS.DONORS, donors)
      return donors[idx]
    }
    throw new Error('Donor not found')
  } else {
    const dbUpdates = { ...updates, updatedAt: Timestamp.now() }
    if (updates.createdAt) {
      dbUpdates.createdAt = Timestamp.fromDate(new Date(updates.createdAt))
    }
    await updateDoc(doc(fdb, 'donors', donorId), dbUpdates)
    return { id: donorId, ...updates }
  }
}

export const deleteDonor = async (donorId) => {
  if (isDemoMode) {
    const donors = getLocalData(LOCAL_STORAGE_KEYS.DONORS)
    const filtered = donors.filter((d) => d.id !== donorId)
    saveLocalData(LOCAL_STORAGE_KEYS.DONORS, filtered)
    return true
  } else {
    await deleteDoc(doc(fdb, 'donors', donorId))
    return true
  }
}

export const getDonations = async () => {
  if (isDemoMode) {
    return getLocalData(LOCAL_STORAGE_KEYS.DONATIONS)
  } else {
    const qSnap = await getDocs(collection(fdb, 'donations'))
    return qSnap.docs.map((d) => {
      const data = d.data()
      return {
        ...data,
        id: d.id,
        dateOfDonation: data.dateOfDonation?.toDate
          ? data.dateOfDonation.toDate().toISOString()
          : data.dateOfDonation,
        items: (data.items || []).map((item) => ({
          ...item,
          expiryDate: item.expiryDate?.toDate
            ? item.expiryDate.toDate().toISOString()
            : item.expiryDate || null
        }))
      }
    })
  }
}

export const subscribeDonations = (callback) => {
  if (isDemoMode) {
    const fetchAndCallback = () => callback(getLocalData(LOCAL_STORAGE_KEYS.DONATIONS) || [])
    fetchAndCallback()
    const handleStorage = (e) => {
      if (!e || e.key === LOCAL_STORAGE_KEYS.DONATIONS) fetchAndCallback()
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('dommunity_donations_updated', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('dommunity_donations_updated', handleStorage)
    }
  } else {
    const q = collection(fdb, 'donations')
    return onSnapshot(
      q,
      (snapshot) => {
        const donations = snapshot.docs.map((d) => {
          const data = d.data()
          return {
            ...data,
            id: d.id,
            dateOfDonation: data.dateOfDonation?.toDate
              ? data.dateOfDonation.toDate().toISOString()
              : data.dateOfDonation,
            items: (data.items || []).map((item) => ({
              ...item,
              expiryDate: item.expiryDate?.toDate
                ? item.expiryDate.toDate().toISOString()
                : item.expiryDate || null
            }))
          }
        })
        callback(donations)
      },
      (err) => {
        console.warn('Donations snapshot listener restricted, falling back to local cache:', err?.message || err)
        callback(getLocalData(LOCAL_STORAGE_KEYS.DONATIONS) || [])
      }
    )
  }
}

export const addDonation = async (donation, userId) => {
  if (isDemoMode) {
    const donations = getLocalData(LOCAL_STORAGE_KEYS.DONATIONS)
    const newDonation = {
      ...donation,
      id: 'don-' + Math.random().toString(36).substr(2, 9),
      dateOfDonation: donation.dateOfDonation || new Date().toISOString()
    }
    donations.push(newDonation)
    saveLocalData(LOCAL_STORAGE_KEYS.DONATIONS, donations)

    // Automatical inventory stock aggregation!
    const inventory = getLocalData(LOCAL_STORAGE_KEYS.INVENTORY)
    newDonation.items.forEach((dItem) => {
      // Find matching item in inventory by name and expiryDate (batch matching)
      const existing = inventory.find(
        (i) =>
          areNamesSimilar(i.name, dItem.name) &&
          (i.expiryDate ? new Date(i.expiryDate).getTime() : 0) ===
            (dItem.expiryDate ? new Date(dItem.expiryDate).getTime() : 0)
      )

      if (existing) {
        existing.quantity += dItem.quantity
        existing.status = computeInventoryStatus(existing.quantity, existing.expiryDate)
        existing.updatedAt = new Date().toISOString()
        existing.lastUpdatedBy = userId
        if (!existing.piecesPerUnit && dItem.piecesPerUnit) {
          existing.piecesPerUnit = dItem.piecesPerUnit
        }
        if (
          (!existing.groupUnit || existing.groupUnit === 'none') &&
          dItem.groupUnit &&
          dItem.groupUnit !== 'none'
        ) {
          existing.groupUnit = dItem.groupUnit
        }
      } else {
        inventory.push({
          id: 'inv-' + Math.random().toString(36).substr(2, 9),
          name: dItem.name,
          category: dItem.category || inferCategory(dItem.name),
          unit: dItem.unit,
          quantity: dItem.quantity,
          expiryDate: dItem.expiryDate || null,
          donationId: newDonation.id,
          receivedDate: newDonation.dateOfDonation,
          status: computeInventoryStatus(dItem.quantity, dItem.expiryDate),
          lastUpdatedBy: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          piecesPerUnit: dItem.piecesPerUnit || null,
          groupUnit: dItem.groupUnit || null
        })
      }
    })

    saveLocalData(LOCAL_STORAGE_KEYS.INVENTORY, inventory)
    return newDonation
  } else {
    const dbItems = donation.items.map((i) => ({
      ...i,
      expiryDate: i.expiryDate ? Timestamp.fromDate(new Date(i.expiryDate)) : null
    }))

    const docRef = await addDoc(collection(fdb, 'donations'), {
      ...donation,
      dateOfDonation: Timestamp.fromDate(new Date(donation.dateOfDonation)),
      items: dbItems,
      receivedBy: userId
    })

    const donationId = docRef.id

    // Cloud Mode Inventory Aggregation
    const qSnap = await getDocs(collection(fdb, 'inventory'))
    for (const dItem of donation.items) {
      let match = null

      qSnap.docs.forEach((docSnap) => {
        const invD = docSnap.data()
        const existingName = invD.name.toLowerCase().trim()
        const invExp = invD.expiryDate ? invD.expiryDate.toDate().toISOString().split('T')[0] : null
        const targetExp = dItem.expiryDate
          ? new Date(dItem.expiryDate).toISOString().split('T')[0]
          : null
        if (areNamesSimilar(existingName, dItem.name) && invExp === targetExp) {
          match = docSnap
        }
      })

      if (match) {
        const curQty = match.data().quantity + dItem.quantity
        const status = computeInventoryStatus(curQty, dItem.expiryDate)
        const updatePayload = {
          quantity: curQty,
          status,
          lastUpdatedBy: userId,
          updatedAt: Timestamp.now()
        }
        if (!match.data().piecesPerUnit && dItem.piecesPerUnit) {
          updatePayload.piecesPerUnit = dItem.piecesPerUnit
        }
        if (
          (!match.data().groupUnit || match.data().groupUnit === 'none') &&
          dItem.groupUnit &&
          dItem.groupUnit !== 'none'
        ) {
          updatePayload.groupUnit = dItem.groupUnit
        }
        await updateDoc(doc(fdb, 'inventory', match.id), updatePayload)
      } else {
        const status = computeInventoryStatus(dItem.quantity, dItem.expiryDate)
        await addDoc(collection(fdb, 'inventory'), {
          name: dItem.name,
          category: dItem.category || inferCategory(dItem.name),
          unit: dItem.unit,
          quantity: dItem.quantity,
          expiryDate: dItem.expiryDate ? Timestamp.fromDate(new Date(dItem.expiryDate)) : null,
          donationId,
          receivedDate: Timestamp.fromDate(new Date(donation.dateOfDonation)),
          status,
          lastUpdatedBy: userId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          piecesPerUnit: dItem.piecesPerUnit || null,
          groupUnit: dItem.groupUnit || null
        })
      }
    }

    return { ...donation, id: donationId }
  }
}

const inferCategory = (itemName) => {
  const name = itemName.toLowerCase()
  if (
    name.includes('book') ||
    name.includes('pencil') ||
    name.includes('paper') ||
    name.includes('pen') ||
    name.includes('crayon') ||
    name.includes('school')
  ) {
    return 'school supplies'
  } else if (
    name.includes('sardine') ||
    name.includes('noodle') ||
    name.includes('rice') ||
    name.includes('food') ||
    name.includes('biscuit') ||
    name.includes('can')
  ) {
    return 'food packs'
  } else if (
    name.includes('soap') ||
    name.includes('toothpaste') ||
    name.includes('brush') ||
    name.includes('shampoo') ||
    name.includes('hygiene') ||
    name.includes('alcohol')
  ) {
    return 'hygiene kits'
  }
  return 'other'
}

// --- EVENT SERVICES ---

export const getEvents = async () => {
  if (isDemoMode) {
    return getLocalData(LOCAL_STORAGE_KEYS.EVENTS)
  } else {
    const qSnap = await getDocs(collection(fdb, 'events'))
    return qSnap.docs.map((d) => ({
      ...d.data(),
      id: d.id,
      scheduleDate: d.data().scheduleDate?.toDate
        ? d.data().scheduleDate.toDate().toISOString()
        : d.data().scheduleDate
    }))
  }
}

export const subscribeEvents = (callback) => {
  if (isDemoMode) {
    const fetchAndCallback = () => callback(getLocalData(LOCAL_STORAGE_KEYS.EVENTS) || [])
    fetchAndCallback()
    const handleStorage = (e) => {
      if (!e || e.key === LOCAL_STORAGE_KEYS.EVENTS) fetchAndCallback()
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('dommunity_events_updated', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('dommunity_events_updated', handleStorage)
    }
  } else {
    const q = collection(fdb, 'events')
    return onSnapshot(
      q,
      (snapshot) => {
        const events = snapshot.docs.map((d) => {
          const data = d.data()
          return {
            ...data,
            id: d.id,
            scheduleDate: data.scheduleDate?.toDate
              ? data.scheduleDate.toDate().toISOString()
              : data.scheduleDate
          }
        })
        callback(events)
      },
      (err) => {
        console.warn('Events snapshot listener restricted, falling back to local cache:', err?.message || err)
        callback(getLocalData(LOCAL_STORAGE_KEYS.EVENTS) || [])
      }
    )
  }
}

export const addEvent = async (event) => {
  if (isDemoMode) {
    const events = getLocalData(LOCAL_STORAGE_KEYS.EVENTS)
    const newEvent = {
      ...event,
      id: 'event-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    events.push(newEvent)
    saveLocalData(LOCAL_STORAGE_KEYS.EVENTS, events)
    if (event.status && event.status.toLowerCase().trim() === 'completed') {
      createPendingReportForCompletedEvent(newEvent).catch((err) =>
        console.warn('[db.js] Failed to auto-create pending report for completed added event:', err)
      )
    }
    return newEvent
  } else {
    const docRef = await addDoc(collection(fdb, 'events'), {
      ...event,
      scheduleDate: Timestamp.fromDate(new Date(event.scheduleDate)),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    const created = { ...event, id: docRef.id }
    if (event.status && event.status.toLowerCase().trim() === 'completed') {
      createPendingReportForCompletedEvent(created).catch((err) =>
        console.warn('[db.js] Failed to auto-create pending report for completed added event:', err)
      )
    }
    return created
  }
}

export const updateEvent = async (eventId, updates) => {
  if (isDemoMode) {
    const events = getLocalData(LOCAL_STORAGE_KEYS.EVENTS)
    const idx = events.findIndex((e) => e.id === eventId)
    if (idx !== -1) {
      events[idx] = {
        ...events[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      saveLocalData(LOCAL_STORAGE_KEYS.EVENTS, events)
      if (updates.status && updates.status.toLowerCase().trim() === 'completed') {
        createPendingReportForCompletedEvent(events[idx]).catch((err) =>
          console.warn('[db.js] Failed to auto-create pending report for completed event:', err)
        )
      }
      return events[idx]
    }
    throw new Error('Event not found')
  } else {
    const dbUpdates = { ...updates, updatedAt: Timestamp.now() }
    if (updates.scheduleDate) {
      dbUpdates.scheduleDate = Timestamp.fromDate(new Date(updates.scheduleDate))
    }
    await updateDoc(doc(fdb, 'events', eventId), dbUpdates)
    if (updates.status && updates.status.toLowerCase().trim() === 'completed') {
      try {
        const evDoc = await getDoc(doc(fdb, 'events', eventId))
        if (evDoc.exists()) {
          const evData = {
            ...evDoc.data(),
            id: evDoc.id,
            scheduleDate: evDoc.data().scheduleDate?.toDate
              ? evDoc.data().scheduleDate.toDate().toISOString()
              : evDoc.data().scheduleDate
          }
          await createPendingReportForCompletedEvent(evData)
        }
      } catch (err) {
        console.warn('[db.js] Failed to auto-create pending report for completed event in Firestore:', err)
      }
    }
  }
}

export const deleteEvent = async (eventId) => {
  if (isDemoMode) {
    let events = getLocalData(LOCAL_STORAGE_KEYS.EVENTS)
    events = events.filter((e) => e.id !== eventId)
    saveLocalData(LOCAL_STORAGE_KEYS.EVENTS, events)
    return true
  } else {
    await deleteDoc(doc(fdb, 'events', eventId))
  }
}

// In-flight mutex set to prevent concurrent duplicate pending report creations for the same event
const pendingReportCreations = new Set()

const CLEARED_REPORT_EVENTS_KEY = 'dommunity_cleared_report_events'

export const getClearedReportEventIds = () => {
  try {
    const raw = localStorage.getItem(CLEARED_REPORT_EVENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const recordClearedReportEventId = (eventId) => {
  if (!eventId) return
  try {
    const current = getClearedReportEventIds()
    if (!current.includes(eventId)) {
      const updated = [...current, eventId]
      localStorage.setItem(CLEARED_REPORT_EVENTS_KEY, JSON.stringify(updated))
    }
  } catch {}
}

/**
 * Automatically creates or registers a narrative report with status 'pending'
 * for a completed event. Prevents duplicate reports for the same event.
 */
export const createPendingReportForCompletedEvent = async (event) => {
  if (!event || !event.id) return null
  const eventId = event.id
  if (pendingReportCreations.has(eventId)) return null
  if (event.reportCleared || event.narrativeReportCleared) return null
  if (getClearedReportEventIds().includes(eventId)) return null
  pendingReportCreations.add(eventId)

  try {
    // 1. Check local cache first to ensure no duplicate pending/draft/submitted/returned/approved report exists
    const localReports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
    const existingLocal = localReports.find((r) => r.eventId === eventId)
    if (existingLocal) {
      return existingLocal
    }

    // 2. In cloud mode, check Firestore narrative_reports for existing report with this eventId
    if (!isDemoMode) {
      try {
        const qSnap = await getDocs(
          query(collection(fdb, 'narrative_reports'), where('eventId', '==', eventId))
        )
        if (!qSnap.empty) {
          const docData = qSnap.docs[0].data()
          const existingReport = {
            ...docData,
            id: qSnap.docs[0].id,
            createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate().toISOString() : docData.createdAt,
            updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate().toISOString() : docData.updatedAt
          }
          // Mirror to local cache
          const curReports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
          const existingIdx = curReports.findIndex((r) => r.id === existingReport.id)
          if (existingIdx !== -1) {
            curReports[existingIdx] = existingReport
          } else {
            curReports.push(existingReport)
          }
          saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, curReports)
          return existingReport
        }
      } catch (checkErr) {
        console.warn('[db.js] Error checking existing pending report in Firestore:', checkErr)
      }
    }

    // 3. Extract and format event details for pending narrative report
    const eventName = event.name || 'Untitled Completed Event'
    let eventDate = ''
    if (event.scheduleDate) {
      try {
        const d = event.scheduleDate.toDate ? event.scheduleDate.toDate() : new Date(event.scheduleDate)
        if (!isNaN(d.getTime())) {
          eventDate = d.toISOString().split('T')[0]
        }
      } catch {}
    }
    const venue = event.location || event.venueLocation || event.venue || ''
    const orgId = event.assignedOrganizationId || null
    const orgName = event.organizationName || ''
    const desc = event.description || ''

    const newPendingReport = {
      eventId: eventId,
      activityTitle: eventName,
      title: eventName,
      activityDate: eventDate || new Date().toISOString().split('T')[0],
      location: venue,
      venue: venue,
      organizationId: orgId,
      assignedOrganizationId: orgId,
      organizationName: orgName,
      parentDepartmentId: event.parentDepartmentId || null,
      eventType: event.eventType || 'department',
      description: desc,
      eventDescription: desc,
      narrative: '',
      photos: [],
      academicYear: '2026-2027',
      semester: '1st Semester',
      type: event.eventType === 'department' ? 'outreach' : 'outreach',
      status: 'pending',
      adminFeedback: null,
      authorId: null,
      authorName: 'Coordinator',
      authorEmail: '',
      submittedBy: 'Coordinator',
      history: [
        {
          status: 'pending',
          changedBy: 'system',
          timestamp: new Date().toISOString(),
          notes: `Automatic pending narrative report generated for completed event "${eventName}".`
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (isDemoMode) {
      const reports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
      const localObj = {
        ...newPendingReport,
        id: 'report-evt-' + eventId
      }
      reports.push(localObj)
      saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, reports)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dommunity_reports_updated'))
      }
      return localObj
    } else {
      try {
        const firestorePayload = sanitizeForFirestore({
          ...newPendingReport,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
        const docRef = await addDoc(collection(fdb, 'narrative_reports'), firestorePayload)
        const createdReport = {
          ...newPendingReport,
          id: docRef.id
        }

        // Mirror to local cache
        const localReports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
        const existingIdx = localReports.findIndex((r) => r.id === docRef.id)
        if (existingIdx !== -1) {
          localReports[existingIdx] = createdReport
        } else {
          localReports.push(createdReport)
        }
        saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, localReports)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dommunity_reports_updated'))
        }
        return createdReport
      } catch (fsErr) {
        console.warn('[db.js] Failed to save pending report to Firestore, using local fallback:', fsErr)
        const reports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
        const fallbackObj = {
          ...newPendingReport,
          id: 'report-evt-' + eventId,
          syncStatus: 'local_pending'
        }
        reports.push(fallbackObj)
        saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, reports)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dommunity_reports_updated'))
        }
        return fallbackObj
      }
    }
  } finally {
    pendingReportCreations.delete(eventId)
  }
}

/**
 * Inspects all completed events and ensures each has a registered narrative report.
 * If any completed event lacks a report, automatically creates a 'pending' report entry.
 */
export const ensurePendingReportsForCompletedEvents = async (events, reports) => {
  if (!Array.isArray(events) || events.length === 0) return []
  const currentReports = Array.isArray(reports)
    ? reports
    : (getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || [])

  const clearedEventIds = getClearedReportEventIds()

  const completedEvents = events.filter((e) => {
    if (!e || !e.id) return false
    if (e.reportCleared || e.narrativeReportCleared || clearedEventIds.includes(e.id)) {
      return false
    }
    const s = (e.status || '').toLowerCase().trim()
    return s === 'completed' || s === 'successful' || s === 'done'
  })

  const createdReports = []
  for (const evt of completedEvents) {
    if (!evt || !evt.id) continue
    const alreadyExists = currentReports.some((r) => r.eventId === evt.id)
    if (!alreadyExists) {
      const created = await createPendingReportForCompletedEvent(evt)
      if (created) createdReports.push(created)
    }
  }
  return createdReports
}

// --- NARRATIVE REPORT SERVICES ---

export const syncPendingReportsToFirestore = async (pendingReports) => {
  if (!pendingReports || pendingReports.length === 0 || isDemoMode) return
  for (const rep of pendingReports) {
    try {
      if (rep.id && rep.id.startsWith('report-')) {
        const { id, syncStatus, syncError, ...cleanData } = rep

        // Check if an equivalent report already exists in Firestore (e.g. from prior submission)
        let docId = null
        try {
          if (cleanData.authorId) {
            const qExisting = query(
              collection(fdb, 'narrative_reports'),
              where('authorId', '==', cleanData.authorId)
            )
            const snapExisting = await getDocs(qExisting)
            if (!snapExisting.empty) {
              const match = snapExisting.docs.find((d) => {
                const dData = d.data()
                return (
                  dData.activityTitle === cleanData.activityTitle &&
                  dData.eventId === cleanData.eventId &&
                  (dData.status === cleanData.status || dData.status === 'submitted')
                )
              })
              if (match) docId = match.id
            }
          }
        } catch {}

        if (!docId) {
          // 1. Ensure HTML narrative is strictly under Firestore 1MB limit
          if (cleanData.narrative && typeof cleanData.narrative === 'string') {
            cleanData.narrative = await ensureHtmlUnderFirestoreLimit(cleanData.narrative, {
              storage: fstorage
            })
          }

          // 2. Compress photos array if present
          if (Array.isArray(cleanData.photos) && cleanData.photos.length > 0) {
            cleanData.photos = await Promise.all(
              cleanData.photos.map(async (photo) => {
                if (typeof photo === 'string' && photo.startsWith('data:image/') && photo.length > 50000) {
                  try {
                    return await compressImage(photo, { maxWidth: 1000, maxHeight: 1000, quality: 0.7 })
                  } catch {
                    return photo
                  }
                }
                return photo
              })
            )
          }

          const firestoreData = sanitizeForFirestore({
            ...cleanData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          })
          const docRef = await addDoc(collection(fdb, 'narrative_reports'), firestoreData)
          docId = docRef.id
        }

        const cur = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
        const idx = cur.findIndex((r) => r.id === rep.id)
        if (idx !== -1) {
          cur[idx] = { ...rep, id: docId, syncStatus: 'synced', syncError: null }
          saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, cur)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('dommunity_reports_updated'))
          }
        }
      }
    } catch (err) {
      console.warn('[db.js] Handled pending report auto-sync failure:', rep.id, err?.message || err)
      const cur = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
      const idx = cur.findIndex((r) => r.id === rep.id)
      if (idx !== -1) {
        cur[idx] = { ...cur[idx], syncError: err?.message || String(err) }
        saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, cur)
      }
    }
  }
}

export const getReports = async () => {
  if (isDemoMode) {
    return getLocalData(LOCAL_STORAGE_KEYS.REPORTS)
  } else {
    try {
      const qSnap = await getDocs(collection(fdb, 'narrative_reports'))
      const list = qSnap.docs.map((d) => {
        const data = d.data()
        return {
          ...data,
          id: d.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
        }
      })
      // Sync snapshot to local cache while preserving any locally pending reports
      const existingLocal = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
      const pendingLocal = existingLocal.filter(
        (localRep) =>
          localRep.syncStatus === 'local_pending' &&
          !list.some((remoteRep) => remoteRep.id === localRep.id)
      )
      const mergedList = [...list, ...pendingLocal]
      saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, mergedList)

      // Background auto-sync of locally pending reports to Firestore
      if (pendingLocal.length > 0) {
        syncPendingReportsToFirestore(pendingLocal).catch((e) =>
          console.warn('[db.js] Auto-sync of pending reports failed:', e)
        )
      }

      return mergedList
    } catch (err) {
      console.warn('Firestore getReports failed (permissions or offline), using local cache fallback:', err)
      return getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
    }
  }
}

export const subscribeReports = (callback) => {
  if (isDemoMode) {
    const fetchAndCallback = () => {
      const reports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
      callback(reports)
    }
    fetchAndCallback()
    const handleStorage = (e) => {
      if (!e || e.key === LOCAL_STORAGE_KEYS.REPORTS) {
        fetchAndCallback()
      }
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('dommunity_reports_updated', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('dommunity_reports_updated', handleStorage)
    }
  } else {
    const q = collection(fdb, 'narrative_reports')
    return onSnapshot(
      q,
      (snapshot) => {
        const reports = snapshot.docs.map((d) => {
          const data = d.data()
          return {
            ...data,
            id: d.id,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toISOString()
              : data.createdAt,
            updatedAt: data.updatedAt?.toDate
              ? data.updatedAt.toDate().toISOString()
              : data.updatedAt
          }
        })
        const existingLocal = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
        const pendingLocal = existingLocal.filter(
          (localRep) =>
            localRep.syncStatus === 'local_pending' &&
            !reports.some((remoteRep) => remoteRep.id === localRep.id)
        )
        const merged = [...reports, ...pendingLocal]
        saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, merged)
        callback(merged)
      },
      (err) => {
        console.error('Real-time reports snapshot listener error:', err)
        // Fallback to local storage cache so reports list remains populated
        const local = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
        callback(local)
      }
    )
  }
}

/**
 * Recursively removes undefined fields and strips giant docx base64 blobs to guarantee
 * document writes never fail Firestore 1MB limits or "Unsupported field value: undefined" errors.
 */
export const sanitizeForFirestore = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  if (obj instanceof Timestamp || obj instanceof Date) return obj
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item))
  }
  const cleaned = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue // remove undefined to prevent Firestore crashes
    }
    // Prevent oversized base64 DOCX URIs on originalDocxUrl
    if (key === 'originalDocxUrl' && typeof value === 'string' && value.startsWith('data:') && value.length > 500000) {
      console.warn(`[db.js] Dropped oversized base64 originalDocxUrl (${value.length} bytes) to protect Firestore document size limit.`)
      continue
    }
    // Hard safety guard: ensure no single string property exceeds Firestore's 1MB field limit (1048487 bytes)
    if (typeof value === 'string' && value.length > 1040000) {
      console.warn(`[db.js] Property "${key}" exceeds Firestore limit (${value.length} bytes). Truncating safely to prevent FirebaseError.`)
      cleaned[key] = value.slice(0, 1030000)
      continue
    }
    if (value !== null && typeof value === 'object' && !(value instanceof Timestamp) && !(value instanceof Date)) {
      cleaned[key] = sanitizeForFirestore(value)
    } else {
      cleaned[key] = value
    }
  }
  return cleaned
}

export const addReport = async (report, userId) => {
  if (isDemoMode) {
    const reports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
    const newReport = {
      ...report,
      id: 'report-' + Math.random().toString(36).substr(2, 9),
      authorId: userId,
      photos: report.photos || [],
      adminFeedback: null,
      history: [
        {
          status: report.status,
          changedBy: userId,
          timestamp: new Date().toISOString(),
          notes: 'Report initialized.'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    reports.push(newReport)
    saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, reports)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dommunity_reports_updated'))
    }

    // Update event status to completed if report is submitted/approved
    if ((report.status === 'submitted' || report.status === 'approved') && report.eventId) {
      await updateEvent(report.eventId, { status: 'completed' })
    }

    return newReport
  } else {
    try {
      let sanitizedReport = { ...report }

      // 1. Optimize HTML narrative: ensure it strictly obeys Firestore 1MB document/field limits
      if (sanitizedReport.narrative && typeof sanitizedReport.narrative === 'string') {
        try {
          sanitizedReport.narrative = await ensureHtmlUnderFirestoreLimit(sanitizedReport.narrative, {
            storage: fstorage
          })
        } catch (compErr) {
          console.warn('Narrative image pre-compression failed:', compErr)
        }
      }

      // 3. Compress photos array if any base64 images exist
      if (Array.isArray(sanitizedReport.photos) && sanitizedReport.photos.length > 0) {
        sanitizedReport.photos = await Promise.all(
          sanitizedReport.photos.map(async (photo) => {
            if (typeof photo === 'string' && photo.startsWith('data:image/') && photo.length > 50000) {
              try {
                return await compressImage(photo, { maxWidth: 1000, maxHeight: 1000, quality: 0.7 })
              } catch {
                return photo
              }
            }
            return photo
          })
        )
      }

      // Ensure author details have valid fallback values
      sanitizedReport.authorName = sanitizedReport.authorName || 'Coordinator'
      sanitizedReport.authorEmail = sanitizedReport.authorEmail || ''

      // Clean undefined keys and protect from oversized payloads
      const firestorePayload = sanitizeForFirestore({
        ...sanitizedReport,
        authorId: userId,
        photos: sanitizedReport.photos || [],
        adminFeedback: null,
        history: [
          {
            status: sanitizedReport.status,
            changedBy: userId,
            timestamp: Timestamp.now(),
            notes: 'Report initialized.'
          }
        ],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })

      const docRef = await addDoc(collection(fdb, 'narrative_reports'), firestorePayload)

      if ((sanitizedReport.status === 'submitted' || sanitizedReport.status === 'approved') && sanitizedReport.eventId) {
        try {
          await updateDoc(doc(fdb, 'events', sanitizedReport.eventId), { status: 'completed' })
        } catch (evErr) {
          console.warn('Failed to update event status to completed:', evErr)
        }
      }

      // Mirror to local cache so reading is instant
      const localReports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
      const localObj = {
        ...sanitizedReport,
        id: docRef.id,
        authorId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      const existingIdx = localReports.findIndex((r) => r.id === docRef.id)
      if (existingIdx !== -1) {
        localReports[existingIdx] = localObj
      } else {
        localReports.push(localObj)
      }
      saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, localReports)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dommunity_reports_updated'))
      }

      return { ...sanitizedReport, id: docRef.id }
    } catch (firestoreError) {
      console.warn('Firestore addDoc failed, using resilient local storage fallback:', firestoreError)
      // Save locally so the coordinator NEVER loses their report!
      const reports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
      const fallbackReport = {
        ...report,
        id: 'report-' + Math.random().toString(36).substr(2, 9),
        authorId: userId,
        photos: report.photos || [],
        adminFeedback: null,
        syncStatus: 'local_pending',
        syncError: firestoreError.message || String(firestoreError),
        history: [
          {
            status: report.status,
            changedBy: userId,
            timestamp: new Date().toISOString(),
            notes: 'Report saved locally (Cloud sync pending).'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      reports.push(fallbackReport)
      saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, reports)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dommunity_reports_updated'))
      }
      return fallbackReport
    }
  }
}

export const updateReport = async (reportId, updates, userId) => {
  if (isDemoMode) {
    const reports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
    const idx = reports.findIndex((r) => r.id === reportId)
    if (idx !== -1) {
      const oldStatus = reports[idx].status
      const history = [...(reports[idx].history || [])]

      if (updates.status && updates.status !== oldStatus) {
        history.push({
          status: updates.status,
          changedBy: userId,
          timestamp: new Date().toISOString(),
          notes: updates.adminFeedback
            ? `Returned: ${updates.adminFeedback}`
            : `Status changed to ${updates.status}`
        })
      }

      reports[idx] = {
        ...reports[idx],
        ...updates,
        history,
        updatedAt: new Date().toISOString()
      }

      saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, reports)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dommunity_reports_updated'))
      }

      // Event status updates
      if (
        (updates.status === 'submitted' || updates.status === 'approved') &&
        reports[idx].eventId
      ) {
        await updateEvent(reports[idx].eventId, { status: 'completed' })
      }
      return reports[idx]
    }
    throw new Error('Report not found')
  } else {
    try {
      let sanitizedUpdates = { ...updates }

      if (sanitizedUpdates.narrative && typeof sanitizedUpdates.narrative === 'string') {
        try {
          sanitizedUpdates.narrative = await ensureHtmlUnderFirestoreLimit(sanitizedUpdates.narrative, {
            storage: fstorage
          })
        } catch (compErr) {
          console.warn('Narrative image pre-compression failed:', compErr)
        }
      }

      if (Array.isArray(sanitizedUpdates.photos) && sanitizedUpdates.photos.length > 0) {
        sanitizedUpdates.photos = await Promise.all(
          sanitizedUpdates.photos.map(async (photo) => {
            if (typeof photo === 'string' && photo.startsWith('data:image/') && photo.length > 50000) {
              try {
                return await compressImage(photo, { maxWidth: 1000, maxHeight: 1000, quality: 0.7 })
              } catch {
                return photo
              }
            }
            return photo
          })
        )
      }

      const dbUpdates = sanitizeForFirestore({ ...sanitizedUpdates, updatedAt: Timestamp.now() })
      let rep = null
      try {
        const reportDoc = await getDoc(doc(fdb, 'narrative_reports', reportId))
        rep = reportDoc.exists() ? reportDoc.data() : null
      } catch (getErr) {
        console.warn('Failed to fetch existing report doc before update:', getErr)
      }

      if (rep && sanitizedUpdates.status && sanitizedUpdates.status !== rep.status) {
        const history = [...(rep.history || [])]
        history.push({
          status: sanitizedUpdates.status,
          changedBy: userId,
          timestamp: Timestamp.now(),
          notes: sanitizedUpdates.adminFeedback
            ? `Returned: ${sanitizedUpdates.adminFeedback}`
            : `Status changed to ${sanitizedUpdates.status}`
        })
        dbUpdates.history = history
      }

      await updateDoc(doc(fdb, 'narrative_reports', reportId), dbUpdates)

      if (rep && (sanitizedUpdates.status === 'submitted' || sanitizedUpdates.status === 'approved') && rep.eventId) {
        try {
          await updateDoc(doc(fdb, 'events', rep.eventId), { status: 'completed' })
        } catch (evErr) {
          console.warn('Failed to update event status to completed:', evErr)
        }
      }

      // Also mirror to local storage cache
      const localReports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
      const idx = localReports.findIndex((r) => r.id === reportId)
      if (idx !== -1) {
        localReports[idx] = {
          ...localReports[idx],
          ...sanitizedUpdates,
          updatedAt: new Date().toISOString()
        }
        saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, localReports)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dommunity_reports_updated'))
        }
      }
      return { id: reportId, ...sanitizedUpdates }
    } catch (firestoreError) {
      console.warn('Firestore updateDoc failed, updating local storage fallback:', firestoreError)
      const reports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
      const idx = reports.findIndex((r) => r.id === reportId)
      if (idx !== -1) {
        reports[idx] = {
          ...reports[idx],
          ...updates,
          syncStatus: 'local_pending',
          syncError: firestoreError.message || String(firestoreError),
          updatedAt: new Date().toISOString()
        }
        saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, reports)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dommunity_reports_updated'))
        }
        return reports[idx]
      }
      throw firestoreError
    }
  }
}

/**
 * Permanently deletes a narrative report from Firestore (or local cache in demo mode).
 * Cleans up linked storage files and marks the event as cleared to prevent
 * automatic resurrection of pending reports.
 */
export const deleteReport = async (reportId) => {
  if (!reportId) return false

  // 1. Identify associated report details before removing
  let eventId = null
  let photos = []
  let docxUrl = null

  const localReports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
  const found = localReports.find((r) => r.id === reportId)
  if (found) {
    if (found.eventId) eventId = found.eventId
    if (Array.isArray(found.photos)) photos = found.photos
    if (found.originalDocxUrl) docxUrl = found.originalDocxUrl
  }

  if (!isDemoMode) {
    try {
      const snap = await getDoc(doc(fdb, 'narrative_reports', reportId))
      if (snap.exists()) {
        const d = snap.data()
        if (d) {
          if (d.eventId) eventId = d.eventId
          if (Array.isArray(d.photos) && d.photos.length > 0) photos = d.photos
          if (d.originalDocxUrl) docxUrl = d.originalDocxUrl
        }
      }
    } catch (fetchErr) {
      console.warn('[db.js] Error fetching report doc before deletion:', fetchErr)
    }
  }

  // 2. Mark event as cleared to suppress ensurePendingReports
  if (eventId) {
    recordClearedReportEventId(eventId)
    try {
      await updateEvent(eventId, { reportCleared: true, narrativeReportCleared: true })
    } catch (e) {
      console.warn('[db.js] Failed to update event reportCleared flag:', e)
    }
  }

  // 3. Attempt to clean up storage files if any
  if (!isDemoMode && fstorage) {
    const cleanupUrls = [...photos, docxUrl].filter(
      (u) => typeof u === 'string' && u.startsWith('https://firebasestorage.googleapis.com')
    )
    for (const url of cleanupUrls) {
      try {
        const storageItemRef = ref(fstorage, url)
        await deleteObject(storageItemRef)
      } catch {}
    }
  }

  // 4. Remove document from Firestore if in cloud mode
  if (!isDemoMode) {
    try {
      await deleteDoc(doc(fdb, 'narrative_reports', reportId))
    } catch (delErr) {
      console.warn('[db.js] Firestore deleteDoc failed:', delErr)
      if (delErr.code === 'permission-denied') {
        throw delErr
      }
    }
  }

  // 5. Clean local storage mirrors and helper keys
  const updatedReports = (getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []).filter(
    (r) => r.id !== reportId
  )
  saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, updatedReports)

  try {
    localStorage.removeItem(`dommunity_gdocs_${reportId}`)
    localStorage.removeItem(`dommunity_docx_${reportId}`)
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dommunity_reports_updated'))
  }

  return true
}

/**
 * Removes all approved reports from Firestore and local cache to reduce database size.
 * Marks linked completed events as reportCleared to prevent re-generation.
 */
export const clearApprovedReports = async () => {
  let clearedCount = 0

  if (isDemoMode) {
    const localReports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
    const approvedReports = localReports.filter((r) => r.status === 'approved')
    for (const rep of approvedReports) {
      if (rep.eventId) {
        recordClearedReportEventId(rep.eventId)
        try {
          await updateEvent(rep.eventId, { reportCleared: true, narrativeReportCleared: true })
        } catch {}
      }
      try {
        localStorage.removeItem(`dommunity_gdocs_${rep.id}`)
        localStorage.removeItem(`dommunity_docx_${rep.id}`)
      } catch {}
    }
    const remaining = localReports.filter((r) => r.status !== 'approved')
    saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, remaining)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dommunity_reports_updated'))
    }
    return approvedReports.length
  }

  // Cloud Mode: Delete from Firestore narrative_reports collection
  try {
    const qSnap = await getDocs(
      query(collection(fdb, 'narrative_reports'), where('status', '==', 'approved'))
    )

    for (const d of qSnap.docs) {
      const data = d.data()
      if (data && data.eventId) {
        recordClearedReportEventId(data.eventId)
        try {
          await updateEvent(data.eventId, { reportCleared: true, narrativeReportCleared: true })
        } catch {}
      }

      // Clean up storage files if present
      if (fstorage) {
        const fileUrls = [
          ...(Array.isArray(data.photos) ? data.photos : []),
          data.originalDocxUrl
        ].filter(
          (u) => typeof u === 'string' && u.startsWith('https://firebasestorage.googleapis.com')
        )
        for (const url of fileUrls) {
          try {
            await deleteObject(ref(fstorage, url))
          } catch {}
        }
      }

      try {
        localStorage.removeItem(`dommunity_gdocs_${d.id}`)
        localStorage.removeItem(`dommunity_docx_${d.id}`)
      } catch {}

      await deleteDoc(doc(fdb, 'narrative_reports', d.id))
      clearedCount++
    }
  } catch (firestoreErr) {
    console.warn('[db.js] Error querying/deleting approved reports from Firestore:', firestoreErr)
    // Fallback: iterate over local approved reports to attempt deleteDoc on each
    const localReports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []
    const approved = localReports.filter((r) => r.status === 'approved')
    for (const rep of approved) {
      try {
        if (!rep.id.startsWith('report-')) {
          await deleteDoc(doc(fdb, 'narrative_reports', rep.id))
        }
        clearedCount++
      } catch {}
      if (rep.eventId) {
        recordClearedReportEventId(rep.eventId)
      }
    }
  }

  // Clean local storage cache
  const updatedReports = (getLocalData(LOCAL_STORAGE_KEYS.REPORTS) || []).filter(
    (r) => r.status !== 'approved'
  )
  saveLocalData(LOCAL_STORAGE_KEYS.REPORTS, updatedReports)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dommunity_reports_updated'))
  }

  return clearedCount
}

if (typeof window !== 'undefined') {
  window.dommunityClearApprovedReports = clearApprovedReports
  window.dommunityDeleteReport = deleteReport
}

// Simulated Storage / File Upload
// Encodes loaded image file to base64 for Demo Mode, or uploads to Firebase Storage in Cloud Mode with fallback
export const uploadPhoto = async (academicYear, eventId, file) => {
  const readAsBase64 = () =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })

  if (isDemoMode || !fstorage) {
    return await readAsBase64()
  }

  try {
    const cleanFileName = `photo_${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    const storagePath = `narratives/AY_${academicYear.replace('/', '_')}/event_${eventId}/${cleanFileName}`
    const storageRef = ref(fstorage, storagePath)
    const uploadPromise = uploadBytes(storageRef, file).then(() => getDownloadURL(storageRef))
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Storage timeout')), 4000)
    )
    return await Promise.race([uploadPromise, timeoutPromise])
  } catch (err) {
    console.warn('Firebase Storage upload failed, falling back to Base64 data URL:', err)
    return await readAsBase64()
  }
}

// Upload raw DOCX report file without conversion (preserves binary format)
// Uses Firebase Storage if available, with immediate Base64 fallback if bucket is unprovisioned or offline
export const uploadDocxReportFile = async (academicYear, eventId, file) => {
  const readAsBase64 = () =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result) // Base64 data URL
      reader.onerror = (error) => reject(error)
    })

  if (isDemoMode || !fstorage) {
    return await readAsBase64()
  }

  try {
    const cleanFileName = `docx_${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    const ay = (academicYear || 'General').toString().replace('/', '_')
    const ev = (eventId || 'unassigned').toString()
    const storagePath = `narratives/AY_${ay}/event_${ev}/${cleanFileName}`
    const storageRef = ref(fstorage, storagePath)

    // Set 4-second timeout to avoid 2-minute freeze if Firebase Storage is not provisioned
    const uploadPromise = uploadBytes(storageRef, file).then(() => getDownloadURL(storageRef))
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firebase Storage unavailable or timeout')), 4000)
    )

    return await Promise.race([uploadPromise, timeoutPromise])
  } catch (err) {
    console.warn(
      'Firebase Storage failed (bucket unprovisioned or rules reject). Falling back to Base64 data URL:',
      err
    )
    // Seamless fallback to Base64 data URL: preserves exact file binary without breaking submission
    return await readAsBase64()
  }
}

export const getInventoryTransactions = async () => {
  if (isDemoMode) {
    const list = (getLocalData('dommunity_inventory_transactions') || []).map((d) => ({
      ...d,
      action: d.action || d.type || 'added',
      unit: d.unit || d.baseUnit || 'pieces',
      itemName: d.itemName || d.name || 'Unknown Item'
    }))
    return list.sort((a, b) => new Date(b.date) - new Date(a.date))
  } else {
    try {
      const qSnap = await getDocs(collection(fdb, 'inventory_transactions'))
      const list = []
      qSnap.forEach((snap) => {
        const d = snap.data()
        list.push({
          id: snap.id,
          ...d,
          action: d.action || d.type || 'added',
          unit: d.unit || d.baseUnit || 'pieces',
          itemName: d.itemName || d.name || 'Unknown Item',
          date:
            d.date && typeof d.date.toDate === 'function' ? d.date.toDate().toISOString() : d.date
        })
      })
      return list.sort((a, b) => new Date(b.date) - new Date(a.date))
    } catch (e) {
      console.warn('Failed Firestore transactions load, falling back:', e)
      const list = (getLocalData('dommunity_inventory_transactions') || []).map((d) => ({
        ...d,
        action: d.action || d.type || 'added',
        unit: d.unit || d.baseUnit || 'pieces',
        itemName: d.itemName || d.name || 'Unknown Item'
      }))
      return list.sort((a, b) => new Date(b.date) - new Date(a.date))
    }
  }
}

export const logInventoryTransaction = async (action, itemName, quantity, unit, details = '') => {
  const tx = {
    action,
    itemName,
    quantity,
    unit,
    details,
    date: new Date().toISOString()
  }

  if (isDemoMode) {
    const list = getLocalData('dommunity_inventory_transactions') || []
    list.push({ id: 'tx-' + Math.random().toString(36).substr(2, 9), ...tx })
    saveLocalData('dommunity_inventory_transactions', list)
  } else {
    try {
      await addDoc(collection(fdb, 'inventory_transactions'), {
        ...tx,
        date: Timestamp.now()
      })
    } catch (e) {
      console.error('Failed writing transaction to Firestore:', e)
      const list = getLocalData('dommunity_inventory_transactions') || []
      list.push({ id: 'tx-' + Math.random().toString(36).substr(2, 9), ...tx })
      saveLocalData('dommunity_inventory_transactions', list)
    }
  }
}

export const updateOrganization = async (orgId, updates) => {
  if (isDemoMode) {
    const orgs = getLocalData(LOCAL_STORAGE_KEYS.ORGANIZATIONS)
    const idx = orgs.findIndex((o) => o.id === orgId)
    if (idx !== -1) {
      orgs[idx] = { ...orgs[idx], ...updates }
      saveLocalData(LOCAL_STORAGE_KEYS.ORGANIZATIONS, orgs)
      return orgs[idx]
    }
    throw new Error('Organization not found')
  } else {
    await updateDoc(doc(fdb, 'organizations', orgId), updates)
    return { id: orgId, ...updates }
  }
}

export const deleteOrganization = async (orgId) => {
  if (isDemoMode) {
    const orgs = getLocalData(LOCAL_STORAGE_KEYS.ORGANIZATIONS)
    const filtered = orgs.filter((o) => o.id !== orgId)
    saveLocalData(LOCAL_STORAGE_KEYS.ORGANIZATIONS, filtered)
    return true
  } else {
    await deleteDoc(doc(fdb, 'organizations', orgId))
    return true
  }
}

export const runInventoryDeduplicationMigration = async () => {
  if (isDemoMode) {
    const inventory = getLocalData(LOCAL_STORAGE_KEYS.INVENTORY) || []
    if (inventory.length === 0) return

    const merged = []
    const toDeleteIds = []
    const nameReplacements = {}

    inventory.forEach((item) => {
      const cleanName = item.name.toLowerCase().trim()
      const cleanCategory = (item.category || '').toLowerCase().trim()
      const cleanUnit = (item.unit || '').toLowerCase().trim()
      const cleanExpiry = item.expiryDate
        ? new Date(item.expiryDate).toISOString().split('T')[0]
        : null

      const master = merged.find((m) => {
        const mName = m.name.toLowerCase().trim()
        const mCategory = (m.category || '').toLowerCase().trim()
        const mUnit = (m.unit || '').toLowerCase().trim()
        const mExpiry = m.expiryDate ? new Date(m.expiryDate).toISOString().split('T')[0] : null
        return (
          areNamesSimilar(mName, cleanName) &&
          mCategory === cleanCategory &&
          mUnit === cleanUnit &&
          mExpiry === cleanExpiry
        )
      })

      if (master) {
        master.quantity += item.quantity
        master.status = computeInventoryStatus(master.quantity, master.expiryDate)
        master.updatedAt = new Date().toISOString()

        toDeleteIds.push(item.id)
        if (item.name !== master.name) {
          nameReplacements[item.name] = master.name
        }
      } else {
        merged.push({ ...item })
      }
    })

    if (toDeleteIds.length > 0) {
      saveLocalData(LOCAL_STORAGE_KEYS.INVENTORY, merged)

      const transactions = getLocalData('dommunity_inventory_transactions') || []
      let txUpdated = false
      transactions.forEach((tx) => {
        if (nameReplacements[tx.itemName]) {
          tx.itemName = nameReplacements[tx.itemName]
          txUpdated = true
        }
      })
      if (txUpdated) {
        saveLocalData('dommunity_inventory_transactions', transactions)
      }
      console.log(`Deduplication migration ran successfully. Merged ${toDeleteIds.length} items.`)
    }
  } else {
    try {
      const qSnap = await getDocs(collection(fdb, 'inventory'))
      const inventory = []
      qSnap.forEach((docSnap) => {
        inventory.push({ id: docSnap.id, ...docSnap.data() })
      })

      if (inventory.length === 0) return

      const merged = []
      const duplicateUpdates = []
      const toDeleteIds = []
      const nameReplacements = {}

      inventory.forEach((item) => {
        const cleanName = item.name.toLowerCase().trim()
        const cleanCategory = (item.category || '').toLowerCase().trim()
        const cleanUnit = (item.unit || '').toLowerCase().trim()
        const cleanExpiry = item.expiryDate
          ? (item.expiryDate instanceof Timestamp
              ? item.expiryDate.toDate()
              : new Date(item.expiryDate)
            )
              .toISOString()
              .split('T')[0]
          : null

        const master = merged.find((m) => {
          const mName = m.name.toLowerCase().trim()
          const mCategory = (m.category || '').toLowerCase().trim()
          const mUnit = (m.unit || '').toLowerCase().trim()
          const mExpiry = m.expiryDate
            ? (m.expiryDate instanceof Timestamp ? m.expiryDate.toDate() : new Date(m.expiryDate))
                .toISOString()
                .split('T')[0]
            : null
          return (
            areNamesSimilar(mName, cleanName) &&
            mCategory === cleanCategory &&
            mUnit === cleanUnit &&
            mExpiry === cleanExpiry
          )
        })

        if (master) {
          master.quantity += item.quantity
          master.status = computeInventoryStatus(master.quantity, master.expiryDate)

          const existingUpdate = duplicateUpdates.find((u) => u.id === master.id)
          if (existingUpdate) {
            existingUpdate.quantity = master.quantity
            existingUpdate.status = master.status
          } else {
            duplicateUpdates.push({
              id: master.id,
              quantity: master.quantity,
              status: master.status
            })
          }

          toDeleteIds.push(item.id)
          if (item.name !== master.name) {
            nameReplacements[item.name] = master.name
          }
        } else {
          merged.push({ ...item })
        }
      })

      for (const update of duplicateUpdates) {
        await updateDoc(doc(fdb, 'inventory', update.id), {
          quantity: update.quantity,
          status: update.status,
          updatedAt: Timestamp.now()
        })
      }

      for (const id of toDeleteIds) {
        await deleteDoc(doc(fdb, 'inventory', id))
      }

      if (Object.keys(nameReplacements).length > 0) {
        const txSnap = await getDocs(collection(fdb, 'inventory_transactions'))
        for (const txDoc of txSnap.docs) {
          const txData = txDoc.data()
          if (nameReplacements[txData.itemName]) {
            await updateDoc(doc(fdb, 'inventory_transactions', txDoc.id), {
              itemName: nameReplacements[txData.itemName]
            })
          }
        }
      }

      if (toDeleteIds.length > 0) {
        console.log(
          `Firestore deduplication migration ran successfully. Merged ${toDeleteIds.length} items.`
        )
      }
    } catch (e) {
      console.error('Failed executing Firestore inventory deduplication migration:', e)
    }
  }
}
