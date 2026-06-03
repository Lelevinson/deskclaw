---
name: frontend-design
description: >-
  Build and iterate the Amelya's storefront frontend (the mock e-commerce web UI
  under web/). Use for any Next.js + Tailwind + shadcn/ui work on the storefront —
  app shell, catalogue, product detail, cart, orders, returns surfaces — and any
  time you create or restyle a UI component, page, or design token. Enforces the
  Amelya's design system, the src/shop reuse contract, the 21st.dev Magic MCP
  workflow, and a Puppeteer visual self-review before claiming a UI is done.
---

# Frontend design — Amelya's storefront

Reusable dev-harness skill for building the storefront (`web/`). The storefront is
the **Amelya's** demo skincare brand presented over the existing **DeskClaw**
backend. Read these before writing UI:

- [`web/DESIGN.md`](../../../web/DESIGN.md) — **source of truth** for brand, design tokens, surface
  inventory, and wireframes. Match it exactly; if you must deviate, update it.
- [`docs/planning/storefront-roadmap.md`](../../../docs/planning/storefront-roadmap.md) — phasing + the reuse-layer contract.
- [`ARCHITECTURE.md`](../../../ARCHITECTURE.md) §5/§6 — scope boundary (owns what may be built).

## Non-negotiables

1. **Reuse `src/shop` server-side. Never** read `data/` or the JSON store directly
   from the browser. Server components / route handlers / server actions call the
   same typed service functions the MCP tools use.
2. **Reads are identity-gated, own-resources-only.** Orders/returns are the linked
   demo customer's own; unknown/non-owned ids are refused **identically** (no
   existence leak). Shop as the pre-linked demo customer ("Shopping as …").
3. **No checkout / payments / auth / address mutation / staff view.** The cart is
   the only mutation, and it **must still write the audit log** (resolve the UI
   confirm-vs-audit affordance per roadmap §3). Adding anything beyond scope needs
   an `ARCHITECTURE.md` §5 update first.

## Design system (from web/DESIGN.md — don't reinvent)

- **Brand:** Amelya's, Greek-heritage apothecary skincare. Gold engraving on cream;
  calm, premium, **never medical/“dermatology”** claims.
- **Color:** gold `#a9824b` / gold-deep `#8a6a3a` (gold text on cream) / gold-light
  `#c7a268` (on dark) · ink `#2b2723` · ink-muted `#6f685c` · cream `#f5f0e4` ·
  cream-soft `#faf7ef` · panel `#fbf8f1` · line `#e3dccb` · sage `#3d4a38` · blush
  `#ecd9d2`. Stock: low `#f3e3c2`/`#8a5a00`, sold-out `#e6e1d6`/`#6f685c`.
- **Type:** Cinzel (display/headings/logo, ALL-CAPS, tracking) · Cormorant Garamond
  (product names + editorial body) · Jost (UI/controls/labels). Scale + weights in
  DESIGN.md §3.2.
- **Space/shape:** 4px spacing scale; radius md 8px cards / pill 9999px buttons &
  badges; subtle elevation, prefer hairline `line` borders; max width 1200px,
  gutters 28px; catalogue grid 4/2/1-2 cols.
- **Formatting:** NT$ prefix, comma thousands, no decimals (`NT$1,000`). Dates
  `3 Jun 2026`. Source price from `data/catalog/products.json` (`priceNtd`).
- **Logo:** emblem `web/mockups/refs/amelya-emblem-web.png` + AMELYA'S (Cinzel),
  no tagline. Favicon needs a simplified mark — build the gold monogram-A-in-laurel
  (don't ship the detailed emblem at ≤32px).

Encode tokens once into `tailwind.config` theme + CSS variables; theme shadcn/ui
components to them. New surface = one route + one typed `src/shop` reuse module +
existing components — never a rewrite.

## Component workflow with the Magic MCP (21st.dev)

The `magic` MCP is configured (user scope). Use it to **scaffold** component
starters, then make them ours:

1. Ask Magic for a component close to the need (e.g. "product card grid",
   "cart line item", "filter pill bar").
2. **Re-theme to Amelya's tokens** — do not ship raw Magic output. Replace its
   colors/radii/fonts with our tokens; keep markup/a11y, drop off-brand styling.
3. Reconcile with shadcn/ui (our chosen base) so the component set stays coherent.
4. Match the matching DESIGN.md wireframe for structure.

Magic is an accelerator, not the source of truth — `web/DESIGN.md` is.

## Visual self-review loop (required before "done")

Never claim a UI works from code alone. Render it and **look**:

```bash
# from web/tools/  (Puppeteer + Chromium already installed in the devcontainer)
node shoot.mjs <path-to.html-or-running-url> /tmp/shot.png <width> <height> true
```

Then Read the PNG and verify against DESIGN.md. For a real Next.js page, point
`shoot.mjs` at the running dev URL (e.g. `http://localhost:3000/...`). Check:

- On **cream** (primary) and at least one dark surface (charcoal/sage).
- **Responsive:** desktop + a narrow viewport (grid 4→2→1).
- **States:** default, **empty**, **loading** (skeleton), **error/not-found**
  (neutral, no id/existence leak), plus stock states (in / low / sold-out → Add
  disabled).
- Tokens honored (gold-deep for gold text on cream; hairline borders; NT$ format).

## Definition of done

- Matches the DESIGN.md wireframe + tokens; uses the shared component set.
- Server-side data via `src/shop` only; own-only reads; refusals identical.
- Screenshotted and visually verified (cream + dark, responsive, all states).
- No checkout/auth/scope creep; cart mutations audited.
- `npm run shop:reset` still yields a clean demo; shared store reflects cart changes.
