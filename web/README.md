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

## Cart mutations — the UI confirm-vs-audit resolution (Phase 3)

The cart is the storefront's **only** write, and it **must still write the audit
log** (DESIGN.md §7; roadmap §3/§8). The chat pipeline is `identity → preview →
explicit confirm → execute → audit`, where the **confirm step exists to stop the
*model* from acting without the customer's consent**. In the storefront there is
no untrusted model intermediary — **the customer's own deliberate click is the
consent**.

**Resolution (this is the answer to roadmap §3/§8 and DESIGN §5.4's open note):**

- Mutations live in [`lib/shop/cart-actions.ts`](lib/shop/cart-actions.ts) as
  `"use server"` server actions (`addToCart` / `updateCartQuantity` /
  `removeFromCart`). Each calls the **same `src/shop` path the chat tools use** —
  `preview…ForChannel` then `confirmLatest…ForChannel` back-to-back. This is **not**
  a parallel write path: identity gating, ownership checks, stock re-validation,
  and **both audit-log writes** (the `*.preview` entry and the success entry) fire
  exactly as in chat. The audit log is never dropped.
- The deliberate UI interaction stands in for the chat confirm beat: an Add click,
  a qty ± step. For the destructive **remove**, the row's button takes an explicit
  two-step **"Remove?" confirm** (a lightweight affordance, not a heavy modal —
  DESIGN §5.4 argues against modal friction for qty). 
- Assisted cart actions are capped at 10 units by `validateQuantity` in the
  service (`ASSISTED_QTY_MAX` in `components/store/QtyStepper`). The PDP stepper
  bounds at `min(stock, 10)` (it has the exact `stockQuantity`); the cart-line
  stepper bounds at 10 and **disables entirely for an out-of-stock line** (which
  the service refuses to re-quantity — it can only be removed). A cart line only
  carries `stockStatus`, not an exact count, so an over-stock step on a low-stock
  line is caught by the service's stock re-validation and surfaced inline, with the
  optimistic quantity rolling back.
- After a successful mutation the action `revalidatePath`s `/cart` and the root
  layout so the cart page and the header `Cart(n)` badge stay in sync. Because it
  is one shared store, a cart change here also shows up in the chat agent, and
  vice-versa; `npm run shop:reset` returns a clean demo cart.

## Orders — read-only, own-orders-only (Phase 4)

Order history + order detail/tracking (surfaces 5, DESIGN.md §5.5) are **reads**,
not mutations — checkout/payments stay out of scope (ARCHITECTURE §5), so orders
are seeded fixtures the app only displays. Both surfaces go through the same
reuse-layer seam as everything else: [`lib/shop/index.ts`](lib/shop/index.ts)'s
`getOrders()` / `getOrder(id)` call the chat tools' own `listOrdersForChannel` /
`getOrderForChannel` in `src/shop`, so identity gating and ownership are the one
real code path. Orders are the **demo customer's own** only.

`getOrder(id)` returns `null` for an unknown **or** a non-owned id — the service's
`findOwnedOrder` makes the two indistinguishable — and the route then renders the
neutral `not-found` (no id echo, no existence leak; identical refusal to the
skills, DESIGN.md §5.7).

## Returns — read-only, own-returns-only (Phase 5)

Returns list + return detail (surface 6, DESIGN.md §5.6) are **reads**, mirroring
Orders. Both go through the same reuse-layer seam: [`lib/shop/index.ts`](lib/shop/index.ts)'s
`getReturns()` / `getReturn(id)` call the chat tools' own `listReturnsForChannel` /
`getReturnForChannel` in `src/shop`, so identity gating and ownership are the one
real code path. Returns are the **demo customer's own** only; `getReturn(id)`
returns `null` for an unknown **or** non-owned id (`getReturnForChannel` gives both
the same "not found") → neutral `not-found`, no existence leak — identical refusal
to Orders and the skills.

A `ReturnRequest` is **order-level** — it carries no line items — so the §5.6
wireframe's "Item: … ×1" line is intentionally **not** rendered (the UI never
invents data the service doesn't expose). The detail shows the linked order, the
opened date, the reason, the resolution type, and the read-only status, plus any
human-authored status note (e.g. "Refunded NT$420 …") as a recorded **fact** —
never a money/refund **action**.

**The delivered-order "Request a return" CTA (scope decision).** The §5.5 wireframe
points that CTA at a returns *intake*. Opening a return is a `preview→confirm`
**write**, and the storefront's invariant is that the **cart is its only mutation**
(DESIGN §4/§7); Phase 5 is scoped **read-only** (roadmap §6). Building an intake
would exceed that scope and contradict the invariant — which requires an
`ARCHITECTURE.md` §5 update **first** (roadmap §9). So the CTA stays **inert**: the
honest path is that a return *request* is opened through the **assistant** (chat
`returns-actions`, which creates a `requested` record — never an auto-refund,
ARCHITECTURE §5), while the storefront shows returns read-only. The button now
links to the live `/returns` list rather than being a muted not-yet-built
affordance.

## Polish — responsive, shared states, a11y, brand finish (Phase 6)

The final storefront phase is a cross-cutting pass over the surfaces shipped in
Phases 2–5 — **no new routes, data domains, or mutations** (cart stays the only
write; reads stay identity-gated own-only with identical refusals). It adds:

- **Responsive shell.** The shared header collapses its nav behind a hamburger
  below `md` ([`components/shell/MobileNav.tsx`](components/shell/MobileNav.tsx)),
  fixing the wordmark/nav overlap at narrow widths; the desktop inline nav and the
  mobile menu share one IA definition ([`components/shell/nav.ts`](components/shell/nav.ts)).
  Every surface was screenshot-audited at desktop + narrow.
- **Shared states (DESIGN §5.7).** A `Skeleton` primitive (cream blocks + a faint
  gold shimmer that honors `prefers-reduced-motion`) in
  [`components/store/Skeleton.tsx`](components/store/Skeleton.tsx), with a
  `loading.tsx` per data route; a neutral `app/error.tsx` boundary that reuses
  `EmptyState` and **leaks no error detail/id** (same no-existence-leak discipline
  as the not-found refusal); empty states verified across all surfaces.
- **Deferred cleanups (now that the 3rd copy existed).** A shared `StatusPill`
  shell ([`components/store/StatusPill.tsx`](components/store/StatusPill.tsx)) under
  StockBadge / OrderStatusBadge / ReturnStatusBadge — **each surface keeps its own
  status vocabulary**, the pill owns only the wrapper + brand tones — and a shared
  `LineItemRow` ([`components/store/LineItemRow.tsx`](components/store/LineItemRow.tsx))
  under the cart line and the order-detail row (the proven-duplicated thumb→PDP +
  name→PDP unit; qty/remove/price stay with each caller). Not abstracted further.
- **Accessibility.** Visible focus rings on every interactive element (a shared
  `.focus-ring` utility in `globals.css`), keyboard-operable mobile menu
  (aria-expanded/-controls, Escape, close-on-tap), gold-on-cream uses `gold-deep`,
  reduced-motion for the shimmer.
- **Brand finish.** A simplified small-mark favicon — the gold monogram-A-in-laurel
  as a vector [`app/icon.svg`](app/icon.svg) (the detailed emblem muddies at ≤32px),
  resolving the DESIGN §5/§8 TODO.

## Scalability rule

A new customer-visible data domain = **one route + one typed data-access function
in `lib/shop/` that reuses `src/shop` + the existing shared components** — never a
rewrite. The tokens + shared component set keep every new surface on-brand for
free.

## Layout

```text
app/                      # App Router pages (server components read via lib/shop)
  layout.tsx              # fonts (Cinzel/Cormorant/Jost) + AppShell (+ cart count)
  page.tsx                # catalogue grid (surface 2)
  products/[id]/page.tsx  # product detail / PDP (surface 3)
  cart/page.tsx           # cart (surface 4) — reads getCart(), mutates via actions
  orders/page.tsx         # order history (surface 5) — reads getOrders(), own-only
  orders/[id]/page.tsx    # order detail / tracking — getOrder(id), neutral 404
  returns/page.tsx        # returns list (surface 6) — reads getReturns(), own-only
  returns/[id]/page.tsx   # return detail — getReturn(id), read-only, neutral 404
  not-found.tsx           # neutral 404 (no id/existence leak)
components/
  shell/                  # AppShell (header/nav/footer + "Shopping as"), Logo
  store/                  # ProductCard, CatalogueBrowser, CartLineItem, Price, …
  ui/                     # shadcn/ui primitives, themed to tokens
lib/
  shop/                   # the server-only src/shop reuse layer + demo identity
    cart-actions.ts       # "use server" audited cart mutations (preview→confirm)
  format.ts               # NT$ + date formatting (DESIGN §3.4)
DESIGN.md, mockups/, tools/   # design-phase artifacts (see DESIGN §appendix)
```

## Scope this app must respect

No checkout / payments / auth / address mutation / staff view. The cart is the
only mutation and must still write the audit log — **shipped in Phase 3** (see
"Cart mutations" above): Add-to-cart, qty update, and remove are live and audited.
Orders (Phase 4) and Returns (Phase 5) are **read-only** own-only views over seeded
fixtures — a return is *requested* through the assistant, never opened or refunded
from the storefront. Adding anything beyond the decided scope requires an
`ARCHITECTURE.md` §5 update first.
