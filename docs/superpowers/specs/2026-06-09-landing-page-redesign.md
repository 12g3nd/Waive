# Waive — Landing Page + App Split: Design Spec
**Date:** 2026-06-09  
**Status:** Approved

---

## Overview

The current Waive app is a single page: the tool loads immediately on `/`. The goal is to make the site feel fully-fledged — impressive enough for a judge to spend several minutes exploring before ever touching the tool. The approved approach is to create a rich marketing landing page at `/` and move the existing tool to `/app`, keeping the tool itself unchanged.

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Structure | New `/` landing + tool at `/app` | Clean separation; tool unchanged; landing can tell the full story |
| Aesthetic | Civic Editorial (warm parchment, Fraunces serif, emerald + gold) | Cohesive with existing palette; trustworthy and distinctive |
| Landing sections | Full Narrative (7 sections) | Gives a judge ~3 minutes of rich exploration |
| Hero treatment | Split layout — copy left, result-card UI preview right | "Show don't tell" — judge sees the output before clicking |

---

## Architecture

### Routing changes

| Route | Before | After |
|---|---|---|
| `/` | Current tool (page.tsx) | New marketing landing page |
| `/app` | Does not exist | Current tool (moved from `/`) |

- `app/page.tsx` → renamed/moved to `app/app/page.tsx`
- New `app/page.tsx` created as a pure static marketing page (no `"use client"` at the top level; sections can be Server Components)
- All API routes (`/api/analyze`, `/api/ask`, `/api/samples`) stay exactly where they are — no changes
- Sample cards on the landing page link to `/app?sample=<id>` so clicking a sample deep-links directly into the tool with that sample pre-selected
- The `/app` page needs to read the `?sample` query param on load and auto-trigger analysis if present

### New files

```
app/
  page.tsx                          ← new landing page (replaces current)
  app/
    page.tsx                        ← current tool (moved here, minimal changes)

components/
  landing/
    hero-section.tsx                ← split hero (copy left, result card right)
    result-card-preview.tsx         ← the animated result card in the hero right column
    problem-section.tsx             ← dark section, 3 story cards
    how-it-works-section.tsx        ← 3-step connected flow
    differentiator-section.tsx      ← 4 feature cards (determinism, tests, citations, extensibility)
    sample-cta-section.tsx          ← sample board with /app?sample= links
    trust-section.tsx               ← stats grid + trust pills
    site-footer.tsx                 ← wordmark + tagline + legal disclaimer
    site-nav.tsx                    ← sticky frosted-glass nav
```

### Modified files

- `app/app/page.tsx` — add query-param handling for `?sample=<id>`; add a minimal back-link to `/` in the control bar
- `app/globals.css` — no changes needed; all existing tokens used
- `tailwind.config.ts` — no changes needed

---

## Landing Page Sections (in scroll order)

### 1. Site Nav (sticky)
- Frosted-glass background: `bg-paper/90 backdrop-blur-md`
- Left: Waive wordmark with `ai-letters` gradient
- Right: "How it works" anchor link, "Try a sample" anchor link, "Open the tool →" CTA button (links to `/app`)
- Hides on scroll down, reappears on scroll up (scroll-aware visibility)

### 2. Hero
**Layout:** CSS Grid, 2 columns, `items-center`, max-width 1200px, 80px vertical padding.

**Left column:**
- Badge pill: `Information & document prep — not legal advice` with a green dot
- `h1` in Fraunces display font, ~3.2rem, with one word underlined by a 4px gold bar (`::after` pseudo)
  - Copy: *"Your escape hatch was always there."*
- Subtext (Public Sans, muted): one sentence describing what Waive does
- Two CTAs: primary button ("Try a sample notice →" → `/app`) + ghost button ("How it works" → `#how`)
- Stats bar: 4 stats separated by a top border — `60s avg decode`, `3 domains`, `70+ tests`, `0 guesses`

