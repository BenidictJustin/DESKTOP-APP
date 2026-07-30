# Project Tasks: DommUnity

This document tracks development progress. Mark tasks as `[ ]` (uncompleted), `[/]` (in progress), or `[x]` (completed).

---

## 1. Project Initialization & Setup

- [x] **Initialize frontend repository structure using ElectronJS, ReactJS, and Tailwind CSS**
  - **User Story**: As a Developer, I want to initialize a desktop project repository using ElectronJS, ReactJS, and Tailwind CSS so that the application runs natively on Windows computers within the Community Extension & Services (CES) Office.
  - **Details**: Built as a Windows desktop application wrapping a ReactJS SPA inside ElectronJS. Use Vanilla/Tailwind CSS styling matching Windows display scales on the CES office computers.

- [x] **Install package dependencies**
  - **User Story**: As a Developer, I want to install all required libraries (shadcn/ui, React Icons, Tiptap, Firebase Client SDK, HTML-to-PDF/DOCX) so that we have the necessary packages for rich text editing, styling, cloud sync, and document generation.
  - **Details**:
    - `@radix-ui` and `shadcn/ui` components for standard UI interfaces.
    - React Icons / Lucide React for consistent iconography.
    - Tiptap editor packages (`@tiptap/core`, `@tiptap/starter-kit`) for narrative writing.
    - `firebase` Client SDK for auth, databases, and media storage.
    - HTML-to-PDF / DOCX exporting libraries capable of generating formatted report documents matching standard CES layouts.

- [x] **Setup configurations**
  - **User Story**: As a Developer, I want to configure the Electron wrapper window, Tailwind CSS theme, and Firebase environments so that the app matches visual identity requirements and connects securely to the cloud.
  - **Details**:
    - Electron window configuration tailored for desktop deployment.
    - Tailwind layout constraints matching design aesthetics (Signature Green: `#80CC2A`, Navy Blue: `#030E69`, and Poppins font family).
    - Firebase configuration file (.env/config.js) linking the desktop app to Firestore and Storage.

---

## 2. Firebase & Database Implementation

- [x] **Set up Firebase Auth email/password provider**
  - **User Story**: As an Authorized User, I want to authenticate using my email and password so that I can securely access the system roles and modules.
  - **Details**: Configure Firebase Authentication dashboard to enable the Email/Password sign-in provider. Direct credential verification.

- [x] **Create Firestore Database Collections**
  - **User Story**: As a Developer, I want to establish database collections in Firestore (users, organizations, inventory, donors, donations, events, narrative_reports) so that the application has structured schemas that store transactional data and metadata.
  - **Details**:
    - `users`: Store UID, name, email, credentials, and role tags (`Admin`, `Office Coordinator`, `Department Coordinator`), and assigned department.
    - `organizations`: Store department profile metadata (department name, code, assigned coordinator).
    - `inventory`: Store inventory item tracking metadata (name, category, unit, quantity, date/time log, and FIFO/expiration records).
    - `donors`: Store sponsor profile metrics (individual, organization, department types).
    - `donations`: Store donation batch log records (date, purpose, nested items arrays, quantities).
    - `events`: Store scheduled events logs (title, description, date, time, location, assigned department, status).
    - `narrative_reports`: Store draft and final reports (Tiptap JSON/HTML document content, semester, academic year, status trackers, photos metadata, and admin feedback notes).

- [x] **Deploy Firestore Security Rules for role-based protection**
  - **User Story**: As a Developer, I want to configure security rules on Firestore so that data read/write permissions are restricted by roles and coordinators can only write or read data that they own or are assigned to.
  - **Details**: Role-based access control (RBAC). Admin and Office Coordinator have full read/write access. Department Coordinators are isolated: they have read access only to their assigned department's events and write/edit access only to narrative reports that match their assigned department ID.

- [x] **Set up Firebase Storage Buckets directory layout `/narratives/AY_XXXX-XXXX/`**
  - **User Story**: As a Developer, I want to configure the Cloud Storage bucket structure so that images uploaded by department coordinators are organized by Academic Year directory paths.
  - **Details**: Organize upload paths using the academic year variable: `/narratives/AY_XXXX-XXXX/` (e.g. `/narratives/AY_2026-2027/`). Restrict write actions to authorized coordinators and enforce JPG/PNG formats.

---

## 3. Module Development

### 3.1 Authentication Module

