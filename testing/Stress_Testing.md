# DommUnity System Stress Testing and Concurrent User Testing

---

## 1. Overview

This report shows the **Stress Testing** and **Concurrent User Testing** results for the **DommUnity System**. The tests were done to make sure the system stays stable, works well, and responds fast during heavy daily use, with a lot of data, and with two users using the app at the same time.

---

## 2. Stress Testing Report

During the stress testing of the DommUnity system, the proponents tested the main modules to see how the system works under heavy use. The testing covered all major parts, including Login and Authentication, Admin and Coordinator Dashboards, Inventory Management, Outreach Events Scheduler, Department and Organization Directory, Donor Management, Reports Review, User Accounts Management, and Office Coordinator tools like the Document Editor, Compiled Reports, Document Viewer, and PDF Export. The proponents tested adding many records, switching between pages, saving forms many times, writing long reports with pictures, and making PDF files.

The proponents started by testing the Login and Authentication module. The test tried logging in many times for two user roles: the CES Admin and the Office Coordinator. The goal was to check if the system can handle many login requests without slowing down. The expected result was for both users to log in easily and reach their dashboards without errors or delays. When logging in normally, the system responded fast. But when logins were sent very fast one after another, the system took a few seconds longer to check the account. This happened because repeated requests were sent to the database while the first request was still loading. To fix this, the proponents added simple checks on the form to verify inputs first and made the system handle only one login request at a time. After this change, logging in worked fast and without problems for both users.

For the Admin and Coordinator Dashboards, the proponents tested opening the dashboard while the system had a lot of data, such as many pending reports, scheduled events, and stock items. The expected result was for the dashboard to show all summary cards and event lists quickly without freezing. During testing, the dashboard showed the right data, but it paused for a short moment because it tried to load all summary cards at the same time. The proponents fixed this by making the dashboard load data in a faster and cleaner way. After the fix, both dashboards loaded all summary cards and upcoming events smoothly without any delay.

In the Inventory Management module, the proponents added many stock items and searched and filtered the list many times. The expected result was for the table to show the right search results quickly without freezing. During testing, the table showed the correct items, but typing fast in the search bar made the list feel slow. This happened because the system tried to filter the whole list after every single letter typed. The proponents fixed this by adding a short pause so the system only searches after the user stops typing. This fix made searching and filtering items fast and easy to use.

The Outreach Events Scheduler and Donor Management modules were tested by creating many event records and donation entries, and then switching between date and status filters. The expected result was for the system to save records correctly and update the screen right away after filtering. The system saved all records correctly during the test. A small delay happened when switching filters quickly, which was fixed by improving how the list updates on screen. After this change, both modules updated lists quickly and showed the correct information.

In the Department and Organization Directory and User Accounts modules, the proponents opened department profiles, updated department details, and edited user accounts many times. The expected result was for all updates to save correctly and appear on screen right away. Both modules worked well. The proponents noticed that popup windows sometimes took a moment to open when many records were loaded. The proponents made these popup windows load their data faster. After this change, opening and editing department profiles and user accounts worked fast and without any delay.

The Reports Review and Compiled Reports modules were tested by opening many submitted narrative reports and quickly switching between the Pending, Approved, and Returned tabs. The expected result was for the system to show the correct reports under each tab without delay. During testing, the reports showed up under the right tabs. But clicking between tabs very fast caused a short pause because the system reloaded all reports from the online database each time. The proponents fixed this by saving the report data for a short time inside the app so that switching tabs no longer needs to download everything again. After this update, moving between report tabs was fast and smooth.

The Document Editor was tested by writing long narrative reports with many parts, tables, and several photos. The expected result was for the editor to stay fast while typing and to save drafts automatically in the background without stopping the user. During testing, the editor worked well for short documents. But for long reports with many photos, typing started to lag and the auto-save caused short pauses. The proponents fixed this by automatically shrinking and compressing pictures before adding them to the document, and by letting the auto-save run quietly in the background. These fixes made typing and editing smooth, even for long reports with many pictures.

For the Document Viewer and PDF Export, the proponents tested making PDF files for reports with many pages. The expected result was to make a complete and clean PDF without cut-off text or errors. In early tests of long reports, page breaks were placed in the wrong spots and the export sometimes failed to finish. The proponents fixed this by creating the PDF pages one by one in the right order and setting clear rules for where pages should break. After these fixes, the Document Viewer showed correct report previews, and PDF exports finished cleanly without missing parts.

Overall, the stress testing showed that the DommUnity system stays stable and works well under heavy use. The proponents found the cause of each small issue and applied simple fixes. After all fixes were made, the entire app ran smoothly without crashes, lost data, or login errors, showing that DommUnity is ready for daily use by CES Administrators and Office Coordinators.

---

## 3. Concurrent User Testing Report

Concurrent user testing was done using **two (2) active users at the same time** to make sure the system works well for multiple users without conflicts or errors.

- **User 1 (CES Admin):** Logged into the admin dashboard, added stock items, recorded inventory releases, scheduled outreach activities, and reviewed submitted narrative reports.
- **User 2 (Office Coordinator):** Logged into the coordinator workspace at the same time, wrote a narrative report in the Document Editor, added pictures, updated sections, saved drafts, and submitted the report for review.

During testing, both users worked on the system at the same time from their own accounts without any problems. The system saved and updated data from both users correctly. The CES Admin's actions did not slow down or stop the Office Coordinator's document editing, and reports submitted by the coordinator appeared right away on the admin's review screen. Both users moved between pages, filled out forms, and viewed data smoothly. No lost data, account errors, or slowdowns happened during the concurrent testing.
