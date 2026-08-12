# DommUnity Program Specifications

---

## 1. Login Module

| **Program Specifications of DommUnity: Login Module** |
| :--- |
| **Programming Language:** JavaScript |
| **Events:** |
| 1. Display the splash screen when the application is opened. |
| 2. Display the DommUnity logo and the “DommUnity” application name when the application starts. |
| 3. Redirect the user to their respective dashboard (Admin or Coordinator) if a valid session exists. |
| 4. Display the Login Screen if there is no active authenticated session. |
| |
| **Module:** Credentials Verification Submodule |
| **Purpose:** To allow the user to input their email and credentials to log in. |
| **Events:** |
| 1. Display email/username and password forms. |
| 2. Display error notification if email or password fields are left blank on submit. |
| 3. Display an error notification when the password is less than 8 characters long. |
| 4. Display an error notification when the email format is invalid. |
| 5. Display an error notification when credentials do not match any registered user. |
| 6. Toggle password input visibility (masked/unmasked) when the eye icon is clicked. |
| |
| **Module:** Forgot Password Submodule |
| **Purpose:** To allow users to safely request a password reset link through email. |
| **Events:** |
| 1. Display the "Forget password" modal when clicked. |
| 2. Display notification text explaining that password reset requests are restricted to Admins and that Coordinators must contact the CES Admin. |
| 3. Display an error notification if the email field is empty or with an invalid format. |
| 4. Send a secure password reset request email through Firebase authentication when the form is submitted. |
| 5. Display a success modal indicating that the reset link has been successfully sent. |
| 6. Send a new password recovery link when "Resend Email" is clicked. |
| 7. Close the modal and return to the login interface when the "Done" or Close button is clicked. |

---

## 2. Admin Module

