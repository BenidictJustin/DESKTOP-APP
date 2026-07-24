/**
 * DommUnity Firebase Restore Script
 * -----------------------------------
 * Recreates Firebase Auth accounts and restores Firestore to the original SEED_DATA.
 * Run with: node scripts/restore-firebase.mjs
 */

import { initializeApp, deleteApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore'

// ─── Firebase Config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyAYY5QiO_V0EgMGm9B9uT4GJuGYgTaTkRs',
  authDomain: 'dommunity.firebaseapp.com',
  projectId: 'dommunity',
  storageBucket: 'dommunity.firebasestorage.app',
  messagingSenderId: '157413712739',
  appId: '1:157413712739:web:96c13411b4c9a0a0302956'
}

// ─── Accounts to recreate ─────────────────────────────────────────────────────
const ACCOUNTS = [
  {
    email: 'admin@gmail.com',
    password: 'admin12345',
    uid_placeholder: 'user-admin',
    username: 'admin',
    name: 'Faithful Anne F. Arugay',
    role: 'admin',
    organizationId: null,
    status: 'active'
  },
  {
    email: 'coordinator@gmail.com',
    password: 'coordinator123',
    uid_placeholder: 'user-office',
    username: 'jonnel',
    name: 'Jonnel B. Manio',
    role: 'office_coordinator',
    organizationId: null,
    status: 'active'
  }
]

// ─── Seed Data (matches db.js SEED_DATA exactly) ─────────────────────────────
const now = Timestamp.now()
const toTS = (d) => Timestamp.fromDate(new Date(d))

