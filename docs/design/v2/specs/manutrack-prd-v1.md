# ManuTrack — Product Requirements Document
**Version:** 1.0  
**Date:** April 2026  
**Status:** Internal — POC Scope  
**Audience:** Founding team, Claude Code

---

## 1. Product Overview

ManuTrack is a passive production order tracking web application for small and mid-size manufacturers. It uses QR-labelled trays and fixed camera stations to automatically record order progress through production pipelines — with no change required to how workers operate on the floor.

**Core tracking model:**
- Each tray carries one QR code
- Cameras at each station scan the QR on entry and exit (scan in / scan out)
- One QR code can represent a batch combining items from multiple Customer Orders (cross-order batching, same pipeline only)
- Jobs are the floor-level unit of tracking — auto-generated from Customer Orders, one Job per product type per order

---

## 2. POC Scope Boundaries

**In scope:**
- Station CRUD with camera and slot capacity assignment
- Pipeline CRUD with ordered steps, min/max duration thresholds, tray capacity per type
- Customer Order creation with multiple line items
- Job auto-generation per line item + manual Job creation as fallback
- Pipeline assignment per Job + QR label generation and print
- Order detail view with visual pipeline flow per Job
- Dashboard — Orders tab (status counts, drill-down)
- Dashboard — Operations tab (live station utilization, queues, analytics)
- Analytics with time period selector
- Navigation structure role-aware (no auth enforced in POC)

**Out of scope for POC:**
- Authentication and role enforcement
- Per-order cost calculation
- Multi-user views
- External integrations (ERP, MES)
- Automated scheduling / queue optimization

---

## 3. Entities & Data Model

| Entity | Description |
|---|---|
| **Station** | Physical device or location. Has name, location, camera ID, concurrent slot capacity |
| **Pipeline** | Named sequence of Stations for a specific product type. Each step has min/max duration and tray capacity |
| **Customer Order** | Customer-facing umbrella. Has customer name, line items (product type + quantity), creation date, optional deadline, status |
| **Job** | Floor-level tracking unit. Auto-generated from Customer Order line items (1 per product type). Has QR code, assigned pipeline, status, tray code |

**Key relationships:**
- Customer Order → 1..N Jobs (one per line item / product type)
- Job → 1 Pipeline
- Pipeline → ordered sequence of Stations
- Tray → 1 QR code → 1 Job → Job items may originate from multiple Customer Orders (cross-order batching, same pipeline only)

---

## 4. Navigation Structure

```
MANUTRACK
─────────────────
OPERATIONS
  Dashboard
  Customer Orders
  Jobs

CONFIGURATION
  Pipelines
  Stations
─────────────────
```

**Design principle:** Configuration and Operations are structurally separated. Role-aware by design — auth and role enforcement added post-POC without structural redesign. No collapsible groups; flat labeled sections in sidebar.

---

## 5. Features

---

### 5.1 Station Management
**Location:** Configuration → Stations

**Capabilities:**
- Create station: name, location (optional), camera ID assignment
- Set concurrent slot capacity (how many trays processed simultaneously)
- List all stations as cards
- Edit and delete stations

**Fields:**
| Field | Type | Required |
|---|---|---|
| Name | Text | Yes |
| Location | Text | No |
| Camera ID | Text | No |
| Concurrent slot capacity | Integer | No (default: 1) |

**Business value:** Stations are the physical backbone of tracking. Slot capacity enables real-time utilization monitoring — a manufacturer can see at a glance whether their equipment is running at capacity or idle. This is the data that drives operational decisions.

**Future extension:** Slot capacity can evolve to include shift-based capacity (e.g. stove runs 2 batches per 8h shift), maintenance windows, or dynamic capacity from IoT sensor integration. Camera ID can link to actual camera feed for visual verification.

---

### 5.2 Pipeline Management
**Location:** Configuration → Pipelines

**Capabilities:**
- Create pipeline: name, product type, optional description
- Add stations as ordered steps (select from existing stations or create new)
- Per step: set min duration, max duration (cap), max items per tray, min items per tray (underutilization threshold)
- Reorder steps (drag or up/down controls)
- Remove steps
- View pipeline as horizontal flow (Station → Station → Station with durations)
- Edit and delete pipelines

**Fields — pipeline level:**
| Field | Type | Required |
|---|---|---|
| Name | Text | Yes |
| Product Type | Text | Yes |
| Description | Text | No |

**Fields — per step:**
| Field | Type | Required |
|---|---|---|
| Station | Select | Yes |
| Min duration | Integer (minutes) | No |
| Max duration (cap) | Integer (minutes) | No |
| Max items per tray | Integer | Yes |
| Min items per tray | Integer | No |

