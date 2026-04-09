# ManuTracker Design Review — v2.1

**Reviewer:** Principal Software Designer (AI)
**Date:** April 9, 2026
**Scope:** Full design package — design system tokens, 16-screen prototype, branding, PRD, landing page
**Method:** 6-tier review per Principal Designer skill

---

## Review Summary

The v2 design package is **strong for POC stage**. The design system has solid foundations — well-chosen typography, a clear color hierarchy, and a token file that serves as the single source of truth. The prototype covers 16 screens with realistic data, which is unusually thorough for this stage.

After the initial review, **all 7 Critical items have been resolved** in the design system documentation and token files. The remaining items are Suggestions (addressable during development) and open design questions carried from the original design sessions.

**Verdict:** Ready for engineering implementation. Remaining suggestions can be addressed iteratively.

---

## Tier 1 — System Consistency

### Resolved

- ~~**Logo file uses teal palette.**~~ **FIXED.** Logo HTML updated to blue system: `--sidebar-bg: #0d1f3c`, `--logo-manu: #90c4f0`, dots use `#90c4f0`, light-bg Manu uses `--accent: #1a5faa`. Sidebar context section updated to blue gradient + correct nav colors.

- ~~**CSS alias duplication.**~~ **FIXED.** Token file consolidated into single `:root` block. Header comment declares v5 full names as canonical and short aliases as deprecated. Engineers use full names only.

- ~~**Token file split across multiple `:root` blocks.**~~ **FIXED.** Single `:root` block with section comments.

- ~~**`--surface-hover` discrepancy.**~~ **FIXED.** Settled on `#f8f9fb` (matching prototype). Token file and DESIGN-SYSTEM.md aligned.

### Suggestion (remaining)

- **Batch purple (`#7c4dbd`) is tokenized but semantically orphaned.** The token `--color-batch` exists, but no principle defines when purple is used beyond batching. Define: purple = "system automated action" or replace with a blue variant to stay within the two-hue system.

---

## Tier 2 — Layout & Spacing

### Resolved

- ~~**No responsive behavior specified.**~~ **FIXED.** Minimum viewport width set to 1024px. Behavior below minimum documented: horizontal scroll, sidebar never collapses. See DESIGN-SYSTEM.md Section 8.

### Suggestion (remaining)

- **Spacing values in the prototype use raw pixels.** The token file defines a clean 4px-base scale, but the prototype uses values like `gap: 7px` that fall off-scale. Accepted for POC — custom component tokens (`--table-cell-v: 13px`, `--table-cell-h: 22px`) cover the main cases.

- **Content padding asymmetry.** `--content-padding: 32px 36px` — the 36px doesn't sit on the spacing scale. Minor — not blocking.

### Nit

- **Sidebar width (220px) is technically on the 4px grid** (55 * 4) but unusual. Not worth changing.

---

## Tier 3 — Component Design

### Resolved

- ~~**No component API documentation.**~~ **FIXED.** DESIGN-SYSTEM.md now includes full prop tables for: StatusBadge, Button, FormInput. Types, defaults, and required flags specified.

- ~~**Missing component states.**~~ **FIXED.** All component states documented:
  - Button: default, hover, focus, active, disabled, loading
  - Form Input: default, focus, error, disabled
  - Data Table: loading (initial skeleton), loading (refresh overlay), empty, error
  - Modal: open/close animation, focus trap, keyboard dismiss

- ~~**Destructive actions unspecified.**~~ **FIXED.** Confirmation dialog pattern documented in Modal section: title, body copy template, Cancel + Delete button specs.

### Suggestion (remaining)

- **Pipeline flow visualization** has three rendering modes but no shared component contract. Should be specced as one component with three `variant` modes or three components sharing status tokens.

---

## Tier 4 — Interaction & State

### Resolved

