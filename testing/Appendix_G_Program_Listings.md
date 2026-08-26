# Appendix G: Program Listings

This document contains the complete set of core source code listings for **DommUnity: A Desktop-Based Management System for the Community Extension & Services (CES) Office of Dominican College of Tarlac, Inc.** organized logically by the 11 major modules and functional components corresponding to the study's specific objectives.

---

### Module 1: Firebase Cloud Integration & Environment Initializer
* **File Location:** `src/renderer/src/firebase.js`
* **Programming Language / Technology:** JavaScript (ES6+), Firebase SDK v10 (App, Auth, Firestore, Storage)
* **Key Functions & Objects:** `initializeApp()`, `initializeAuth()`, `getFirestore()`, `getStorage()`, `indexedDBLocalPersistence`
* **Purpose:** Initializes Firebase client SDK services (Authentication, Firestore Database, and Cloud Storage) with persistent local storage configurations adapted for the Electron desktop environment and automatic offline/demo fallback handling.

```javascript
import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Load environment variables for secure Firebase connection
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Check if credentials exist in local environment
const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.authDomain
)

let app
let auth
let db
let storage
let isDemoMode = true

if (isFirebaseConfigured) {
  try {
    // 1. Initialize or retrieve existing Firebase App instance
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

    // 2. Initialize Auth with persistent IndexedDB storage suitable for Electron desktop
    try {
      auth = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence]
      })
    } catch {
      // Fallback if Auth is already initialized (e.g., during Vite Hot Module Reloading)
      auth = getAuth(app)
    }

    // 3. Initialize Firestore Database & Cloud Storage
    db = getFirestore(app)
    storage = getStorage(app)
    isDemoMode = false
    console.log('Firebase initialized successfully. Running in Cloud Mode.')
  } catch (error) {
    console.error('Failed to initialize Firebase, falling back to Local Mode:', error)
    isDemoMode = true
  }
} else {
  console.log('No Firebase config detected. Running in Local Storage fallback mode.')
}

export { app, auth, db, storage, isDemoMode, firebaseConfig }
```

---

### Module 2: User Authentication & Role Gateway Submodule
* **File Location:** `src/renderer/src/components/Login.jsx`
* **Programming Language / Technology:** React JSX, Tailwind CSS, Lucide Icons
* **Key Functions & Hooks:** `Login()`, `handleLoginSubmit()`, `useState()`
* **Purpose:** Provides the primary security gateway for the desktop application, validating user credentials, enforcing password strength rules, and redirecting users to either the Admin or Department Coordinator dashboard based on role-based access control (RBAC).

```javascript
import React, { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react'
import { loginUser } from '../services/db'

export function Login({ onLoginSuccess }) {
  // State management for user credentials, password visibility toggle, and error states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Step 1: Client-side validation checks
    if (!email.trim()) {
      setError('Please enter your email address or username.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    try {
      // Step 2: Authenticate via Firebase & fetch user profile with assigned role
      const userProfile = await loginUser(email.trim(), password)
      
      // Step 3: Check account status
      if (userProfile.status === 'deactivated') {
        throw new Error('This account has been deactivated. Please contact the CES Administrator.')
      }

      // Step 4: Pass authenticated user to app router for role-based dashboard loading
      onLoginSuccess(userProfile)
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your login details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-card-container">
      <form onSubmit={handleLoginSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl border border-red-200">
            {error}
          </div>
        )}
        
        {/* Email or Username Input */}
        <div className="relative">
          <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Username or institutional email"
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-blue/15"
          />
        </div>

        {/* Password Input with Visibility Toggle Button */}
        <div className="relative">
          <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min. 8 characters)"
            className="w-full pl-9 pr-10 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-blue/15"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Submit Authentication Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-navy-blue text-white rounded-xl text-xs font-semibold hover:bg-navy-blue/90 flex items-center justify-center space-x-2"
        >
          <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
```

---

### Module 3: User Account Administration & RBAC Management
* **File Location:** `src/renderer/src/services/db.js`
* **Programming Language / Technology:** JavaScript (ES6+), Firebase Firestore, Firebase Auth Secondary App API
* **Key Functions:** `registerUser()`, `updateUser()`, `deactivateUser()`
* **Purpose:** Enables the System Administrator to register new institutional accounts, edit coordinator profiles, update access permissions, and deactivate/delete user credentials without disrupting the active administrator session.

