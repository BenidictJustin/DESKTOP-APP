# System UML Diagrams: DommUnity

This document contains the Unified Modeling Language (UML) diagrams for **DommUnity**, reflecting the latest system implementation. All diagrams are designed using standard UML notation and rendered using Mermaid syntax.

---

## 1. Use Case Diagram

The Use Case Diagram defines the roles and operational boundaries of the system. It shows how the two primary roles (**Admin** and **Office Coordinator**) interact with system modules and how these actions translate to the backend **Firebase** database, authentication, and storage services.

```mermaid
flowchart LR
    %% Actors
    subgraph Actors [Actors]
        admin((Admin))
        coordinator((Office Coordinator))
    end

    %% External Systems
    subgraph ExternalSystems [External Services]
        fbAuth[Firebase Authentication]
        firestore[Firestore Database]
        fbStorage[Firebase Storage]
    end

    %% System Boundary
    subgraph DommUnitySystem [DommUnity Desktop System]
        %% Shared / Auth Use Cases
        UC_Login(Login / Authenticate)
        UC_VerifyCreds(Verify Credentials)
        UC_ForgotPwd(Forgot Password)
        UC_Logout(Logout)
        UC_Info(View CES Info & Developer Profiles)

        %% Admin-Only Use Cases
        UC_UserMgmt(Manage Coordinator Accounts)
        UC_ToggleStatus(Toggle Account Active / Inactive)
        UC_ResetPwdReq(Handle Password Reset Requests)
        
        UC_Inventory(Manage Supplies Inventory)
        UC_FIFORecommend(Evaluate FIFO & Expiration Priority)
        UC_ReleaseStock(Process Inventory Stock Release)
        UC_ExportInv(Export Inventory Report to PDF/Word)
        
        UC_Donors(Manage Donors & Donations)
        UC_LogDonation(Record Donation Batch)
        UC_TrackShelfLife(Monitor Shelf-life of Consumables)
        
        UC_Events(Schedule Monthly Outreach Events)
        UC_AssignDept(Map Events to Departments)
        
        UC_Orgs(Manage Organizations & Departments)
        
        UC_ReviewReport(Review Narrative Submissions)
        UC_ApproveReport(Approve & Lock Report)
        UC_ReturnReport(Return with Revision Feedback)

        %% Office Coordinator-Only Use Cases
        UC_DashMetrics(View Report Status Metrics)
        UC_WriteReport(Compose Narrative Reports)
        UC_LinkEvent(Link Report to Scheduled Event)
        UC_TiptapEditor(Write Narrative in Tiptap Rich Text)
        UC_PhotoUpload(Upload Activity Photos<br/>Max 10 JPG/PNG)
        UC_SaveDraft(Save Report as Draft)
        UC_SubmitReport(Submit for Review)
        UC_ReviseReport(Revise Returned Reports)
    end

    %% Admin Relationships
    admin --> UC_Login
    admin --> UC_Info
    admin --> UC_Logout
    admin --> UC_UserMgmt
    admin --> UC_Inventory
    admin --> UC_Donors
    admin --> UC_Events
    admin --> UC_Orgs
    admin --> UC_ReviewReport

    %% Coordinator Relationships
    coordinator --> UC_Login
    coordinator --> UC_Info
    coordinator --> UC_Logout
    coordinator --> UC_DashMetrics
    coordinator --> UC_WriteReport
    coordinator --> UC_ReviseReport

    %% Include / Extend Relationships
    UC_Login -.-->|&lt;&lt;include&gt;&gt;| UC_VerifyCreds
    UC_ForgotPwd -.-->|&lt;&lt;extend&gt;&gt;| UC_Login
    
    UC_UserMgmt -.-->|&lt;&lt;include&gt;&gt;| UC_ToggleStatus
    UC_UserMgmt -.-->|&lt;&lt;include&gt;&gt;| UC_ResetPwdReq
    
    UC_Inventory -.-->|&lt;&lt;include&gt;&gt;| UC_FIFORecommend
    UC_Inventory -.-->|&lt;&lt;include&gt;&gt;| UC_ReleaseStock
    UC_Inventory -.-->|&lt;&lt;include&gt;&gt;| UC_ExportInv
    
    UC_Donors -.-->|&lt;&lt;include&gt;&gt;| UC_LogDonation
    UC_Donors -.-->|&lt;&lt;include&gt;&gt;| UC_TrackShelfLife
    
    UC_Events -.-->|&lt;&lt;include&gt;&gt;| UC_AssignDept
    
    UC_ReviewReport -.-->|&lt;&lt;include&gt;&gt;| UC_ApproveReport
    UC_ReviewReport -.-->|&lt;&lt;include&gt;&gt;| UC_ReturnReport
    UC_ReviewReport -.-->|&lt;&lt;include&gt;&gt;| UC_ExportInv
    
    UC_WriteReport -.-->|&lt;&lt;include&gt;&gt;| UC_LinkEvent
    UC_WriteReport -.-->|&lt;&lt;include&gt;&gt;| UC_TiptapEditor
    UC_WriteReport -.-->|&lt;&lt;include&gt;&gt;| UC_PhotoUpload
    
    UC_SaveDraft -.-->|&lt;&lt;extend&gt;&gt;| UC_WriteReport
    UC_SubmitReport -.-->|&lt;&lt;extend&gt;&gt;| UC_WriteReport

    %% External Systems Relationships
    UC_VerifyCreds -.-> fbAuth
    UC_ResetPwdReq -.-> fbAuth
    UC_ForgotPwd -.-> fbAuth
    
    UC_UserMgmt -.-> firestore
    UC_Inventory -.-> firestore
    UC_Donors -.-> firestore
    UC_Events -.-> firestore
    UC_Orgs -.-> firestore
    UC_ReviewReport -.-> firestore
    UC_DashMetrics -.-> firestore
    UC_WriteReport -.-> firestore
    UC_ReviseReport -.-> firestore
    
    UC_PhotoUpload -.-> fbStorage

    %% Styles
    classDef actor fill:#dcfce7,stroke:#166534,stroke-width:2px,color:#166534;
    classDef system fill:#eff6ff,stroke:#1e40af,stroke-width:2px,color:#1e40af;
    classDef usecase fill:#fff,stroke:#374151,stroke-width:1.5px,color:#111827;

    class admin,coordinator actor;
    class fbAuth,firestore,fbStorage system;
    class UC_Login,UC_VerifyCreds,UC_ForgotPwd,UC_Logout,UC_Info,UC_UserMgmt,UC_ToggleStatus,UC_ResetPwdReq,UC_Inventory,UC_FIFORecommend,UC_ReleaseStock,UC_ExportInv,UC_Donors,UC_LogDonation,UC_TrackShelfLife,UC_Events,UC_AssignDept,UC_Orgs,UC_ReviewReport,UC_ApproveReport,UC_ReturnReport,UC_DashMetrics,UC_WriteReport,UC_LinkEvent,UC_TiptapEditor,UC_PhotoUpload,UC_SaveDraft,UC_SubmitReport,UC_ReviseReport usecase;
```

