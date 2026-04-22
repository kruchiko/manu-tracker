# ManuTracker Design — v2

Design artifacts for the ManuTracker production order tracking application.
This folder is the single source of truth for all design decisions, tokens, and specifications.

**Version:** 2.0
**Date:** April 2026
**Stage:** POC

---

## Folder Structure

```
docs/design/v2/
├── README.md                 ← You are here
├── DESIGN-SYSTEM.md          ← Unified design system reference (start here for implementation)
├── REVIEW.md                 ← Design review findings and action items
│
├── tokens/
│   └── manutracker-tokens-v2.css    ← Canonical CSS custom properties (source of truth)
│
├── prototypes/
│   ├── manutracker-full-prototype-v2.html  ← 16-screen interactive prototype (open in browser)
│   └── manutrack-landing-v2.html           ← Marketing landing page
│
├── branding/
│   ├── manutracker-logo-v3-fixed.html      ← Approved ManuTracker logo treatments at multiple sizes
│   └── argus-logo.html                     ← ARGUS brand identity (mark, lockups, palette, typography)
│
└── specs/
    ├── manutrack-prd-v1.md                 ← Product Requirements Document
    ├── manutracker-design-brief-v1.md      ← Design system brief (colors, typography, components)
    └── manutracker-session-debrief-v2.md   ← Session debrief (decisions, changelog, open issues)
```

---

## For Developers: Where to Start

1. **Read `DESIGN-SYSTEM.md`** — this is the unified reference. It consolidates tokens, component specs, and layout rules into one document with proposed React prop APIs.

2. **Open `prototypes/manutracker-full-prototype-v2.html` in a browser** — navigate using the pill bar at the bottom. This shows all 16 screens with realistic data.

3. **Open `branding/argus-logo.html` in a browser** — ARGUS wordmark, icon mark, variants, color chips, and typography specimen (Google Fonts: Syne, DM Mono).

4. **Import `tokens/manutracker-tokens-v2.css`** — this is the canonical token file. All CSS custom properties are defined here. Never hardcode hex values; always reference tokens.

5. **Check `REVIEW.md`** — this contains the design review findings. All 7 Critical items have been resolved. Remaining suggestions are tracked for iterative improvement.

---

## For Designers: What's Next

The following items are open from the design review:

### Resolved (all Critical items fixed)

1. ~~Consolidate CSS class naming~~ — v5 full names canonical, short aliases deprecated
2. ~~Define component API contracts~~ — props, types, defaults, states documented
3. ~~Specify loading and form submission behavior~~ — full spec in Section 6
4. ~~Update logo file to blue palette~~ — all teal references replaced
5. ~~Define minimum supported viewport width~~ — 1024px, documented in Section 8
6. ~~Specify icon library~~ — Lucide React, documented in Section 7

### Remaining Suggestions (address during development)

### Design Screens Still Needed

1. Per-entity empty states (Stations, Pipelines, Jobs, Orders)
2. Landing page updated to blue design system
3. Customer Order edit form
4. Job edit form (if different from create)

---

## Versioning Convention

Design artifacts are versioned at the folder level:

- `docs/design/v1/` — original teal/orange design (if archived)
- `docs/design/v2/` — current blue design system (this folder)
- `docs/design/v3/` — next major revision (when needed)

Individual files retain their own version suffixes (e.g., `tokens-v2.css`, `prototype-v2.html`) for traceability back to the design session that produced them.

---

## Key Design Principles

1. **Industrial credibility** — UI must feel like serious operations software, not consumer SaaS. Density acceptable; clarity required.
2. **Blue = trust** — Primary blue palette chosen for German B2B credibility.
3. **Orange = signal** — Every orange element means "needs attention" or is a primary CTA. Never decorative.
4. **Three fonts, three jobs** — Barlow Condensed for headings, Barlow for body, DM Mono for data.
5. **Token-first** — All visual properties reference named tokens. Raw hex values are prohibited in component CSS.
