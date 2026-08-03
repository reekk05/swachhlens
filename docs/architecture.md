# SwachhLens — Architecture & Design Decisions

## 1. Problem being solved

Urban waste complaint handling today is manual and reactive: citizens report
an issue, officials inspect it later, and only then decide what action to
take. By the time waste is assessed it may have overflowed, spread, blocked
drains, or contaminated recyclables.

SwachhLens converts every citizen report into AI-assisted operational
intelligence, answering:
- Where are waste hotspots forming?
- What type of waste is present?
- How much volume needs clearing?
- Which team/vehicle should be dispatched?
- Is this a duplicate of an existing complaint?
- Which complaints need urgent escalation?
- How should limited cleanup resources be prioritized?

## 2. System overview

Two front-ends, one shared backend + AI engine:

```
┌────────────────┐      ┌──────────────────┐
│  Mobile App     │      │  Municipal        │
│  (Citizen)      │      │  Dashboard         │
│  React Native   │      │  Next.js           │
└────────┬────────┘      └─────────┬─────────┘
         │        REST API          │
         └───────────┬──────────────┘
                      │
              ┌───────▼────────┐
              │   FastAPI       │
              │   Backend       │
              │  (auth, CRUD,   │
              │   routing)      │
              └───────┬────────┘
                      │
          ┌───────────┼───────────┐
          │                       │
  ┌───────▼────────┐     ┌────────▼────────┐
  │  AI Engine       │     │  PostgreSQL      │
  │  - classification│     │  + PostGIS       │
  │  - volume est.    │     │  (via Supabase)  │
  │  - duplicate det. │     │  + File Storage  │
  │  - severity score │     └─────────────────┘
  └──────────────────┘
```

## 3. Tech stack & reasoning

| Layer | Choice | Reasoning |
|---|---|---|
| Citizen mobile app | React Native (Expo) | Real installable mobile app; buildable with JS/React skills; instant device preview via Expo Go for demoing |
| Municipal dashboard | Next.js | Reuses React/JS skills; strong for map-based dashboards and server-rendered data views |
| Backend API | FastAPI (Python) | Fast to build, auto-generated OpenAPI docs, async-friendly, same language as the AI engine |
| AI engine | Python (separate service) | Decoupled from the API so classification/volume/duplicate/severity logic is a clean, independently testable module |
| Database | PostgreSQL + PostGIS via Supabase | PostGIS enables geospatial queries (proximity search for duplicate detection, hotspot clustering) natively; Supabase adds hosted Postgres + Auth + File Storage + Realtime with no extra backend work |
| Maps | Mapbox / Leaflet | Hotspot heatmap visualization on the dashboard |
| Hosting | Vercel (dashboard), Railway/Render (API + AI engine), Supabase (DB/storage) | All free-tier, all publicly reachable — real deployed infrastructure, not local-only |

## 4. Differentiation strategy

Given hackathon scale (300+ teams), most submissions will likely stop at
"photo → classification model → done," covering only 2 of the 7 questions
the problem statement asks. SwachhLens differentiates on:

1. **Volume estimation** — estimating waste size (small/medium/large/very
   large) from the image using scale-reference techniques, not just
   classification.
2. **Duplicate detection** — combining GPS proximity, time window, complaint
   category, and image similarity (embeddings) rather than naive matching.
3. **Explainable severity scoring** — a transparent weighted formula
   (volume + location sensitivity + report frequency + complaint age)
   instead of a black-box score, directly supporting the Data Ethics
   evaluation criterion.
4. **Actual decision support** — the problem statement is titled a "Decision
   Support System," not a classifier. SwachhLens recommends concrete actions
   (team type, vehicle, escalation, routing to recycling partners), not just
   a label.

## 5. Assumptions

_(To be filled in as decisions are made — e.g. supported waste categories,
image quality assumptions, offline behavior, language support.)_

## 6. Compliance & data ethics notes

_(To be filled in — covers the "Data Ethics & Privacy" evaluation criterion:
handling of citizen-submitted imagery, location data, and PII.)_