- [x] **Login screen UI (Signature Green accents, Poppins typography)**
  - **User Story**: As an Authorized User, I want to use a login screen styled with Signature Green accents and Poppins typography so that I can easily enter my credentials and access the system.
  - **Details**: Create login interface using Poppins typography, branding colors (Signature Green: `#80CC2A` accents, Navy Blue: `#030E69` headers). Form validation for empty inputs and invalid email pattern.

- [x] **Sign-up screen UI (Admin creates Department Coordinator accounts)**
  - **User Story**: As an Admin, I want to use a registration interface to create coordinator accounts so that new coordinators can access the system with their specific department assignments.
  - **Details**: Coordinator registration screen accessible only to Admin and Office Coordinator roles. Inputs include full name, email, password, and assigned department dropdown selection.

- [x] **Secure credential matching flow via Firebase Auth**
  - **User Story**: As an Authorized User, I want the system to authenticate my credentials against Firebase Auth so that unauthorized users cannot log into the system.
  - **Details**: Perform credential checks via Firebase Authentication. Automatically route users to dashboards based on fetched role tag.

- [x] **Admin forgot password (email verification link)**
  - **User Story**: As an Admin, I want to request a password reset email link so that I can securely reset my password if I lose my credentials.
  - **Details**: Expose "Forgot Password" option on login for Admin. Triggers email verification/recovery link using Firebase Auth API.

- [x] **Department Coordinator forgot password (admin notification request)**
  - **User Story**: As a Department Coordinator, I want to request a password reset from the Admin so that they can update my password for me since I do not have direct recovery options.
  - **Details**: Coordinators cannot request reset links directly. Clicking forgot password triggers a reset request notification to the Admin. Admin updates the password manually in the Account Management panel.

- [x] **Route redirection gateway by Role type**
  - **User Story**: As an Authorized User, I want to be redirected to the appropriate dashboard (Admin Dashboard or Coordinator Dashboard) based on my role immediately after logging in.
  - **Details**:
    - Admin or Office Coordinator (Mr. Jonnel B. Manio) $\rightarrow$ Admin Dashboard (Full access).
    - Department Coordinator $\rightarrow$ Coordinator Dashboard (Scoped access).

---

### 3.2 User Account Management (Admin-only)

- [x] **Department Coordinator account creator view**
  - **User Story**: As an Admin, I want to view a form to input coordinator account credentials and assign them to a specific department or organization so that I can delegate report creation.
  - **Details**: Admin dashboard section with fields to input coordinator email, username, temporary password, and department picker.

- [x] **Office Coordinator account setup**
  - **User Story**: As an Admin, I want to create Office Coordinator accounts (with Mr. Jonnel B. Manio as the target user) so that they have the same access level as the Head of CES to co-manage the office operations.
  - **Details**: Ensure Office Coordinator accounts receive the exact same admin-level role clearance in the database, allowing co-management of inventory, donors, events, and reports.

- [x] **Account update and active/inactive status toggle**
  - **User Story**: As an Admin, I want to update user account details or toggle their active status so that I can quickly suspend coordinator access if they leave the department.
  - **Details**: Active/inactive status field in the coordinator profile document. Inactive users are blocked from signing in at the login screen.

- [x] **View list of all active/inactive coordinator accounts (filterable by department)**
  - **User Story**: As an Admin, I want to view a list of all coordinator accounts, filterable by department, so that I can manage staff accounts efficiently.
  - **Details**: Searchable tabular interface in Admin dashboard with department filter dropdown and status tags.

- [x] **Enforce one Department Coordinator per department constraint**
  - **User Story**: As an Admin, I want the system to restrict creation of coordinator accounts to one active coordinator per department so that duplicate reports or account overlaps are prevented.
  - **Details**: Verification block when creating or editing an account. If another user document is already active for the selected department, display a blocking error dialog.

---

### 3.3 Inventory Management Module (Admin-only)

- [x] **Item catalog management dashboard (CRUD interface)**
  - **User Story**: As an Admin, I want a CRUD dashboard to add, view, update, and delete inventory items so that I can maintain an accurate record of available supplies.
  - **Details**: CRUD form fields: Item Name, Category, Unit, Quantity, optional Donor info. Audit log tracking: automatically append modification timestamp and the acting Admin's user ID.