---

## 2. Activity Diagrams

Activity Diagrams model the control flow and sequential activities within critical business processes of the system.

### 2.1 User Authentication and Dashboard Routing

This workflow handles the process from user login request to validating user roles and mounting the dashboard.

```mermaid
stateDiagram-v2
    [*] --> EnterCredentials : User inputs email & password
    EnterCredentials --> ValidateForm : Client-side format checks
    ValidateForm --> CheckFormat : Is email valid & password >= 8 chars?
    CheckFormat --> EnterCredentials : No (Show Validation Error)
    CheckFormat --> RequestAuth : Yes (Call Firebase login API)

    RequestAuth --> FirebaseAuthentication : Send credentials
    FirebaseAuthentication --> AuthSuccess : Match found?
    AuthSuccess --> EnterCredentials : No (Show Login Error)
    AuthSuccess --> FetchProfile : Yes (Auth success, get UID)

    FetchProfile --> QueryFirestoreUsers : Fetch user document by UID
    QueryFirestoreUsers --> CheckRole : Check "role" field
    
    CheckRole --> RouteAdmin : role == "admin"
    CheckRole --> RouteOfficeCoord : role == "office_coordinator"
    CheckRole --> FallbackError : Else (Role not recognized)

    RouteAdmin --> AdminDashboard : Load Admin Interface
    RouteOfficeCoord --> OfficeCoordinatorDashboard : Load Coordinator Interface
    FallbackError --> RestrictScreen : Show Access Restricted Alert

    AdminDashboard --> [*]
    OfficeCoordinatorDashboard --> [*]
    RestrictScreen --> [*]
```

### 2.2 Donation Receipt and FIFO Stock Tracking

This workflow models the inventory collection updates, splitting consumable batches, and identifying availability, low stock, or expired items.

