# PlanSphere — Project Proposal

*Plan Infinity and Travel Beyond the World.*

A privacy-first, serverless planner for trips, events and shared expenses.

> A Word copy of this proposal sits beside it: [`PlanSphere_Project_Proposal.docx`](PlanSphere_Project_Proposal.docx).

| Item | Detail |
| --- | --- |
| Project name | PlanSphere |
| Document | Project Proposal |
| Version | 1.0 |
| Date | 23 September 2026 |
| Prepared by | KaonHew02 |
| Repository | https://github.com/KaonHew02/PlanSphere |
| Live application | https://kaonhew02.github.io/PlanSphere/ |
| Project type | Client-side web application: travel, event and expense planner |
| Current status | Working system live on GitHub Pages. This proposal sets out its scope, design, delivery plan and roadmap. |

## Contents

- [1. Executive Summary](#1-executive-summary)
- [2. Background and Problem Statement](#2-background-and-problem-statement)
- [3. Objectives](#3-objectives)
- [4. Project Scope](#4-project-scope)
- [5. Target Users and Stakeholders](#5-target-users-and-stakeholders)
- [6. Proposed Solution](#6-proposed-solution)
- [7. Functional Requirements](#7-functional-requirements)
- [8. Non-Functional Requirements](#8-non-functional-requirements)
- [9. System Architecture and Technology](#9-system-architecture-and-technology)
- [10. Data Model](#10-data-model)
- [11. Business Rules and Algorithms](#11-business-rules-and-algorithms)
- [12. Security and Privacy Design](#12-security-and-privacy-design)
- [13. User Interface and Experience Design](#13-user-interface-and-experience-design)
- [14. Development Methodology](#14-development-methodology)
- [15. Project Timeline and Milestones](#15-project-timeline-and-milestones)
- [16. Testing and Evaluation Plan](#16-testing-and-evaluation-plan)
- [17. Resource Requirements and Cost](#17-resource-requirements-and-cost)
- [18. Risk Assessment](#18-risk-assessment)
- [19. Limitations](#19-limitations)
- [20. Future Enhancements](#20-future-enhancements)
- [21. Expected Outcomes and Benefits](#21-expected-outcomes-and-benefits)
- [22. Conclusion](#22-conclusion)
- [Appendix A. Setup and Deployment](#appendix-a-setup-and-deployment)
- [Appendix B. Glossary](#appendix-b-glossary)
- [Appendix C. References](#appendix-c-references)

---

## 1. Executive Summary

PlanSphere is a browser-based planner that keeps one trip or event whole: the dates, the itinerary, the bookings, the money, the people, the documents and the packing list, all in one application. It needs **no account and no server**. Every record is stored in the user's own browser (IndexedDB, with localStorage as a fallback), and a backup copy can optionally be written to the user's own Google Drive.

The system is organised into six numbered modules: **Home Dashboard, Calendar & Timeline, Trip & Event Management, Schedule & Itinerary, Expense Manager, and Summary & Analytics**. It also has four supporting screens: **Budget, Bookings, Packing and Convert**. Together they cover the whole life of a trip or event: planning before it, tracking during it, and settling up after it.

What sets PlanSphere apart:

- **Private by design.** There is no sign-up and no backend database. Nothing leaves the device unless the user presses a button.
- **Group money handled end to end.** Expenses can be split equally, by percentage or by custom amount. Balances are worked out automatically, and the settlement plan needs at most one transfer fewer than there are people.
- **Receipts read on the device.** On-device OCR turns a photograph into a pre-filled expense without uploading the image anywhere.
- **Several currencies, handled honestly.** Original amounts are never overwritten, and the exchange rates are the ones the user actually got.
- **No running cost.** The app is static files on GitHub Pages, with free-tier Google APIs.

The application is live at https://kaonhew02.github.io/PlanSphere/. This proposal covers the problem, objectives, scope, requirements, architecture, data model, security design, methodology, timeline, testing plan, costs, risks and future roadmap.

---

## 2. Background and Problem Statement

### 2.1 Background

Planning a trip or a group event today is spread across many tools. Dates go in a calendar app, the itinerary sits in a notes app or a group chat, the budget lives in a spreadsheet, and shared costs go into a bill-splitting app. Booking confirmations are scattered through email inboxes, and receipts through the phone's camera roll. Each tool holds part of the truth, and none of them knows about the others.

### 2.2 Problem Statement

| # | Problem | Consequence |
| --- | --- | --- |
| P1 | Information is fragmented across calendars, chats, spreadsheets and inboxes | Figures are typed in several times and checked against each other by hand, and they drift apart |
| P2 | Shared costs in a group are hard to settle | Arguments over who paid what, and more bank transfers than needed to square up |
| P3 | Travellers cannot see their budget while it matters | Planned, committed and actually spent money are only compared after the trip is over |
| P4 | Several currencies get confused | Foreign amounts are converted when entered and the original is lost. Mid-market rates differ from the rate actually received at the counter |
| P5 | Privacy | Most planning and expense apps need an account and upload personal data, receipts and card slips to someone else's server |
| P6 | Poor connectivity abroad | Server-based apps fail exactly when travellers need them, on a plane or on roaming data |
| P7 | Event organisers are not served | Company, CSR, family and sports events need attendance counts and cost per attendee, which trip apps do not provide |

### 2.3 Proposed Answer

A single web application where the trip, event or activity is the central record, and every other piece of information (days, stops, bookings, expenses, people, receipts, notes, budgets and packing) hangs off it. Anything that can be worked out from other data is calculated when it is shown, never stored a second time. The data stays on the user's device.

---

## 3. Objectives

### 3.1 General Objective

To design and build a privacy-first, serverless web application that manages the full life of trips, events and activities (planning, scheduling, spending, settling and reviewing) in one place.

### 3.2 Specific Objectives

1. To provide one central record (a trip, event or activity) to which the itinerary, bookings, expenses, notes, documents, budget and packing list all attach.
2. To show every dated item on one calendar with Month, Week, Day and Timeline views, including public holidays for both the home country and the destination.
3. To record expenses with flexible splitting (equal, percentage or custom amount), and to work out balances and the shortest settlement plan automatically.
4. To let users set overall, per-category, per-person and daily budgets, and to warn them at 90% and 100% without blocking any spending.
5. To support several currencies without ever overwriting an original amount.
6. To read receipts on the device with OCR and pre-fill expense entries from them.
7. To keep all data on the user's device, with export/import, an optional Google Drive backup and an optional one-way push into Google Calendar.
8. To deliver a responsive, accessible interface that works on phone, tablet and desktop, at no hosting cost.
9. To protect the client against console tampering and booby-trapped backup files.

---

## 4. Project Scope

### 4.1 In Scope

| Area | Included |
| --- | --- |
| Records | Trips (spanning several days), events (spanning several days) and activities (one day), each with type, status, cover image, currency, budget, members and country |
| Calendar | Month, Week, Day and Timeline views; editable categories; drag-to-reschedule; search and filters; public holidays; .ics export; Google Calendar push |
| Itinerary | Day-by-day stops with times, duration, activity type, estimated and actual cost, status, attachment and pinned notes |
| Money | Expense ledger, people and roles, attendance, three split methods, balances, settlement tracking, expense categories, receipt OCR, document filing |
| Budget & analytics | Four budget types, warnings, spent/committed/planned comparison, category breakdown, statistics, event analytics |
| Supporting tools | Bookings register, packing checklist, currency converter with typed rates |
| Data | Automatic local saving, export/import of a JSON backup, Google Drive backup (manual and automatic) |
| Security | Content Security Policy, input cleaning on import, output escaping, pinned CDN libraries with integrity hashes, tamper guard |

### 4.2 Out of Scope

- User accounts, logins and server-side storage.
- Real-time multi-user collaboration and two-way sync.
- Booking or paying for flights, hotels or tickets inside the app. PlanSphere records bookings; it does not make them.
- Background push notifications to a locked phone. This would need a push server; phone reminders are delivered through the .ics export with alarms instead.
- Automatic exchange rates for trip totals. The user types the rate they actually received.
- Native iOS or Android apps. The web app is responsive instead.

---

## 5. Target Users and Stakeholders

### 5.1 User Groups

| User group | Main needs | How PlanSphere serves them |
| --- | --- | --- |
| Solo and leisure travellers | Itinerary, bookings, budget, packing | One record per trip with every day laid out, bookings on the calendar, budget warnings and a packing checklist |
| Friends and family groups | Fair sharing of costs | Expense splitting, derived balances and a settlement plan with the fewest transfers |
| Event organisers (company, CSR, birthday, wedding, sports) | Budget, headcount, attendance | Event records with a roster, Registered/Attended/Absent status, event analytics and cost per attendee |
| Business travellers | Receipts, documents, several currencies | On-device receipt scanning, document filing, original-currency amounts with conversion |

### 5.2 Stakeholders

| Stakeholder | Role / interest |
| --- | --- |
| Project owner / developer (KaonHew02) | Requirements, design, implementation, deployment and maintenance |
| End users | Plan trips and events, record spending and settle up |
| Google (Identity, Drive and Calendar APIs) | Optional sign-in, backup storage and calendar integration |
| GitHub (Pages) | Source control and free static hosting |
| CDN and data providers (jsDelivr, open.er-api.com) | Deliver the OCR and holiday libraries, and daily reference exchange rates |

### 5.3 Usage Scenarios

**Scenario A: a friends trip to Da Nang.** Four friends plan a trip from 16 to 20 September with a budget of RM 4,000. The organiser creates the trip, adds stops such as Coconut Forest on 18 September at 10:30 am, and records flights and hotels as bookings. During the trip, receipts are scanned into expenses and split equally. Afterwards the Settlement screen shows, for example, *Bob → Jekaon RM 550* and *Alice → Jekaon RM 50*, and each payment is ticked off as it is made.

**Scenario B: a company CSR event.** An organiser creates an event with a RM 2,500 budget and registers 25 participants. On the day, 22 are marked Attended and 3 Absent. Event analytics report an actual spend of RM 2,400 and a cost per attendee of RM 109.09, worked out over the people who actually came.

---

## 6. Proposed Solution

### 6.1 Overview

PlanSphere is a single-page web application made of plain HTML, CSS and JavaScript, with no build step and no framework. All ten screens live on one page and only one is visible at a time. The app opens on **Home**, which answers the question people arrive with: *what have I got on?*

### 6.2 User Flow

Every step in the flow below is a real dependency, not just a suggested order. Nothing further down can be filled in before the thing above it exists, and every screen says so when it is empty rather than showing a form that cannot work.

```text
                         HOME
                           |
                        CALENDAR
                           |
            TRIP   .   EVENT   .   ACTIVITY
                           |
                 SCHEDULE / ITINERARY
                           |
                    EXPENSE MANAGER
          People . Receipts . Notes . Documents
             Bill split  ->  Settlement
                           |
                         BUDGET
                           |
                  SUMMARY & ANALYTICS
```

### 6.3 Navigation Structure

| Area | Contents |
| --- | --- |
| Sidebar | Home, Calendar, Activities (the shelf of trips, events and activities) and, below a divider, Convert. It collapses to a narrow rail on desktop and to a drawer on phones. |
| Record bar | Shown while a record is open: Itinerary, Expenses, Budget, Summary, Bookings and Packing, each with a live count. |
| Top toolbar | Save stamp (where the data lives and how much room is left), Drive status, Auto / To Drive / From Drive, and Export / Import. |

### 6.4 Design Principles

- **One source of truth.** The calendar reads the same arrays the other modules write, so nothing has to be entered twice. A stop's actual cost is read from its expense, not copied from it.
- **Derived values are never stored.** Duration, balances, settlement transfers and settlement status are all worked out whenever they are shown.
- **Undo rather than ask.** Deleting something that can be restored (a category, type, note or document) happens at once and offers Undo. Actions that cannot be undone, such as deleting a trip or importing a backup, ask for confirmation first.
- **Empty states teach.** A blank store shows what has to be created first. There is no demo data.
- **Budgets advise, they never block.** An app that refuses to record what was actually spent stops telling the truth.
- **Suggestions stay editable.** OCR guesses are placed in normal form fields for the user to correct.

---

## 7. Functional Requirements

The requirements are grouped by module and numbered so the test plan in Section 16 can refer to them.

### 7.1 Module 01: Home Dashboard

| ID | Requirement |
| --- | --- |
| FR-1.1 | Show a headline for the open record that depends on the dates: "Departs in N days" before it starts, "Happening now, day X of Y" during it, and "Done" afterwards. |
| FR-1.2 | Show the number of days with something planned, and the budget left. |
| FR-1.3 | List what is next on the itinerary, bookings still to confirm, packing progress and the settlement still outstanding. |
| FR-1.4 | Do no arithmetic of its own: read every module and write to none. |
| FR-1.5 | On first run with an empty store, explain what needs to be created first. |

### 7.2 Module 02: Calendar & Timeline

| ID | Requirement |
| --- | --- |
| FR-2.1 | Provide Month, Week, Day and Timeline views over one set of items. |
| FR-2.2 | Show activities the calendar owns (fully editable), plus items taken from other modules: trips as bars across their days, itinerary stops at their times, and bookings on their dates. Clicking one of these opens the module that owns it. |
| FR-2.3 | Provide activities with a category, time range, place, note, reminder and optional yearly repeat (for example, birthdays). |
| FR-2.4 | Ship six default categories (Trip, Event, Personal, Company, Family, Birthday), each with an editable name, icon and colour from a nine-tone palette. Users can add categories and delete them with Undo. Trip can be renamed but not deleted. |
| FR-2.5 | Reschedule activities, stops and bookings by dragging them to another day. |
| FR-2.6 | Search names, places and notes; category chips hide or show whole categories. |
| FR-2.7 | Show public holidays for the home country and each trip's country, calculated from bundled rules (date-holidays, about 200 countries) and cached per country and year. |
| FR-2.8 | Export everything as an .ics file with VALARM reminders; open Google Calendar's own form pre-filled for a single activity; optionally push everything one way into a dedicated "PlanSphere" Google calendar without creating duplicates. |
| FR-2.9 | Show browser notifications for activities while the page is open. The code is present; the buttons are currently switched off in the interface pending a design decision. |

### 7.3 Module 03: Trip & Event Management

| ID | Requirement |
| --- | --- |
| FR-3.1 | "Create New" offers Trip (start and end date), Event (start and end date) and Activity (one date). All three share one record shape, told apart by a `kind` field. |
| FR-3.2 | Record fields: name, type, destination or venue, start, end, description, cover image, currency, budget, members, status and country. |
| FR-3.3 | Shrink cover images on a canvas to at most 1200 px wide and store them as JPEG. |
| FR-3.4 | Keep types as editable lists. Trip types: Personal, Family, Friends. Event types: Company, Family, Birthday, Wedding, CSR, Sports, Other. Types can be added from the list or directly from the form, and deleted with Undo. |
| FR-3.5 | Offer the statuses Draft, Planning, Upcoming, Ongoing, Completed and Archived. The status is stored and set by the user; the date line ("In 24 days", "Happening now") is worked out separately. |
| FR-3.6 | Show records as cards with cover, dates, destination, members, budget and committed amount (shown in red when over budget), with a filter by kind. |
| FR-3.7 | Ask for confirmation before deleting a record, then remove its stops, bookings, expenses, documents, notes and packing list with it. |

### 7.4 Module 04: Schedule & Itinerary

| ID | Requirement |
| --- | --- |
| FR-4.1 | Give every day between the record's dates a heading. Stops dated outside that range appear under "Extra", so none are silently lost. |
| FR-4.2 | Stop fields: date, start and end time, title, location, description, activity type, estimated cost, actual cost, notes, attachment and status. |
| FR-4.3 | Work out duration from the start and end times. Typing a duration fills in the end time. An end time earlier than the start means the stop runs past midnight. |
| FR-4.4 | Offer the statuses Planned, In Progress, Completed, Cancelled and Skipped. Cancelled and skipped stops stay visible (dimmed and struck through) but are left out of every total. |
| FR-4.5 | Filter by activity type, and choose between "Still on" and "Everything". |
| FR-4.6 | Estimated vs actual: link the actual cost to an expense or booking (read fresh every time) or type it by hand, never both. Show the difference in red when over and green when under. |
| FR-4.7 | Allow one attachment per stop. Images are compressed; other files over 1 MB are refused with a message. |
| FR-4.8 | Keep activity types as an editable list (Travel, Stay, Food, Activity, Shopping, Other). "Other" cannot be deleted. |
| FR-4.9 | Show notes pinned to a day in that day's heading; clicking one jumps to the note. |

### 7.5 Module 05: Expense Manager

| ID | Requirement |
| --- | --- |
| FR-5.1 | Expense fields: reference (EXP-001, numbered per trip), date, time, merchant, description, category, amount, currency, paid by, participants, split method, notes, receipt, attachments and an optional linked itinerary stop. |
| FR-5.2 | People: name, phone (tap to call), email, role, status and notes. The trip's member count follows this list. |
| FR-5.3 | Roles: Organizer, Participant, Guest, Volunteer, Employee, Family and Friend, plus any the user adds. They can be deleted with Undo. |
| FR-5.4 | Attendance statuses Registered, Attended and Absent, with a headcount for events and activities. |
| FR-5.5 | Split methods: Equal; Percentage (must total 100, checked to one decimal place); Custom amount (must total the expense). The last person takes the rounding, so the shares always add up to the amount. |
| FR-5.6 | When a person is removed, their expenses keep their id and show "Someone (removed)". Their shares stay unchanged, and Undo restores them everywhere. |
| FR-5.7 | "Who paid, who owes" table: amount paid, share and balance for each person, all worked out on the fly. |
| FR-5.8 | Settlement: build a plan by matching the largest debt against the largest credit. Store only the amounts actually paid per pair. Show the status as Pending, Partially paid or Paid based on those amounts (Cancelled is stored), with an overall progress bar. |
| FR-5.9 | Expense categories: ten defaults (Transport, Accommodation, Food, Activities, Taxi, Shopping, Drinks, Groceries, Fees, Other), all editable. |
| FR-5.10 | "Where it went": amount spent, budget, spend per person, and a bar for each category. |
| FR-5.11 | Receipt scanner: take a photo or choose one; read it on the device with Tesseract.js; suggest the merchant, date, total, currency, category and document type; the user confirms; then either create an expense with the receipt attached or file the photo as a document only. |
| FR-5.12 | Documents in eight kinds (Receipt, Invoice, Flight ticket, Hotel confirmation, Booking, Event ticket, Travel document, Event document), each linkable to a day and an expense. |
| FR-5.13 | Notes in nine fixed types (General, Travel, Event, Meeting, Reminder, Important, Personal, Food, Accommodation), supporting bullet points, links, multiple files and pinning to a day. |

### 7.6 Budget

| ID | Requirement |
| --- | --- |
| FR-B.1 | Four optional budgets: overall, per category, per person and per day. An empty budget means that question is not being asked. |
| FR-B.2 | Read actual spending from the expense ledger. A person's actual spending is their share of the expenses, not what they happened to pay. |
| FR-B.3 | Warn at 90% or more of a budget, and change the wording once it is exceeded. Never block spending. |
| FR-B.4 | Draw each bar with the budget as its full width, and show any overspend in red past the end. |
| FR-B.5 | List spent (expenses), committed (bookings) and planned (itinerary estimates) side by side in one table. |
| FR-B.6 | Keep one exchange-rate row for each foreign currency the trip actually uses. Mark amounts without a rate as "rate not set". |

### 7.7 Module 06: Summary & Analytics

| ID | Requirement |
| --- | --- |
| FR-6.1 | Headline: duration, members, budget, spent and remaining. |
| FR-6.2 | Expense breakdown by category as a stacked bar, with a row per category giving amount and share, and an "Unspent" slice. |
| FR-6.3 | Statistics: total spending, average per spending day, highest expense, highest category, budget used, planned vs actual, cost per person and spending by person (as a share). |
| FR-6.4 | Event analytics: budget, actual spend, participants, attendance and cost per attendee (over those who attended). |
| FR-6.5 | Reuse the same calculation functions as the other screens (`spentOf`, `balances`, `plannedOf`) so every figure agrees across the app. |

### 7.8 Bookings, Packing and Convert

| ID | Requirement |
| --- | --- |
| FR-7.1 | Bookings: type, date, status (Idea, Held, Paid), cost and currency, what, provider and reference. Bookings appear on the calendar, count towards the committed amount, and appear on Home while unconfirmed. |
| FR-7.2 | Packing: items grouped (for example, Documents) with a quantity, ticked off as packed, with progress shown on Home. |
| FR-7.3 | Convert: pick two currencies, type the rate as a board shows it (1 MYR = X VND), switch direction, and see the inverse rate plus a ladder of round amounts. |
| FR-7.4 | "Use this rate for the trip" saves the rate on the trip, and the rest of the app converts through it. |
| FR-7.5 | Support 166 currencies, with the ones commonly used for trips pinned to the top. Currencies without a minor unit (JPY, KRW, VND) are shown without decimals. |

### 7.9 Data Management

| ID | Requirement |
| --- | --- |
| FR-10.1 | Save every change automatically to IndexedDB, falling back to localStorage. |
| FR-10.2 | Export the whole store as one JSON backup. Import replaces everything after showing what is in each copy and asking for confirmation. |
| FR-10.3 | Google Drive: "To Drive" and "From Drive" buttons, plus "Auto", which sends a copy one minute after changes stop. Offer to restore from Drive when the browser is empty. |
| FR-10.4 | Show which storage is in use and how much space is taken. |
| FR-10.5 | Once there is data worth keeping, ask the browser (once) to keep the storage persistent. |

---

## 8. Non-Functional Requirements

| Quality | Requirement |
| --- | --- |
| Privacy | No account. Data stays on the device. Google permissions are limited to `drive.file` (files the app created) and `calendar.app.created` (calendars the app created). |
| Offline use | Once loaded, the app works without a network. Only on-demand features need one: the OCR library, the first load of holiday rules, and reference exchange rates. |
| Performance | All data is held in memory, and writes to disk are grouped within about 250 ms. Images are compressed on the way in, so a 12 MP photo lands at tens of kilobytes. |
| Reliability | A failed write is reported with a message, never silently ignored. Money is stored as whole sen (integers), so it cannot drift by a fraction of a cent. Dates are plain YYYY-MM-DD strings, so time zones never shift them. |
| Usability | Empty states explain the next step. Undo is offered for reversible actions; confirmation is asked only for irreversible ones. On phones, toggles replace multi-selects. |
| Accessibility | Text meets a contrast ratio of at least 4.5:1. Colour is never the only carrier of meaning: dots and borders carry category colour, not text. Focus is visible. |
| Responsiveness | Works on screens from 375 px phones to wide desktops. The sidebar becomes a rail, then a drawer. |
| Security | Content Security Policy, cleaning of imported data, escaping of all output, pinned CDN versions with integrity hashes, and a tamper guard (Section 12). |
| Maintainability | No build step and no framework. CSS starts from design tokens, each screen has one renderer, and the design decisions are documented in README.md and docs/. |
| Portability | Runs in current Chrome, Edge, Firefox and Safari, and can be hosted by any static web host. |
| Cost | No infrastructure cost (Section 17). |

---

## 9. System Architecture and Technology

### 9.1 Architectural Style

PlanSphere runs entirely in the browser as a single-page application. There is no application server and no shared database. Every browser holds its own copy of the data, and Google services are called directly from the page, using a short-lived OAuth token that the user grants.

```text
+-- User's browser ----------------------------------------------------------+
| index.html  (10 screens, one visible)  +  style.css  (tokens, layout)      |
|                            |                                               |
| app.js   modules, business rules, renderers, tamper guard                  |
|       |                         |                        |                 |
| store.js                    drive.js                 gcal.js               |
| IndexedDB "plansphere"      Drive backup             Calendar push         |
| localStorage fallback       scope: drive.file        calendar.app.created  |
+----------------------------------------------------------------------------+
                                  |                        |
                                  v                        v
                        Google Drive API v3     Google Calendar API v3

  Loaded on demand : jsDelivr -> tesseract.js 5.1.1 (OCR),
                                 date-holidays 3.37.0 (public holidays)
  Reference rates  : open.er-api.com, cached once a day
  Hosting          : GitHub Pages (static)  |  local: node serve.js :5173
```

### 9.2 Technology Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Markup | HTML5 | One page containing all ten screens |
| Styling | CSS3 custom properties | Tokens first, then layout, components and responsive rules. Fonts: Archivo and Spline Sans (Google Fonts) |
| Icons | Bootstrap Icons 1.11.3 | Loaded from jsDelivr with an SRI integrity hash |
| Logic | Plain JavaScript (ES2020+) | No framework and no build step. The whole of app.js runs inside one closure |
| Persistence | IndexedDB + localStorage | IndexedDB for records; localStorage as a fallback and for disposable caches |
| OCR | Tesseract.js 5.1.1 | WebAssembly, runs on the device and is loaded the first time a receipt is scanned |
| Holidays | date-holidays 3.37.0 | Rule-based, works offline once loaded, cached per country and year |
| Exchange rates | open.er-api.com | Daily reference rates for the converter (with a fallback source). Trip totals use rates the user types |
| Identity | Google Identity Services | OAuth 2.0 token flow in the browser; no client secret |
| Cloud APIs | Google Drive API v3, Google Calendar API v3 | Both optional; the app works fully without them |
| Hosting and source | GitHub Pages, Git and GitHub | Free static hosting that publishes directly from the repository |
| Local server | Node.js (serve.js) | Plain static server on port 5173 for development |

### 9.3 Source Files

| File | Lines | Purpose |
| --- | --- | --- |
| index.html | 1,942 | The shell and all ten screens, including the Content Security Policy |
| style.css | 4,822 | Design tokens, layout, components and responsive rules |
| app.js | 9,716 | In-memory store, navigation, business rules, one renderer per screen, import cleaning and tamper guard |
| store.js | 321 | IndexedDB storage with a localStorage fallback, an in-memory mirror and grouped writes |
| drive.js | 542 | Google Drive backup: push, pull, automatic mode and status |
| drive-config.js | 52 | Drive folder ID, file name and OAuth client (no secrets) |
| gcal.js | 264 | One-way push into a dedicated Google Calendar |
| gcal-config.js | 49 | OAuth client ID and calendar name (no secrets) |
| serve.js | 54 | Static file server for local development |
| docs/ | 4 files | SECURITY.md, DRIVE.md, GOOGLE.md, SETUP-GOOGLE.md |
| brand/ | 17 files | Logo mark, lockups, one-colour versions, app icon, favicon and identity sheet |

### 9.4 Storage Design

- **Why IndexedDB.** localStorage is capped at about 5 MB per origin, and PlanSphere shares its origin with two sibling apps (MoneyFlow and FinSim). Receipts and cover images can fill that. IndexedDB is offered a share of free disk instead, typically gigabytes.
- **Synchronous reads, asynchronous writes.** `store.js` reads everything into memory once, before the first paint. After that, reads are simple lookups. Writes update memory at once and reach the disk about 250 ms later, grouped together, so typing in a form is one write rather than one per keystroke.
- **Failures are reported.** A write that fails shows a message explaining what to do, which clears itself once a write succeeds.
- **Keys.** Records use `plansphere.v2` in the `plansphere` database. Holidays are cached in `plansphere.holidays.v1` and rates in `plansphere.fx.v1`. The caches are disposable and left out of backups.

---

## 10. Data Model

All records are held in one store object. Money is kept as whole sen (integers) together with its currency, and dates as `YYYY-MM-DD` strings.

| Collection | Holds | Key fields |
| --- | --- | --- |
| trips | Trips, events and activities | id, kind, name, type, status, cat, where, desc, cover, from, to, who (members), home (currency), country, budget, headBudget, dayBudget, catBudget, people[], rates |
| stops | Itinerary items | trip, date, time, end, kind, title, where, desc, note, att, cost + cur (estimate), from (linked record) or actual + actualCur, status |
| books | Bookings | trip, kind, date, status, cost, cur, title, who (provider), ref |
| packs | Packing items | trip, group, item, qty, done |
| events | Calendar activities | cat, title, date, time, end, where, note, remind, repeat |
| cats | Calendar categories | id, label, mark, tone, locked |
| types | Trip and event types | id, scope (trip / event), label |
| stopKinds | Itinerary activity types | id, label, icon, tone, locked |
| notes | Notes and information | trip, type, date (optional pin), title, body, links[], atts[] |
| spend | Expenses | trip, ref, date, time, merchant, desc, cat, amount, cur, by (payer), who (participants), split, parts, note, receipt, atts[], stop |
| spendCats | Expense categories | id, label, mark, tone |
| docs | Documents | trip, kind, title, date, file, text (OCR), stop, spend, note |
| roles | People roles | id, label |
| settle | Settlement payments | trip, from, to, paid, cancelled |
| homeCountry, current | Settings | Home country for holidays; the record currently open |

The backup format wraps the store in an envelope, so the same file works for Export, Import and Google Drive:

```text
{ format: 'plansphere.backup', version: 1, app: 'PlanSphere',
  saved: '<ISO timestamp>', data: { ...the store... } }
```

---

## 11. Business Rules and Algorithms

### 11.1 Money and Rounding

- Amounts are stored as integer sen and only become decimals when displayed.
- In a split, the last person takes the rounding. RM 292.31 split three ways gives 97.43, 97.43 and 97.45, which add back up exactly.
- Percentages start evenly spread (33.3, 33.3, 33.4) and must total 100, checked to one decimal place.
- Every split is calculated in the trip's home currency, so an expense in another currency still adds up.

### 11.2 Settlement Algorithm

A person's balance is what they paid minus their share. The settlement plan is recalculated every time it is shown:

```text
debtors   = people with balance < 0, largest debt first
creditors = people with balance > 0, largest credit first
while debtors and creditors are both non-empty:
    d = largest debtor;  c = largest creditor
    amount = min(|d.balance|, c.balance)
    add transfer  d -> c  for amount
    reduce both balances; drop whoever reaches zero
```

Each step settles at least one person completely, so n people need at most n − 1 transfers. The app stores only what has actually been paid for each pair. Status comes from that amount: nothing paid is **Pending**, some is **Partially paid**, all of it is **Paid**. **Cancelled** is the only stored status, because it is a decision rather than a sum.

### 11.3 Budget Rules

- Warnings appear at 90% or more of any budget that has been set. Past 100%, the message changes to say by how much it has been exceeded.
- Days with no spending are left out of daily warnings.
- Spent means expenses. Committed means bookings. Planned means itinerary estimates that are not yet linked to an expense.

### 11.4 Currency Rules

- The original amount and currency are never replaced. Conversion happens only when amounts are displayed or added up.
- An amount in a currency with no rate counts as nothing and is labelled "rate not set". It is never added to totals as if it were in the home currency.
- Rates are typed the way a money-changer's board shows them (1 MYR = X), and the direction switch decides which way to convert.

### 11.5 Time Rules

- Duration = end time − start time. If the end is earlier than the start, the stop wraps past midnight.
- Dates are compared as text. The one place a real Date object is created, it is set to noon, so a time-zone shift can never move it to another day.
- .ics times are written without a time zone, so 7 pm stays 7 pm in whatever country the file is opened.

### 11.6 Receipt Reading Heuristics

| Field | How it is guessed |
| --- | --- |
| Merchant | The first line near the top that reads like a name rather than an address, phone number or heading |
| Date | Formats such as 18/08/2026, 2026-09-16, 05.09.2026, 14 Sep 2026 and Sep 14, 2026. Ambiguous numeric dates are read day first. A date that cannot be read is left empty |
| Total | The last line containing "total" wins. Subtotal, tax, change and cash lines are skipped. Failing that, the largest figure written like money |
| Number format | Both 1,234.56 and 1.234,50 are understood |
| Currency | Taken from symbols or codes on the page: RM, ¥, €, ฿, ₫ and others |
| Category and kind | Keyword matches, for example restaurant or ramen gives Food, grab or taxi gives Taxi, and boarding pass or PNR gives Flight ticket |

---

## 12. Security and Privacy Design

### 12.1 Privacy Model

There is no server or shared database, so there is no central store of user data to breach. Each browser holds only its own records. Changing the page from the developer console changes only that person's own copy.

### 12.2 Threats and Controls

| Route in | Risk | Control |
| --- | --- | --- |
| Imported backup file | A field is written so that it becomes markup or script when displayed | `psClean` checks every record on the way in; `esc()` escapes every value when displayed; the CSP refuses scripts from anywhere not allowed |
| Google Drive file | The same, if someone else can write to the folder | The same three controls, and the folder is kept Restricted |
| Links in notes | A javascript: URL that runs when clicked | Only http and https become links (`safeUrl`); the CSP also blocks javascript: URLs |
| Email addresses | Extra recipients hidden inside the address | Only a plain address becomes a mailto: link |
| Attachment names | Right-to-left characters that disguise a file's real type | Control and direction characters are stripped before download |
| Currency codes | A crafted code that makes the rate lookup fetch a different file | Only codes from the app's own list are ever sent (`knownCur`) |
| Crafted data | Wrong-typed fields that crash the app on every start | Each field is forced to its expected type; lookups only answer to keys they actually hold (`own`) |
| CDN | A changed library release running in the page | Exact version pins, plus SRI hashes on the OCR reader and the icon stylesheet |
| Shared origin | MoneyFlow and FinSim share kaonhew02.github.io | Caches and store are checked on load. Recommendation: give PlanSphere its own origin |

### 12.3 Tamper Guard

- All of app.js runs inside one closure, so `db`, `save()` and the storage object cannot be reached from the console. Drive and Calendar receive a frozen, read-only `PSApp` interface.
- Only real user input is accepted. Clicks and keystrokes made by scripts (`el.click()`, `dispatchEvent`) are dropped before any handler sees them.
- On the published site, developer-tool shortcuts (F12, Ctrl+Shift+I/J/C/K, Ctrl+U) and the right-click menu are disabled, and the page hides itself while the developer tools are open. These are speed bumps, not locks.
- The configuration objects (`PS_DRIVE`, `PS_GCAL`) are frozen, so the backup cannot be pointed at someone else's folder.

### 12.4 OAuth and Google Integration

- Browser token flow only: the client ID is public and there is no client secret anywhere in the repository.
- Smallest possible permissions: `drive.file` (only files this app created) and `calendar.app.created` (only calendars this app created).
- Allowed JavaScript origins are limited to https://kaonhew02.github.io and http://localhost:5173.

---

## 13. User Interface and Experience Design

### 13.1 Layout

The layout reuses the shell of its sibling app, MoneyFlow: a sidebar that collapses to a rail on desktop and a drawer on phones, a quiet top bar, one hero band carrying the single number the screen exists to answer, and cards in a single column or a two-column grid. Delete actions that can be undone show a message with an Undo button; delete actions that cannot be undone open a confirmation dialog.

### 13.2 Colour and Contrast

The brand is a bright cornflower blue on a soft blue-tinted white. Contrast decides which blue can do which job, so the brand blue is split into three tokens:

| Token | Value | Used for | Contrast on white |
| --- | --- | --- | --- |
| --azure-vivid | #287dfa | Shapes only: progress fills, focus ring | 3.9 : 1 |
| --azure | #1d70e6 | Fills carrying white text: active tab, primary button | 4.7 : 1 |
| --azure-ink | #1657c4 | Blue text on a pale background | 6.6 : 1 |

The hero band uses a deeper blue (#2060c2, 6.0 : 1 with white) because it carries small white text. The travel category uses a deeper cyan so that it is not mistaken for the "selected" colour. A complete dark theme is defined in the tokens and can be switched on with one attribute.

### 13.3 Typography and Brand

- Typefaces: **Archivo** for headings and **Spline Sans** for text, served by Google Fonts.
- The brand identity is in `brand/`: the PlanSphere mark, horizontal and stacked lockups, ink and reverse one-colour versions, an app icon, a favicon, seven explored concepts and an identity sheet (`identity.html`).
- Tagline: *Plan Infinity and Travel Beyond the World.*

---

## 14. Development Methodology

The project follows an **iterative and incremental** approach. The core modules were built end to end first, then refined module by module, with every push to the main branch published straight to GitHub Pages. This gives a working, testable product at every stage and allows feedback to shape the next step.

1. **Requirements.** Define the flow (Home → Calendar → Record → Itinerary → Expenses → Budget → Analytics) and the dependencies between steps.
2. **Design.** Brand concepts and identity, the app shell, design tokens and contrast rules.
3. **Implementation.** One renderer per screen on a shared in-memory store, in plain HTML, CSS and JavaScript.
4. **Integration.** Google Drive backup and Google Calendar push using OAuth with the smallest possible permissions.
5. **Refinement.** Record sub-modules, dashboard, calendar fields, theme, expenses, decimal amounts and settlement.
6. **Hardening.** Content Security Policy, import cleaning, pinned libraries and tamper guard.
7. **Testing and evaluation.** Functional, compatibility, security and usability testing (Section 16).

Tools: Visual Studio Code, Node.js, Git and GitHub, Chrome and Edge developer tools, Google Cloud Console, and real phones for camera and layout testing.

---

## 15. Project Timeline and Milestones

Phases 1 to 6 are taken from the repository's commit history; later phases are proposed.

| Phase | Dates | Work | Status |
| --- | --- | --- | --- |
| 1 | 20 Aug 2026 | Project start: brand identity, app shell, first commit | Done |
| 2 | 21 Aug 2026 | All core modules built; went live on GitHub Pages; Google Drive backup set up | Done |
| 3 | 24 – 26 Aug 2026 | Interface refinement: tile layout, record sub-modules, dashboard, calendar fields, theme | Done |
| 4 | 2 – 4 Sep 2026 | Expense Manager rework; support for decimal amounts | Done |
| 5 | 8 Sep 2026 | Settlement: transfer plan, part payments, progress | Done |
| 6 | 23 Sep 2026 | Security hardening against tampering and booby-trapped backups; project proposal | Done |
| 7 | Oct 2026 | Structured testing (Section 16): functional, compatibility and security | Proposed |
| 8 | Nov 2026 | Usability study with 5–8 users; fixes from the findings | Proposed |
| 9 | Dec 2026 onwards | Enhancements from Section 20 (installable app, own origin, PDF reports) | Proposed |

### 15.1 Deliverables

- The PlanSphere web application, live at https://kaonhew02.github.io/PlanSphere/.
- Source code in the public GitHub repository.
- Documentation: README.md, docs/SECURITY.md, docs/DRIVE.md, docs/GOOGLE.md and docs/SETUP-GOOGLE.md.
- Brand identity kit in `brand/`.
- This project proposal (Word and Markdown versions).
- Test plan and results report (Phase 7).

---

## 16. Testing and Evaluation Plan

### 16.1 Test Levels

| Level | Method |
| --- | --- |
| Rule checks | Check split rounding, settlement, currency conversion, date reading and duration against known inputs on localhost |
| Functional | Run the test cases in 16.2 against the requirements in Section 7 |
| Compatibility | Chrome, Edge, Firefox and Safari on desktop; Chrome on Android and Safari on iOS; widths of 375, 768 and 1280 px |
| Security | Import crafted backups, try tampering from the console, check the CSP violation reports |
| Usability | 5–8 participants complete set tasks (create a trip, add stops, split a bill, settle up) followed by the System Usability Scale (SUS) questionnaire |

### 16.2 Key Test Cases

| ID | Scenario | Expected result | Ref. |
| --- | --- | --- | --- |
| TC-01 | Create a trip from 16 to 20 Sep | A bar spans five days on the calendar; the itinerary shows five day headings | FR-2.2, 4.1 |
| TC-02 | Add a stop on 18 Sep at 10:30 and type a duration of 90 | End time fills in as 12:00; the stop appears in the Month, Week and Timeline views | FR-4.3 |
| TC-03 | Drag an activity to another day | Its date updates everywhere | FR-2.5 |
| TC-04 | Split RM 292.31 equally among three people | Shares are 97.43, 97.43 and 97.45 | FR-5.5 |
| TC-05 | Enter a percentage split totalling 85% | Save is blocked, with a hint explaining the shares must total 100 | FR-5.5 |
| TC-06 | Balances +600 / −50 / −550 | Plan: Bob → Jekaon RM 550, Alice → Jekaon RM 50 | FR-5.8 |
| TC-07 | Record a part payment | Status shows Partially paid and the progress bar moves | FR-5.8 |
| TC-08 | Spend RM 580 against a RM 600 Food budget | Warning: 97% of the Food budget used | FR-B.3 |
| TC-09 | Add an expense in JPY with no rate set | Shows "rate not set" and is left out of totals | FR-B.6 |
| TC-10 | Scan a receipt photo | Fields are pre-filled; confirming opens an expense with the receipt attached | FR-5.11 |
| TC-11 | Delete a category that has activities | Activities move to another category; a message offers Undo, which restores everything | FR-2.4 |
| TC-12 | Delete a trip | A confirmation appears; stops, bookings, expenses, documents, notes and packing items are removed | FR-3.7 |
| TC-13 | Export, then Import in a fresh browser | Identical data after the reload | FR-10.2 |
| TC-14 | Import a backup containing an `<img onerror>` tag and a `javascript:` link | Nothing runs; the link is shown as text | 12.2 |
| TC-15 | Call button.click() from the console | No handler runs | 12.3 |
| TC-16 | Open at 375 px width | The sidebar becomes a drawer; no sideways scrolling | NFR |
| TC-17 | To Drive on one machine, From Drive on another | The same data is restored | FR-10.3 |
| TC-18 | Send to Google Calendar twice | Entries are updated, not duplicated | FR-2.8 |

### 16.3 Acceptance Criteria

- All test cases TC-01 to TC-18 pass on Chrome, Edge, Firefox and Safari.
- No console errors or CSP violations in normal use.
- Average SUS score of 70 or above in the usability study.
- Data survives a reload, a browser restart and an Export/Import round trip without loss.

---

## 17. Resource Requirements and Cost

| Item | Purpose | Cost |
| --- | --- | --- |
| GitHub repository and GitHub Pages | Source control and hosting | Free |
| Google Cloud project (OAuth, Drive API, Calendar API) | Optional backup and calendar integration | Free |
| jsDelivr CDN, Google Fonts, Bootstrap Icons | Libraries, fonts, icons | Free |
| open.er-api.com | Daily reference exchange rates | Free |
| Visual Studio Code, Node.js, Git, web browsers | Development and testing | Free |
| Laptop and smartphone | Development, camera and layout testing | Existing equipment |
| **Total recurring cost** |  | **RM 0** |
| Optional: custom domain | Gives PlanSphere its own origin (see Section 12) | Annual registration fee |

---

## 18. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Browser data cleared, so records are lost | Medium | High | Export file, Google Drive backup with Auto mode, persistent-storage request, restore offer when the browser is empty |
| Storage quota exceeded | Low | High | IndexedDB instead of localStorage, image compression, 1 MB limit on other files, failed-write message |
| Shared origin with sibling apps | Medium | Medium | Store and caches checked on load; move to its own origin |
| CDN unavailable | Low | Medium | Features degrade gracefully (for example, the OCR review opens with empty fields); pinned versions with SRI |
| OCR reads a receipt wrongly | High | Low | Every guess is an editable field; the raw text read is available for checking |
| Malicious backup file | Low | High | psClean, output escaping and CSP; Import always asks before replacing |
| Google API policy or quota changes | Low | Medium | Integrations are optional; the core app works without them |
| GitHub account compromised | Low | High | Two-factor authentication; no unnecessary collaborators |
| Exchange-rate mismatch | Medium | Low | Rates are typed by the user; amounts without a rate are flagged, not guessed |
| Missing holiday data (Cambodia, Laos, Myanmar) | Certain | Low | Documented limitation; the rest of the calendar is unaffected |

---

## 19. Limitations

- Data lives in one browser. Moving between devices relies on Export/Import or Google Drive, and both **replace** the data rather than merging it.
- There is no real-time collaboration. Group members do not each have a live view of a shared trip.
- Browser reminders fire only while the page is open, and their buttons are currently switched off. Phone reminders depend on importing the .ics file.
- The Google Calendar push is one-way.
- The holiday data does not cover Cambodia, Laos or Myanmar.
- OCR accuracy depends on photo quality. The total is read more reliably than the merchant.
- Non-image attachments over 1 MB are refused.
- PlanSphere shares its web origin with MoneyFlow and FinSim.
- Only the light theme is exposed. The dark tokens exist, but there is no switch.
- The Google OAuth consent screen is in testing mode, so only listed test users can connect Drive and Calendar until the app is published through Google.

---

## 20. Future Enhancements

| Enhancement | Benefit |
| --- | --- |
| Installable app (PWA) with a service worker | Install to the home screen; cache the OCR and holiday libraries for full offline use |
| Dedicated origin or custom domain | Separates PlanSphere's storage from its sibling apps |
| Shared trips through a common Drive file, with merging | Lets group members view and add to one trip |
| PDF trip report and expense claim export | Ready-made documents for reimbursement and record keeping |
| Dark theme switch that follows the system setting | More comfortable at night; the tokens already exist |
| Multiple languages (English, Bahasa Melayu, Chinese) | Wider audience in Malaysia and the region |
| Automated test suite (unit tests plus Playwright end-to-end) | Catches regressions in split, settlement and currency rules |
| Map view of itinerary stops | Shows each day's route at a glance |
| Reminders brought back, with an optional push service | Reminders that reach a phone without importing a file |

---

## 21. Expected Outcomes and Benefits

- **One place for the whole trip.** No re-typing between calendar, spreadsheet and bill-splitting apps.
- **Fairer, faster settling.** Clear balances and the fewest transfers reduce disputes within groups.
- **Better control of spending.** Live budget warnings and a spent/committed/planned view help avoid overspending.
- **Privacy kept.** Personal data, receipts and card slips never leave the device unless the user chooses.
- **Works anywhere.** Offline once loaded, on any modern phone or computer, at no cost to run.
- **Suits events too.** Attendance and cost per attendee support company, CSR and family events.

---

## 22. Conclusion

PlanSphere addresses a common, everyday problem: the information for one trip or event is scattered across too many tools. It brings the calendar, itinerary, bookings, expenses, settlement, budget and analytics together around one record, while keeping data on the user's own device. The design favours correctness (one source of truth, derived figures, integer money), honesty (budgets advise rather than block; missing exchange rates are flagged rather than guessed) and privacy (no accounts, minimal Google permissions, hardened against tampering).

The working system is already live at no running cost. The next phases are structured testing, a usability study, and the enhancements in Section 20. The proposal is that PlanSphere continues through these phases towards a polished, installable, fully offline planner.

---

## Appendix A. Setup and Deployment

### A.1 Run Locally

```text
git clone https://github.com/KaonHew02/PlanSphere.git
cd PlanSphere
node serve.js            # then open http://localhost:5173
```

Opening index.html straight from the disk mostly works, but Google will not issue a token to a `file://` page, so Drive and Calendar need a real origin.

### A.2 Deploy

Push to the `main` branch. GitHub Pages serves the repository as static files at https://kaonhew02.github.io/PlanSphere/. There is no build step.

### A.3 Google Setup (Optional)

1. In Google Cloud Console, create or choose a project.
2. Enable the Google Drive API and the Google Calendar API.
3. Set up the OAuth consent screen: External, with your own account added as a test user.
4. Create an OAuth client ID of type Web application, with the authorised JavaScript origins https://kaonhew02.github.io and http://localhost:5173 (no path, no redirect URI).
5. Paste the client ID into `gcal-config.js`. Drive reuses it automatically.
6. Keep the Drive folder Restricted. Never add a client secret to the repository.

The full walkthrough is in docs/SETUP-GOOGLE.md.

---

## Appendix B. Glossary

| Term | Meaning |
| --- | --- |
| CDN | Content delivery network, used here for jsDelivr, which serves the open-source libraries |
| CSP | Content Security Policy, a browser-enforced list of what a page may load and run |
| IndexedDB | A database built into the browser, for large amounts of structured data |
| localStorage | Simple key-value storage in the browser, capped at about 5 MB per origin |
| OAuth 2.0 | A standard that lets a user grant an app limited access to their Google account |
| OCR | Optical character recognition: reading text from an image |
| Origin | The scheme and host of a website (for example https://kaonhew02.github.io), which the browser uses as a security boundary |
| .ics / VALARM | The iCalendar file format and its reminder component, understood by every calendar app |
| Sen | One hundredth of a Malaysian ringgit; PlanSphere stores all money as whole sen |
| SPA | Single-page application |
| SRI | Subresource Integrity, a hash that makes the browser refuse a file that has changed |
| SUS | System Usability Scale, a standard ten-question usability questionnaire |

---

## Appendix C. References

- PlanSphere repository and documentation: https://github.com/KaonHew02/PlanSphere (README.md, docs/SECURITY.md, docs/DRIVE.md, docs/GOOGLE.md, docs/SETUP-GOOGLE.md)
- Tesseract.js: https://github.com/naptha/tesseract.js
- date-holidays: https://github.com/commenthol/date-holidays
- Bootstrap Icons: https://icons.getbootstrap.com
- Google Identity Services, OAuth 2.0 for web: https://developers.google.com/identity/oauth2/web
- Google Drive API: https://developers.google.com/drive/api
- Google Calendar API: https://developers.google.com/calendar/api
- MDN, IndexedDB API: https://developer.mozilla.org/docs/Web/API/IndexedDB_API
- MDN, Content Security Policy: https://developer.mozilla.org/docs/Web/HTTP/CSP
- RFC 5545, iCalendar: https://www.rfc-editor.org/rfc/rfc5545
- ExchangeRate-API open access: https://www.exchangerate-api.com/docs/free