- ~~**No loading strategy.**~~ **FIXED.** Full loading behavior documented in DESIGN-SYSTEM.md Section 6: page-level loading (skeleton), tab switches (instant), table loading (skeleton rows vs. overlay), analytics (inline skeleton), polling (30s background refresh).

- ~~**No form submission behavior.**~~ **FIXED.** Submit flow documented: button loading state, field read-only during submit, client validation (scroll to first error), success (redirect + toast), server error (banner + preserved data).

- ~~**Concurrent interaction conflicts.**~~ **FIXED.** Double-click prevention documented: button disabled on first click.

### Suggestion (remaining)

- **No keyboard navigation flow.** Tab order through sidebar, forms, tables, and modals is not specified. Acceptable for POC but should be documented before accessibility audit.

---

## Tier 5 — Accessibility

### Resolved

- ~~**No `prefers-reduced-motion` specification.**~~ **FIXED.** Token file includes `@media (prefers-reduced-motion: reduce)` rule that disables all animations and transitions.

- ~~**Form labeling unclear.**~~ **FIXED.** DESIGN-SYSTEM.md Form Input spec now requires: visible label above every input (never placeholder-only), required fields marked with `*`, error messages below field replacing helper text.

### Suggestion (remaining)

- **Color contrast on sidebar text.** `--sidebar-text: #c4d4e8` on `#1a3a6e` is borderline for WCAG AA (approximately 4.2:1). Consider bumping to `#d0dff0`. Verify with a contrast checker during implementation.

- **Pipeline flow uses color alone** to distinguish completed/active/pending nodes. Adding icon or shape differences would support color-blind users.

---

## Tier 6 — Engineering Handoff

### Resolved

- ~~**Token file vs. prototype discrepancy.**~~ **FIXED.** Token file consolidated and aligned with prototype. README clarifies: `manutracker-tokens-v2.css` is canonical source of truth, prototype component CSS is reference-only.

- ~~**No icon library.**~~ **FIXED.** Lucide React selected. Size grid (16/20/24px), stroke weight (1.5px), color behavior (currentColor), and per-context icon mapping documented in DESIGN-SYSTEM.md Section 7.

- ~~**No animation/transition specs.**~~ **FIXED.** Motion tokens added to token file (`--duration-fast/normal/slow`, `--easing-default/enter/exit`). Modal animation specs documented.

### Suggestion (remaining)

- **Missing PRD sections for `station-detail` and `pipeline-detail`.** These screens exist in the prototype but aren't described in the PRD. Engineers can implement from the prototype directly, but PRD should be updated for completeness.

- **Data formatting rules.** Recommendations documented in DESIGN-SYSTEM.md Section 9 but marked as decisions (DD.MM.YYYY, 24h, German locale). Need explicit sign-off before implementation.

---

## Open Design Issues (carried from design brief)

These were flagged by the design team and remain open design decisions:

1. **Purple batch badge** — orphan color, no system principle
2. **KPI stat cards visually flat** — no urgency differentiation
3. **Orange dual use** — CTA button and alert status share the same color
4. **Logo dots at small sizes** — pipeline metaphor unclear at 19px
5. **Landing page palette mismatch** — still uses teal/orange, not blue system

---

## Priority Matrix (post-fix)

| Priority | Original Count | Resolved | Remaining |
|----------|---------------|----------|-----------|
| Critical | 7 | 7 | **0** |
| Suggestion | 11 | 3 | **8** |
| Nit | 2 | 1 | **1** |

### Remaining suggestions for first sprint

1. **Batch purple principle** — decide if purple = "system automated" or replace with blue
2. **Keyboard navigation flow** — document tab order
3. **Sidebar text contrast** — verify WCAG AA compliance
4. **Pipeline visualization** — unify component contract
5. **PRD gaps** — add `station-detail` and `pipeline-detail` sections
6. **Data formatting sign-off** — confirm German locale decisions
7. **Spacing scale alignment** — audit off-scale values in prototype
8. **Content padding** — settle on 32x32 or 32x40