```mermaid
stateDiagram-v2
    [*] --> InputDonation : Admin enters Donor details & items list
    InputDonation --> ProcessItems : Admin submits Donation Batch

    state ProcessItems {
        [*] --> CheckItemType : Iterate through each item
        CheckItemType --> SetBatch : Consumable (has expiry date)?
        SetBatch --> CreateConsumableRecord : Yes (Separate batch record)
        CheckItemType --> CreateNonConsumableRecord : No (Normal FIFO record)
        
        CreateConsumableRecord --> SaveToFirestore : Write to 'inventory' collection
        CreateNonConsumableRecord --> SaveToFirestore : Write to 'inventory' collection
    }

    SaveToFirestore --> UpdateStockStatus : Execute status logic per record

    state UpdateStockStatus {
        [*] --> CheckExpiry : Is Expiry Date <= Today?
        CheckExpiry --> FlagExpired : Yes (Set status = "expired")
        CheckExpiry --> CheckQuantity : No

        CheckQuantity --> FlagAvailable : Quantity > 10 (Set status = "available")
        CheckQuantity --> FlagLowStock : 1 <= Quantity <= 10 (Set status = "low stock")
        CheckQuantity --> FlagOutOfStock : Quantity == 0 (Set status = "out of stock")
    }

    FlagExpired --> RefreshDashboard : Exclude from release suggestions
    FlagAvailable --> RefreshDashboard : Include in FIFO release list
    FlagLowStock --> RefreshDashboard : Show low stock warning
    FlagOutOfStock --> RefreshDashboard : Show out of stock

    RefreshDashboard --> [*] : Dashboard displays updated stats & sidebar alerts
```

### 2.3 Narrative Report Compilation and Approval Lifecycle

This workflow documents report drafting, photo attachments limits, submission locks, and the admin feedback loop.

```mermaid
stateDiagram-v2
    [*] --> StartReport : Coordinator starts new report
    StartReport --> LinkEvent : Link to Admin-scheduled Event?
    LinkEvent --> AutoFillMetadata : Yes (Auto-fetch name, date, location)
    LinkEvent --> ManualMetadata : No (Manual text input)

    AutoFillMetadata --> EditContent : Edit text narrative via Tiptap
    ManualMetadata --> EditContent

    EditContent --> AddPhotos : Optional image documentation
    AddPhotos --> CheckUploadLimits : Drag-and-drop files
    CheckUploadLimits --> UploadToStorage : Files <= 10 & PNG/JPG formats
    CheckUploadLimits --> AddPhotos : Invalid format / Count > 10 (Block)

    UploadToStorage --> LinkPhotoURLs : Save URLs to narrative report record
    LinkPhotoURLs --> SaveDraft : Click "Save Draft"
    SaveDraft --> EditContent : Status: Draft (Keep editing)

    LinkPhotoURLs --> SubmitReport : Click "Submit for Approval"
    SubmitReport --> ReviewQueue : Status: Submitted (Locked from edits)

    ReviewQueue --> AdminInspection : Admin opens pending report
    AdminInspection --> EvaluateReport : Review narrative & photo carousel

    EvaluateReport --> ApproveReport : Satisfactory?
    EvaluateReport --> ReturnReport : No (Provide feedback notes)

    ReturnReport --> RevisionDashboard : Status: Returned (Editable again)
    RevisionDashboard --> EditContent : Coordinator reads feedback & revises

    ApproveReport --> FinalLock : Status: Approved (Locked for both roles)
    FinalLock --> CompilePDF : Admin clicks Compile & Export
    CompilePDF --> LocalStorage : Save official PDF document
    LocalStorage --> [*]
```

---

## 3. Sequence Diagrams

Sequence Diagrams capture the system component interactions, API requests, and message passing between the React frontend, Firebase services (Auth, Firestore, Storage), and the local desktop shell.

### 3.1 Scenario A: Authentication & Role Redirection Gateway

This diagram illustrates the step-by-step user credentials validation and role routing flow.

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Admin / Office Coordinator)
    participant UI as React Frontend (App.jsx)
    participant FA as Firebase Authentication
    participant FS as Cloud Firestore (users collection)

    User->>UI: Enter Email & Password, click Log In
    UI->>UI: Validate form fields (email pattern, password >= 8 chars)
    alt Validation Fails
        UI-->>User: Display validation error message
    else Validation Succeeds
        UI->>FA: signInWithEmailAndPassword(email, password)
        alt Authentication Fails
            FA-->>UI: Return Auth error (invalid credentials)
            UI-->>User: Display error message on screen
        else Authentication Succeeds
            FA-->>UI: Return User Credentials (UID)
            UI->>FS: Fetch document users/{uid}
            FS-->>UI: Return User Document (username, email, role, etc.)
            alt role == "admin"
                UI->>UI: Set active user state
                UI->>User: Route & render AdminDashboard
            else role == "office_coordinator"
                UI->>UI: Set active user state
                UI->>User: Route & render OfficeCoordinatorDashboard
            else Unknown Role / Status Inactive
                UI->>UI: Block access & sign out
                UI-->>User: Display Access Restricted Alert
            end
        end
    end