**Business value:** Pipelines codify the production knowledge of the manufacturer — the sequence of steps, how long each should take, and physical constraints. Min/max thresholds turn this knowledge into automated alerts. A manufacturer stops relying on individual workers knowing the process and starts having it encoded in the system.

**Future extension:** Multiple pipelines per product type (e.g. standard vs. expedited). Pipeline versioning — when a process changes, historical Jobs retain the pipeline version they ran on. Parallel steps (not just sequential) for manufacturers with branching production flows.

---

### 5.3 Customer Order Management
**Location:** Operations → Customer Orders

**Capabilities:**
- Create Customer Order: customer name, one or more line items (product type + quantity), optional deadline, notes
- Auto-populated: creation date, order number (CO-XXXX), created by
- On save: system auto-generates one Job per line item
- User then assigns each Job to a Pipeline (or system pre-assigns if product type maps to one pipeline)
- List view: Order#, Customer, Lines, Status, Allocated %, Fulfilled %, Due date
- Status states: New → In Progress → Completed
- Edit and delete orders

**Business value:** Customer Orders provide the commercial visibility layer. A manager can immediately see how many orders are active, which are at risk of missing deadline, and what the overall fulfillment rate is. This is the answer to "where are we with the Müller order?" — answered in seconds without calling the floor.

**Future extension:** Customer contact details and communication history. Deadline alert triggers (email/SMS when order at risk). Order templates for repeat customers. Integration with invoicing or ERP systems.

---

### 5.4 Job Management
**Location:** Operations → Jobs

**Capabilities:**
- Auto-creation from Customer Order (primary flow)
- Manual creation as fallback: select pipeline, product type, quantity, notes
- System generates: Job# (JOB-XXXX), Tray Code (TRAY-XXXX), QR code
- Cross-order batching: if a tray has remaining capacity and another Job of same pipeline/type is pending, system combines them onto one tray (one QR)
- Printable QR label per tray
- Pipeline assignment (if not auto-assigned from Customer Order)
- List view: Job#, Product Type, Pipeline, Qty, Allocated, Status, Tray Code, Customer Order reference, Created At
- Job detail: visual pipeline flow with current station marked, event timeline (all scan in/out events with timestamps), KPIs (total tracked time, station visits, longest station time)

**Tracking states per Job:**
- Pending — created, not yet started
- In Progress — tray scanned into at least one station
- Completed — tray scanned out of final station

**Business value:** Jobs are the operational heartbeat of the system. The QR label on the tray is the only physical change workers experience. Every movement is recorded automatically. The event timeline gives a complete audit trail for any order — answering delivery disputes, identifying where time was lost, and building the data for realistic future estimates.

**Future extension:** Multi-tray Jobs (one Job spans multiple physical trays). Job priority levels — urgent orders surface to top of queue at each station. Predicted completion time based on historical stage durations. Cost attribution per Job when time-tracking data is combined with hourly rates.

---

### 5.5 Dashboard — Customer Orders Tab
**Location:** Operations → Dashboard → Customer Orders

**Capabilities:**
- KPI cards: Total Orders, New, In Progress, Completed
- Orders list with status, fulfillment %, due date
- Click any order → Order detail view
- Order detail: customer info, all Jobs listed, per-Job visual pipeline flow diagram showing current position, overall order completion %

**Visual pipeline flow (Order detail):**
- Horizontal node diagram per Job
- Each station = node
- Completed stations = filled/colored
- Current station = highlighted with time-at-station
- Not started = muted

**Business value:** Transforms shift handover from a 20-minute verbal briefing to a 2-minute screen check. The incoming manager sees every active order, where each is in production, and which are at risk. Customer-facing: when a client asks about their order, the answer is available in under 10 seconds.

**Future extension:** Deadline risk scoring — orders flagged amber/red based on current position vs. expected completion time. Customer portal (read-only external view). Automated customer notification when order hits final station.

---

### 5.6 Dashboard — Internal Operations Tab
**Location:** Operations → Dashboard → Internal Operations

**Capabilities:**

**Live KPIs:**
- Active Jobs (currently in-station)
- Avg time at station across all active Jobs
- Bottleneck station (station with highest avg station time vs. threshold)
- Threshold violations (Jobs exceeding max duration at any station)

**Live Job Board:**
- All active Jobs: Job#, Product, Status, Pipeline, Progress (X/N stations), Current Station, Time at Station, Last Seen

**Station utilization (live):**
- Per station: occupied slots / total slots, queue size (Jobs assigned but not yet scanned in), idle flag

