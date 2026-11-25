# SportsApp (working name "Rally")

Investor MVP: badminton in one city. Local groups and events, short tutorials,
and an AI coach that gives tips on uploaded clips.

## Layout

```
apps/web/                 Next.js website and API (sign-up, profiles, groups, events, tutorials, coach)
services/pose-analyzer/   Python AI service (MediaPipe pose, angle metrics, tips) — phase 2
packages/shared/          Sports, skill levels, strokes, plan limits shared across the app
packages/db/migrations/   Database schema (Supabase / PostgreSQL + PostGIS)
docs/                     Build plan and decisions
```

## Run locally

1. Install Node 22 and pnpm 10, then run `pnpm install`.
2. Copy `apps/web/.env.example` to `apps/web/.env.local` and add your Supabase keys.
3. Run the SQL in `packages/db/migrations/` in the Supabase SQL editor, in order.
4. `pnpm dev`, then open http://localhost:3000.

Without Supabase keys the site still runs in preview mode, with sign-in switched off.