```javascript
import { doc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { db as fdb, firebaseConfig } from '../firebase'

/**
 * Registers a new user account without disrupting the currently logged-in Admin session
 * Uses an isolated secondary Firebase App instance.
 */
export const registerUser = async (
  email,
  username,
  password,
  name,
  role = 'office_coordinator',
  organizationId = null
) => {
  const cleanEmail = (email || '').trim().toLowerCase()
  
  // Create isolated secondary app to avoid logging out the current admin
  const secondaryAppName = 'SecondaryApp_' + Date.now()
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName)
  const secondaryAuth = getAuth(secondaryApp)

  try {
    // Step 1: Create credentials in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password)
    const newUid = userCredential.user.uid

    // Step 2: Store role-based profile in Firestore 'users' collection
    const userDocRef = doc(fdb, 'users', newUid)
    const userData = {
      uid: newUid,
      username: username || cleanEmail.split('@')[0] || '',
      email: cleanEmail,
      name,
      role, // 'admin', 'office_coordinator', or 'department_coordinator'
      organizationId, // Reference to assigned college department
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    await setDoc(userDocRef, userData)
    return userData
  } finally {
    // Cleanup temporary secondary app instance
    await deleteApp(secondaryApp)
  }
}

/**
 * Updates existing user account profile and role assignments
 */
export const updateUser = async (userId, updates) => {
  const userRef = doc(fdb, 'users', userId)
  await updateDoc(userRef, {
    ...updates,
    updatedAt: Timestamp.now()
  })
}

/**
 * Deactivates user account access (prevents login while preserving audit history)
 */
export const deactivateUser = async (userId) => {
  const userRef = doc(fdb, 'users', userId)
  await updateDoc(userRef, {
    status: 'deactivated',
    updatedAt: Timestamp.now()
  })
}
```

---

### Module 4: Password Recovery & Security Verification Submodule
* **File Location:** `src/renderer/src/components/ResetPassword.jsx`
* **Programming Language / Technology:** React JSX, Firebase Auth Action Codes
* **Key Functions & Hooks:** `ResetPassword()`, `handleResetSubmit()`, `verifyResetCode()`, `resetPasswordWithCode()`
* **Purpose:** Verifies secure out-of-band (OOB) email reset tokens and validates new password strength constraints before updating credentials in Firebase Authentication.

```javascript
import { useState, useEffect } from 'react'
import { verifyResetCode, resetPasswordWithCode } from '../services/db'

export default function ResetPassword({ oobCode, onComplete }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    // Validate password complexity rules
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.')
      return
    }
    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setFormError('Password must combine uppercase, lowercase, numbers, and special characters.')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      // Confirm password reset with Firebase OOB code
      await resetPasswordWithCode(oobCode, password)
      onComplete()
    } catch (err) {
      setFormError(err.message || 'Failed to reset password. Link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleResetSubmit} className="space-y-4">
      {formError && (
        <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl border border-red-200">
          {formError}
        </div>
      )}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        className="w-full p-2.5 text-xs border rounded-xl"
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
        className="w-full p-2.5 text-xs border rounded-xl"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-navy-blue text-white rounded-xl text-xs font-semibold"
      >
        {loading ? 'Updating Password...' : 'Save New Password'}
      </button>
    </form>
  )
}
```

---

### Module 5: Inventory Stock Status & Expiry Computation Submodule
* **File Location:** `src/renderer/src/services/db.js`
* **Programming Language / Technology:** JavaScript (ES6+), Firebase Firestore
* **Key Functions:** `computeInventoryStatus()`, `addInventoryItem()`, `updateInventoryItem()`
* **Purpose:** Computes real-time inventory status labels (`available`, `low stock` when quantity $\le 10$, `out of stock` when quantity is $0$, and `expired` when shelf-life has lapsed) and persists batch updates to the Firestore database.