```

### 3.2 Scenario B: Donation Log and FIFO Batch-Level Inventory Update

This sequence describes logging a donation and inserting separated batch items into Firestore to maintain inventory FIFO order.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin (Mrs. Faithful Anne F. Arugay)
    participant UI as React Frontend (AdminDashboard)
    participant FS as Cloud Firestore (donors, donations, inventory collections)

    Admin->>UI: Enter Donation Details & Items List
    UI->>UI: Validate donation metadata & items quantity
    
    Admin->>UI: Click "Save Donation"
    UI->>FS: Write to donors/ (if new donor profile created)
    FS-->>UI: Return Donor Document ID
    
    UI->>FS: Write to donations/ (donorId, date, purpose, items array)
    FS-->>UI: Return Donation Document ID
    
    loop For each item in donation batch
        UI->>UI: Check if consumable (has expiration date)
        alt Is Consumable
            UI->>FS: Write to inventory/ as separate batch document (name, qty, expiryDate, donationId, status="available")
        else Is Non-Consumable
            UI->>FS: Write to inventory/ as standard FIFO document (name, qty, expiryDate=null, donationId, status="available")
        end
        FS-->>UI: Return Inventory Document ID
    end

    UI->>UI: Re-run FIFO and approaching expiration sorting logic
    UI-->>Admin: Show success toast & update inventory/dashboard tables
```

### 3.3 Scenario C: Narrative Report Life-Cycle (Create -> Submit -> Return/Approve -> PDF Export)

This sequence follows the complete narrative lifecycle from text and image processing to state transitions and compiling.

```mermaid
sequenceDiagram
    autonumber
    actor Coord as Office Coordinator (Mr. Jonnel B. Manio)
    actor Admin as Admin (Mrs. Faithful Anne F. Arugay)
    participant UI_C as Coordinator Dashboard
    participant UI_A as Admin Dashboard
    participant ST as Firebase Storage
    participant FS as Cloud Firestore (narrative_reports collection)
    participant Local as Local OS File System

    %% 1. Report Draft & Photo Upload
    Coord->>UI_C: Create new report, select event, write narrative in Tiptap
    loop Drag-and-drop photos (max 10)
        Coord->>UI_C: Drop photo file (PNG/JPG)
        UI_C->>ST: Upload file to /narratives/AY_XXXX-XXXX/event_uuid/photo.jpg
        ST-->>UI_C: Return Download URL
        UI_C->>UI_C: Append photo URL to local draft state
    end

    %% 2. Save & Submit
    alt Save Draft
        Coord->>UI_C: Click "Save Draft"
        UI_C->>FS: Write to narrative_reports/ (status="draft", authorId, content, photo URLs)
        FS-->>UI_C: Confirm draft saved
    else Submit for Approval
        Coord->>UI_C: Click "Submit for Approval"
        UI_C->>FS: Write to narrative_reports/ (status="submitted", authorId, content, photo URLs)
        FS-->>UI_C: Confirm submission (Report state set to Read-Only)
    end

    %% 3. Admin Review Queue
    Admin->>UI_A: Open Reports Review tab
    UI_A->>FS: Query reports where status == "submitted"
    FS-->>UI_A: Return list of submitted reports
    Admin->>UI_A: Click inspect report
    UI_A->>UI_A: Display Tiptap narrative & photo carousel

    %% 4. Review Decisions
    alt Decision: Return Report
        Admin->>UI_A: Input feedback notes & click "Return"
        UI_A->>FS: Update narrative_reports/{id} (status="returned", adminFeedback="notes")
        FS-->>UI_A: Confirm return status
        UI_A-->>Admin: Show success message
        %% Coord gets updated status on dashboard refresh
        Coord->>UI_C: Refresh Compiled Reports list
        UI_C->>FS: Query reports
        FS-->>UI_C: Return list (one marked "returned" with feedback)
        UI_C->>Coord: Display report as editable with feedback notes
    else Decision: Approve Report
        Admin->>UI_A: Click "Approve Report"
        UI_A->>FS: Update narrative_reports/{id} (status="approved")
        FS-->>UI_A: Confirm approval status
        UI_A-->>Admin: Show success message (Report is locked from edits)
        
        %% 5. Export PDF
        Admin->>UI_A: Click "Export PDF"
        UI_A->>UI_A: Compile HTML content, fetch photos from Storage URLs
        UI_A->>Local: Generate and save PDF file locally (CES standard layout)
        Local-->>UI_A: Return save path confirmation
        UI_A-->>Admin: Open saved PDF file locally
    end
```