- [x] **Stock tracking status engine**
  - **User Story**: As an Admin, I want the system to calculate and display the stock level status (Available, Low Stock, Out of Stock, Expired) for each item so that I can manage inventory levels proactively and prevent distributing expired goods.
  - **Details**: Status indicator tags:
    - `Available` (Quantity > 10)
    - `Low Stock` (Quantity $\le$ 10)
    - `Out of Stock` (Quantity = 0)
    - `Expired` (Expiry Date has passed and Quantity > 0)
  - Items that are expired are visually separated in the inventory table and excluded from distribution recommendations. An "Expiring Soon" sidebar alert warns about batches approaching expiration within 30 days.

- [x] **Category and unit classification filters**
  - **User Story**: As an Admin, I want to group and filter items by category (e.g. food packs, school supplies, hygiene kits) and unit of measurement so that I can easily browse the inventory.
  - **Details**: Grouping and sorting UI elements to filter inventory tables by categories matching standard outreach donation drives.

- [x] **FIFO sorting and nearest-expiration-date recommendation logic**
  - **User Story**: As an Admin, I want the system to recommend which stock batches to distribute first based on FIFO and nearest expiration date so that we minimize waste of consumable items.
  - **Details**: Algorithm prioritizes sorting items by nearest expiration date first (consumables). For non-consumables, falls back to the oldest entry timestamp (First In, First Out). Shows a "Prioritized for Release" recommendation tag. The system uses **batch-level tracking**: identical items with different expiration dates are stored as separate inventory records (e.g., 8 cans of sardines received on different dates with different expiry dates appear as 3 separate rows, each with its own quantity and expiration date). This ensures granular tracking per batch and prevents mixing of expiration windows.

- [x] **Downloadable inventory summary exports (PDF/Word)**
  - **User Story**: As an Admin, I want to download the current inventory status as a PDF or Word document so that I can file official records or print summaries.
  - **Details**: Use HTML-to-PDF or Word compilers to export inventory tables formatted with official CES header layouts.

---

### 3.4 Event & Department Coordination Module (Admin-only)

- [x] **Department/Organization profile editor**
  - **User Story**: As an Admin, I want to edit organization and department profiles under the CES office so that department metadata remains current.
  - **Details**: Edit profiles of academic departments/organizations involved in outreach activities, including department codes and coordinator logs.

- [x] **Monthly event scheduler board**
  - **User Story**: As an Admin, I want to view a monthly calendar board to schedule events with date, time, location, title, and description so that all extension activities are structured and visible.
  - **Details**: Calendar UI grid filtering events by month. Fields include Event Name, Description, Scheduled Date, Time, Location, and Status.

- [x] **Department-event assignment mapper**
  - **User Story**: As an Admin, I want to map specific scheduled events to a department so that the department's coordinator is assigned to write the narrative report.
  - **Details**: UI assignment dropdown on the event scheduler, linking the event to one or more department profiles in the database.

---

### 3.5 Donor Management Module (Admin-only)

- [x] **Donor profile log**
  - **User Story**: As an Admin, I want to log donor profiles of different types (individual, organization, department) so that we have an organized contact directory of our sponsors.
  - **Details**: Full CRUD form to save, update, delete, search, and manage Donor Name, Contact details, Donor Type (Individual, External Organization, School Department), and date of registration.

- [x] **Donation batch receipt logger**
  - **User Story**: As an Admin, I want to log donation batches specifying the quantity and purpose of items received so that we have a transparent audit history of all contributions.
  - **Details**: Records date of donation, list of donated items, quantities (supporting thousands of supplies like food packs, school supplies, and hygiene kits), and specific community distribution purpose.

- [x] **Shelf-life expiration tracker for consumables**
  - **User Story**: As an Admin, I want to specify and track expiration dates for consumable donations so that they are flagged before they become unusable.
  - **Details**: Date input for consumable item expiration dates. Integrates with the inventory stock status dashboard to display warnings for near-expiry items.

---

### 3.6 Reports Module (Department Coordinators)

- [x] **Narrative editor layout (Semester and Academic Year selection)**
  - **User Story**: As a Department Coordinator, I want to select the semester and academic year when initiating a report so that it is cataloged under the correct academic schedule.
  - **Details**: Dropdowns for Semester (1st Semester, 2nd Semester, Summer) and Academic Year (e.g. AY 2026-2027) at the start of report creation.

- [x] **Department-scoped event selector**
  - **User Story**: As a Department Coordinator, I want to select from a list of events assigned to my department only so that I do not accidentally document events belonging to another department.
  - **Details**: Filter event selection options to only list scheduled events where `assignedDepartment` matches the coordinator's assigned department ID.

