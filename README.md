# SwachhLens

> **Cleaner Cities. Smarter Actions.**

SwachhLens is an AI-powered waste response decision support system designed to transform citizen waste reports into actionable municipal operations.

Instead of stopping at complaint submission, SwachhLens connects the complete response loop:

**Report → AI analysis → Prioritization → Dispatch → Field navigation → Cleanup evidence → AI verification → Municipal confirmation**

The project was developed for **TechNova Round 2 — Problem Statement 2: SwachhLens**, whose goal is to move urban waste management from reactive complaint handling toward proactive, evidence-based response planning.

---

## Table of Contents

- [Overview](#overview)
- [Core Workflow](#core-workflow)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Application Structure](#application-structure)
- [Technology Stack](#technology-stack)
- [Supabase Data Model](#supabase-data-model)
- [Dashboard Modules](#dashboard-modules)
- [Mobile Modules](#mobile-modules)
- [Setup](#setup)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Operational API Integration](#operational-api-integration)
- [Maps & Routing](#maps--routing)
- [AI Decision Support](#ai-decision-support)
- [Security & Privacy](#security--privacy)
- [Production Readiness](#production-readiness)
- [Demo Flow](#demo-flow)
- [Hackathon Positioning](#hackathon-positioning)
- [Future Enhancements](#future-enhancements)

---

## Overview

Urban sanitation workflows often become reactive:

1. A citizen reports a waste problem.
2. Someone manually reviews it.
3. A team is assigned.
4. The team travels to the location.
5. Cleanup is performed.
6. Someone verifies the result.

SwachhLens turns that process into a connected digital workflow.

The citizen's phone becomes a source of structured field intelligence. AI-assisted analysis converts a raw image into operational information such as waste category, approximate volume, severity, and recommended action. Municipal staff can then prioritize complaints, dispatch field workers, plan routes, and monitor completion.

The field worker app closes the loop by providing assigned stops, live location updates, Google Maps navigation, completion evidence, and a worker profile.

---

## Core Workflow

```text
                 CITIZEN MOBILE
                      │
                      │ Photo + GPS + Description
                      ▼
                ┌──────────────┐
                │ AI ANALYSIS  │
                │              │
                │ Category     │
                │ Volume       │
                │ Severity     │
                │ Recommendation
                └──────┬───────┘
                       │
                       ▼
              MUNICIPAL DASHBOARD
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Queue      Risk/Command   Dispatch
                       Center        │
                                     ▼
                              FIELD WORKER
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                          ▼                     ▼
                  Google Maps             Cleanup
                  Navigation                  │
                                              ▼
                                      Completion Photo
                                              │
                                              ▼
                                      AI Verification
                                              │
                                              ▼
                                  Municipal Confirmation
                                              │
                                              ▼
                                          RESOLVED
```

---

## Key Features

### Citizen Mobile

- Citizen authentication and account creation.
- GPS-enabled waste reporting.
- Photo-based waste reporting.
- Optional description.
- AI-powered waste classification.
- AI-assisted waste volume estimation.
- Severity scoring and breakdown.
- Recommended municipal action.
- Duplicate complaint support through backend intelligence.
- Activity/history and impact-oriented citizen views.
- Profile management.

### Municipal Dashboard

- Secure staff authentication.
- Complaint queue ordered by severity.
- Active/dispatched complaint tracking.
- Complaint rejection workflow.
- Before/after cleanup evidence.
- AI cleanup verification.
- Municipal confirmation or send-back workflow.
- Complaint map with severity visualization.
- Dispatch planner.
- Worker selection.
- Optimized multi-stop routing.
- Live worker location tracking.
- Worker management.
- AI operations copilot.
- **Command Center** for city-level risk and field-resource intelligence.

### Field Worker Mobile

- Worker authentication.
- Temporary-password onboarding and password change.
- Assigned cleanup stops.
- Optimized route view.
- Manual stop selection.
- Live worker location reporting.
- Google Maps navigation to complaint locations.
- Completion photo upload.
- Worker profile and logout.

---

## System Architecture

SwachhLens is split into three main operational layers:

```text
┌──────────────────────────────┐
│        Citizen Mobile        │
│      React Native / Expo     │
└──────────────┬───────────────┘
               │
               │ HTTPS / Authenticated APIs
               ▼
┌──────────────────────────────┐
│      Application Backend     │
│                              │
│ Complaint processing         │
│ AI integration              │
│ Worker dispatch             │
│ Routing / operational APIs  │
│ Verification workflows      │
└───────┬──────────────┬───────┘
        │              │
        │              │
        ▼              ▼
┌───────────────┐   ┌─────────────────────┐
│   Supabase    │   │ Municipal Dashboard │
│ Auth + DB +   │   │     Next.js         │
│ Storage       │   └─────────────────────┘
└──────┬────────┘
       │
       └───────────────┐
                       ▼
               Field Worker Mobile
                 React Native / Expo
```

### Primary external services

- **Supabase** — authentication, PostgreSQL database, storage, and realtime application data.
- **Google Maps** — field-worker navigation.
- **OSRM** — dashboard road-route geometry for optimized dispatch routes.
- **AI services** — classification, operational recommendations, and cleanup verification are integrated through the backend layer.

---

## Application Structure

```text
SwachhLens/
│
├── apps/
│   │
│   ├── dashboard/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── login/
│   │   │   │   ├── signup/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── AwaitingConfirmationCard.tsx
│   │   │   │   ├── ComplaintMap.tsx
│   │   │   │   ├── CommandCenterTab.tsx
│   │   │   │   ├── CopilotWidget.tsx
│   │   │   │   ├── DashboardTabs.tsx
│   │   │   │   ├── QueueTab.tsx
│   │   │   │   ├── RejectModal.tsx
│   │   │   │   ├── RouteMap.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   └── WorkersTab.tsx
│   │   │   │
│   │   │   └── lib/
│   │   │       └── supabase/
│   │   │
│   │   ├── public/
│   │   │   ├── swachhlens-icon.svg
│   │   │   └── swachhlens-logo.svg
│   │   ├── package.json
│   │   └── ...
│   │
│   └── mobile/
│       ├── components/
│       │   ├── ActivityTab.js
│       │   ├── HistoryTab.js
│       │   ├── HomeTab.js
│       │   ├── ImpactTab.js
│       │   ├── ProfileTab.js
│       │   ├── ReportTab.js
│       │   ├── TabBar.js
│       │   ├── WorkerApp.js
│       │   └── WorkerProfileTab.js
│       │
│       ├── screens/
│       │   ├── AuthScreen.js
│       │   ├── RoleSelectScreen.js
│       │   └── SetPasswordScreen.js
│       │
│       ├── lib/
│       │   └── supabase.js
│       ├── assets/
│       ├── App.js
│       ├── app.json
│       ├── config.js
│       ├── theme.js
│       ├── package.json
│       └── ...
│
└── backend/
    └── API service
```

> The backend service is required by both client applications and runs on port `8000` in the current development configuration.

---

## Technology Stack

### Citizen / Worker Mobile

| Technology | Purpose |
|---|---|
| React Native | Mobile application UI |
| Expo 54 | Development/runtime tooling |
| Expo Location | GPS and worker location reporting |
| Expo Image Picker | Photo capture/selection |
| Supabase Auth | Authentication and sessions |
| Supabase JS | Database/auth access |
| AsyncStorage | Persistent mobile auth sessions |
| Expo Font | Custom typography |
| React Native URL Polyfill | Supabase compatibility |

### Municipal Dashboard

| Technology | Purpose |
|---|---|
| Next.js 16 | Web application framework |
| React 19 | UI |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Supabase SSR | Dashboard authentication/session handling |
| Supabase JS | Database access |
| Leaflet | Interactive complaint maps |
| React Leaflet | React integration for Leaflet |
| Lucide React | UI icons |
| React Markdown | AI/coplanit response rendering |
| OSRM | Road-route geometry |

---

## Supabase Data Model

The current data model is centered around four main tables.

### `complaints`

Stores the primary waste intelligence record.

```text
id
reporter_id
location
address_text
photo_url

category
volume

severity_score
severity_breakdown

duplicate_of
status
recommended_action
description

reported_at
resolved_at
resolved_photo_url

report_count

estimated_weight_kg
estimated_cleanup_minutes
workers_needed
recyclable_percentage

rejection_reason

assigned_worker_id
dispatched_at

ai_verification_note
```

### `staff_profiles`

Stores municipal staff and worker profile metadata.

```text
id
full_name
role
ward
created_at
must_change_password
```

### `citizen_profiles`

Stores citizen-facing profile information.

```text
id
display_name
created_at
avatar_url
```

### `worker_locations`

Stores the latest known worker position.

```text
worker_id
latitude
longitude
updated_at
```

This table powers the worker-position layer of the Command Center.

---

## Dashboard Modules

### Complaint Queue

The queue surfaces pending/verified complaints and supports:

- severity-based prioritization,
- complaint selection,
- resolution,
- rejection,
- and dispatch preparation.

### Active Operations

Displays dispatched/in-progress complaints.

The dashboard also contains a dedicated **awaiting confirmation** workflow where staff can inspect cleanup evidence before confirming resolution.

### Complaint Map

The map visualizes reported complaints and distinguishes severity ranges:

```text
75+   Critical
50–74 High
25–49 Medium
0–24  Low
```

### Dispatch Planner

The dispatch planner supports:

- complaint selection,
- worker selection,
- worker suggestion,
- optimized stop ordering,
- road-route visualization,
- final crew dispatch.

The selected complaints are passed to the operational routing API, and road geometry is rendered through OSRM.

### Workers

Municipal staff can:

- view field workers,
- create worker accounts,
- see whether workers have location information,
- manage worker access.

### Command Center

The Command Center adds an operational intelligence layer on top of existing complaint and worker data.

It currently combines:

- active complaint count,
- high-risk complaint count,
- estimated cleanup demand,
- geographically clustered complaint zones,
- risk scoring,
- high-severity concentration,
- complaint reporting frequency,
- worker live locations,
- worker distance from the highest-risk zone,
- and a data-driven deployment recommendation.

This turns individual complaints into city-level operational context.

### Operations Copilot

The dashboard includes a copilot interface that can receive operational questions and provide responses through the backend AI layer.

Distance-aware questions can include the dashboard officer's current browser location.

---

## Mobile Modules

### Citizen Flow

```text
Role Select
    ↓
Citizen Authentication
    ↓
Home
    ├── Report
    ├── Activity
    ├── History
    ├── Impact
    └── Profile
```

### Waste Reporting

The report flow captures the citizen's submitted evidence and location and sends it to the complaint API.

### Field Worker Flow

```text
Role Select
    ↓
Worker Login
    ↓
Worker App
    ├── Optimized Route
    ├── Manual Stops
    └── Profile
```

Each assigned stop can:

1. show the waste category,
2. show the reported address,
3. open the destination in Google Maps,
4. and complete the job with a photo.

### Password Management

Worker accounts can be created by municipal staff and can use temporary-password onboarding.

Workers can change their password through the profile flow or the dedicated password setup screen.

---

## Setup

### Prerequisites

Install:

- Node.js 20+ recommended
- npm
- Expo CLI / Expo Go for mobile development
- A Supabase project
- The SwachhLens backend API service

---

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd <repository-directory>
```

---

## 2. Install dashboard dependencies

```bash
cd apps/dashboard
npm install
```

Start the dashboard:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 3. Install mobile dependencies

In a second terminal:

```bash
cd apps/mobile
npm install
```

Start Expo:

```bash
npm start
```

or:

```bash
npm run android
```

```bash
npm run ios
```

```bash
npm run web
```

---

## 4. Start the backend API

The current mobile and dashboard code expect the operational API to be available at:

```text
http://<backend-host>:8000
```

The current mobile development configuration points to:

```text
http://10.5.69.65:8000
```

Change this for your local network/environment before running the app on another device.

---

## Configuration

### Mobile API configuration

Current file:

```text
apps/mobile/config.js
```

It contains:

```js
export const API_URL = "http://<backend-host>:8000";
```

The API must be reachable from the mobile device, not just from the developer machine.

For a physical device, use the computer's LAN IP or a reachable HTTPS deployment.

### Supabase

The current code uses a Supabase project through the browser/mobile client.

For a production deployment, move project URLs and public keys into environment variables instead of keeping them inline in source files.

Recommended dashboard variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Recommended mobile configuration:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
```

Do not put service-role keys or backend secrets into the mobile app or browser bundle.

---

## Operational API Integration

The current client code expects the backend to provide operational routes including:

### Worker operations

```text
GET  /staff/workers
POST /staff/workers/create
POST /staff/suggest-worker
```

### Complaint operations

```text
POST /complaints/
POST /staff/complaints/{complaint_id}/resolve
POST /staff/complaints/{complaint_id}/reject
POST /staff/complaints/{complaint_id}/confirm
POST /staff/complaints/dispatch
```

### Routing

```text
POST /staff/route
```

### AI Copilot

```text
POST /copilot/ask
```

### Worker mobile

```text
GET  /worker/my-stops
POST /worker/location
POST /worker/change-password
```

The backend remains the authoritative place for privileged operations, AI calls, worker dispatch, and role-protected actions.

---

## Maps & Routing

SwachhLens uses two map-related flows:

### Municipal Dashboard

The dashboard uses:

- **Leaflet / React Leaflet** for interactive maps.
- **OSRM** for road-route geometry.

The dispatch workflow sends selected complaint locations to the routing API and then renders the returned route.

### Field Worker

The field-worker app opens **Google Maps directly** for a selected stop.

The navigation helper prefers the complaint's exact coordinates and falls back to the address when coordinates are unavailable.

This avoids embedding another full navigation system inside the worker app while still providing turn-by-turn navigation through Google Maps.

---

## AI Decision Support

SwachhLens is designed around AI-assisted operational intelligence rather than a single classifier.

The platform can work with information such as:

- waste category,
- approximate waste volume,
- severity,
- severity breakdown,
- report frequency,
- complaint age,
- estimated cleanup time,
- worker requirements,
- recyclable percentage,
- duplicate relationships,
- recommended intervention,
- and AI cleanup verification.

The Command Center then aggregates these operational signals spatially to identify higher-risk complaint zones and suggest field-resource deployment.

### Explainability principle

The application should expose the reasoning behind operational recommendations where practical.

For example:

```text
Zone risk
91 / 100

Drivers:
• High complaint concentration
• High-severity reports
• Large cleanup demand
• Repeated citizen reports
• Older unresolved complaints
```

The system should avoid presenting generated numbers as scientifically precise when they are heuristic or model-derived estimates.

---

## Security & Privacy

SwachhLens handles:

- account credentials,
- citizen profiles,
- worker identities,
- GPS coordinates,
- uploaded public-space images,
- cleanup evidence images,
- and operational municipal data.

### Recommended safeguards

- Use Supabase Row Level Security (RLS).
- Keep service-role credentials exclusively on the backend.
- Never embed backend secrets in mobile or browser code.
- Store only the user data required for the workflow.
- Restrict citizen data from unauthorized staff accounts.
- Restrict worker-location data to authorized operational roles.
- Validate all backend requests server-side.
- Use HTTPS for deployed API traffic.
- Review image-retention policies before production use.
- Avoid exposing precise worker locations outside authorized operational views.

Public imagery and location information should be treated as sensitive operational data even when the locations themselves are publicly visible.

---

## Production Readiness

Before deployment, replace development-only configuration such as:

```text
localhost
LAN IP addresses
hard-coded configuration values
```

with:

- environment variables,
- deployed HTTPS endpoints,
- production Supabase configuration,
- proper storage policies,
- production authentication settings,
- monitored backend services,
- and production database policies.

Also remove development artifacts from version control:

```text
.next/
node_modules/
.expo/
```

and keep credentials out of the repository.

---

## Demo Flow

A strong demonstration should show the complete closed loop rather than isolated screens.

### Suggested 4–6 minute demo

#### 1. Citizen report

Open the mobile app.

- Sign in as a citizen.
- Capture/select a waste image.
- Confirm location.
- Submit the report.

#### 2. AI analysis

Show the generated operational information:

- waste category,
- volume,
- severity,
- recommended action.

#### 3. Municipal decision

Switch to the dashboard.

Show:

- the complaint entering the queue,
- severity prioritization,
- the complaint map,
- Command Center risk zones,
- worker locations,
- and recommended deployment.

#### 4. Dispatch

Select the complaint.

Open:

```text
Dispatch → Get Optimized Route
```

Confirm dispatch to a field worker.

#### 5. Field response

Switch to the worker app.

Show:

```text
Assigned stop
→ Get Directions — Google Maps
→ Navigate
→ Mark Complete — Upload Photo
```

#### 6. Verification

Return to the dashboard.

Show:

```text
Before photo
+
After photo
+
AI verification
```

Then confirm the resolution.

### The final story

```text
Citizen reports.
AI understands.
Municipality prioritizes.
Resources are dispatched.
Worker navigates.
Cleanup is verified.
```

---

## Hackathon Positioning

SwachhLens is not positioned as another complaint-registration application.

Its core value is the **operational intelligence layer between a citizen report and real municipal action**.

The project is designed around four connected questions:

```text
Where is waste risk concentrating?
What is happening there?
What action should happen next?
How should limited field resources be deployed?
```

The Command Center strengthens this positioning by connecting complaint intelligence with live worker locations and cleanup demand.

---

## Future Enhancements

Potential next-stage capabilities include:

- stronger spatial hotspot detection using geospatial clustering,
- historical hotspot trend analysis,
- predictive risk escalation,
- vehicle-capacity-aware dispatch,
- richer fleet/resource optimization,
- learned resource allocation from historical cleanup outcomes,
- citizen notification improvements,
- municipal SLA tracking,
- ward-level analytics,
- recycling-partner routing,
- and longitudinal city cleanliness metrics.

These should be introduced only when supported by reliable operational data.

---

## Contributing

For hackathon development:

1. Create a feature branch.
2. Keep client and backend changes aligned.
3. Avoid committing secrets or local configuration.
4. Test the complete workflow before merging.
5. Prefer small, descriptive commits.

Example:

```bash
git checkout -b feature/command-center
git add .
git commit -m "feat: add municipal command center intelligence"
git push origin feature/command-center
```

---

## License

This project is intended as an original TechNova hackathon submission.

Add your team's chosen license here before public distribution.

---

## Team

**SwachhLens**

An AI-powered waste response decision support system for faster, evidence-based urban sanitation operations.