**Analytics (time period selector):**
- Periods: Today / This Week / This Month / Custom date range
- Per station: Jobs processed, avg time at station, utilization %, idle time
- Per pipeline: Jobs completed, avg total duration, bottleneck step
- Charts: station load comparison, throughput over time

**Business value:** Operational analytics turn gut-feel management into evidence-based decisions. "Station 3 always seems slow on Fridays" becomes a measurable fact. A manufacturer can identify their real bottleneck (not the assumed one), justify equipment investment with data, and plan capacity based on actual throughput — not estimates.

**Future extension:** Shift-based analytics (performance by shift, not just by day). Predictive bottleneck alerts before a queue builds. Equipment utilization reports for investment decisions. Comparison across configurable time periods (this week vs. last week).

---

## 6. Capacity & Batching Rules

- **Tray capacity:** defined per pipeline step as max items per tray (type-specific, set at pipeline level)
- **Batching:** if a Job's quantity is less than tray max capacity and another pending Job of same pipeline exists, system combines items from both Customer Orders into one Job on one tray — one QR code, one tray, one Job, items from multiple orders
- **Batching constraint:** same pipeline only
- **Slot capacity:** each station has a concurrent slot capacity (max trays active simultaneously)
- **Slot tracking:** scan in increments occupied count; scan out decrements it
- **Queue:** Jobs assigned to a station but waiting for a slot to free = queue
- **Underutilization warning:** if Job quantity is below min items per tray threshold (set at pipeline step level), system flags it at Job creation

---

## 7. QR & Scanning Model

- One QR code per tray
- QR code generated at Job creation
- Printable label format: Tray code, QR code, Job#, Product Type, Pipeline name, all contributing Customer Order references with quantities
- Scan in at station entry → logs timestamp, increments station slot count, updates Job status
- Scan out at station exit → logs timestamp, decrements slot count, advances Job to next station
- If Job contains items from multiple Customer Orders → all referenced Orders progress simultaneously on scan events

**Multi-order visibility requirement:** when a Job aggregates items from multiple Customer Orders, the system must surface this in three places:
1. **Job detail** — lists all contributing Customer Orders with customer name and item quantity per order
2. **Customer Order detail** — shows when an Order's items are batched into a shared Job, with reference to the other Order(s) on the same tray (e.g. "Batched with CO-0002 on TRAY-0001")
3. **Tray label** — all contributing Customer Order numbers printed on the label

---

## 8. Role Structure (POC: no auth enforced)

| Role | Access | POC status |
|---|---|---|
| Admin | Full access — Configuration + Operations | Single user (no auth) |
| Manager on Duty | Operations only — Dashboard, Orders, Jobs (read + create) | Structural only |
| Station Operator | Jobs only — view assigned Jobs, print labels | Structural only |

Navigation and page structure must be designed to support role-based access restrictions without requiring layout redesign when auth is added.

---

## 9. Parking Lot

Items logged for post-POC, not blocking current build.

**User onboarding & education**

New users — particularly non-software-native small manufacturers — need to understand the system's mental model before they start configuring. Risk without this: misconfigured pipelines, unused features, failed adoption.

Recommended approach (priority order):

1. **Setup sequence on first login** — Dashboard shows a guided checklist when nothing is configured: Create Station → Build Pipeline → Create Order. Each step has one sentence explaining the why, not just the what. Disappears once setup is complete.

2. **Empty state guidance** — every empty list (Stations, Pipelines, Jobs) shows a brief explanation of what belongs here and why, plus a primary action button. Replaces generic "No items yet" with contextual orientation. Disappears once first item is created.

3. **Contextual placeholders** — form field placeholders use real manufacturing examples ("e.g. Kiln, Drying Room, Inspection Bench") not generic ones ("e.g. Station Name"). Low effort, high clarity.

4. **Inline process illustration on Pipeline builder** — a small static diagram showing a tray moving through a sequence of stations, visible while the user is building their pipeline. Makes the abstract data model physically concrete. Most valuable for first-time setup.

5. **Inline field hints (secondary)** — short contextual notes on complex fields only (e.g. concurrent slot capacity, min items per tray). Not tooltips — visible text below the field. Used sparingly, not on every field.

*Note: Infobox-heavy UI feels helpful to designers but gets ignored by operators. Structure and empty states teach better than help text.*

---

## 10. Open Items (Post-POC)

- Authentication and role enforcement
- Per-order cost calculation (time × hourly rate per station)
- Automated pipeline pre-assignment based on product type mapping
- Multi-tray Job support
- Predicted completion time
- Customer notification triggers
- ERP / invoicing integration
