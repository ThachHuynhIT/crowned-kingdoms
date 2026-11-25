# Close-up art — plan (done 12/11/2026)

Spec: `docs/superpowers/specs/2026-11-12-close-up-art-design.md`.

1. Sample on the DEV flag `?smooth=1` (Dân Quân unit and building at density 8, 6× zoom). The owner approved it:
   "Làm toàn bộ".
2. Exporters: generalise each script's density-4 path to m = density / 2 and accept `--density 8`. Three subagents ran
   in parallel (units; buildings, levels, plots and wall; wilds, decor, forest and portal).
   - Check: density 2 and 4 outputs byte-identical (git clean).
   - Check: every UHD file is 4× its SD twin, alpha 0/255 (`tools/test_art_hd_density.py` `UhdTwinTest`).
3. Runtime:
   - `artQuality.ts` with tests;
   - `imageArtLoads(tier)` and the UHD key, with tests;
   - atlas UHD frames;
   - smooth filter and power-of-two padding;
   - zoom limits with a test;
   - text buckets up to 6 with a test;
   - Boot and Settings wiring.
4. PWA runtime cache for `ai-v1-uhd` (`tools/pwa.ts` + test). Atlas packing at the UHD tier stays within 4096 px
   (`tools/spriteAtlas.test.ts`).
5. Register: `register_uhd.py` (772 manifest entries), a CREDITS line, the CLAUDE.md rule.
6. Gate: `npm run lint && npm run typecheck && npm test && npm run build`, plus the Python tools tests.
7. Browser checks:
   - DPR 1 desktop: 772 UHD files, 6 atlas pages of 2048×4096, zoom 6, no console errors;
   - DPR 2 desktop: same;
   - DPR 3 phone: HD tier, no UHD.
