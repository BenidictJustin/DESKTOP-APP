# DommUnity System Stress Testing Specification

---

## 1. Overview

This document presents the **Stress Testing Results** for the **DommUnity System**. Stress testing evaluates system performance and average response times under increasing concurrent user loads (50, 100, 200, 500, 1,000, and 2,000 concurrent users/requests).

The testing covers major user workflows across the **Login Module**, **CES Admin Modules** (Dashboard, Inventory Management, Events, Organization, Donor, Reports Review, User Accounts), **Coordinator Modules** (Dashboard, Document Editor, Document Viewer), and **Shared System Functions** (PDF Export, Search & Filter, Modals & Forms).

---

## 2. Stress Testing Results Table

<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr style="text-align: left; font-weight: bold;">
      <th style="border: 1px solid #000; width: 22%;">Module / Action</th>
      <th style="border: 1px solid #000; width: 28%;">Concurrent Load / Test Condition</th>
      <th style="border: 1px solid #000; width: 15%; text-align: center;">Average Response Time</th>
      <th style="border: 1px solid #000; width: 15%; text-align: center;">Success Rate</th>
      <th style="border: 1px solid #000; width: 20%;">Remarks / Observations</th>
    </tr>
  </thead>
  <tbody>
    <!-- LOGIN MODULE -->
    <tr style="font-weight: bold;">
      <td colspan="5" style="border: 1px solid #000; padding: 8px;">Login Module</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">Credentials & Authentication Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Log in to system</td>
      <td style="border: 1px solid #000;">50 users log in concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">1.80s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Did not show any noticeable slowdown or issues</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Log in to system</td>
      <td style="border: 1px solid #000;">100 users log in concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.30s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Did not show any noticeable slowdown or issues</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Log in to system</td>
      <td style="border: 1px solid #000;">200 users log in concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">3.50s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Acceptable performance under moderate concurrent load</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Log in to system</td>
      <td style="border: 1px solid #000;">500 users log in concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">6.20s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Response time increases; system remains operational</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Log in to system</td>
      <td style="border: 1px solid #000;">1,000 users log in concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">11.80s</td>
      <td style="border: 1px solid #000; text-align: center;">95% Success</td>
      <td style="border: 1px solid #000;">High load; performance degrades, minor request timeouts</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Log in to system</td>
      <td style="border: 1px solid #000;">2,000 users log in concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">N/A</td>
      <td style="border: 1px solid #000; text-align: center;">0% Success</td>
      <td style="border: 1px solid #000;">System reaches limit; requests fail</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">Password Recovery Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Request password reset email</td>
      <td style="border: 1px solid #000;">100 requests submitted concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.10s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Did not show any noticeable slowdown or issues</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Request password reset email</td>
      <td style="border: 1px solid #000;">500 requests submitted concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">5.90s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Response time increases; system remains operational</td>
    </tr>
    <!-- CES ADMIN MODULES -->
    <tr style="font-weight: bold;">
      <td colspan="5" style="border: 1px solid #000; padding: 8px;">CES Admin Modules</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">Dashboard Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View dashboard metrics and events</td>
      <td style="border: 1px solid #000;">50 requests submitted concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">1.50s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Did not show any noticeable slowdown or issues</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View dashboard metrics and events</td>
      <td style="border: 1px solid #000;">100 requests submitted concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.10s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Did not show any noticeable slowdown or issues</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View dashboard metrics and events</td>
      <td style="border: 1px solid #000;">200 requests submitted concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">3.20s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Acceptable performance under moderate concurrent load</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View dashboard metrics and events</td>
      <td style="border: 1px solid #000;">500 requests submitted concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">5.80s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Response time increases; data loads successfully</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View dashboard metrics and events</td>
      <td style="border: 1px solid #000;">1,000 requests submitted concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">10.40s</td>
      <td style="border: 1px solid #000; text-align: center;">92% Success</td>
      <td style="border: 1px solid #000;">Performance degrades under high load</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View dashboard metrics and events</td>
      <td style="border: 1px solid #000;">2,000 requests submitted concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">N/A</td>
      <td style="border: 1px solid #000; text-align: center;">0% Success</td>
      <td style="border: 1px solid #000;">System reaches limit; requests fail</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">Inventory Management Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View and filter inventory items</td>
      <td style="border: 1px solid #000;">50 lists fetched concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">1.60s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Did not show any noticeable slowdown or issues</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View and filter inventory items</td>
      <td style="border: 1px solid #000;">200 lists fetched concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">3.40s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Acceptable performance under moderate concurrent load</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View and filter inventory items</td>
      <td style="border: 1px solid #000;">1,000 lists fetched concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">11.20s</td>
      <td style="border: 1px solid #000; text-align: center;">90% Success</td>
      <td style="border: 1px solid #000;">Performance degrades under high load</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Add new catalog item</td>
      <td style="border: 1px solid #000;">100 items added concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.40s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Item added successfully without noticeable delay</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Add new catalog item</td>
      <td style="border: 1px solid #000;">500 items added concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">6.50s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Item added with slight response delay</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Release inventory items</td>
      <td style="border: 1px solid #000;">100 releases processed concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.70s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Items released successfully</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Release inventory items</td>
      <td style="border: 1px solid #000;">500 releases processed concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">7.10s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Items released with slight response delay</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">Outreach Events Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View and filter scheduled events</td>
      <td style="border: 1px solid #000;">100 event schedules fetched concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.00s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Did not show any noticeable slowdown or issues</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View and filter scheduled events</td>
      <td style="border: 1px solid #000;">500 event schedules fetched concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">5.50s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Events loaded with slight response delay</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Schedule or edit event</td>
      <td style="border: 1px solid #000;">100 event updates saved concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.30s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Event saved successfully</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Schedule or edit event</td>
      <td style="border: 1px solid #000;">500 event updates saved concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">6.00s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Event saved with slight response delay</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">Department & Organization Directory Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View department profiles</td>
      <td style="border: 1px solid #000;">100 profiles loaded concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">1.90s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Did not show any noticeable slowdown or issues</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Add or edit department profile</td>
      <td style="border: 1px solid #000;">100 profile updates saved concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.50s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Profile saved successfully</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">Donor Management Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View donation history</td>
      <td style="border: 1px solid #000;">100 donation logs fetched concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.20s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Did not show any noticeable slowdown or issues</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Register donation record</td>
      <td style="border: 1px solid #000;">100 donations registered concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.80s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Donation recorded successfully</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Register donation record</td>
      <td style="border: 1px solid #000;">500 donations registered concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">7.40s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Donation recorded with response delay</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">Narrative Reports Review Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View submitted reports list</td>
      <td style="border: 1px solid #000;">100 report lists loaded concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.10s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Did not show any noticeable slowdown or issues</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View submitted reports list</td>
      <td style="border: 1px solid #000;">500 report lists loaded concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">6.10s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Reports loaded with slight response delay</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Inspect report preview</td>
      <td style="border: 1px solid #000;">100 report previews loaded concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.60s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Preview displayed correctly</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Approve or return report</td>
      <td style="border: 1px solid #000;">100 status updates submitted concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.40s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Report status updated successfully</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">User Accounts Management Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View user accounts list</td>
      <td style="border: 1px solid #000;">100 user directories fetched concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">1.80s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Did not show any noticeable slowdown or issues</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Add new user account</td>
      <td style="border: 1px solid #000;">100 accounts created concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.60s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Account created successfully</td>
    </tr>
    <!-- COORDINATOR MODULES -->
    <tr style="font-weight: bold;">
      <td colspan="5" style="border: 1px solid #000; padding: 8px;">Coordinator Modules</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">Coordinator Dashboard Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View coordinator dashboard</td>
      <td style="border: 1px solid #000;">100 requests submitted concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">1.70s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Did not show any noticeable slowdown or issues</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">Document Editor Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Save report draft</td>
      <td style="border: 1px solid #000;">50 drafts saved concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">1.40s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Did not show any noticeable slowdown or issues</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Save report draft</td>
      <td style="border: 1px solid #000;">200 drafts saved concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">3.10s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Draft saved successfully</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Submit report for review</td>
      <td style="border: 1px solid #000;">100 reports submitted concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.50s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Report submitted successfully</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Submit report for review</td>
      <td style="border: 1px solid #000;">500 reports submitted concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">6.80s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Report submitted with slight response delay</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">Document Viewer Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View report preview</td>
      <td style="border: 1px solid #000;">100 document renders requested concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">2.20s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Preview displayed correctly</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">View report preview</td>
      <td style="border: 1px solid #000;">500 document renders requested concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">5.90s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Preview displayed with slight delay</td>
    </tr>
    <!-- SHARED SYSTEM FUNCTIONS -->
    <tr style="font-weight: bold;">
      <td colspan="5" style="border: 1px solid #000; padding: 8px;">Shared System Functions</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">PDF Export Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Export report as PDF</td>
      <td style="border: 1px solid #000;">50 PDF exports executed concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">3.20s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">PDF exported successfully</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Export report as PDF</td>
      <td style="border: 1px solid #000;">100 PDF exports executed concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">4.80s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">PDF exported successfully</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Export report as PDF</td>
      <td style="border: 1px solid #000;">200 PDF exports executed concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">8.50s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">PDF exported with slight response delay</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Export report as PDF</td>
      <td style="border: 1px solid #000;">500 PDF exports executed concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">15.20s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">PDF exported with noticeable delay under heavy load</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">Search & Filter Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Search and filter records</td>
      <td style="border: 1px solid #000;">100 search queries executed concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">1.90s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Results displayed quickly</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Search and filter records</td>
      <td style="border: 1px solid #000;">500 search queries executed concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">5.40s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Results displayed with slight response delay</td>
    </tr>
    <tr style="font-weight: bold; font-style: italic;">
      <td colspan="5" style="border: 1px solid #000; padding: 6px 8px;">Form & Modals Submodule</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Open modals and validate forms</td>
      <td style="border: 1px solid #000;">100 modal interactions triggered concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">1.30s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Modals open quickly</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;">Open modals and validate forms</td>
      <td style="border: 1px solid #000;">500 modal interactions triggered concurrently</td>
      <td style="border: 1px solid #000; text-align: center;">4.10s</td>
      <td style="border: 1px solid #000; text-align: center;">100% Success</td>
      <td style="border: 1px solid #000;">Modals open with slight response delay</td>
    </tr>
  </tbody>
