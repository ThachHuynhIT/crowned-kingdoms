# Night plan — 12/11/2026 (branch `feature/close-up-art`, 02:00 → 03:45)

Time is short (about 1 h 45 min before the machine sleeps), so the phases are ordered by the owner's priority list
and each one stops at what can be finished and checked. Every commit passes `npm run lint && npm run typecheck &&
npm test && npm run build`. No push, merge or PR; no Codex.

## Phase 1: card picks (priority 1)
- **Bug:** buying one of the Merchant's three cards for 3 gold "loses a card".
- **Cause:** a pick was put on top of the draw pile. Since the draw-one rule, the next year's only draw is that card,
  so a purchase adds nothing to the hand. Mua thẻ (`buyCard`) puts the card in the hand.
- **Files:** `src/game/run/commands.ts` (`pickOffer`), `src/game/run/merchant.test.ts`, new
  `src/game/run/merchantDeck.test.ts` (hand ∪ draw ∪ discard = deck after every command over full greedy-bot runs;
  every merchant buy adds one card), `endlessCompatibility.test.ts` baseline.
- **Done when:** a merchant purchase goes into the hand; reward, conquest and quest picks keep their rule (top of the
  draw pile, the year's draw), which is a design choice for the owner; the invariant test is green.

## Phase 2: performance (priority 2)
- Measure the realm in planning and battle (desktop 1280×720, "Cao"; phone landscape 844×390) with the Playwright
  rAF sampler: average fps, p95 frame time, time to the main menu.
- Optimise only what the numbers point at; keep a change only if it improves them; record before and after.

## Phase 3: layout of buttons and text (priority 3)
- Screenshot each scene at 1280×720 and a small window (960×540).
- Look for text overflowing buttons or frames and for overlapping or misplaced buttons; fix; add layout tests where
  the maths is pure (`src/ui/*Layout.ts`).

## Phase 4: phones, landscape only (priority 4)
- `screen.orientation.lock('landscape')` where supported, plus a "Xoay ngang điện thoại để chơi" overlay that pauses
  the game in portrait.
- Check 667×375, 844×390, 915×412, 932×430 and 1024×768: 44 px targets, safe-area insets, no clipped modals.

## Later phases (only if time remains)
- Dropdowns for cycling settings.
- WCAG AA contrast.
- Map rendering and performance.
- Help and asset-admin text.
- Asset rules for the new walking directions (spec only).

## Report
`NIGHT-RUN-REPORT.md` after every phase: morning summary first, then commits, numbers, screenshots, decisions,
what is left.
