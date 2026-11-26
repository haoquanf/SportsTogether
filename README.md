# ZeniSports (repo: SportsTogether)

Investor MVP: badminton in one city. Local groups and events, short tutorials,
and an AI coach that gives tips on uploaded clips.

## Layout

```
apps/web/                 Next.js website and API (sign-up, profiles, groups, events, tutorials, coach)
services/pose-analyzer/   Earlier Python prototype of the AI coach (the live coach runs in the browser, see below)
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

## AI coach (smash)

The AI coach at `/coach` runs MediaPipe Pose in the browser, so clips never leave the device.

- `apps/web/lib/coach/analyze.ts` finds the swing, lines it up with the reference using dynamic time warping,
  measures knee bend, trunk rotation, elbow height, arm extension, contact height and follow-through,
  and turns the gaps into a 0 to 100 score and the top 3 fixes. Wording and tolerances: `lib/coach/smash.ts`.
- The reference is `apps/web/public/coach/references/smash.json` (plus `smash.mp4` for the replay).
  It is currently a placeholder made from the 3D lesson player. To swap in the coach, film 5 to 10
  side-on clips (instructions on the page), open `/coach/reference`, build, and replace both files.
- Tests: `pnpm --filter web test`.
