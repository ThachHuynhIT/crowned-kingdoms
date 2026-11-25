# Portfolio kingdom capture — 2026-11-20

`public/assets/portfolio/kingdom.webp` is an actual renderer capture, not a newly generated illustration or a record of a completed player run. The website labels it as a sample layout.

- Local Vite dev build at baseline `4426c54`, viewport 1440×900, screenshot format WebP.
- `newRun(1847, 'wheat', CONTENT, RULES_FULL)`, year set to 12, gold to 23.
- In-memory persistence: `SaveCoordinator(new MemorySaveStore(), CONTENT)` injected through Realm's existing DEV preview interface. Real saves untouched.
- Sample level-2 buildings: windmill at 1 and 18, field at 6, 7, 11 and 16, scarecrow at 10, reapers at 12; starting throne retained at 2. Other requested ids were checked against CONTENT and skipped when absent.
- `PlanningHud` stopped, dev HTML overlay hidden, no renderer/art changes. Screenshot captured using Playwright; no image synthesis, external source, or editing pipeline.
- Existing registered art from `public/assets/art/ai-v1/`, detailed in `CREDITS.md` and `docs/assets.manifest.yml`.
