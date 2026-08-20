# SwachhLens

**Cleaner cities, smarter actions.**

SwachhLens is an AI-powered waste response decision support system built for TechNova Round 2 (Problem Statement 2). The core idea: don't stop at "citizen submits a complaint." Carry that report all the way through — analysis, prioritization, dispatch, fieldwork, verification, and confirmation — so municipal teams are acting on evidence, not guesswork.

The full loop looks like this:

**Report → AI analysis → Prioritization → Dispatch → Field navigation → Cleanup evidence → AI verification → Municipal confirmation**

---

## Table of Contents

- [Why This Exists](#why-this-exists)
- [How It Works](#how-it-works)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [Dashboard Walkthrough](#dashboard-walkthrough)
- [Mobile Walkthrough](#mobile-walkthrough)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Maps & Routing](#maps--routing)
- [AI & Decision Support](#ai--decision-support)
- [Security & Privacy](#security--privacy)
- [Going to Production](#going-to-production)
- [Demo Script](#demo-script)
- [Why This Approach](#why-this-approach)
- [What's Next](#whats-next)

---

## Why This Exists

Most municipal waste workflows look roughly like this: a citizen reports a problem, someone eventually reviews it, a team gets assigned, they travel out, clean up, and — if you're lucky — someone checks that it actually got done. Every step is manual, and every handoff loses information.

SwachhLens turns the citizen's phone into a source of structured field intelligence instead of just a complaint form. A photo becomes a waste category, a rough volume estimate, a severity score, and a recommended action — automatically. From there, municipal staff prioritize, dispatch, and track, while field workers get a focused app that tells them where to go and lets them close the loop with photo evidence.

## How It Works

1. A citizen reports waste with a photo, GPS location, and optional description.
2. The backend runs it through AI classification — category, volume, severity, and a recommended action come back.
3. Staff see it land in the dashboard queue, sorted by severity, with duplicate detection running in the background.
4. Staff select complaints, get a suggested worker (or pick manually), and dispatch — with an optimized multi-stop route.
5. The assigned field worker sees the job on their phone, navigates via Google Maps, does the cleanup, and uploads an after-photo.
6. The AI compares before/after and gives a verification note. Staff review the evidence and confirm resolution (or send it back).
7. The citizen's status updates automatically — no separate sync step needed.

## Features

**Citizen mobile**
- Account creation and login
- Photo + GPS-based waste reporting, with optional description
- AI classification, volume estimate, severity breakdown, and recommended action
- Duplicate detection handled server-side
- Activity history and personal impact stats
- Editable profile with avatar

**Municipal dashboard**
- Staff login, severity-sorted queue, and a dedicated Active tab for in-progress work
- Rejection workflow with a reason recorded and surfaced to the citizen
- Before/after evidence review with AI verification notes, plus confirm/send-back
- Map view with severity-coded markers
- Dispatch planner: worker suggestion (nearest available), manual override, optimized routing, road-accurate route geometry
- Live worker location tracking and a worker roster with active/inactive status
- In-dashboard worker account creation (no logout required)
- A floating AI copilot for operational questions, location-aware when relevant

**Field worker mobile**
- Same app as citizens, different experience — gated by role, not just permissions
- Temporary-password onboarding that forces a real password on first login
- Assigned stops, shown either as an optimized sequence or a full manual list
- One tap to open the destination in Google Maps
- Photo upload to mark a stop complete, which feeds straight into the office review queue
- A lightweight worker profile

## Architecture

Three layers: two client apps and a backend that owns everything privileged.

```
Citizen Mobile  ─┐
                 ├─→ Backend API ─→ Supabase (Auth, Postgres, Storage)
Field Worker  ───┘        │
                          └─→ Municipal Dashboard (Next.js)
```

The backend is the only thing that talks to the AI models, holds service-role credentials, and enforces role checks — neither client app should ever be trusted with that on its own.

**External services in play:**
- **Supabase** — auth, Postgres (with PostGIS for location data), file storage
- **OSRM** — road-accurate route geometry for the dashboard's dispatch planner
- **Google Maps** — turn-by-turn navigation on the field worker's phone
- An AI provider for classification and cleanup verification, called only from the backend

## Project Structure

```
swachhlens/
├── apps/
│   ├── dashboard/            Next.js municipal dashboard
│   │   └── src/
│   │       ├── app/          Routes: login, signup, main dashboard
│   │       ├── components/   Queue, map, dispatch, workers, copilot, etc.
│   │       └── lib/supabase/ Client + server Supabase setup
│   │
│   └── mobile/                React Native (Expo) app — citizen + worker
│       ├── components/        Tab screens for both roles
│       ├── screens/           Auth, role select, worker onboarding
│       ├── lib/                Supabase client
│       ├── App.js
│       └── config.js
│
└── services/
    ├── api/                   FastAPI backend
    └── ai-engine/              Classification + verification service
```

## Tech Stack

**Mobile (citizen + worker)**
React Native on Expo 54, Expo Location for GPS and live worker tracking, Expo Image Picker, Supabase Auth/JS, AsyncStorage for session persistence, custom fonts via Expo Font.

**Dashboard**
Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase SSR for session handling, Leaflet/React Leaflet for maps, OSRM for routing, Lucide for icons, React Markdown for rendering copilot responses.

**Backend**
FastAPI, PostgreSQL + PostGIS via Supabase, an AI provider for image analysis.

## Data Model

Four tables carry the whole system.

**`complaints`** — the core record: location, photo, AI-derived category/volume/severity, status, dispatch and resolution timestamps, before/after photos, rejection reason, assigned worker, and the AI's verification note.

**`staff_profiles`** — office staff and field workers alike, distinguished by `role`. Includes a `must_change_password` flag for worker onboarding.

**`citizen_profiles`** — display name and avatar for citizens.

**`worker_locations`** — each worker's most recent GPS position, updated periodically from the mobile app and used to power proximity-based dispatch.

## Dashboard Walkthrough

**Queue** — pending and verified complaints, sorted by severity, with select/resolve/reject actions.

**Active** — everything dispatched or in progress. Complaints awaiting office confirmation surface here too, with side-by-side before/after photos and the AI's note, so staff aren't confirming blind.

**Map** — every open complaint plotted and color-coded by severity (critical, high, medium, low).

**Dispatch** — select complaints, get a suggested nearest worker (or pick one, or add a new worker account on the spot), generate an optimized route with real road geometry, then confirm.

**Workers** — an alphabetical roster with a live status dot (on-field vs. inactive), based on whether that worker currently has anything dispatched or in progress.

**Copilot** — a floating chat widget for questions like "what's the most urgent thing right now" or "what's closest to me" — answers are grounded in live complaint data, not guesses.

## Mobile Walkthrough

**Citizen flow:** role select → sign up or log in → Home (leaderboard, quick report shortcut) → Report → Activity (stats + history) → Profile.

**Field worker flow:** role select → log in → forced password reset on first login → assigned stops (optimized or manual view) → Google Maps navigation per stop → mark complete with a photo → Profile.

The two flows share one codebase and one login screen, but branch into completely different experiences based on the account's actual role in the database — not just what the person clicked.

## Getting Started

You'll need Node 20+, npm, Expo Go (or a simulator) for mobile, a Supabase project, and the backend API running somewhere reachable.

```bash
git clone <your-repo-url>
cd <repo-directory>
```

**Dashboard**
```bash
cd apps/dashboard
npm install
npm run dev
```
Runs at `http://localhost:3000`.

**Mobile**
```bash
cd apps/mobile
npm install
npm start
```
Or `npm run android` / `npm run ios` / `npm run web`.

**Backend** — needs to be reachable at the address configured in `apps/mobile/config.js` and wherever the dashboard points its API calls. For a physical phone, that means your machine's LAN IP, not `localhost`.

## Configuration

`apps/mobile/config.js` currently holds:
```js
export const API_URL = "http://<your-backend-host>:8000";
```

For anything beyond local development, move Supabase URLs/keys and the API URL into environment variables instead of hardcoding them:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
```

Service-role keys stay on the backend, always. Never in mobile code or the browser bundle.

## API Reference

```
Workers
GET  /staff/workers
POST /staff/workers/create
POST /staff/suggest-worker

Complaints
POST /complaints/
POST /staff/complaints/{id}/resolve
POST /staff/complaints/{id}/reject
POST /staff/complaints/{id}/confirm
POST /staff/complaints/dispatch

Routing
POST /staff/route

Copilot
POST /copilot/ask

Worker mobile
GET  /worker/my-stops
POST /worker/location
POST /worker/change-password
```

## Maps & Routing

The dashboard and the worker app solve two different problems, so they use two different tools. The dashboard needs to plan a multi-stop route and show it visually — that's Leaflet for rendering plus OSRM for actual road geometry. The field worker just needs to get from where they are to one specific address, so it opens Google Maps directly rather than reimplementing navigation inside the app.

## AI & Decision Support

The point isn't a single classifier — it's a layer of operational signals that build on each other: waste category, volume, severity and its breakdown, report frequency, complaint age, estimated cleanup time and crew size, recyclable percentage, duplicate relationships, a recommended action, and a verification note once cleanup evidence comes in.

Where possible, the reasoning behind a score should be visible, not just the number — e.g., a severity score should come with the factors that produced it, not sit as an unexplained figure. Anything derived from a model should be treated as an estimate, not presented as exact.

## Security & Privacy

The system touches account credentials, citizen and worker identities, GPS data, and photos of public and semi-private spaces. A few things worth taking seriously:

- Row Level Security on every table, not just the sensitive-looking ones
- Service-role credentials never leave the backend
- No secrets in mobile or browser bundles
- Citizen data shouldn't be reachable by unauthenticated or mismatched-role requests
- Worker location data should stay restricted to authorized operational views, not exposed broadly
- All backend requests validated server-side, not just trusted from the client
- HTTPS in any deployed environment
- A defined retention policy for uploaded images before this goes anywhere near production

## Going to Production

Before deploying, swap out anything development-only: `localhost`, LAN IPs, and hardcoded config values become environment variables and real HTTPS endpoints. Set up proper Supabase storage policies and production auth settings, and don't commit `.next/`, `node_modules/`, `.expo/`, or credentials of any kind.

## The story in one line
A citizen reports, the system understands, the municipality prioritizes, resources move, the worker acts, and the result gets verified — not just marked done.

## Why This Approach

This isn't meant to be another complaint-logging app. The actual value sits in the layer between a citizen's report and real action on the ground — answering where waste risk is concentrating, what's actually happening at a given spot, what should happen next, and how to use limited field resources well.

## What's Next

Ideas worth exploring once there's enough real usage data to justify them: proper geospatial hotspot clustering, historical trend analysis, predictive risk escalation, vehicle-capacity-aware dispatch, smarter resource allocation learned from past outcomes, citizen notifications, SLA tracking, ward-level analytics, and routing to recycling partners.

---