```javascript
import { collection, addDoc, updateDoc, doc, Timestamp, getDocs } from 'firebase/firestore'
import { db as fdb } from '../firebase'

/**
 * Computes inventory item stock status based on available units and expiry date
 * - Expired: Expiration date is prior to current date
 * - Out of stock: Quantity is 0 or less
 * - Low stock: Quantity is between 1 and 10 units
 * - Available: Quantity is greater than 10 units
 */
export const computeInventoryStatus = (quantity, expiryDate) => {
  const qty = parseInt(quantity, 10) || 0
  
  // Check if consumable item is past its expiration date
  if (expiryDate) {
    const exp = new Date(expiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (exp < today && qty > 0) {
      return 'expired'
    }
  }

  if (qty <= 0) {
    return 'out of stock'
  } else if (qty <= 10) {
    return 'low stock'
  }
  return 'available'
}

/**
 * Adds a new item batch to the Firestore inventory collection
 */
export const addInventoryItem = async (item, userId) => {
  const cleanName = (item.name || '').trim()
  const cleanCategory = (item.category || 'other').trim()
  const cleanUnit = (item.unit || 'pieces').trim()

  const newItemData = {
    name: cleanName,
    category: cleanCategory,
    unit: cleanUnit,
    quantity: parseInt(item.quantity, 10) || 0,
    receivedDate: item.receivedDate
      ? Timestamp.fromDate(new Date(item.receivedDate))
      : Timestamp.now(),
    expiryDate: item.expiryDate 
      ? Timestamp.fromDate(new Date(item.expiryDate)) 
      : null,
    status: computeInventoryStatus(item.quantity, item.expiryDate),
    donationId: item.donationId || null,
    lastUpdatedBy: userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }

  const docRef = await addDoc(collection(fdb, 'inventory'), newItemData)
  return { ...newItemData, id: docRef.id }
}
```

---

### Module 6: Inventory Release & FIFO Distribution Engine
* **File Location:** `src/renderer/src/modules/admin/AdminDashboard.jsx`
* **Programming Language / Technology:** React JSX, JavaScript (ES6+)
* **Key Functions:** `handleConfirmRelease()`, `updateInventoryItem()`, `logInventoryTransaction()`
* **Purpose:** Executes inventory distribution for outreach operations following the First In, First Out (FIFO) policy, verifies physical quantity sufficiency, deducts released amounts, and writes audit records to the transaction history log.

```javascript
/**
 * Handles confirmation and processing of staged inventory release items
 */
const handleConfirmRelease = async () => {
  if (isOffline) {
    triggerError('Cannot perform action: No active internet connection.')
    return
  }

  // Validate that all queued release items have positive non-zero quantities
  const invalidItem = pendingReleaseItems.find((p) => !p.baseQty || parseInt(p.baseQty, 10) <= 0)
  if (invalidItem) {
    triggerValidationError(
      'Release Confirmation Error',
      `Please specify a valid quantity for "${invalidItem.name}".`,
      [],
      'Ensure all items in the release list have a quantity greater than zero.'
    )
    return
  }

  setLoading(true)
  try {
    // Process each item queued for distribution
    for (const pending of pendingReleaseItems) {
      const item = inventoryList.find((i) => i.id === pending.id)
      if (!item) {
        throw new Error(`Item "${pending.name}" was not found in inventory.`)
      }

      const baseQtyToRelease = parseInt(pending.baseQty, 10)
      if (baseQtyToRelease > item.quantity) {
        throw new Error(
          `Insufficient stock for "${item.name}". Only ${item.quantity} ${item.unit} available.`
        )
      }

      // Step 1: Compute remaining stock and update inventory document
      const updatedQty = item.quantity - baseQtyToRelease
      await updateInventoryItem(
        item.id,
        { quantity: updatedQty, hasBeenReleased: true },
        user.uid
      )

      // Step 2: Record permanent transaction audit entry
      await logInventoryTransaction(
        'released',
        item.name,
        baseQtyToRelease,
        item.unit,
        'Released for community extension outreach program'
      )
    }

    triggerSuccess('Selected inventory items released successfully.')
    setPendingReleaseItems([])
    setIsReviewModalOpen(false)
    loadData()
  } catch (err) {
    triggerError(err.message)
  } finally {
    setLoading(false)
  }
}
```

