# DommUnity: Data Dictionary

This document details the complete Data Dictionary for **DommUnity: A Desktop-Based Management System for the Community Extension & Services (CES) Office of Dominican College of Tarlac, Inc.** implemented using **Firebase Firestore** NoSQL Cloud Database.

---

Table No. 1: Data Dictionary for Users

| Attributes | Description |
| :--- | :--- |
| uid | Unique Firestore and Firebase Authentication generated identifier for the user account. |
| username | Unique account handle or username identifier associated with the user profile. |
| email | Registered institutional or personal email address used for system login authentication. |
| name | Full name of the user (e.g., CES Administrator or Office Coordinator). |
| role | System role and access permission level (admin or office_coordinator). |
| organizationId | Reference to the assigned academic department or student organization, or null for admin. |
| status | Current status of the user account, active or inactive. |
| createdAt | Date/time the user account record was created. |
| updatedAt | Date/time the user account record was last modified. |

---

Table No. 2: Data Dictionary for Organizations

| Attributes | Description |
| :--- | :--- |
| id | Unique Firestore generated identifier for the organization record (e.g., dept-cba, org-ssc). |
| name | Official full name of the academic department or student organization. |
| abbreviation | Shortened acronym or department code (e.g., CBA, CCS, COED, SSC). |
| description | Detailed description and community extension focus of the organization. |
| type | Classification of the institutional unit, department or organization. |
| coordinatorId | Reference ID of the assigned coordinator user account. |
| logo | Download URL or storage file path of the organization logo. |
| createdAt | Date/time the organization record was created. |

---

Table No. 3: Data Dictionary for Inventory

| Attributes | Description |
| :--- | :--- |
| id | Unique Firestore generated identifier for the inventory item. |
| name | Name and specification of the physical supply or relief goods item. |
| category | Category of the inventory item (e.g., school supplies, food packs, hygiene kits). |
| unit | Standard unit of measurement for packaging and distribution (e.g., pieces, cans, packs, bars). |
| quantity | Current available on-hand stock quantity in the inventory warehouse. |
| status | Operational stock status, available, low stock, out of stock, or expired. |
| receivedDate | Date/time the stock batch was received and logged into storage. |
| expiryDate | Expiration date of consumable relief goods, or null for non-perishable supplies. |
| donationId | Reference ID to the donation record from which the item batch was acquired. |
| lastUpdatedBy | Reference ID of the user who performed the most recent stock update. |
| hasBeenReleased | Indicator denoting whether stock from this batch has undergone distribution. |
| piecesPerUnit | Number of individual pieces contained per packaging unit. |
| groupUnit | Bulk grouping or packaging denomination (e.g., box, bundle, crate). |
| createdAt | Date/time the inventory record was created. |
| updatedAt | Date/time the inventory record was last updated. |

---

Table No. 4: Data Dictionary for Inventory Transactions

| Attributes | Description |
| :--- | :--- |
| id | Unique Firestore generated identifier for the transaction log entry. |
| action | Operational type of inventory movement, such as Stock In, Stock Release, or Adjustment. |
| itemName | Name of the specific inventory item involved in the movement. |
| quantity | Quantity of items added, released, or adjusted. |
| unit | Unit of measurement associated with the recorded quantity. |
| details | Contextual narrative or outreach event purpose justifying the inventory movement. |
| date | Date/time the inventory transaction occurred. |

---

Table No. 5: Data Dictionary for Donors

| Attributes | Description |
| :--- | :--- |
| id | Unique Firestore generated identifier for the donor record. |
| name | Full name of the individual donor, sponsoring alumni organization, or partner department. |
| type | Categorical classification of the donor, internal_department, external_sponsor, or individual. |
| contactEmail | Contact email address of the donor or representative. |
| contactPhone | Contact phone number of the donor. |
| createdAt | Date/time the donor record was created. |
| updatedAt | Date/time the donor record was last modified. |

---

Table No. 6: Data Dictionary for Donations

| Attributes | Description |
| :--- | :--- |
| id | Unique Firestore generated identifier for the donation turnover record. |
| donorId | Reference to the donor record who provided the contribution. |
| purpose | Outreach initiative or relief operation for which the donation was designated. |
| description | Narrative description of the donation turnover and context. |
| items | Itemized list of donated supplies containing names, quantities, units, and expiration dates. |
| receivedBy | Reference ID of the authorized user who officially accepted the donation. |
| dateOfDonation | Date the donation was physically received and turned over. |

---

Table No. 7: Data Dictionary for Donation Items (Embedded Sub-entity)

| Attributes | Description |
| :--- | :--- |
| name | Name of the specific donated item. |
| quantity | Quantity of items donated for the specific item. |
| unit | Packaging unit of measurement (e.g., pieces, cans, packs, bars). |
| piecesPerUnit | Number of piece-level contents per group unit. |
| groupUnit | Outer bulk packaging denomination (e.g., box, bundle). |
| expiryDate | Expiration date of the donated consumable item batch, if applicable. |

---

Table No. 8: Data Dictionary for Events

| Attributes | Description |
| :--- | :--- |
| id | Unique Firestore generated identifier for the outreach event. |
| name | Title and designation of the community outreach program or activity. |
| description | Detailed scope, target community objectives, and planned activities for the outreach. |
| location | Target partner community, adopted barangay, or venue where the event is conducted. |
| assignedOrganizationId | Reference to the department or student organization assigned to lead the event. |
| status | Current status of the outreach activity, planned, in_progress, completed, or cancelled. |
| scheduleDate | Scheduled date and start time of the outreach event. |
| createdAt | Date/time the outreach event was scheduled in the calendar. |
| updatedAt | Date/time the event schedule or details were last modified. |

---

Table No. 9: Data Dictionary for Narrative Reports

| Attributes | Description |
| :--- | :--- |
| id | Unique Firestore generated identifier for the narrative report document. |
| eventId | Reference to the documented outreach event. |
| authorId | Reference ID of the coordinator or faculty user who authored the report. |
| organizationId | Reference to the department or student organization associated with the report. |
| type | Program classification of the report (e.g., department_program, blood_donation). |
| semester | Academic semester during which the activity was conducted (e.g., 1st Semester, 2nd Semester). |
| academicYear | Academic school year under which the outreach is logged (e.g., 2026-2027). |
| narrative | Complete rich-text HTML content containing formatted report narrative, headers, and tables. |
| photos | Download URLs of uploaded photo documentation attachments. |
| status | Review status of the report, draft, submitted, approved, or returned. |
| adminFeedback | Review remarks, revision notes, or return recommendations from the Admin. |
| history | Embedded status transition audit log tracking user IDs, statuses, notes, and timestamps. |
| createdAt | Date/time the report document was created. |
| updatedAt | Date/time the report document was last modified. |

---

Table No. 10: Data Dictionary for Report History (Embedded Sub-entity)

| Attributes | Description |
| :--- | :--- |
| status | Status of the narrative report at the point of change (draft, submitted, returned, approved). |
| changedBy | Reference ID of the user who performed the status transition. |
| notes | Administrative notes, submission remarks, or return feedback accompanying the change. |
| timestamp | Date/time the status transition occurred. |