| **Program Specifications of DommUnity: Admin Module** |
| :--- |
| **Programming Language:** JavaScript |
| **Events:** |
| 1. Load admin dashboard metrics, control panels, and navigation options upon successful admin authentication. |
| |
| **Module:** Dashboard Module |
| **Purpose:** To display system-wide summaries, pending reports, and upcoming outreaches to the administrator. |
| **Events:** |
| 1. Display metrics counters (stock items total pieces, departments, scheduled outreaches, and completed outreaches). |
| 2. Open completed events history modal when the "Completed" stats card is clicked. |
| 3. Display a list of pending submitted reports. |
| 4. Open the report details modal for review when "Inspect Report" is clicked. |
| 5. Redirect to the Reports Review page when "Review All Reports" is clicked. |
| 6. Display a list of events. |
| 7. Redirect to the Events Scheduler module when "View All" is clicked. |
| |
| **Module:** Inventory Module |
| **Purpose:** To manage all inventory items used in community activities. |
| **Events:** |
| 1. Display the inventory listings, categories when the tab is accessed. |
| |
| **Module:** Stock Catalog & Tracker Submodule |
| **Purpose:** To manage and track stock items and categories. |
| **Events:** |
| 1. Display list of cataloged inventory items showing item name, category, quantity, status, and expiry date. |
| 2. Filter item list dynamically by Category. |
| 3. Filter item list dynamically by Stock Level Status (available, low stock, expired). |
| 4. Highlight items that are recommended for release (e.g., items with near expiration dates). |
| 5. Allow quick release of recommended items directly from the recommendation card. |
| 6. Edit item details by populating the add/edit modal with selected item data. |
| 7. Delete an item permanently with a confirmation dialog box. |
| 8. Export the current stock table summary as a PDF document. |
| |
| **Module:** Add Catalog Item Submodule |
| **Purpose:** To create a new inventory item catalog entry. |
| **Events:** |
| 1. Open the "Add Catalog Item" modal when the corresponding button is clicked. |
| 2. Display suggestions of existing item names as the user types, and auto-fill category and unit when a suggestion is clicked. |
| 3. Display a validation error if name, quantity, or expiration date (for non-school supplies) are missing. |
| 4. Allow toggling of grouped unit types (e.g., packs, boxes, bundles) and inputting pieces per unit. |
| 5. Save new item and close the modal. |
| |
| **Module:** Release Item Submodule |
| **Purpose:** To add items to a temporary pending release list for upcoming events. |
| **Events:** |
| 1. Open the "Release Item" modal when the corresponding button is clicked. |
| 2. Search and select items from a dropdown of active catalog stock. |
| 3. Allow selection of release unit types (base unit or grouped units). |
| 4. Validate release quantities to prevent exceeding available stock levels. |
| 5. Append verified release items to the temporary pending release review list and close the modal. |
| |
| **Module:** Release Review List Submodule |
| **Purpose:** To inspect, edit, and confirm the release of catalog items. |
| **Events:** |
| 1. Open the "Release Review List" modal displaying all pending release items. |
| 2. Modify release quantity or remove items from the pending list. |
| 3. Validate that none of the items exceed available stock levels. |
| 4. Deduct the release quantities from the inventory stock on confirmation. |
| |
| **Module:** Inventory Report Submodule |
| **Purpose:** To display and export all inventory operations (added, updates, releases, deletions). |
| **Events:** |
| 1. Display Inventory history table when "Download Report PDF" is clicked. |
| 2. Open a report preview displaying dates, item names, types, quantities, and descriptions. |
| 3. Export Inventory report as a PDF. |
| |
| **Module:** Events Module |
| **Purpose:** To allows the Admin to record and manage events. |
| **Events:** |
| 1. Display all scheduled events upon tab access. |
| |
| **Module:** Outreach Scheduler Submodule |
| **Purpose:** To plan, edit, and track community activities schedules and details. |
| **Events:** |
| 1. Display a list view of scheduled activities events. |
| 2. Filter events list dynamically by Month and text queries. |
| 3. Edit event details by opening the Event Modal with pre-filled fields. |
| |
| **Module:** Add Schedule Event/Edit Modal Submodule |
| **Purpose:** To register new or update activities events. |
| **Events:** |
| 1. Open the Event Modal when "Schedule Event" or Edit button is clicked. |
| 2. Provide input fields: Name, Description, Date & Time, Location, Event Type (Department or Organization), and Assigned Department. |
| 3. Display validation errors if required fields are missing on form submit. |
| 4. Update event status (planned, Cancelled, completed). |
| 5. Save the scheduled event and close the modal. |
| |
| **Module:** Organization Module |
| **Purpose:** allows the Admin to manage the organizations and departments. |
| **Events:** |
| 1. Display department and organization profiles upon accessing the tab. |
| |
| **Module:** Registered Deparment / Organization Directory Submodule. |
| **Purpose:** To view, create, edit, and delete department and organization profiles. |
| **Events:** |
| 1. Display the registered departments directory grid as cards with their logo, name, and abbreviation. |
| 2. Open the specific department's profile details page when a department card is clicked. |
| 3. Edit department details by opening the department modal. |
| 4. Open the completed activities tracking modal when the "Completed Activities" stats card is clicked. |
| |
| **Module:** Department / Organization Modal Submodule. |
| **Purpose:** To input profile details for registering or updating organizations and departments. |
| **Events:** |
| 1. Open the "Register New Department" modal when the "+ Add Department" button is clicked. |
| 2. Input fields: Name, Abbreviation, Description, Logo URL (for departments). |
| 3. Display validation error if fields are empty or if the abbreviation slug is already in use by another profile. |
| 4. Save details and close the modal. |
| |
| **Module:** Donor Module. |
| **Purpose:** To allows the admin to save the details of Donor Information and Donations. |
| **Events:** |
| 1. Display donors and donation history upon tab access. |
| |
| **Module:** Donation History Logs Submodule. |
| **Purpose:** To view list of donors donation. |
| **Events:** |
| 1. Display list of donation history. |
| |
| **Module:** Donation Registration Submodule. |
| **Purpose:** To record batch donation details and add items directly to inventory stocks. |
| **Events:** |
| 1. Open the "Register Donation" modal when the corresponding button is clicked. |
| 2. Input fields: Donor Name, Donor Type, Date of Donation, Purpose, and Description. |
| 3. Allow dynamically adding or removing item rows in the donation item table list. |
| 4. Input item details: Category, Name, Quantity, Unit, Expiry Date, Grouped Unit type, and Pieces per Unit. |
| 5. Save the donation batch record, add items to the inventory and close the modal. |
| |
| **Module:** Reports Review. |
| **Purpose:** To allows the Admin to view submitted narrative reports. |
| **Events:** |
| 1. Display narrative report records submit by coordinator. |
| |
| **Module:** Admin Reports Reviewer Submodule. |
| **Purpose:** To inspect narrative reports submitted by coordinators and issue approvals or feedback. |
| **Events:** |
| 1. Display reports lists by status (submitted, approved, returned). |
| 2. Open report narrative preview inside the DocumentViewer modal when inspect button is clicked. |
| 3. Approve report, update automatically status to "approved". |
| 4. Return report with feedback. |
| 5. Export approved narrative reports as a PDF files. |
| |
| **Module:** User Accounts Module. |
| **Purpose:** To allows the admin to create, update and manage system user accounts. |
| **Events:** |
| 1. Display user accounts upon tab access. |
| |
| **Module:** Account Directory Submodule. |
| **Purpose:** To manage access permissions, roles, and status of user credentials. |
| **Events:** |
| 1. Display a table grid of user accounts showing name, username, email, role, and account status (active/inactive). |
| 2. Open the "Add User" modal when the create user button is clicked. |
| 3. Input user details (name, email, password, role). |
| 4. Toggle account status dynamically between "active" and "inactive". |
| 5. Send password reset link to coordinator email through clicking "Reset Password" button. |
| |
| **Module:** Logout. |
| **Purpose:** To let the admin log out their accounts. |
| **Events:** |
| 1. Display the “Confirm Logout” modal when the logout is clicked in the sidebar layout. |
| 2. Display the login module when the admin clicks "Logout". |
| 3. Close the panel when the admin clicks "Cancel". |