---

### Module 7: Donor & Donation Batch Management Submodule
* **File Location:** `src/renderer/src/services/db.js`
* **Programming Language / Technology:** JavaScript (ES6+), Firebase Firestore
* **Key Functions:** `addDonor()`, `addDonation()`, `computeInventoryStatus()`
* **Purpose:** Registers donor profiles (internal departments, external sponsors, individuals) and logs batch donations containing multiple item lines, automatically synchronizing incoming quantities into the active inventory collection.

```javascript
import { collection, addDoc, doc, updateDoc, Timestamp, getDocs } from 'firebase/firestore'
import { db as fdb } from '../firebase'
import { computeInventoryStatus } from './db'

/**
 * Registers a new donor profile in Firestore
 */
export const addDonor = async (donor) => {
  const docRef = await addDoc(collection(fdb, 'donors'), {
    name: donor.name.trim(),
    type: donor.type, // 'internal_department', 'external_sponsor', 'individual'
    contactEmail: donor.contactEmail || '',
    contactPhone: donor.contactPhone || '',
    createdAt: Timestamp.now()
  })
  return { ...donor, id: docRef.id }
}

/**
 * Logs a donation batch and automatically populates corresponding inventory records
 */
export const addDonation = async (donation, userId) => {
  const dbItems = donation.items.map((i) => ({
    ...i,
    expiryDate: i.expiryDate ? Timestamp.fromDate(new Date(i.expiryDate)) : null
  }))

  // Step 1: Record Donation Batch document
  const docRef = await addDoc(collection(fdb, 'donations'), {
    donorId: donation.donorId,
    purpose: donation.purpose,
    description: donation.description || '',
    dateOfDonation: Timestamp.fromDate(new Date(donation.dateOfDonation)),
    items: dbItems,
    receivedBy: userId
  })

  const donationId = docRef.id

  // Step 2: Automatically create batch-level item entries in active inventory
  for (const dItem of donation.items) {
    const status = computeInventoryStatus(dItem.quantity, dItem.expiryDate)
    await addDoc(collection(fdb, 'inventory'), {
      name: dItem.name,
      category: dItem.category || 'other',
      unit: dItem.unit,
      quantity: dItem.quantity,
      expiryDate: dItem.expiryDate ? Timestamp.fromDate(new Date(dItem.expiryDate)) : null,
      donationId,
      receivedDate: Timestamp.fromDate(new Date(donation.dateOfDonation)),
      status,
      lastUpdatedBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
  }

  return { ...donation, id: donationId }
}
```

---

### Module 8: Organization & Department Profile Management
* **File Location:** `src/renderer/src/services/db.js`
* **Programming Language / Technology:** JavaScript (ES6+), Firebase Firestore
* **Key Functions:** `addOrganization()`, `updateOrganization()`, `getOrganizations()`
* **Purpose:** Manages academic department records and student organizations under the CES Office, storing abbreviations, descriptions, coordinator links, and official logos.

```javascript
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore'
import { db as fdb } from '../firebase'

/**
 * Registers or saves an Organization / Department profile
 */
export const addOrganization = async (org) => {
  const orgDocRef = doc(fdb, 'organizations', org.id)
  const orgData = {
    id: org.id,
    name: org.name.trim(),
    abbreviation: org.abbreviation.trim(),
    description: org.description || '',
    type: org.type || 'department',
    coordinatorId: org.coordinatorId || null,
    logo: org.logo || null,
    createdAt: new Date().toISOString()
  }

  await setDoc(orgDocRef, orgData)
  return orgData
}

/**
 * Updates an existing organization profile
 */
export const updateOrganization = async (orgId, updates) => {
  await updateDoc(doc(fdb, 'organizations', orgId), updates)
  return { id: orgId, ...updates }
}
```

---

### Module 9: Event Calendar & Outreach Scheduler
* **File Location:** `src/renderer/src/services/db.js`
* **Programming Language / Technology:** JavaScript (ES6+), Firebase Firestore
* **Key Functions:** `addEvent()`, `updateEvent()`, `getEvents()`
* **Purpose:** Manages scheduled extension activities, storing date/time stamps, target community venues, assigned department co-organizers, and workflow status (planned, ongoing, completed).