const SEED = {
  ORGANIZATIONS: [
    {
      id: 'dept-cba',
      name: 'College of Business Administration',
      abbreviation: 'CBA',
      description: 'Business and entrepreneurial extension projects.',
      coordinatorId: null, // will be linked after coordinator accounts exist
      type: 'department',
      createdAt: now
    },
    {
      id: 'dept-cs',
      name: 'College of Computer Studies',
      abbreviation: 'CCS',
      description: 'IT literacy and tech support programs.',
      coordinatorId: null,
      type: 'department',
      createdAt: now
    },
    {
      id: 'dept-coed',
      name: 'College of Education',
      abbreviation: 'COED',
      description: 'Literacy, tutoring, and youth mentoring outreach.',
      coordinatorId: null,
      type: 'department',
      createdAt: now
    },
    {
      id: 'org-ssc',
      name: 'Supreme Student Council',
      abbreviation: 'SSC',
      description: 'Student body outreach and advocacy programs.',
      coordinatorId: null,
      type: 'organization',
      createdAt: now
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
      receivedDate: toTS(new Date(2026, 5, 1)),
      status: 'available',
      lastUpdatedBy: 'user-admin',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'inv-2',
      name: 'Pencils',
      category: 'school supplies',
      unit: 'pieces',
      quantity: 180,
      expiryDate: null,
      receivedDate: toTS(new Date(2026, 5, 1)),
      status: 'available',
      lastUpdatedBy: 'user-admin',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'inv-3a',
      name: 'Sardines (Canned)',
      category: 'food packs',
      unit: 'cans',
      quantity: 3,
      expiryDate: toTS(new Date(2026, 6, 15)),
      receivedDate: toTS(new Date(2026, 4, 10)),
      status: 'low stock',
      lastUpdatedBy: 'user-admin',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'inv-3b',
      name: 'Sardines (Canned)',
      category: 'food packs',
      unit: 'cans',
      quantity: 3,
      expiryDate: toTS(new Date(2026, 8, 20)),
      receivedDate: toTS(new Date(2026, 4, 15)),
      status: 'low stock',
      lastUpdatedBy: 'user-admin',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'inv-3c',
      name: 'Sardines (Canned)',
      category: 'food packs',
      unit: 'cans',
      quantity: 2,
      expiryDate: toTS(new Date(2026, 11, 1)),
      receivedDate: toTS(new Date(2026, 5, 1)),
      status: 'low stock',
      lastUpdatedBy: 'user-admin',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'inv-4',
      name: 'Instant Noodles',
      category: 'food packs',
      unit: 'packs',
      quantity: 55,
      expiryDate: toTS(new Date(2026, 9, 30)),
      receivedDate: toTS(new Date(2026, 5, 15)),
      status: 'available',
      lastUpdatedBy: 'user-admin',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'inv-5',
      name: 'Hygiene Soap',
      category: 'hygiene kits',
      unit: 'bars',
      quantity: 120,
      expiryDate: toTS(new Date(2027, 11, 1)),
      receivedDate: toTS(new Date(2026, 5, 20)),
      status: 'available',
      lastUpdatedBy: 'user-admin',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'inv-6',
      name: 'Expired Biscuits',
      category: 'food packs',
      unit: 'packs',
      quantity: 0,
      expiryDate: toTS(new Date(2026, 4, 1)),
      receivedDate: toTS(new Date(2026, 2, 1)),
      status: 'out of stock',
      lastUpdatedBy: 'user-admin',
      createdAt: now,
      updatedAt: now
    }
  ],
  DONORS: [
    {
      id: 'donor-1',
      name: 'DCT High School Alumni Association',
      type: 'external_sponsor',
      contactEmail: 'alumni@dct.edu.ph',
      contactPhone: '09171234567',
      createdAt: now
    },
    {
      id: 'donor-2',
      name: 'Senior High School Department',
      type: 'internal_department',
      contactEmail: 'shs@dct.edu.ph',
      contactPhone: '09187654321',
      createdAt: now
    },
    {
      id: 'donor-3',
      name: 'Mrs. Josefina Cruz',
      type: 'individual',
      contactEmail: 'josefina@gmail.com',
      contactPhone: '09095551234',
      createdAt: now
    }
  ],
  DONATIONS: [
    {
      id: 'don-1',
      donorId: 'donor-2',
      dateOfDonation: toTS(new Date(2026, 5, 1)),
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
      dateOfDonation: toTS(new Date(2026, 4, 10)),
      purpose: 'Typhoon Relief Operation',
      description: 'Food and hygiene kits for relief.',
      items: [
        { name: 'Sardines (Canned)', quantity: 8, unit: 'cans', expiryDate: toTS(new Date(2026, 6, 15)) },
        { name: 'Instant Noodles', quantity: 55, unit: 'packs', expiryDate: toTS(new Date(2026, 9, 30)) },
        { name: 'Hygiene Soap', quantity: 120, unit: 'bars', expiryDate: toTS(new Date(2027, 11, 1)) }
      ],
      receivedBy: 'user-admin'
    }
  ],
  EVENTS: [
    {
      id: 'event-1',
      name: 'Pamaskong Handog Gift Giving',
      description: 'Gift distribution and feeding program for families in Brgy. Tibag.',
      scheduleDate: toTS(new Date(2026, 11, 18, 9, 0)),
      location: 'Brgy. Tibag, Tarlac City',
      assignedOrganizationId: 'dept-cba',
      status: 'planned',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'event-2',
      name: 'Basic Computer Literacy Training',
      description: 'Teaching high school students basic HTML and MS Office tools.',
      scheduleDate: toTS(new Date(2026, 6, 10, 13, 0)),
      location: 'DCT CCS Computer Lab 2',
      assignedOrganizationId: 'dept-cs',
      status: 'planned',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'event-3',
      name: 'CES Annual Blood Donation Drive',
      description: 'Blood letting activity in coordination with Red Cross Tarlac.',
      scheduleDate: toTS(new Date(2026, 7, 5, 8, 0)),
      location: 'DCT Gymnasium',
      assignedOrganizationId: 'dept-coed',
      status: 'planned',
      createdAt: now,
      updatedAt: now
    }
  ]
  // NOTE: Reports reference authorId = Firebase UIDs, set after accounts are created
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function deleteCollection(db, collectionName) {
  const snap = await getDocs(collection(db, collectionName))
  if (snap.empty) {
    console.log(`  [skip] ${collectionName} is already empty`)
    return
  }
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
  console.log(`  [deleted] ${snap.size} docs from '${collectionName}'`)
}

async function createOrGetAuthUser(auth, email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    console.log(`  [created] Auth user: ${email} → uid: ${cred.user.uid}`)
    return cred.user.uid
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      // User already exists — sign in to get UID
      const cred = await signInWithEmailAndPassword(auth, email, password)
      console.log(`  [exists]  Auth user: ${email} → uid: ${cred.user.uid}`)
      return cred.user.uid
    }
    throw err
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔥 DommUnity Firebase Restore Script')
  console.log('=====================================\n')

  // Initialize primary app
  const app = initializeApp(firebaseConfig, 'RestoreApp')
  const db = getFirestore(app)
  const auth = getAuth(app)

  // ── Step 1: Recreate Auth accounts ──────────────────────────────────────────
  console.log('STEP 1: Recreating Firebase Auth accounts...')
  const uidMap = {}

  for (const account of ACCOUNTS) {
    // Use a secondary app per user to avoid signing out the current session
    const secApp = initializeApp(firebaseConfig, `SecApp_${account.email}_${Date.now()}`)
    const secAuth = getAuth(secApp)
    try {
      const uid = await createOrGetAuthUser(secAuth, account.email, account.password)
      uidMap[account.uid_placeholder] = uid
    } finally {
      await signOut(secAuth).catch(() => {})
      await deleteApp(secApp)
    }
  }

  console.log('\n  UID mapping:', uidMap)

  // ── Step 1b: Sign in as admin on primary app so Firestore rules pass ─────────
  console.log('\nSTEP 1b: Signing in as admin for Firestore access...')
  try {
    await signInWithEmailAndPassword(auth, ACCOUNTS[0].email, ACCOUNTS[0].password)
    console.log('  [signed in] as', ACCOUNTS[0].email)
  } catch (err) {
    console.error('  [error] Could not sign in as admin:', err.message)
    throw err
  }

  // ── Step 2: Clear all existing Firestore collections ────────────────────────
  console.log('\nSTEP 2: Clearing existing Firestore data...')
  const COLLECTIONS = [
    'users', 'organizations', 'inventory', 'donors',
    'donations', 'events', 'narrative_reports',
    'inventory_transactions', 'system'
  ]
  for (const col of COLLECTIONS) {
    await deleteCollection(db, col)
  }

  // ── Step 3: Write Users ──────────────────────────────────────────────────────
  console.log('\nSTEP 3: Writing user documents to Firestore...')
  for (const account of ACCOUNTS) {
    const uid = uidMap[account.uid_placeholder]
    if (!uid) {
      console.warn(`  [skip] No UID found for ${account.email}`)
      continue
    }
    const userData = {
      uid,
      username: account.username,
      email: account.email,
      name: account.name,
      role: account.role,
      organizationId: account.organizationId,
      status: account.status,
      createdAt: now,
      updatedAt: now
    }
    await setDoc(doc(db, 'users', uid), userData)
    console.log(`  [written] users/${uid} (${account.email})`)
  }

  // ── Step 4: Write Organizations ──────────────────────────────────────────────
  console.log('\nSTEP 4: Writing organizations...')
  for (const org of SEED.ORGANIZATIONS) {
    await setDoc(doc(db, 'organizations', org.id), org)
    console.log(`  [written] organizations/${org.id}`)
  }

  // ── Step 5: Write Inventory ──────────────────────────────────────────────────
  console.log('\nSTEP 5: Writing inventory items...')
  for (const item of SEED.INVENTORY) {
    const itemData = { ...item, lastUpdatedBy: uidMap['user-admin'] || item.lastUpdatedBy }
    await setDoc(doc(db, 'inventory', item.id), itemData)
    console.log(`  [written] inventory/${item.id} — ${item.name}`)
  }

  // ── Step 6: Write Donors ──────────────────────────────────────────────────────
  console.log('\nSTEP 6: Writing donors...')
  for (const donor of SEED.DONORS) {
    await setDoc(doc(db, 'donors', donor.id), donor)
    console.log(`  [written] donors/${donor.id} — ${donor.name}`)
  }

  // ── Step 7: Write Donations ────────────────────────────────────────────────────
  console.log('\nSTEP 7: Writing donations...')
  for (const donation of SEED.DONATIONS) {
    const donData = { ...donation, receivedBy: uidMap['user-admin'] || donation.receivedBy }
    await setDoc(doc(db, 'donations', donation.id), donData)
    console.log(`  [written] donations/${donation.id}`)
  }

  // ── Step 8: Write Events ────────────────────────────────────────────────────────
  console.log('\nSTEP 8: Writing events...')
  for (const event of SEED.EVENTS) {
    await setDoc(doc(db, 'events', event.id), event)
    console.log(`  [written] events/${event.id} — ${event.name}`)
  }

  // ── Step 9: Write Narrative Reports ────────────────────────────────────────────
  console.log('\nSTEP 9: Writing narrative reports...')
  const adminUid = uidMap['user-admin'] || 'user-admin'

  const report1 = {
    id: 'report-1',
    eventId: 'event-3',
    authorId: adminUid,
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
        changedBy: adminUid,
        timestamp: toTS(new Date(2025, 7, 5)),
        notes: 'Report started.'
      },
      {
        status: 'approved',
        changedBy: adminUid,
        timestamp: toTS(new Date(2025, 7, 10)),
        notes: 'Approved by Head of CES.'
      }
    ],
    createdAt: toTS(new Date(2025, 7, 5)),
    updatedAt: toTS(new Date(2025, 7, 10))
  }

  const report2 = {
    id: 'report-2',
    eventId: 'event-2',
    authorId: adminUid, // originally 'user-cs' — mapped to admin since no CS coordinator
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
        changedBy: adminUid,
        timestamp: toTS(new Date(2026, 6, 12)),
        notes: 'First draft.'
      },
      {
        status: 'submitted',
        changedBy: adminUid,
        timestamp: toTS(new Date(2026, 6, 13)),
        notes: 'Submitted for review.'
      },
      {
        status: 'returned',
        changedBy: adminUid,
        timestamp: toTS(new Date(2026, 6, 14)),
        notes: 'Returned for adding images.'
      }
    ],
    createdAt: toTS(new Date(2026, 6, 12)),
    updatedAt: toTS(new Date(2026, 6, 14))
  }

  await setDoc(doc(db, 'narrative_reports', report1.id), report1)
  console.log(`  [written] narrative_reports/report-1`)
  await setDoc(doc(db, 'narrative_reports', report2.id), report2)
  console.log(`  [written] narrative_reports/report-2`)

  // ── Step 10: Mark migration as complete ────────────────────────────────────────
  console.log('\nSTEP 10: Marking migration as complete...')
  await setDoc(doc(db, 'system', 'migration'), {
    completed: true,
    migratedAt: now
  })
  console.log('  [written] system/migration')

  // ── Done ────────────────────────────────────────────────────────────────────────
  await deleteApp(app)

  console.log('\n✅ RESTORE COMPLETE!')
  console.log('=====================================')
  console.log('Auth Accounts:')
  ACCOUNTS.forEach((a) => {
    const uid = uidMap[a.uid_placeholder]
    console.log(`  ${a.email} / ${a.password}  → uid: ${uid || 'FAILED'}`)
  })
  console.log('\nFirestore Collections Restored:')
  console.log('  users: 2 docs')
  console.log('  organizations: 4 docs (CBA, CCS, COED, SSC)')
  console.log('  inventory: 8 docs')
  console.log('  donors: 3 docs')
  console.log('  donations: 2 docs')
  console.log('  events: 3 docs')
  console.log('  narrative_reports: 2 docs')
  console.log('  system/migration: marked complete\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('\n❌ RESTORE FAILED:', err.message || err)
  process.exit(1)
})