---

## 3. Coordinator Module

| **Program Specifications of DommUnity: Coordinator Module** |
| :--- |
| **Programming Language:** JavaScript |
| **Events:** |
| 1. Load coordinator dashboard metrics, editor workspace, and compiled report listings upon coordinator authentication. |
| |
| **Module:** Dashboard Module. |
| **Purpose:** To display personal report metrics and quick shortcuts. |
| **Events:** |
| 1. Display stats cards summarizing Total, Draft, Submitted, Approved, and Returned reports. |
| 2. Redirect to the Document Editor with a blank canvas when "New Report" is clicked. |
| 3. Redirect to the Compiled Reports page when "View My Reports" is clicked. |
| 4. Allow quick viewing of submitted/approved reports, or quick editing of draft/returned reports directly from the list. |
| |
| **Module:** Document Editor Submodule. |
| **Purpose:** To write or type narrative reports in the document. |
| **Events:** |
| 1. Display a blank document canvas workspace for narrative text input. |
| 2. Provide formatting tools. |
| 3. Save report as an draft. |
| 4. Submit the narrative report to the Admin for approval. |
| |
| **Module:** Compiled Reports Submodule. |
| **Purpose:** To view, edit, and compile reports. |
| **Events:** |
| 1. Display list of reports showing status and admin feedback (if returned). |
| 2. Open report narrative preview inside the DocumentViewer modal when "View" is clicked. |
| 3. Open draft or returned reports in the Text Editor when "Edit" is clicked. |
| |
| **Module:** Logout. |
| **Purpose:** To let the coordinator log out their accounts. |
| **Events:** |
| 1. Display the “Confirm Logout” modal when the logout is clicked in the sidebar layout. |
| 2. Display the login module when the coordinator clicks "Logout". |
| 3. Close the panel when the coordinator clicks "Cancel". |