```javascript
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp, getDocs } from 'firebase/firestore'
import { db as fdb } from '../firebase'

/**
 * Schedules a new community extension outreach event
 */
export const addEvent = async (event, userId) => {
  const docRef = await addDoc(collection(fdb, 'events'), {
    name: event.name.trim(),
    description: event.description || '',
    scheduleDate: Timestamp.fromDate(new Date(event.scheduleDate)),
    location: event.location.trim(),
    assignedOrganizationId: event.assignedOrganizationId,
    status: event.status || 'planned',
    createdBy: userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  })

  return { ...event, id: docRef.id }
}

/**
 * Updates event details or marks outreach as completed
 */
export const updateEvent = async (eventId, updates) => {
  const eventRef = doc(fdb, 'events', eventId)
  const payload = { ...updates, updatedAt: Timestamp.now() }
  if (updates.scheduleDate) {
    payload.scheduleDate = Timestamp.fromDate(new Date(updates.scheduleDate))
  }
  await updateDoc(eventRef, payload)
}
```

---

### Module 10: Narrative Report Review & Lifecycle Management Submodule
* **File Location:** `src/renderer/src/services/db.js`
* **Programming Language / Technology:** JavaScript (ES6+), Firebase Firestore
* **Key Functions:** `addReport()`, `updateReportReviewStatus()`, `getReports()`
* **Purpose:** Manages the multi-stage document lifecycle (Draft $\rightarrow$ Submitted $\rightarrow$ Approved / Returned with Feedback) for narrative reports, synchronizes photo attachments (up to 10 images), and automatically marks outreach events as completed.

```javascript
import { collection, addDoc, updateDoc, doc, Timestamp, getDocs } from 'firebase/firestore'
import { db as fdb } from '../firebase'

/**
 * Creates and submits a new narrative report in Firestore
 */
export const addReport = async (report, userId) => {
  const docRef = await addDoc(collection(fdb, 'narrative_reports'), {
    eventId: report.eventId || null,
    authorId: userId,
    organizationId: report.organizationId,
    type: report.type || 'outreach',
    semester: report.semester,
    academicYear: report.academicYear,
    narrative: report.narrative || '',
    photos: (report.photos || []).slice(0, 10), // Enforce 10 photo maximum limit
    status: report.status || 'submitted',
    adminFeedback: null,
    history: [
      {
        status: report.status || 'submitted',
        changedBy: userId,
        timestamp: Timestamp.now(),
        notes: 'Narrative report submitted for administrative review.'
      }
    ],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  })

  // Automatically update event status to completed upon successful submission
  if ((report.status === 'submitted' || report.status === 'approved') && report.eventId) {
    await updateDoc(doc(fdb, 'events', report.eventId), { status: 'completed' })
  }

  return { ...report, id: docRef.id }
}

/**
 * Updates report review status with administrative feedback notes
 */
export const updateReportReviewStatus = async (reportId, status, feedbackNotes, adminId) => {
  const reportRef = doc(fdb, 'narrative_reports', reportId)
  
  await updateDoc(reportRef, {
    status: status, // "approved" or "returned"
    adminFeedback: feedbackNotes || null,
    updatedAt: Timestamp.now()
  })
}
```

---

### Module 11: Desktop Native Runtime & Main Application Window
* **File Location:** `src/main/index.js`
* **Programming Language / Technology:** JavaScript (Node.js), Electron Main Process API
* **Key Functions:** `createWindow()`, `app.whenReady()`, `shell.openExternal()`
* **Purpose:** Initializes the Electron main desktop process, creates the secure native Chromium browser window, configures Inter-Process Communication (IPC) handlers, and prevents unauthorized external window navigation.

```javascript
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

function createWindow() {
  // Create the native desktop browser window with security settings
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    title: 'DommUnity - Community Extension & Services Management System',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Open external web links in the default desktop browser rather than inside the app
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the Vite development server URL in dev mode, or compiled index.html in production
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Electron lifecycle initialization
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.dommunity.dct')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

---