- [x] **Tiptap rich-text editor integration for diaries**
  - **User Story**: As a Department Coordinator, I want to write the narrative in a diary format using a Tiptap rich-text editor so that I can format the text narrative easily.
  - **Details**: Integrate Tiptap editor with simple text-styling tools: Bold, Italic, Bullet lists, Ordered lists, and Undo/Redo.

- [x] **Drag-and-drop Photo Upload module**
  - **User Story**: As a Department Coordinator, I want to drag and drop activity photos into the editor and have the system enforce limits (max 10 files, JPG/PNG only) so that only valid documentation is uploaded.
  - **Details**:
    - Drag-and-drop dropzone component in the report creation form.
    - Max 10 images limit verification before uploading.
    - Extensions validation: block everything except JPG and PNG formats.
    - Files uploaded under the path: `/narratives/AY_XXXX-XXXX/` on Firebase Storage.

- [x] **Save Draft option & Submit for Approval option**
  - **User Story**: As a Department Coordinator, I want to save reports as drafts or submit them for approval so that I can work on them incrementally before finalized submission.
  - **Details**:
    - "Save Draft" updates Firestore with status `Draft` (Coordinator can still edit, Admin cannot approve).
    - "Submit for Approval" locks coordinator editing and sets status to `Submitted` (making it visible in the Admin's review queue).

- [x] **Submission status checker dashboard**
  - **User Story**: As a Department Coordinator, I want to view a status dashboard (Draft, Submitted, Returned, Approved) for all my reports so that I can track their review progress.
  - **Details**: Coordinator dashboard list showing report title, event, date, and status color codes matching their review stages.

- [x] **Returned Report revision view (displaying Admin feedback notes)**
  - **User Story**: As a Department Coordinator, I want to view feedback notes on a returned report and edit it so that I can address the Admin's review concerns and resubmit it.
  - **Details**: If status is `Returned`, coordinator can view notes written by the Admin/Office Coordinator. The Tiptap editor is re-enabled for revision and resubmission.

---

### 3.7 Reports Review & Generation (Admin-only)

- [x] **Submissions review queue**
  - **User Story**: As an Admin, I want to view a queue of submitted narrative reports including text narratives and uploaded photo galleries so that I can review the coordinator's documentation.
  - **Details**: Scrollable review panel showing pending reports. Clicking a report displays the text diary alongside the image carousel.

- [x] **Approval locks & Return with feedback actions**
  - **User Story**: As an Admin, I want to approve a report (locking it from further edits) or return it with feedback notes so that I can manage report quality control.
  - **Details**:
    - Approval action changes status to `Approved` and locks database edits for both roles.
    - Return action displays text box for feedback notes, updates status to `Returned`, and sends it back to the coordinator.

- [x] **PDF/Word compiler (exports reports structured in standard CES layouts)**
  - **User Story**: As an Admin, I want to compile and export approved reports into standard CES-formatted PDF or Word documents so that they can be printed and archived.
  - **Details**: Outputs structured documents embedding the text narrative and the uploaded photos formatted strictly to the CES standard report style.

---

### 3.8 Information Module

- [x] **CES Office information display page**
  - **User Story**: As an Authorized User, I want to view the CES office information page including mission, vision, and organizational chart so that I can refer to institutional details.
  - **Details**: Displays the CES mission, vision, and organizational structure:
    - School Administrator: Sr. Lorna I. Ablog, O.P.
    - Vice President of Academic Affairs: Dr. Augusto R. Dela Cruz
    - Head of Community Extension & Services (CES) Office: Mrs. Faithful Anne F. Arugay
    - Coordinator of Community Extension & Services (CES) Office: Mr. Jonnel B. Manio
    - Student Advocates: JEEPGY Advocates (supporting CEAP advocacies: justice and peace, care for the environment, active citizenship, poverty awareness, gender equality, youth empowerment).

- [x] **Developer / Proponent information display page**
  - **User Story**: As an Authorized User, I want to view a display page listing information about the developers/proponents of DommUnity so that we know who built the application.
  - **Details**: Interactive profile cards for the proponents/developers of the system.

- [x] **Navigation route accessible to both Admin and Coordinator roles**
  - **User Story**: As an Authorized User, I want to access the information module through the main navigation menu so that I can easily toggle between operational dashboards and reference pages.
  - **Details**: Add links in sidebars/top-bars of both Admin and Coordinator layout wrappers.

### 3.9 UI Layout & Wide-Screen Optimization

- [x] **Utilize right-side screen space with responsive widgets**
  - **User Story**: As an Authorized User, I want the screen workspace to utilize the empty right-side margin space on my desktop monitor to view live widgets and reference manuals so that I have immediate access to status details.
  - **Details**:
    - Expand layout container width from `max-w-5xl` to `max-w-[1600px]` matching wider resolutions.
    - Implement a responsive right-side sidebar column (`xl:w-80 shrink-0`) that displays dashboard-specific alerts, quick metrics, upcoming outreach schedules, and CEAP JEEPGY advocacy rules.
    - Keep layout responsive by stacking widgets on smaller screen widths.

---

## 4. Verification & Testing

- [x] **Validate login state limits & validation forms**
  - **User Story**: As a Developer, I want to test authentication form validations and session limits so that invalid credentials show appropriate error messages and sessions persist correctly.
  - **Details**: Run checks on password input length, empty fields, bad email patterns, and correct session handling after Electron window closure.

- [x] **Test three-role routing (Admin, Office Coordinator, Department Coordinator)**
  - **User Story**: As a Developer, I want to test route redirection for Admin, Office Coordinator, and Department Coordinator accounts so that each role is correctly and securely isolated to their allowed interfaces.
  - **Details**: Verify that Coordinator accounts cannot navigate to inventory/donor pages, and Office Coordinator accounts (Mr. Jonnel B. Manio) have identical privileges to the Admin (Mrs. Faithful Anne F. Arugay).

- [x] **Test Department Coordinator isolation (coordinator A cannot see/submit reports for department B)**
  - **User Story**: As a Developer, I want to verify that a coordinator assigned to Department A cannot view, edit, or submit reports for Department B so that departmental confidentiality and data integrity are maintained.
  - **Details**: Log in as a coordinator for Dept A, try to inspect Dept B drafts or query Dept B assigned events. Assert that the client restricts data view to Dept A scopes only.

- [x] **Test FIFO ordering database queries (verify priority of oldest/closest expiry)**
  - **User Story**: As a Developer, I want to run tests on the inventory FIFO queries and expiration prioritization so that stock release suggestions accurately prioritize the closest-expiry items.
  - **Details**: Seed mock items with expiration dates and entry timestamps. Query the stock engine and assert that nearest-expiration items are ordered first, followed by FIFO sorting.

- [x] **Run test uploads for photo galleries (check limits over 10 files & invalid file extensions)**
  - **User Story**: As a Developer, I want to test image uploads with files exceeding the count limit or having incorrect extensions so that the validation catches errors before uploading to storage.
  - **Details**: Verify file upload component behavior with > 10 files and with unsupported extensions (e.g. PDF, BMP, SVG). Assert that standard error text displays.

- [x] **Conduct end-to-end user journey simulation tests**
  - **User Story**: As a Developer, I want to simulate an end-to-end user flow from event creation to report submission, review, approval, and final export so that the entire workflow functions seamlessly together.
  - **Details**: Simulated sequence:
    1. Admin creates and assigns event.
    2. Coordinator creates report draft, writes content, uploads photos.
    3. Coordinator submits report.
    4. Admin reviews, adds comments, and returns.
    5. Coordinator revises and resubmits.
    6. Admin approves.
    7. Admin exports PDF/Word report.

- [/] **Conduct User Acceptance Testing (UAT) session with Mrs. Faithful Anne F. Arugay**
  - **User Story**: As an Admin, I want to participate in a User Acceptance Testing (UAT) session to verify that the system satisfies all operational needs of the CES Office.
  - **Details**: Final interactive review with Mrs. Faithful Anne F. Arugay (Head of the Community Extension & Services Office) to inspect UI colors (Green/Navy Blue), typography (Poppins), and official layout alignment.

---

## 5. Documentation & Diagrams

- [x] **Produce Project UML Diagrams**
  - **User Story**: As a Developer, I want to create the project's UML diagrams (Use Case, Activity, and Sequence Diagrams) based on the latest implementation of the system so that they accurately reflect the current system behavior and are suitable for the capstone manuscript.
  - **Details**:
    - **Use Case Diagram**: Map out roles (Admin, Office Coordinator) and their interactions with the system modules and Firebase services.
    - **Activity Diagram**: Model workflows including authentication/routing, FIFO-based inventory management, and report compilation/review cycles.
    - **Sequence Diagram**: Detail interactions between UI controllers, Firebase Auth, Firestore Database, and Storage for authentication, donation logs, and report approvals.
