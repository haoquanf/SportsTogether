# Build plan

Follows "Sports Social App Investor MVP Plan" (Nov 24, 2026).

| Phase | What ships | Plan requirements |
| --- | --- | --- |
| 1. Foundation | Monorepo, sign-up (email + Google), password reset, profile with sport/skill/city, age gate, video consent, delete account, live URL | F1, F2 |
| 2. AI coach | Clip upload, MediaPipe pose, skeleton overlay side by side with the coach, score + 3 to 5 tips, history, progress score per clip | F9 to F11 |
| 3. Community and lessons | Groups on a map, skill-tagged events with RSVP and waitlist, comments, report/block, reminders, tutorial library | F3 to F8, F15 |
| 4. Payments and polish | Stripe Premium, free limit (3/month), admin panel, analytics, demo rehearsal; activity feed and challenges if time allows | F12 to F14 |

Launch city: Boston, MA.

Database setup: run every file in packages/db/migrations in number order in the Supabase SQL Editor.

Out of scope (roadmap slides only): pro-match 3D analysis, team plans.
Demo footage: the founder's own filmed coaches with signed release forms, never pro/broadcast footage.

Check after phase 2: if tips are not convincing on 20 test clips, narrow strokes or simplify the score before phase 3.
