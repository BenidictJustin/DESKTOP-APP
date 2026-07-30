# Technical Requirements Document (TRD): DommUnity

This document outlines the technical requirements, scope, architecture, and design specifications for **DommUnity**, a desktop-based management system developed for the Community Extension & Services (CES) Office of Dominican College of Tarlac, Inc.

---

## 1. Project Overview

### 1.1 Context & Objectives

The CES Office coordinates community outreach activities, donation drives, and departmental event programs. Historically, office staff managed these activities manually (tracking inventories, departments, events, and donor records in separate files) and prepared narrative reports using Microsoft Word, leading to high administrative overhead.

**DommUnity** is a desktop application designed to streamline:

- Inventory tracking (FIFO, expiration-based sorting)
- Donor information and department contribution records
- Event scheduling and tracking
- Automated narrative report generation matching the standard CES format

### 1.2 System Objectives

- **User Authentication:** Allow secure login/sign-up and role-based access control for Admins and Coordinators.
- **Inventory Management:** Organize community service supplies, monitor stock levels, and enforce distribution policies.
- **Donor Management:** Track donations, donor profiles, and key details (e.g., expiration dates of consumables).
- **Event Management:** Plan and assign monthly events to academic departments, tracking task completion status.
- **Organization Management:** Maintain department profiles and organization hierarchies under the CES.
- **Reports Module:** Streamline narrative report compilation, documentation upload, and automated standard format generation.
- **Information Module:** Display system and developer information.

---

## 2. Functional Scope & Modules

### 2.1 Role-Based Access Control

The system supports three user roles:

1. **Admin** (Mrs. Faithful Anne F. Arugay, Head of CES): Full access to configurations, accounts, logs, master database, and report approvals.
2. **Office Coordinator** (Mr. Jonnel B. Manio, CES Office Coordinator): Same system access as Admin — assists in managing CES operations, reviewing submitted reports, and overseeing department activities.
3. **Department Coordinator** (one per academic department): Access restricted to report creation, submission, and viewing status of **only their assigned department's** events. Each department has a designated coordinator who documents the community extension activities conducted by their department.

---

### 2.2 Admin Modules

#### 2.2.1 Authentication & User Management

- **Log In:** Credentials (username/password) required for security.
- **Forgot Password:** Secure recovery flow triggering a verification link or code to the admin's registered email address.
- **User Account Management:** Add, update, and manage accounts for department coordinators. Each coordinator account is linked to a specific department/organization, ensuring department-scoped access. The Admin can also set up Office Coordinator accounts with admin-level access.

#### 2.2.2 Inventory Management

- **Item Management Submodule:** Add, update, and delete items. The system automatically logs changes with date and time.
- **Stock Tracking Submodule:**
  - Status flags: _Available_, _Low Stock_ (quantity $\le$ 10), _Out-of-Stock_ (quantity = 0), and _Expired_ (expiry date has passed and quantity > 0).
  - Distribution Logic: Enforces **First In, First Out (FIFO)** and prioritizes releasing items with the nearest expiration date. Expired items are visually flagged and excluded from distribution recommendations.
  - **Batch-Level Tracking:** Identical items with different expiration dates are stored as separate inventory records (e.g., 8 cans of sardines received across different donation batches with 3 different expiry dates appear as 3 separate rows). This enables granular per-batch expiration monitoring.
  - **Expiring Soon Alerts:** The system sidebar displays proactive alerts for consumable batches approaching expiration within 30 days.
- **Category & Unit Submodule:** Group items by category (e.g., Food Packs, School Supplies, Hygiene Kits) and units of measurement.
- **Inventory Report Submodule:** Export inventory summaries in PDF and Word formats.

#### 2.2.3 Event & Organization Management

- **Event Management:** Schedule, update, and track events by month. Stores event name, description, location, and status.
- **Organization Management:** Manage profiles of academic departments and organizations, tracking their assigned events and activities.

#### 2.2.4 Donor & Donation Management

- **Donor Directory:** Complete CRUD management (Create, Read, Update, Delete) of donor profiles. Maintain, edit, and search records of donor name, contact details, type (Individual, External Sponsor, School Department), and date of registration.
- **Donation History:** Track historical items donated, purpose, and distribution status.

#### 2.2.5 Report Review & Generation

- **Report Management:** Review narrative submissions from department coordinators, approve or return reports, and export final copies into PDF/Word layouts following the standard CES format. Reports can be filtered by department/organization.

---

### 2.3 Department Coordinator Modules

#### 2.3.1 Authentication & Profile

- **Log In:** Access credentials managed and provided by the Admin. Each Department Coordinator is linked to a specific department/organization.
- **Forgot Password:** Initiate a reset request forwarded to the Admin, who issues a new password.

#### 2.3.2 Report Creation & Submission

- **Report Creation:** Fill out report details including semester, academic year, and category (e.g., Outreach, Blood Donation). Department Coordinators can only select events assigned to their department.
- **Narrative Writing Submodule:** Write event summaries and diaries directly using a rich text editor.
- **Photo Upload Submodule:**
  - Upload up to 10 photos per activity.
  - Supported formats: PNG, JPG.
  - Media must be selected from the local desktop/machine.
- **Report Submission:** Submit completed drafts for Admin review.
- **Report Status:** Monitor status of submissions (_Draft_, _Submitted_, _Returned_, _Approved_).
- **Report History:** Access previously submitted reports, filterable by semester or event.

---

### 2.4 System Limitations

- **Deployment Platform:** Exclusively compiled for **Windows OS** (aligning with the computers available in the CES office).
- **Offline Constraints:** No handling of online financial transactions, cash donations, or payment gateways.
- **Data Capture:** Manual encoding is required for activity data and physical donations.
- **Target Audience:** Specifically designed for the workflow of Dominican College of Tarlac, Inc. and is not plug-and-play for other institutions.

---

## 3. Technical Specifications

### 3.1 Hardware Environment

- **Development & Implementation:** Desktop computers and laptops capable of running the development environments and packaging tools.

### 3.2 Software & Framework Stack

The application is structured as a desktop hybrid application:

| Layer                  | Technology       | Details / Purpose                                                              |
| :--------------------- | :--------------- | :----------------------------------------------------------------------------- |
| **Shell Framework**    | **ElectronJS**   | Wraps the web front-end as a standalone Windows desktop app.                   |
| **Front-End Library**  | **ReactJS**      | Declarative UI state management and modular views.                             |
| **Styling**            | **Tailwind CSS** | Utility-first styling framework for rapid responsive layouts.                  |
| **UI Components**      | **Shadcn/ui**    | Accessible, reusable UI components.                                            |
| **Rich Text Editor**   | **Tiptap**       | Headless rich-text editor for writing narratives/diaries.                      |
| **Backend & Database** | **Firebase**     | Online real-time database and file storage for reports, inventory, and images. |
| **Target OS**          | **Windows OS**   | Optimized for Windows 10 and above.                                            |

---

## 4. UI & Design Guidelines

### 4.1 Color Palette

The color scheme is directly inspired by the official Community Extension & Services (CES) Office logo:

- **Signature Green (`#80CC2A`):** Main accent color symbolizing fellowship, growth, and clean design.
- **Navy Blue (`#030E69`):** Secondary color for navigation blocks and headers.
- **White (`#FFFFFF`):** Core background canvas color to maintain clean visual spacing.
- **Black/Dark Gray:** Used for typography and navigation iconography to ensure high contrast and readability.

### 4.2 Typography

- **Primary Typeface:** **Poppins** (sans-serif). Chosen for readability on screen and clean geometric aesthetic.