**Right column — `ResultCardPreview` component:**
- White card, `rounded-2xl`, `shadow-lg`, `border border-border`
- `DECODED NOTICE` label pill anchored to top-left of card
- Header row: SVG countdown clock (urgent red, `8d`) + notice title + amount
- Remedy row: green pill "✓ Remedy found: Waiver — fault not required"
- Catch row: gold left-border block "⚡ Presumption fires — shifts burden back to agency"
- Draft row: emerald doc icon + "SSA-632 draft ready · copy to clipboard"
- Footer row: green dot + "Deadlines computed by tested code · sources cited"
- Subtle entrance animation: `animate-fade-up` with a 200ms delay
- No interactivity — purely decorative preview

### 3. Problem Section
**Background:** `bg-foreground` (dark ink) — creates strong visual break.

- Gold section label: "The problem"
- `h2` in Fraunces light on dark: *"Every year, thousands lose by silence — not by law."*
- 3 story cards in a grid (dark glass cards, `bg-white/5 border-white/10`):
  - Card 1: blockquote from a fictional SSA recipient → outcome badge "✗ Lost by silence" (red)
  - Card 2: blockquote from a fictional debt claim recipient → outcome badge "✗ Lost by silence" (red)
  - Card 3: positive resolution story → outcome badge "✓ Escape hatch found" (green)
- Closing statement centered below cards: *"The remedy was always there."* with "always there" in gold

### 4. How It Works
**Background:** back to `bg-paper`.

- Primary-colored section label: "How it works"
- `h2`: *"From intimidating notice to clear action plan."*
- 3-step layout with a `dashed` connector line running through the step number circles (CSS pseudo-element)
- Each step:
  - Emerald numbered circle (`w-14 h-14 rounded-full bg-primary text-primary-foreground`)
  - Title in Fraunces
  - Body in Public Sans muted
  - Tag pill at bottom (green or gold depending on theme)
- Step content:
  1. **Drop your notice** — upload PDF/image, AI extracts facts. Tag: "PDF · Image · Any jurisdiction"
  2. **Deadlines computed** — deterministic code, no AI in the math. Tag: "Deterministic · Tested · Cited" (gold)
  3. **Your escape hatch** — remedy routed, draft generated. Tag: "Remedy · Draft · Citations"

### 5. What Makes It Different
**Background:** `bg-highlight/10` (very light gold) with subtle top/bottom gold borders — creates a third visual zone.

- Gold section label: "What makes it different"
- `h2`: *"Built to be trusted, not just impressive."*
- 2×2 grid of feature cards (white bg, border, `rounded-xl`, `p-7`):
  - Each card: icon block (emerald square, rounded) + title (Fraunces) + body text + mono code tag
  1. **The AI only translates. The code decides.** — `engine/pipeline.ts · 0 AI branches`
  2. **70+ tests. Every deadline verified.** — `70 passing · 0 mocked deadlines`
  3. **Every claim is cited.** — `corpus/benefits.json · verified`
  4. **Domain-agnostic by design.** — `packs/benefits · packs/answer`

### 6. Try It Now (Sample CTA)
**Background:** `bg-paper`.

- Primary section label: "Try it now"
- `h2`: *"Pick a notice. See it decoded."*
- Subtitle: "Real scenarios. Real results. Click any card to run the full pipeline."
- 3 sample cards, same content as the existing `SampleBoard` component but adapted:
  - Each card links to `/app?sample=<id>` (not triggering the React state machine)
  - Thumbnail area with a gradient background tinted by urgency
  - Badge, title, description, "Decode this notice →" link
  - Hover: `translateY(-3px)` + `shadow-lg` (matching existing component behavior)
- The existing `SampleBoard` component is **not** used here — this is a simpler static version that navigates to `/app` rather than triggering client-side state

### 7. Trust Section
**Background:** `bg-foreground` (dark) — mirrors the Problem section bookend.

