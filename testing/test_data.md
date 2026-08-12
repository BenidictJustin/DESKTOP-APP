# DommUnity Test Data

---

## 1. Login Module

| **DOMMUNITY APPLICATION TEST DATA** |
| :--- |
| **TEST DATA FOR UNIT TEST:** |
| |
| **Module: Login Module** |
| Display the splash screen animation when the user launches the application. |
| Display the DommUnity logo and application name during startup. |
| Display the Login page after the splash screen finishes. |
| Automatically redirect the user to the Admin Dashboard if an active Admin session exists. |
| Automatically redirect the user to the Coordinator Dashboard if an active Coordinator session exists. |
| Display the Login Screen when no active authenticated session is detected. |
| |
| **Module: Credentials Verification Submodule** |
| Display email/username and password input fields on the login panel when the user accesses the login screen. |
| Display an error notification when the user submits empty email or password fields. |
| Display an error notification when user entering a password shorter than 8 characters. |
| Display an error notification when the user enters an invalid email format. |
| Display an error notification when the user enters credentials that do not match any registered account. |
| Unmask and reveal password text when the user clicks the eye icon. |
| Mask and hide password text when the user clicks the eye icon again. |
| Display a success notification and redirect the user to the Admin Dashboard after successful Admin login. |
| Display a success notification and redirect the user to the Coordinator Dashboard after successful Coordinator login. |
| |
| **Module: Forgot Password Submodule** |
| Display the "Forgot Password" modal when the user clicks the button. |
| Display an administrative restriction notice when the user attempts to reset password as a coordinator. |
| Display an error notification when the user submits an empty email field. |
| Display an error notification when the user enters an invalid email address format. |
| Send a secure password reset link via Firebase authentication after the user submits a valid registered admin email. |
| Display a success modal confirmation after the password reset email is sent. |
| Send a new password recovery link when the user clicks the "Resend Email" button. |
| Close the modal and return to the main login panel when the user clicks "Done" or the Close button. |

---

## 2. Admin Module

