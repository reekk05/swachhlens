# SwachhLens

**AI-Powered Waste Response Decision Support System**
Built for TechNova Round 2 — Problem Statement 2 (SwachhLens)

## What this is

SwachhLens lets citizens report waste issues (overflowing bins, illegal dumps,
plastic, construction debris, hazardous waste, etc.) with a photo + GPS
location. An AI engine classifies the waste type, estimates its volume, checks
for duplicate reports, and scores its priority — then a municipal dashboard
uses that intelligence to recommend the right cleanup response (team, vehicle,
urgency) instead of relying on manual triage.

See `docs/architecture.md` for the full technical breakdown and reasoning
behind every decision.

## Repo structure

```
swachhlens/
├── apps/
│   ├── mobile/          # React Native (Expo) — citizen-facing app
│   └── dashboard/        # Next.js — municipal authority portal
├── services/
│   ├── api/              # FastAPI — main backend (auth, complaints, routing)
│   └── ai-engine/        # Python — classification, volume estimation,
│                          #   duplicate detection, severity scoring
├── packages/
│   └── shared/            # Shared types/constants used by mobile + dashboard
├── docs/                  # Architecture, assumptions, compliance docs
└── infra/                 # Deployment configs
```

## Status

🚧 Phase 1: Foundation — repo scaffolding in progress.
