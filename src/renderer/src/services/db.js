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
  verifyPasswordResetCode
} from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import {
  db as fdb,
  auth as fauth,
  storage as fstorage,
  isDemoMode,
  firebaseConfig
} from '../firebase'

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
  RESET_REQUESTS: 'dommunity_reset_requests'
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

const getLocalData = (key) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error(`Failed to parse localStorage key "${key}":`, e)
    return null
  }
}
const saveLocalData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error(`Failed to save localStorage key "${key}":`, e)
  }
}

// ==========================================
// 2. EXPOSED API SERVICES
// ==========================================

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
      saveLocalData(LOCAL_STORAGE_KEYS.LOGGED_IN_USER, user)
      return user
    } else {
      throw new Error('Invalid email or password credentials.')
    }
  } else {
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

    const userCredential = await signInWithEmailAndPassword(fauth, loginEmail, password)
    let userData = null

    try {
      const userDoc = await getDoc(doc(fdb, 'users', userCredential.user.uid))
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
        await signOut(fauth)
        throw new Error('This account is inactive. Please contact the CES Admin.')
      }
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
      status: 'active'
    }
    return fallbackUser
  }
}

export const logout = async () => {
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
          localStorage.removeItem(LOCAL_STORAGE_KEYS.LOGGED_IN_USER)
          callback(null, { deactivated: true })
        } else {
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
      migrateLocalDataToFirebase().catch((err) => console.error('Migration error:', err))

      let unsubscribeUserSnapshot = null

      const unsubscribeAuth = onAuthStateChanged(fauth, (firebaseUser) => {
        if (unsubscribeUserSnapshot) {
          unsubscribeUserSnapshot()
          unsubscribeUserSnapshot = null
        }

        if (firebaseUser) {
          const userDocRef = doc(fdb, 'users', firebaseUser.uid)
          unsubscribeUserSnapshot = onSnapshot(
            userDocRef,
            async (snapshot) => {
              try {
                if (snapshot.exists()) {
                  const userData = snapshot.data()
                  if (userData.status === 'inactive') {
                    if (unsubscribeUserSnapshot) {
                      unsubscribeUserSnapshot()
                      unsubscribeUserSnapshot = null
                    }
                    await signOut(fauth)
                    callback(null, { deactivated: true })
                  } else {
                    callback(userData)
                  }
                } else {
                  if (unsubscribeUserSnapshot) {
                    unsubscribeUserSnapshot()
                    unsubscribeUserSnapshot = null
                  }
                  await signOut(fauth)
                  callback(null, { deactivated: true })
                }
              } catch (err) {
                console.error('Firestore user snapshot handling error:', err)
                callback(null)
              }
            },
            (err) => {
              console.error('Firestore user snapshot listener error:', err)
              callback(null)
            }
          )
        } else {
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
  organizationId = null
) => {
  const normalizedRole = role === 'admin' ? 'admin' : 'office_coordinator'
  const assignedOrg = normalizedRole === 'admin' ? organizationId || null : organizationId || null

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
      (err) => console.error('Users snapshot error:', err)
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
  return await confirmPasswordReset(fauth, oobCode, newPassword)
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
      (err) => console.error('Organizations snapshot error:', err)
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
    const inventory = getLocalData(LOCAL_STORAGE_KEYS.INVENTORY)
    return sortInventory(inventory)
  } else {
    const qSnap = await getDocs(collection(fdb, 'inventory'))
    const items = qSnap.docs.map((d) => ({
      ...d.data(),
      id: d.id,
      expiryDate: d.data().expiryDate ? d.data().expiryDate.toDate().toISOString() : null,
      receivedDate: d.data().receivedDate.toDate().toISOString()
    }))
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
              : data.receivedDate
          }
        })
        callback(sortInventory(items))
      },
      (err) => console.error('Inventory snapshot error:', err)
    )
  }
}