| **DOMMUNITY APPLICATION TEST DATA** |
| :--- |
| **TEST DATA FOR UNIT TEST:** |
| |
| **Module: Admin Module** |
| Load admin dashboard metrics, control panels, and navigation options after the admin completes successful authentication. |
| |
| **Module: Dashboard Module** |
| Display metric counter cards for stock items total pieces, departments, scheduled outreaches, and completed outreaches when the admin lands on the dashboard. |
| Open completed events history modal when the user clicks the "Completed" stats card. |
| Display a list of pending submitted narrative reports with report title, department, author, and date. |
| Open the report details modal for inspection when the user clicks the "Inspect Report" button. |
| Redirect the user to the Reports Review page when the user clicks the "Review All Reports" button. |
| Display a list of upcoming scheduled events with event name, date, location, and department abbreviation. |
| Redirect the user to the Events Scheduler module when the user clicks the "View All" button. |
| |
| **Module: Inventory Module** |
| Display active inventory listings and categories when the user accesses the Inventory tab. |
| |
| **Module: Stock Catalog & Tracker Submodule** |
| Display cataloged inventory table listing item name, category, quantity, status, and expiry date when the catalog tab loads. |
| Filter inventory item list dynamically when the user selects a specific Category from the dropdown. |
| Filter inventory item list dynamically when the user selects Stock Level Status (available, low stock, expired). |
| Highlight items near expiration date on the recommendation release card. |
| Open the release item process pre-filled with item data when the user clicks the quick release button on recommendation cards. |
| Open the edit item modal pre-filled with selected item details when the user clicks the "Edit" button. |
| Display confirmation dialog box when the user clicks "Delete", and delete item permanently after user confirms. |
| Export current inventory stock table summary as a PDF document when the user clicks the export button. |
| |
| **Module: Add Catalog Item Submodule** |
| Open the "Add Catalog Item" modal when the user clicks the corresponding button. |
| Display matching item suggestions as the user types, and auto-fill category and base unit after the user clicks a suggestion. |
| Display a validation error when the user submits the form with missing item name, quantity, or expiry date (for non-school supplies). |
| Allow selecting grouped unit types (packs, boxes, bundles) and entering pieces per unit when the user toggles grouped units. |
| Save new catalog entry to inventory stock database and close the modal after the user submits valid item details. |
| |
| **Module: Release Item Submodule** |
| Open the "Release Item" modal when the user clicks the corresponding button. |
| Search and select catalog items from the active stock dropdown menu when the user types or selects an item. |
| Select release unit type (base unit or grouped units) when the user chooses a unit option. |
| Display a validation error if the user enters a release quantity that exceeds available stock levels. |
| Append verified item to temporary pending release list and close the modal when the user clicks "Add to Release List". |
| |
| **Module: Release Review List Submodule** |
| Open the "Release Review List" modal displaying all pending release items when the user clicks the review list button. |
| Modify release quantity or remove item from the pending list when the user edits or clicks the remove button. |
| Display a validation error if the modified pending quantities entered by the user exceed available stock levels. |
| Deduct released quantities from inventory stock database and log transaction after the user clicks "Confirm Release". |
| |
| **Module: Inventory Report Submodule** |
| Display inventory transaction audit history table when the user clicks "Download Report PDF". |
| Open a document preview displaying transaction dates, item names, types, quantities, and descriptions. |
| Download and export inventory transaction history as a PDF file after the user clicks the export confirmation. |
| |
| **Module: Events Module** |
| Display all scheduled outreach events when the user accesses the Events tab. |
| |
| **Module: Outreach Scheduler Submodule** |
| Display list/card view of scheduled outreach activities and events. |
| Filter scheduled events list dynamically when the user selects a Month or enters a text search query. |
| Open the event modal pre-filled with event details when the user clicks the "Edit" button. |
| |
| **Module: Add Schedule Event/Edit Modal Submodule** |
| Open the Event Modal when the user clicks "Schedule Event" or the "Edit" button. |
| Provide input fields: Event Name, Description, Scheduled Date & Time, Target Location, Event Type (Department or Organization), and Assigned Department. |
| Display validation errors if required fields (Name, Date, Event Type) are left blank when the user submits the form. |
| Update event status dropdown (planned, cancelled, completed) when the user changes the status option. |
| Save event details to database and close the modal after the user submits the form successfully. |
| |
| **Module: Organization Module** |
| Display department and organization profiles when the user accesses the Organization tab. |
| |
| **Module: Registered Department / Organization Directory Submodule** |
| Display registered departments directory as grid cards containing department logo, name, and abbreviation. |
| Open department profile details page when the user clicks a department grid card. |
| Open department edit modal pre-filled with department details when the user clicks "Edit Profile". |
| Open completed activities tracking modal when the user clicks the "Completed Activities" stats card. |
| |
| **Module: Department / Organization Modal Submodule** |
| Open the "Register New Department" modal when the user clicks the "+ Add Department" button. |
| Provide input fields: Department Name, Abbreviation, Description, and Logo upload. |
| Display a validation error if fields are left empty or if the user enters an abbreviation that is already in use by another profile. |
| Save department profile to database and close the modal after the user submits valid details. |
| |
| **Module: Donor Module** |
| Display donors and donation history logs when the user accesses the Donor tab. |
| |
| **Module: Donation History Logs Submodule** |
| Display audit table of donation history showing dates, donor source, purpose, and donated item list. |
| |
| **Module: Donation Registration Submodule** |
| Open the "Register Donation Batch" modal when the user clicks the corresponding button. |
| Provide input fields: Donor Name, Donor Type, Date of Donation, Purpose, and Description. |
| Add a new item row or remove an existing row in the donation item table when the user clicks add or remove. |
| Input item row details: Category, Item Name, Quantity, Unit, Expiry Date, Grouped Unit type, and Pieces per Unit. |
| Save donation batch record, update inventory stocks with donated items, and close the modal after the user submits valid donation data. |
| |
| **Module: Reports Review** |
| Display narrative report records submitted by coordinators when the user accesses the Reports tab. |
| |
| **Module: Admin Reports Reviewer Submodule** |
| Filter and display reports list table grouped by status (submitted, approved, returned) when the user selects a status filter. |
| Open report narrative preview inside the DocumentViewer modal when the user clicks "Inspect Report". |
| Approve submitted report and automatically update status to "approved" after the user clicks the "Approve" button. |
| Return report with feedback note, validate that feedback note is not empty, and update status to "returned" after the user submits feedback. |
| Compile and export approved narrative report as an official PDF file when the user clicks the export button. |
| |
| **Module: User Accounts Module** |
| Display user accounts directory table when the user accesses the Accounts tab. |
| |
| **Module: Account Directory Submodule** |
| Display table grid of user accounts showing name, username, email, role, assigned organization, and status (active/inactive). |
| Open the "Add User" modal when the user clicks the "Add User" button. |
| Input user account details: Full Name, Email, Password, Role, and Department. |
| Toggle user account status dynamically between "active" and "inactive" when the user clicks the status button. |
| Send password reset email link to coordinator after the user clicks the "Reset Password" button. |
| |
| **Module: Logout** |
| Display "Confirm Logout" modal when the user clicks "Logout" in the sidebar navigation. |
| Terminate active user session and redirect to the Login screen after the user clicks "Logout" in the confirmation modal. |
| Dismiss confirmation modal and remain on the current screen when the user clicks "Cancel". |

---

## 3. Coordinator Module

| **DOMMUNITY APPLICATION TEST DATA** |
| :--- |
| **TEST DATA FOR UNIT TEST:** |
| |
| **Module: Coordinator Module** |
| Load coordinator dashboard metrics, editor workspace, and compiled report listings after the coordinator completes successful authentication. |
| |
| **Module: Dashboard Module** |
| Display stats cards summarizing Total, Draft, Submitted, Approved, and Returned reports created by the coordinator when landing on the dashboard. |
| Redirect coordinator to Document Editor with a blank canvas workspace when the user clicks "New Report". |
| Redirect coordinator to Compiled Reports page when the user clicks "View My Reports". |
| Open report preview for submitted/approved reports, or open Text Editor for draft/returned reports when the user clicks an item in the recent reports list. |
| |
| **Module: Document Editor Submodule** |
| Display a blank document canvas workspace for narrative text input when the user opens the editor. |
| Apply text formatting tools (headings, bold, italic, strikethrough, bullet lists, blockquotes) when the user selects narrative text and clicks a formatting icon. |
| Save report draft dynamically to database after the user clicks "Save Draft". |
| Submit narrative report to Admin for approval after the user clicks "Submit Report". |
| |
| **Module: Compiled Reports Submodule** |
| Display list of coordinator's reports showing title, status badges, updated date, and admin feedback (if returned). |
| Open report narrative preview inside DocumentViewer modal when the user clicks "View". |
| Reopen draft or returned reports inside the Text Editor when the user clicks "Edit". |
| |
| **Module: Logout** |
| Display "Confirm Logout" modal when the user clicks "Logout" in the sidebar navigation. |
| Terminate active coordinator session and redirect to the Login screen after the user clicks "Logout" in the confirmation modal. |
| Dismiss confirmation modal and remain on the dashboard when the user clicks "Cancel". |


