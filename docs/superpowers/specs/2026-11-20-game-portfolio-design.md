# Crowned Kingdoms portfolio

## Intent

Create a Vietnamese, single-page showcase that introduces the game and invites visitors to play it. The owner delegated the page's content and creative decisions. Implementation decisions below are the assistant's calls.

## Approach

Use a separate Vite HTML entry at `portfolio/index.html`, sharing the game's existing public assets. This lets the portfolio and game ship together under any base path while keeping existing game links valid. A new framework would add unnecessary dependencies; replacing the game's entry would change existing play and PWA behavior.

## Design

- Forest `#132e29`, deep forest `#0d211e`, ivory `#f3ead5`, gold `#d5ae65`, sage `#aab8a5`, paper `#eae5d7`.
- Palatino/Book Antiqua display typography; Segoe UI body typography, both with local fallbacks and Vietnamese support.
- A spacious dark hero with a large English game title, Vietnamese introduction, an illustrated pixel landscape, a play link and a gameplay anchor.
- A light editorial section explains the yearly loop; a dark interactive gallery presents nine kings; a project section explains the implemented systems; native FAQ disclosures and a final play invitation finish the page.
- Use existing approved art and, if useful, an actual screenshot of an in-memory sample kingdom. Do not generate or download new art. Clearly identify illustration versus in-game imagery.
- All navigation and play links work without JavaScript. JavaScript progressively enhances king selection and the small-screen menu. No pretend community links, trailer, reviews, or invented player counts.

## Constraints and acceptance

- `/` continues to launch the game; `/portfolio/` serves the showcase in dev and production, including under a deployment subpath.
- No Phaser imports, game-rule changes, runtime font services, dependencies or save changes.
- Responsive at 375, 768 and 1440 CSS px. No horizontal overflow, readable Vietnamese, visible keyboard focus, targets at least 44px, semantic headings and reduced-motion support.
- King gallery supports pointer and keyboard selection, updates name, text and art, and exposes selection to assistive technology. Mobile navigation closes on link selection and Escape.
- Verify actual browser rendering, missing images, navigation, interactions and production output; run lint, typecheck, tests and build.