- `h2`: *"Built for the moment when the stakes are real."*
- 4-column stats grid:
  - 70+ / Tests passing
  - 0 / AI-decided outcomes
  - 3 / Jurisdictions
  - 100% / Sources cited
- Trust pill strip below: privacy, legal disclaimer, Ollama, open rule packs

### 8. Footer
- Dark background (continuation of trust section)
- Left: Waive wordmark + "Stop losing by silence." tagline
- Right: Legal disclaimer text (muted, small)

---

## `/app` Page Changes (minimal)

The current `app/page.tsx` moves to `app/app/page.tsx` with two small additions:

1. **Back link in control bar:** A text link "← Waive" at the far left of the existing control bar (before the LLM status badge), linking to `/`. Styled as a ghost/text button, subdued.

2. **Query-param deep-linking:** On mount, if `?sample=<id>` is present in the URL, auto-trigger `callAnalyze` with `{ mode: "sample", sampleId: id }` — same as clicking a sample card. This lets landing page sample cards route directly to a result without an extra click.

---

## Animations & Motion

All motion respects `prefers-reduced-motion: reduce` (already handled in `globals.css`).

| Element | Animation | Notes |
|---|---|---|
| Nav hide/show | `translateY(-100%)` on scroll down, reverse on scroll up | `useScrollDirection` hook |
| Hero content | `animate-fade-up` staggered (existing class) | Left col 0ms, right col 150ms |
| Result card preview | `animate-fade-up` 200ms delay | Subtle float-in |
| Problem cards | `animate-fade-up` on scroll into view | `IntersectionObserver` |
| Step numbers | `animate-fade-up` staggered on scroll | 3 × 80ms interval |
| Diff cards | `animate-fade-up` staggered on scroll | 4 × 60ms interval |
| Sample cards | hover `translateY(-3px)` | Existing pattern |
| Stats | Count-up animation on scroll into view | Using a simple counter hook |

---

## Component Interfaces

```typescript
// components/landing/result-card-preview.tsx
// No props — static preview with hardcoded SSA sample data

// components/landing/hero-section.tsx
// No props — pure static section

// components/landing/problem-section.tsx
// No props — pure static section

// components/landing/how-it-works-section.tsx
// No props — pure static section

// components/landing/differentiator-section.tsx
// No props — pure static section

// components/landing/sample-cta-section.tsx
interface SampleCtaSectionProps {
  samples: SampleCard[];  // fetched server-side via /api/samples
}

// components/landing/trust-section.tsx
// No props — pure static section

// components/landing/site-nav.tsx
// No props — reads scroll position via hook

// components/landing/site-footer.tsx
// No props — pure static

// app/page.tsx — Server Component
// Fetches sample cards server-side, passes to SampleCtaSection
```

---

## Data Flow

```
GET /
  └─ app/page.tsx (Server Component)
       └─ fetch('/api/samples') server-side
            └─ renders all landing sections
                 └─ SampleCtaSection receives SampleCard[]

Click "Decode this notice →" on sample card
  └─ navigate to /app?sample=ssdi-not-at-fault

GET /app?sample=ssdi-not-at-fault
  └─ app/app/page.tsx
       └─ useEffect reads searchParams
            └─ auto-calls callAnalyze({ mode: 'sample', sampleId: 'ssdi-not-at-fault' })
                 └─ normal result flow
```

---

## What Is NOT Changing

- All API routes (`/api/analyze`, `/api/ask`, `/api/samples`) — untouched
- The engine, packs, corpus, lib — untouched
- All existing result-view components — untouched
- `globals.css` design tokens — untouched
- `tailwind.config.ts` — untouched
- All 70+ tests — untouched

---

## Out of Scope

- Dark mode
- Mobile nav (hamburger menu) — nav links collapse gracefully at small breakpoints but no hamburger drawer
- Internationalization of landing page (EN only; tool keeps its EN/ES toggle)
- Any new legal domains or rule packs
- Authentication or user accounts
