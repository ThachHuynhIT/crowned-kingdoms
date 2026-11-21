# Game portfolio implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Vietnamese showcase for Crowned Kingdoms at `/portfolio/`.

**Architecture:** A separate semantic HTML entry with CSS and a small TypeScript enhancement module. Reuse approved public art; preserve the game entry and relative production base.

**Tech Stack:** HTML, CSS, TypeScript, Vite, browser verification.

**Spec:** `docs/superpowers/specs/2026-11-20-game-portfolio-design.md`

## Global constraints

- No game behavior, saves, new dependencies, external fonts or generated game art.
- Keep the page Vietnamese and links valid under a deployment subpath.
- Touch targets at least 44 CSS px; support keyboard, reduced motion and 375px screens.

## Review focus

- Production HTML must reference the correct relative art, script and game links.
- The page must load without booting Phaser or registering a service worker.
- All nine king buttons must work with keyboard input and expose their state.
- Menu behavior must recover correctly after viewport changes and Escape.
- All illustrations must load; text must stay within viewport at 375px and 200% zoom.

### Task 1: Showcase entry and visual design

**Files:** `portfolio/index.html`, `src/portfolio/style.css`, `vite.config.ts`; optional own-game screenshot and asset registration.

- [x] Write semantic page content, descriptive metadata, navigation and working game links.
- [x] Build the forest-and-ivory visual system using existing art and responsive layouts.
- [x] Add the portfolio to Vite's production HTML inputs.
- [x] Check desktop and mobile screenshots and production asset paths.

### Task 2: Progressive interactions

**Files:** `src/portfolio/main.ts` and the corresponding HTML hooks.

**Interfaces:** `data-king` buttons select the gallery content; `aria-pressed` communicates selection. `aria-expanded` communicates mobile-menu state.

- [x] Implement all nine king selections and arrow/Home/End keyboard navigation.
- [x] Implement mobile menu toggle, link close, Escape, and desktop resize recovery.
- [x] Verify in the browser, including reduced motion and native FAQ disclosures.

### Task 3: Verification and review

- [x] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; distinguish existing baseline failures.
- [x] Verify built `/portfolio/` and a deployment subpath, inspect for missing images and console errors, and confirm `/` still launches the game.
- [x] Request a focused independent review and address important findings.
- [x] Leave the feature branch local, with no publishing or merge.

## Verification record — 2026-11-21

- Lint, all three TypeScript projects and production build exited 0. Production portfolio script is approximately 5.05 KB minified, independent of the 1.95 MB game bundle.
- `npm.cmd test -- --maxWorkers=2`: 239 files passed, 3067 tests passed, 6 skipped, 113.59s. Unbounded runs had existing 5-second timeout failures under concurrent load, also observed before implementation. No simulation files or test timeouts changed.
- Browser: all nine selections and portrait decodes; unique pressed state; Left/Right wrap, Home/End; menu open, Escape, link close and breakpoint recovery in both directions; native FAQ keyboard; reduced motion; useful no-JavaScript navigation and play links.
- Layout widths 320, 375, 720 (desktop 200%-zoom equivalent), 768, 1024, 1440 CSS px: no horizontal overflow. Desktop/mobile screenshots reviewed in `.playwright-mcp/portfolio-final-{desktop,mobile}.png` (ignored local evidence).
- Built `/portfolio/` and `/demo/portfolio/`: every image decoded, selection worked, game/art/script links kept the deployment prefix, no portfolio runtime errors. Actual dev play link reached `/` with the MainMenu scene and game canvas.
- Independent read-only source review: no blocking findings. Fixed its minor focus-recovery finding and verified both breakpoint directions in the browser. Screen-reader announcements have source review only, not a manual screen-reader test.
- Kept changes local on `feat/game-portfolio`; no push, merge or deployment.
