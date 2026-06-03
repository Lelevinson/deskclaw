# Amelya's Storefront (`web/`)

The mock storefront web UI for DeskClaw — the **Amelya's** demo skincare brand
presented over the existing `src/shop` backend. A **companion view** to the
conversational agent: browse the catalogue, and (later phases) manage a cart and
view the linked customer's own orders & returns. **No checkout, no payments, no
auth** (ARCHITECTURE §5; roadmap §1–2).

- Design system & wireframes: [`DESIGN.md`](DESIGN.md) (source of truth for brand/tokens).
- Plan & phasing: [`../docs/planning/storefront-roadmap.md`](../docs/planning/storefront-roadmap.md).
- Scope boundary: [`../ARCHITECTURE.md`](../ARCHITECTURE.md) §5/§6.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui. Design tokens are
encoded once in [`tailwind.config.ts`](tailwind.config.ts) + CSS variables in
[`app/globals.css`](app/globals.css); shadcn/ui primitives theme to them.

## Run

```bash
cd web
npm install          # first time
npm run dev          # http://localhost:3000
```

The app reads the **same shared shop store** the chat agent uses. Reset to a
clean demo state from the repo root: `npm run shop:reset`.

## The reuse layer (the one rule that matters)

**The storefront reuses `src/shop` server-side. The browser never reads `data/`
or the JSON store directly.** (roadmap §3, DESIGN §7.)

How it is wired:

- **Single seam:** [`lib/shop/index.ts`](lib/shop/index.ts) is marked
  `import "server-only"` and is the only place the app calls `src/shop`. It calls
  the *same* typed service functions the MCP tools wrap, so identity gating,
  ownership checks, and audit logging are one real code path — not a parallel
  reimplementation. Server components / route handlers / server actions import
  this module; the browser only ever receives plain serialized data.
- **Import path:** `@shop/*` → `../src/shop/*` (tsconfig `paths`). The service is
  authored as NodeNext ESM (`.js` import specifiers pointing at `.ts` sources), so
  [`next.config.ts`](next.config.ts) sets `resolve.extensionAlias` to resolve
  `.js` → `.ts`. Next transpiles the TypeScript directly — no separate build step.
- **Data seam:** `src/shop/store.ts` honors `DESKCLAW_DATA_DIR` and
  `DESKCLAW_SHOP_DB_PATH`. Next runs with cwd = `web/`, so [`.env`](.env) points
  both back at the repo-root `data/` and `.local/shop-db.json`. One store, shared
  with the agent.
- **Identity:** no login (auth deferred). The session is pinned to the existing
  pre-linked demo customer via [`lib/shop/identity.ts`](lib/shop/identity.ts)
  (`simulated-chat` + `demo-lin` → `customer-demo-lin`). Reads are identity-gated,
  own-resources-only; unknown/non-owned ids are refused identically (no existence
  leak). The header shows "Shopping as <demo customer>".

Phase 2 added two read functions to `src/shop/service.ts` — `listProducts()` and
`getProductById()` — so browse/PDP surfaces never touch `data/` directly.

## Scalability rule

A new customer-visible data domain = **one route + one typed data-access function
in `lib/shop/` that reuses `src/shop` + the existing shared components** — never a
rewrite. The tokens + shared component set keep every new surface on-brand for
free.

## Layout

```text
app/                      # App Router pages (server components read via lib/shop)
  layout.tsx              # fonts (Cinzel/Cormorant/Jost) + AppShell
  page.tsx                # catalogue grid (surface 2)
  products/[id]/page.tsx  # product detail / PDP (surface 3)
  not-found.tsx           # neutral 404 (no id/existence leak)
components/
  shell/                  # AppShell (header/nav/footer + "Shopping as"), Logo
  store/                  # ProductCard, CatalogueBrowser, Price, StockBadge, …
  ui/                     # shadcn/ui primitives, themed to tokens
lib/
  shop/                   # the server-only src/shop reuse layer + demo identity
  format.ts               # NT$ + date formatting (DESIGN §3.4)
DESIGN.md, mockups/, tools/   # design-phase artifacts (see DESIGN §appendix)
```

## Scope this app must respect

No checkout / payments / auth / address mutation / staff view. The cart is the
only mutation and must still write the audit log — **cart mutation is Phase 3**;
Phase 2 ships the catalogue + PDP slice with the Add-to-cart control inert. Adding
anything beyond the decided scope requires an `ARCHITECTURE.md` §5 update first.
