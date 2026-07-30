# Functional Design Document (FDD): DommUnity

This document defines the functional specifications, user behaviors, database logic, and user interface workflows for **DommUnity**, a desktop-based management system developed for the Community Extension & Services (CES) Office of Dominican College of Tarlac, Inc.

---

## 1. Project Introduction & Functional Scope

### 1.1 Document Purpose

This Functional Design Document (FDD) translates the technical requirements of the DommUnity application into detailed functional descriptions. It acts as the definitive reference for the system’s modules, user interactions, database-driven workflows, and validation boundaries.

### 1.2 System Overview

**DommUnity** is a native Windows desktop application wrapping a ReactJS SPA inside Electron. It manages and automates the operations of the Dominican College of Tarlac’s Community Extension & Services (CES) Office. The application streamlines three main pillars:

1. **Supplies & Resource Logistics:** Expiration-aware inventory tracking using First-In-First-Out (FIFO) batch sorting.
2. **Community Extension Coordination:** Scheduling and mapping monthly departmental outreach events.
3. **Institutional Reporting:** Collaborative compiling, rich-text formatting, and official PDF/Word rendering of narrative reports.

---

## 2. Roles, Privileges & Scopes

The system enforces three roles to isolate operational concerns and maintain data integrity:

| Role                       | Target User                                  | System Access & Scopes                                                                                                                                                                                        |
| :------------------------- | :------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Admin**                  | Mrs. Faithful Anne F. Arugay (Head of CES)   | Full read/write access. Permissions include account creation, status toggles, inventory logs, event assignments, donor directories, report approvals, and document compilations.                              |
| **Office Coordinator**     | Mr. Jonnel B. Manio (CES Office Coordinator) | Shares identical system clearing and functional rights as the Admin (except for core user account creation/credential modification) to co-manage daily office tasks and review submitted documents.           |
| **Department Coordinator** | Assigned Faculty/Student Representatives     | Scoped access restricted to their assigned department. Permissions are limited to scheduling visibility, writing narratives via the Tiptap editor, uploading activity photos, and tracking submission status. |

---

## 3. Core Functional Modules

### 3.1 Authentication & Profile Gateway

- **Secure Credentials Portal:** Standard login form requiring unique username/email and password strings.
- **Role-Based Gateway Routing:** Authenticates credentials via Firebase Auth. The client reads the Firestore user document to resolve the user role.
  - Users with `Admin` or `Office Coordinator` roles are directed to the main Admin Operations Dashboard.
  - Users with `Department Coordinator` roles are redirected to the Coordinator Portal, scoped strictly to their assigned organization ID.
- **Forgot Password Protocol:**
  - **Admin Accounts:** Triggers a standard password recovery verification link sent to their registered email address.
  - **Department Coordinator Accounts:** Clicking the reset link forwards an in-app notification request directly to the Admin Dashboard. The Admin/Office Coordinator then resets or updates the password manually in the Account panel.

### 3.2 User Account Management (Admin Only)

- **Coordinator Account Creator:** Admin-only view to input coordinator email, username, temporary credentials, and department assignment.
- **Active/Inactive Status Toggle:** A state switch in user profiles. Deactivating a user instantly blocks future login attempts.
- **Single Coordinator Constraint:** Business logic validation preventing the creation of more than one active coordinator account for any single academic department.

### 3.3 Inventory Management Module

- **Item Catalog (CRUD):** Form interface to register, update, or archive inventory supplies (e.g., canned foods, notebooks, hygiene packs). Automatically appends the modifying Admin's user ID and timestamp to the record's modification array.
- **Stock Levels & Status Engine:** Calculates item counts and displays status tags:
  - `Available`: Current quantity > 10 units.
  - `Low Stock`: Current quantity is between 1 and 10 units.
  - `Out of Stock`: Current quantity equals 0 units.
  - `Expired`: Current quantity > 0 but the batch's expiration date is earlier than the system's current date.
- **FIFO & Expiration Distribution Logic:**
  - **Batch-Level Tracking:** Identical items received at different times or carrying different expiration dates are tracked as separate, distinct rows.
  - **Distribution Ordering:** The system queries database items, sorting them to prioritize the oldest batch received (First In, First Out) for non-consumables, and the closest expiration date first for consumables.
  - **Expiration Exclusions:** Expired batches are excluded from active release recommendations and display as red alerts.
- **Expiring-Soon Alerts:** A persistent sidebar widget listing all consumable batches with expiration dates falling within the next 30 days.

### 3.4 Event & Department Coordination Module

- **Monthly Scheduler Calendar:** Grid interface mapping events scheduled per month. Displays event name, scheduled dates, location, category, and status.
- **Department Mapper:** Assigns scheduled events to specific academic departments. Once mapped, the event appears in the assigned department coordinator's workspace.
- **Event Status Tracker:** Toggles event status flags (`Planned`, `Conducted`, `Completed`, `Cancelled`).

### 3.5 Donor & Donation Management Module

- **Donor Directory:** Profile CRUD to search and manage sponsors. Tracks donor name, type (Individual, External Sponsor, School Department), and contact details.
- **Donation History Logger:** Records physical supply donations. Logs receipt date, purpose, list of items, and quantities.
- **Shelf-Life Tracker:** Captures expiration dates for consumable donations at the point of ingestion, syncing the data directly with the stock status engine.

### 3.6 Narrative Reports Module

- **Metadata Configuration:** Dropdown selectors for Academic Year (AY) directories and Semester scopes.
- **Scoped Event Selector:** Restricts department coordinators to selecting only events specifically assigned to their department.
- **Tiptap Rich Text Editor:** A WYSIWYG text editor for narrative diary logs. Provides formatting controls for bold, italics, bullet lists, ordered lists, and undo/redo states.
- **Photo Upload Dropzone:**
  - Enforces a strict limit of 10 photos per report.
  - Restricts file extensions to JPG and PNG.
  - Uploads media directly to Firebase Storage paths structured as `/narratives/AY_XXXX-XXXX/`.
- **Status Dashboard Workflows:**
  - **Save Draft:** Saves progress as a `Draft`, keeping the report editable by the coordinator.
  - **Submit for Approval:** Submits the report to the Admin's review queue, changing status to `Submitted` and locking it from coordinator edits.
  - **Returned for Revision:** If the Admin returns a report, the status changes to `Returned`. The coordinator can view the Admin’s text comments, edit the document, and resubmit.
  - **Approved:** Once approved, the report status becomes `Approved` and is permanently locked from editing by all roles.

### 3.7 Reports Review & Document Compiler (Admin & Office Coordinator)

- **Review Queue:** Scrollable dashboard displaying pending submitted reports.
- **Approval Actions:**
  - **Approve:** Toggles status to `Approved`.
  - **Return:** Opens feedback dialog to input notes, then toggles status to `Returned`.
- **PDF/Word Compiler:** Generates formatted PDF or Word documents combining the narrative rich-text diary and the photo attachments, matching the official CES reporting templates.

---

## 4. Business Logic Rules & Validations

1. **Department Isolation:** Firestore security rules validate that queries from a Department Coordinator match their assigned department ID.
2. **Expired Stock Safety Lock:** The distribution engine blocks users from checking out or recommending items tagged with the `Expired` status.
3. **Registration Constraints:** Creating or editing a user account checks existing documents. The system blocks the activation of a coordinator if an active coordinator is already registered for that department.
4. **Media Constraints:** The photo upload dropzone validates file limits client-side, rejecting actions exceeding 10 files or using unsupported extensions.