// Helper: Determine inventory status including expired detection
const computeInventoryStatus = (quantity, expiryDate) => {
  if (quantity === 0) return 'out of stock'
  if (expiryDate && new Date(expiryDate) < new Date()) return 'expired'
  if (quantity <= 10) return 'low stock'
  return 'available'
}

// Algorithmic sorting:
// 1. Prioritize consumables with expiryDates. Sort by nearest expiry first.
// 2. For non-consumables (no expiryDate), sort by FIFO (oldest receivedDate first).
// 3. Exclude Out of Stock (quantity = 0) and Expired items to separate sections.
const sortInventory = (items) => {
  // Recompute status for all items (catches newly expired items)
  const updatedItems = items.map((item) => ({
    ...item,
    status: computeInventoryStatus(item.quantity, item.expiryDate)
  }))

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

export const addInventoryItem = async (item, userId) => {
  const cleanExpiry = item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : null
  const cleanName = item.name.toLowerCase().trim()
  const cleanCategory = (item.category || '').toLowerCase().trim()
  const cleanUnit = (item.unit || '').toLowerCase().trim()

  if (isDemoMode) {
    const inventory = getLocalData(LOCAL_STORAGE_KEYS.INVENTORY)
    const existing = inventory.find((i) => {
      const existingName = i.name.toLowerCase().trim()
      const existingCategory = (i.category || '').toLowerCase().trim()
      const existingUnit = (i.unit || '').toLowerCase().trim()
      const existingExpiry = i.expiryDate
        ? new Date(i.expiryDate).toISOString().split('T')[0]
        : null
      return (
        areNamesSimilar(existingName, cleanName) &&
        existingCategory === cleanCategory &&
        existingUnit === cleanUnit &&
        existingExpiry === cleanExpiry
      )
    })

    if (existing) {
      existing.quantity += item.quantity
      existing.status = computeInventoryStatus(existing.quantity, existing.expiryDate)
      existing.lastUpdatedBy = userId
      existing.hasBeenReleased = false
      existing.updatedAt = new Date().toISOString()
      saveLocalData(LOCAL_STORAGE_KEYS.INVENTORY, inventory)
      return existing
    }

    const newItem = {
      ...item,
      id: 'inv-' + Math.random().toString(36).substr(2, 9),
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
      const existingUnit = (d.unit || '').toLowerCase().trim()
      const existingExpiry = d.expiryDate ? d.expiryDate.toDate().toISOString().split('T')[0] : null
      if (
        areNamesSimilar(existingName, cleanName) &&
        existingCategory === cleanCategory &&
        existingUnit === cleanUnit &&
        existingExpiry === cleanExpiry
      ) {
        existingRef = docSnap.ref
        existingData = { id: docSnap.id, ...d }
      }
    })

    if (existingRef && existingData) {
      const newQty = existingData.quantity + item.quantity
      const newStatus = computeInventoryStatus(newQty, item.expiryDate)
      await updateDoc(existingRef, {
        quantity: newQty,
        status: newStatus,
        lastUpdatedBy: userId,
        hasBeenReleased: false,
        updatedAt: Timestamp.now()
      })
      return {
        ...existingData,
        quantity: newQty,
        status: newStatus,
        hasBeenReleased: false,
        updatedAt: new Date().toISOString()
      }
    }

    const newItemData = {
      ...item,
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
    return { ...item, id: docRef.id, hasBeenReleased: false }
  }
}

export const updateInventoryItem = async (itemId, updates, userId) => {
  if (updates.quantity !== undefined || updates.expiryDate !== undefined) {
    const qty = updates.quantity !== undefined ? updates.quantity : 0
    const exp = updates.expiryDate !== undefined ? updates.expiryDate : null
    updates.status = computeInventoryStatus(qty, exp)
  }

  if (isDemoMode) {
    const inventory = getLocalData(LOCAL_STORAGE_KEYS.INVENTORY)
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
      (err) => console.error('Donors snapshot error:', err)
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
      (err) => console.error('Donations snapshot error:', err)
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
      (err) => console.error('Events snapshot error:', err)
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
    return newEvent
  } else {
    const docRef = await addDoc(collection(fdb, 'events'), {
      ...event,
      scheduleDate: Timestamp.fromDate(new Date(event.scheduleDate)),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    return { ...event, id: docRef.id }
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
      return events[idx]
    }
    throw new Error('Event not found')
  } else {
    const dbUpdates = { ...updates, updatedAt: Timestamp.now() }
    if (updates.scheduleDate) {
      dbUpdates.scheduleDate = Timestamp.fromDate(new Date(updates.scheduleDate))
    }
    await updateDoc(doc(fdb, 'events', eventId), dbUpdates)
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

// --- NARRATIVE REPORT SERVICES ---

export const getReports = async () => {
  if (isDemoMode) {
    return getLocalData(LOCAL_STORAGE_KEYS.REPORTS)
  } else {
    const qSnap = await getDocs(collection(fdb, 'narrative_reports'))
    return qSnap.docs.map((d) => {
      const data = d.data()
      return {
        ...data,
        id: d.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
      }
    })
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
        callback(reports)
      },
      (err) => {
        console.error('Real-time reports snapshot listener error:', err)
      }
    )
  }
}

export const addReport = async (report, userId) => {
  if (isDemoMode) {
    const reports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS)
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
    const docRef = await addDoc(collection(fdb, 'narrative_reports'), {
      ...report,
      authorId: userId,
      photos: report.photos || [],
      adminFeedback: null,
      history: [
        {
          status: report.status,
          changedBy: userId,
          timestamp: Timestamp.now(),
          notes: 'Report initialized.'
        }
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })

    if ((report.status === 'submitted' || report.status === 'approved') && report.eventId) {
      await updateDoc(doc(fdb, 'events', report.eventId), { status: 'completed' })
    }

    return { ...report, id: docRef.id }
  }
}

export const updateReport = async (reportId, updates, userId) => {
  if (isDemoMode) {
    const reports = getLocalData(LOCAL_STORAGE_KEYS.REPORTS)
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
    const dbUpdates = { ...updates, updatedAt: Timestamp.now() }
    const reportDoc = await getDoc(doc(fdb, 'narrative_reports', reportId))
    const rep = reportDoc.exists() ? reportDoc.data() : null

    if (rep && updates.status && updates.status !== rep.status) {
      const history = [...(rep.history || [])]
      history.push({
        status: updates.status,
        changedBy: userId,
        timestamp: Timestamp.now(),
        notes: updates.adminFeedback
          ? `Returned: ${updates.adminFeedback}`
          : `Status changed to ${updates.status}`
      })
      dbUpdates.history = history
    }

    await updateDoc(doc(fdb, 'narrative_reports', reportId), dbUpdates)

    if (rep && (updates.status === 'submitted' || updates.status === 'approved') && rep.eventId) {
      await updateDoc(doc(fdb, 'events', rep.eventId), { status: 'completed' })
    }
  }
}

// Simulated Storage / File Upload
// Encodes loaded image file to base64 for Demo Mode, or uploads to Firebase Storage in Cloud Mode
export const uploadPhoto = async (academicYear, eventId, file) => {
  if (isDemoMode) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result) // Base64 data URL
      reader.onerror = (error) => reject(error)
    })
  } else {
    const cleanFileName = `photo_${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    const storagePath = `narratives/AY_${academicYear.replace('/', '_')}/event_${eventId}/${cleanFileName}`
    const storageRef = ref(fstorage, storagePath)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
  }
}

export const getInventoryTransactions = async () => {
  if (isDemoMode) {
    const list = getLocalData('dommunity_inventory_transactions') || []
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
          date:
            d.date && typeof d.date.toDate === 'function' ? d.date.toDate().toISOString() : d.date
        })
      })
      return list.sort((a, b) => new Date(b.date) - new Date(a.date))
    } catch (e) {
      console.warn('Failed Firestore transactions load, falling back:', e)
      const list = getLocalData('dommunity_inventory_transactions') || []
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
