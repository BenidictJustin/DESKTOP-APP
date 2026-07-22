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
  Timestamp
} from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db as fdb, auth as fauth, storage as fstorage, isDemoMode, firebaseConfig } from '../firebase'

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
    let loginEmail = email.trim()
    if (!loginEmail.includes('@')) {
      const q = query(collection(fdb, 'users'), where('username', '==', loginEmail))
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        loginEmail = querySnapshot.docs[0].data().email
      } else {
        const q2 = query(collection(fdb, 'users'), where('username', '==', loginEmail.toLowerCase()))
        const querySnapshot2 = await getDocs(q2)
        if (!querySnapshot2.empty) {
          loginEmail = querySnapshot2.docs[0].data().email
        } else {
          throw new Error('User record not found in system database.')
        }
      }
    }
    const userCredential = await signInWithEmailAndPassword(fauth, loginEmail, password)
    const userDoc = await getDoc(doc(fdb, 'users', userCredential.user.uid))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      if (userData.status === 'inactive') {
        await signOut(fauth)
        throw new Error('This account is inactive. Please contact the CES Admin.')
      }
      return userData
    }
    throw new Error('User record not found in system database.')
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
    const localOrgs = getLocalData(LOCAL_STORAGE_KEYS.ORGANIZATIONS) || SEED_DATA.ORGANIZATIONS || []
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
      const pwd = user.email === 'admin@gmail.com' ? 'admin12345' : 
                  (user.email === 'coordinator@gmail.com' ? 'coordinator123' : 
                   (user.password || 'password123'))
      
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
    await secondaryApp.delete()

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
        receivedDate: inv.receivedDate ? Timestamp.fromDate(new Date(inv.receivedDate)) : Timestamp.now(),
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
        dateOfDonation: don.dateOfDonation ? Timestamp.fromDate(new Date(don.dateOfDonation)) : Timestamp.now(),
        notes: don.notes || '',
        items: (don.items || []).map(item => ({
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
        scheduleDate: ev.scheduleDate ? Timestamp.fromDate(new Date(ev.scheduleDate)) : Timestamp.now(),
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
        history: (rep.history || []).map(h => ({
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
    try {
      const user = getLocalData(LOCAL_STORAGE_KEYS.LOGGED_IN_USER)
      callback(user)
    } catch (e) {
      console.error("Auth change listener failed in Demo Mode:", e)
      callback(null)
    }
    return () => {}
  } else {
    try {
      // Trigger migration check/run in Cloud Mode
      migrateLocalDataToFirebase().catch(err => console.error("Migration error:", err))

      return onAuthStateChanged(fauth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            const userDoc = await getDoc(doc(fdb, 'users', firebaseUser.uid))
            if (userDoc.exists()) {
              callback(userDoc.data())
            } else {
              callback(null)
            }
          } else {
            callback(null)
          }
        } catch (err) {
          console.error("Firestore user fetch failed in auth listener:", err)
          callback(null)
        }
      })
    } catch (e) {
      console.error("Auth listener registration failed:", e)
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
  role,
  organizationId = null
) => {
  if (isDemoMode) {
    const users = getLocalData(LOCAL_STORAGE_KEYS.USERS)

    const newUid = 'user-' + Math.random().toString(36).substr(2, 9)
    const newUser = {
      uid: newUid,
      username,
      email,
      password,
      name,
      role,
      organizationId,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    users.push(newUser)
    saveLocalData(LOCAL_STORAGE_KEYS.USERS, users)

    return newUser
  } else {
    // Real mode (Admin registers using Firebase Auth)
    // To prevent logging out the admin, we initialize a secondary Firebase app instance.
    const secondaryAppName = 'SecondaryApp_' + Date.now()
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName)
    const secondaryAuth = getAuth(secondaryApp)
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
      const newUid = userCredential.user.uid

      const userDocRef = doc(fdb, 'users', newUid)
      const userData = {
        uid: newUid,
        username,
        email,
        name,
        role,
        organizationId,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await setDoc(userDocRef, userData)

      return userData
    } finally {
      await secondaryApp.delete()
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
    return qSnap.docs.map((d) => ({ ...d.data(), uid: d.id }))
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

export const deleteUser = async (uid) => {
  if (isDemoMode) {
    let users = getLocalData(LOCAL_STORAGE_KEYS.USERS)
    users = users.filter((u) => u.uid !== uid)
    saveLocalData(LOCAL_STORAGE_KEYS.USERS, users)
    return true
  } else {
    await deleteDoc(doc(fdb, 'users', uid))
    return true
  }
}

// Coordinator password reset requests
export const requestPasswordReset = async (email) => {
  if (isDemoMode) {
    const users = getLocalData(LOCAL_STORAGE_KEYS.USERS)
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user) throw new Error('Email address not found in system directory.')

    if (user.role !== 'admin') {
      throw new Error(
        'Password recovery is restricted to Admin accounts only. Please contact the CES Admin to request a password reset.'
      )
    }

    return true
  } else {
    const usersRef = collection(fdb, 'users')
    const q = query(usersRef, where('email', '==', email))
    const qSnap = await getDocs(q)

    if (qSnap.empty) {
      throw new Error('Email address not found in system directory.')
    }

    const userDoc = qSnap.docs[0].data()
    if (userDoc.role !== 'admin') {
      throw new Error(
        'Password recovery is restricted to Admin accounts only. Please contact the CES Admin to request a password reset.'
      )
    }

    await sendPasswordResetEmail(fauth, email)
    return true
  }
}

export const sendCoordinatorResetEmail = async (email) => {
  if (isDemoMode) {
    const users = getLocalData(LOCAL_STORAGE_KEYS.USERS)
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user) throw new Error('Email address not found in system directory.')
    return true
  } else {
    await sendPasswordResetEmail(fauth, email)
    return true
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

export const addOrganization = async (org) => {
  if (isDemoMode) {
    const orgs = getLocalData(LOCAL_STORAGE_KEYS.ORGANIZATIONS)
    const newOrg = {
      ...org,
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
      coordinatorId: org.coordinatorId || null,
      logo: org.logo || null,
      createdAt: new Date()
    })
    return org
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
        existingName === cleanName &&
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
        existingName === cleanName &&
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
        dateOfDonation: data.dateOfDonation.toDate().toISOString(),
        items: data.items.map((item) => ({
          ...item,
          expiryDate: item.expiryDate ? item.expiryDate.toDate().toISOString() : null
        }))
      }
    })
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
          i.name.toLowerCase() === dItem.name.toLowerCase() &&
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
    for (const dItem of donation.items) {
      const q = query(collection(fdb, 'inventory'), where('name', '==', dItem.name))
      const snap = await getDocs(q)
      let match = null

      snap.docs.forEach((docSnap) => {
        const invD = docSnap.data()
        const invExp = invD.expiryDate ? invD.expiryDate.toDate().toISOString() : null
        const targetExp = dItem.expiryDate ? new Date(dItem.expiryDate).toISOString() : null
        if (invExp === targetExp) {
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
      scheduleDate: d.data().scheduleDate.toDate().toISOString()
    }))
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
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString()
      }
    })
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
