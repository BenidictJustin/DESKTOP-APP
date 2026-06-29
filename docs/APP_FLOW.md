# Application Flow: DommUnity

This document maps out the application states, navigation structures, and interactive processes for all user roles (Admin, Office Coordinator, and Department Coordinator) in the **DommUnity** system.

---

## 1. Authentication & Role Gateway Flow

```mermaid
graph TD
    Start([Launch DommUnity]) --> Login{Login Screen}
    Login -->|Invalid Credentials| Login
    Login -->|Forgot Password| ForgotPwd[Forgot Password Screen]
    Login -->|New User Sign-Up| SignUp[Sign-Up Screen]
    SignUp -->|Admin creates account| Login
    ForgotPwd -->|Admin: Trigger email link/code| Login
    ForgotPwd -->|Dept Coordinator: Request Admin Reset| Login
    Login -->|Valid Credentials| AuthGateway{Verify User Role}
    AuthGateway -->|Role: Admin| AdminDash[Admin Dashboard]
    AuthGateway -->|Role: Office Coordinator| AdminDash
    AuthGateway -->|Role: Department Coordinator| CoordDash[Department Coordinator Dashboard]
```

---

## 2. Administrator Flow & Journeys

The Administrator (Head of CES Office) and Office Coordinator (Mr. Jonnel B. Manio) share the same dashboard. They manage settings, inventory, departments, donors, create department coordinator accounts, and review submitted reports.

```mermaid
graph TD
    AdminDash[Admin Dashboard] --> SelectTab{Sidebar Navigation}
    
    %% User Management
    SelectTab --> UserMgmt[User Account Management]
    UserMgmt --> CreateUser[Create Department Coordinator Account]
    UserMgmt --> AssignOrg[Assign Coordinator to Department]
    UserMgmt --> EditUser[Edit/Update Permissions]
    
    %% Inventory Flow
    SelectTab --> InvMgmt[Inventory Management]
    InvMgmt --> AddItem[Add New Item]
    InvMgmt --> TrackStock[Track Stock Levels / FIFO Sorting]
    InvMgmt --> ExportInv[Export Inventory Report PDF/Word]
    
    %% Event & Org Flow
    SelectTab --> EventMgmt[Event & Org Management]
    EventMgmt --> ScheduleEvent[Schedule Monthly Event]
    EventMgmt --> AssignDept[Assign Event to Department]
    
    %% Donor Flow
    SelectTab --> DonorMgmt[Donor Management]
    DonorMgmt --> LogDonation[Log Donor Info & Donations]
    DonorMgmt --> ExpiryTrack[Track Consumable Expirations]
    
    %% Reports Flow
    SelectTab --> ReportReview[Report Management]
    ReportReview --> ViewSubmissions[View Submitted Department Reports]
    ViewSubmissions --> FilterByDept[Filter by Department / Organization]
    ViewSubmissions --> Decision{Approve or Return?}
    Decision -->|Approve| ExportReport[Generate standard PDF/Word Report]
    Decision -->|Return| ReturnFeedback[Return to Coordinator with Feedback]
    
    %% Information Module
    SelectTab --> InfoModule[Information Module]
    InfoModule --> CESInfo[CES Office Information]
    InfoModule --> DevInfo[Developer / Proponent Information]
```

### 2.1 Key Admin Procedures
1. **Inventory Sorting (FIFO & Expiration-based):**
   - System receives a release request for items.
   - Core algorithms filter by item category.
   - Items are queued sorting by **First In, First Out (FIFO)** and **nearest expiration date** to ensure zero product wastage.
   - **Batch-Level Tracking:** Identical items (e.g., canned sardines) with different expiration dates are stored as separate inventory rows. Each batch has its own quantity, received date, and expiry date, enabling granular per-batch monitoring.
   - **Expired Detection:** Items whose expiration date has passed are automatically flagged as `Expired` and excluded from distribution recommendations.
   - **Expiring Soon Alerts:** The dashboard sidebar proactively warns about consumable batches approaching expiration within 30 days.
2. **Reviewing Narrative Reports:**
   - Reports under `Submitted` status appear on the Admin Dashboard.
   - Admin reviews the rich text diary content and attached media (up to 10 photos).
   - Approving the report locks the status to `Approved` and allows compilation. Returning shifts the status to `Returned`, alerting the department coordinator.

---

## 3. Department Coordinator Flow & Journeys

Each department has a designated coordinator who compiles narrative reports for their department's outreach programs and tracks their assigned events. Department Coordinators can only access reports and events related to their assigned department.

```mermaid
graph TD
    CoordDash[Department Coordinator Dashboard] --> CoordNav{Sidebar Navigation}
    
    %% Report Workflow
    CoordNav --> ReportWorkspace[Report Creation Workspace]
    ReportWorkspace --> SetMetadata[Select Semester & Academic Year]
    SetMetadata --> SelectEvent[Select Department Event]
    SelectEvent --> DiaryWriter[Write Narrative Diary via Tiptap Editor]
    DiaryWriter --> PhotoUpload[Upload Photos max 10, JPG/PNG]
    PhotoUpload --> SaveDraft[Save Draft]
    SaveDraft --> SubmitReport[Submit Report for Review]
    
    %% Report Status Tracking
    CoordNav --> ReportHistory[Report History & Status]
    ReportHistory --> FilterReports[Filter by Semester / Department Event]
    ReportHistory --> ViewStatus{Current Status}
    ViewStatus -->|Draft| EditDraft[Resume Editing]
    ViewStatus -->|Submitted| ViewOnly[Read-Only Mode]
    ViewStatus -->|Returned| EditReturned[Modify details based on Admin feedback]
    ViewStatus -->|Approved| Archived[Archived / Read-Only]
    
    %% Information Module
    CoordNav --> InfoModule[Information Module]
    InfoModule --> CESInfo[CES Office Information]
    InfoModule --> DevInfo[Developer / Proponent Information]
```

### 3.1 Key Department Coordinator Procedures
1. **Compiling a Narrative Report:**
   - Department Coordinator opens the **Report Creation Module**.
   - Input fields: Semester, Academic Year, Department Event Selection (only events assigned to their department are shown).
   - Rich Text Area: Uses **Tiptap Editor** to log narrative details of the outreach.
   - Photo Interface: Selects up to 10 local PNG/JPG images (e.g., proof of donation handovers, community interaction).
   - Actions:
     - `Save` changes status to **Draft**.
     - `Submit` moves status to **Submitted** and locks changes.
2. **Reviewing Returned Reports:**
   - If the Admin returns a report, the status shows as **Returned**.
   - The department coordinator selects the report, views the admin's revision notes, applies corrections, and clicks **Submit** again.
