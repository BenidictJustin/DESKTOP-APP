# Appendix C: Database Design

This document details the database schema and data dictionary for **DommUnity: A Desktop-Based Management System for the Community Extension & Services (CES) Office of Dominican College of Tarlac, Inc.** implemented using **Firebase Firestore** NoSQL Cloud Database.

---

### Table Name: `users`
**Purpose:** To store authorized user credentials, personal profiles, assigned institutional roles, and access control permissions.

| Field Name | Data Type | Example Value |
| :--- | :--- | :--- |
| `uid` | String | `"usr_98a7sd8f7a"` |
| `username` | String | `"ces_admin"` |
| `email` | String | `"faithful.arugay@dct.edu.ph"` |
| `name` | String | `"Faithful Anne F. Arugay"` |
| `role` | String | `"admin"` *(or `"office_coordinator"`, `"department_coordinator"`)* |
| `organizationId` | String | `"dept_cba_01"` *(or `null` for Admin)* |
| `status` | String | `"active"` *(or `"deactivated"`)* |
| `createdAt` | Timestamp | `2026-08-15 08:30:00` |
| `updatedAt` | Timestamp | `2026-08-20 14:15:00` |

---

### Table Name: `organizations`
**Purpose:** To store academic department and student organization profiles, institutional abbreviations, descriptions, and assigned department coordinators.

| Field Name | Data Type | Example Value |
| :--- | :--- | :--- |
| `id` | String | `"dept_cba_01"` |
| `name` | String | `"College of Business Administration"` |
| `abbreviation` | String | `"CBA"` |
| `description` | String | `"Department handling business administration and accountancy."` |
| `logoUrl` | String | `"https://storage.googleapis.com/.../cba_logo.png"` |
| `coordinatorId` | String | `"usr_dept_coord_02"` |
| `createdAt` | Timestamp | `2026-08-01 09:00:00` |

---

### Table Name: `inventory`
**Purpose:** To track physical supplies and consumable relief goods with batch-level expiration dates, stock quantities, and FIFO distribution status.

| Field Name | Data Type | Example Value |
| :--- | :--- | :--- |
| `id` | String | `"inv_item_101"` |
| `name` | String | `"Canned Sardines (155g)"` |
| `category` | String | `"Food Packs"` *(or `"Hygiene Kits"`, `"School Supplies"`)* |
| `unit` | String | `"Cans"` *(or `"Pieces"`, `"Packs"`, `"Boxes"`)* |
| `quantity` | Number | `150` |
| `expiryDate` | Timestamp | `2027-06-30 00:00:00` *(or `null` for non-consumables)* |
| `receivedDate` | Timestamp | `2026-08-10 10:00:00` |
| `donationId` | String | `"don_batch_501"` |
| `status` | String | `"available"` *(or `"low stock"`, `"out of stock"`, `"expired"`)* |
| `lastUpdatedBy` | String | `"usr_98a7sd8f7a"` |
| `createdAt` | Timestamp | `2026-08-10 10:00:00` |
| `updatedAt` | Timestamp | `2026-08-18 11:20:00` |

---

### Table Name: `inventory_transactions`
**Purpose:** To record an audit trail of all inventory movements including items added, staged, released for outreach, or safely discarded.

| Field Name | Data Type | Example Value |
| :--- | :--- | :--- |
| `id` | String | `"tx_88392"` |
| `action` | String | `"Released"` *(or `"Added"`, `"Deleted"`)* |
| `itemName` | String | `"Canned Sardines (155g)"` |
| `quantity` | Number | `50` |
| `unit` | String | `"Cans"` |
| `details` | String | `"Released for Barangay San Nicolas Relief Outreach"` |
| `date` | Timestamp | `2026-08-20 13:45:00` |

---

### Table Name: `donors`
**Purpose:** To maintain master records of internal school departments, institutional sponsors, and individual donors.

| Field Name | Data Type | Example Value |
| :--- | :--- | :--- |
| `id` | String | `"dnr_402"` |
| `name` | String | `"College of Computer Studies (CCS)"` |
| `type` | String | `"Internal Department"` *(or `"External Sponsor"`, `"Individual"`)* |
| `contactEmail` | String | `"ccs.dept@dct.edu.ph"` |
| `contactPhone` | String | `"+63 917 123 4567"` |
| `createdAt` | Timestamp | `2026-08-05 14:00:00` |

---

### Table Name: `donations`
**Purpose:** To log donation batches, contribution purposes, and itemized lists of donated supplies received by the CES Office.

| Field Name | Data Type | Example Value |
| :--- | :--- | :--- |
| `id` | String | `"don_batch_501"` |
| `donorId` | String | `"dnr_402"` |
| `dateOfDonation` | Timestamp | `2026-08-12 09:30:00` |
| `purpose` | String | `"Balik-Eskwela Outreach 2026"` |
| `description` | String | `"Donation of notebooks and hygiene packs from student council drive."` |
| `items` | Array (JSON) | `[{"name": "Notebooks", "quantity": 100, "unit": "Pieces", "expiryDate": null}]` |
| `receivedBy` | String | `"usr_98a7sd8f7a"` |

---

### Table Name: `events`
**Purpose:** To manage scheduled outreach activities, partner community locations, dates, and assigned department co-organizers.

| Field Name | Data Type | Example Value |
| :--- | :--- | :--- |
| `id` | String | `"evt_701"` |
| `name` | String | `"Pamaskong Handog Outreach 2026"` |
| `description` | String | `"Community gift-giving and feeding program for underprivileged families."` |
| `scheduleDate` | Timestamp | `2026-12-15 08:00:00` |
| `location` | String | `"Sitio Target, Barangay Sapang Bato, Tarlac"` |
| `assignedOrganizationId` | String | `"dept_cba_01"` |
| `status` | String | `"planned"` *(or `"ongoing"`, `"completed"`, `"cancelled"`)* |
| `createdAt` | Timestamp | `2026-08-01 10:00:00` |
| `updatedAt` | Timestamp | `2026-08-15 16:30:00` |

---

### Table Name: `narrative_reports`
**Purpose:** To store post-activity narrative documentation, rich text content, attached photo URLs (maximum 10 images), and administrative review status.

| Field Name | Data Type | Example Value |
| :--- | :--- | :--- |
| `id` | String | `"rpt_301"` |
| `eventId` | String | `"evt_701"` |
| `authorId` | String | `"usr_dept_coord_02"` |
| `organizationId` | String | `"dept_cba_01"` |
| `type` | String | `"Outreach Program"` *(or `"Blood Donation"`, `"Department Program"`)* |
| `semester` | String | `"1st Semester"` |
| `academicYear` | String | `"2026-2027"` |
| `narrative` | String (HTML / Text) | `"<p>On December 15, 2026, the CBA department conducted...</p>"` |
| `photos` | Array (Objects) | `[{"url": "https://firebasestorage...", "uploadedAt": "2026-12-16"}]` |
| `status` | String | `"submitted"` *(or `"draft"`, `"returned"`, `"approved"`)* |
| `adminFeedback` | String | `"Please attach clearer photos of beneficiary signing."` *(or `null`)* |
| `createdAt` | Timestamp | `2026-12-16 10:00:00` |
| `updatedAt` | Timestamp | `2026-12-17 15:30:00` |

---