</table>

---

### GFM Markdown Table Representation

| Module / Action | Concurrent Load / Test Condition | Average Response Time | Success Rate | Remarks / Observations |
| :--- | :--- | :---: | :---: | :--- |
| **Login Module** | | | | |
| *Credentials & Authentication Submodule* | | | | |
| Log in to system | 50 users log in concurrently | 1.80s | 100% Success | Did not show any noticeable slowdown or issues |
| Log in to system | 100 users log in concurrently | 2.30s | 100% Success | Did not show any noticeable slowdown or issues |
| Log in to system | 200 users log in concurrently | 3.50s | 100% Success | Acceptable performance under moderate concurrent load |
| Log in to system | 500 users log in concurrently | 6.20s | 100% Success | Response time increases; system remains operational |
| Log in to system | 1,000 users log in concurrently | 11.80s | 95% Success | High load; performance degrades, minor request timeouts |
| Log in to system | 2,000 users log in concurrently | N/A | 0% Success | System reaches limit; requests fail |
| *Password Recovery Submodule* | | | | |
| Request password reset email | 100 requests submitted concurrently | 2.10s | 100% Success | Did not show any noticeable slowdown or issues |
| Request password reset email | 500 requests submitted concurrently | 5.90s | 100% Success | Response time increases; system remains operational |
| **CES Admin Modules** | | | | |
| *Dashboard Submodule* | | | | |
| View dashboard metrics and events | 50 requests submitted concurrently | 1.50s | 100% Success | Did not show any noticeable slowdown or issues |
| View dashboard metrics and events | 100 requests submitted concurrently | 2.10s | 100% Success | Did not show any noticeable slowdown or issues |
| View dashboard metrics and events | 200 requests submitted concurrently | 3.20s | 100% Success | Acceptable performance under moderate concurrent load |
| View dashboard metrics and events | 500 requests submitted concurrently | 5.80s | 100% Success | Response time increases; data loads successfully |
| View dashboard metrics and events | 1,000 requests submitted concurrently | 10.40s | 92% Success | Performance degrades under high load |
| View dashboard metrics and events | 2,000 requests submitted concurrently | N/A | 0% Success | System reaches limit; requests fail |
| *Inventory Management Submodule* | | | | |
| View and filter inventory items | 50 lists fetched concurrently | 1.60s | 100% Success | Did not show any noticeable slowdown or issues |
| View and filter inventory items | 200 lists fetched concurrently | 3.40s | 100% Success | Acceptable performance under moderate concurrent load |
| View and filter inventory items | 1,000 lists fetched concurrently | 11.20s | 90% Success | Performance degrades under high load |
| Add new catalog item | 100 items added concurrently | 2.40s | 100% Success | Item added successfully without noticeable delay |
| Add new catalog item | 500 items added concurrently | 6.50s | 100% Success | Item added with slight response delay |
| Release inventory items | 100 releases processed concurrently | 2.70s | 100% Success | Items released successfully |
| Release inventory items | 500 releases processed concurrently | 7.10s | 100% Success | Items released with slight response delay |
| *Outreach Events Submodule* | | | | |
| View and filter scheduled events | 100 event schedules fetched concurrently | 2.00s | 100% Success | Did not show any noticeable slowdown or issues |
| View and filter scheduled events | 500 event schedules fetched concurrently | 5.50s | 100% Success | Events loaded with slight response delay |
| Schedule or edit event | 100 event updates saved concurrently | 2.30s | 100% Success | Event saved successfully |
| Schedule or edit event | 500 event updates saved concurrently | 6.00s | 100% Success | Event saved with slight response delay |
| *Department & Organization Directory Submodule* | | | | |
| View department profiles | 100 profiles loaded concurrently | 1.90s | 100% Success | Did not show any noticeable slowdown or issues |
| Add or edit department profile | 100 profile updates saved concurrently | 2.50s | 100% Success | Profile saved successfully |
| *Donor Management Submodule* | | | | |
| View donation history | 100 donation logs fetched concurrently | 2.20s | 100% Success | Did not show any noticeable slowdown or issues |
| Register donation record | 100 donations registered concurrently | 2.80s | 100% Success | Donation recorded successfully |
| Register donation record | 500 donations registered concurrently | 7.40s | 100% Success | Donation recorded with response delay |
| *Narrative Reports Review Submodule* | | | | |
| View submitted reports list | 100 report lists loaded concurrently | 2.10s | 100% Success | Did not show any noticeable slowdown or issues |
| View submitted reports list | 500 report lists loaded concurrently | 6.10s | 100% Success | Reports loaded with slight response delay |
| Inspect report preview | 100 report previews loaded concurrently | 2.60s | 100% Success | Preview displayed correctly |
| Approve or return report | 100 status updates submitted concurrently | 2.40s | 100% Success | Report status updated successfully |
| *User Accounts Management Submodule* | | | | |
| View user accounts list | 100 user directories fetched concurrently | 1.80s | 100% Success | Did not show any noticeable slowdown or issues |
| Add new user account | 100 accounts created concurrently | 2.60s | 100% Success | Account created successfully |
| **Coordinator Modules** | | | | |
| *Coordinator Dashboard Submodule* | | | | |
| View coordinator dashboard | 100 requests submitted concurrently | 1.70s | 100% Success | Did not show any noticeable slowdown or issues |
| *Document Editor Submodule* | | | | |
| Save report draft | 50 drafts saved concurrently | 1.40s | 100% Success | Did not show any noticeable slowdown or issues |
| Save report draft | 200 drafts saved concurrently | 3.10s | 100% Success | Draft saved successfully |
| Submit report for review | 100 reports submitted concurrently | 2.50s | 100% Success | Report submitted successfully |
| Submit report for review | 500 reports submitted concurrently | 6.80s | 100% Success | Report submitted with slight response delay |
| *Document Viewer Submodule* | | | | |
| View report preview | 100 document renders requested concurrently | 2.20s | 100% Success | Preview displayed correctly |
| View report preview | 500 document renders requested concurrently | 5.90s | 100% Success | Preview displayed with slight delay |
| **Shared System Functions** | | | | |
| *PDF Export Submodule* | | | | |
| Export report as PDF | 50 PDF exports executed concurrently | 3.20s | 100% Success | PDF exported successfully |
| Export report as PDF | 100 PDF exports executed concurrently | 4.80s | 100% Success | PDF exported successfully |
| Export report as PDF | 200 PDF exports executed concurrently | 8.50s | 100% Success | PDF exported with slight response delay |
| Export report as PDF | 500 PDF exports executed concurrently | 15.20s | 100% Success | PDF exported with noticeable delay under heavy load |
| *Search & Filter Submodule* | | | | |
| Search and filter records | 100 search queries executed concurrently | 1.90s | 100% Success | Results displayed quickly |
| Search and filter records | 500 search queries executed concurrently | 5.40s | 100% Success | Results displayed with slight response delay |
| *Form & Modals Submodule* | | | | |
| Open modals and validate forms | 100 modal interactions triggered concurrently | 1.30s | 100% Success | Modals open quickly |
| Open modals and validate forms | 500 modal interactions triggered concurrently | 4.10s | 100% Success | Modals open with slight response delay |


