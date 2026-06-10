# Amelya's Storefront — Design (Phase 1)

Design discovery for the DeskClaw mock storefront. This is the durable output of
**Phase 1** in [`../docs/planning/storefront-roadmap.md`](../docs/planning/storefront-roadmap.md) §6 — the
build phases (Foundation → Cart → Orders → Returns → Polish) consume this file
for the brand, tokens, surfaces, and wireframes. No app code is scaffolded yet.

> **Naming:** **DeskClaw** is the agentic customer-service *platform/architecture*.
> **Amelya's** is the *demo skincare brand* the storefront presents. The store is
> branded Amelya's; DeskClaw is the system behind it. This is presentation only —
> it changes no architecture scope.

## 0. What this storefront is

A **companion view** to the conversational agent — not a commerce engine. It runs
on the existing [`../src/shop`](../src/shop) backend (server-side reuse), shows the same shared
shop state in a browser, and is lightly interactive: **browse catalogue → build a
cart → place a mock order → view your own orders & returns.** **Real login + signup
and a mock checkout (cart → unpaid order) shipped 2026-06-09; no real payment** (see roadmap §1–2, ARCHITECTURE §5). A logged-in
customer's session drives identity (a `web`-channel account-link); browsing is
public, account surfaces require a session. Reads are own-resources-only, and cart
mutations reuse the same `src/shop` path (audit/confirm question resolved in Phase 2, roadmap §3).

---

## 1. Brand identity — Amelya's

A premium **Taiwan skincare** brand with a **Greek-heritage apothecary** feel:
classical, calm, gentle, honest. Gold engraving on cream paper; quiet luxury, not
clinical, not "dermatology"/medical (the product deliberately refuses medical
claims — the brand must not imply them either).

**Logo.** Emblem (a classical goddess medallion in a laurel wreath, gold line
engraving) + the **AMELYA'S** wordmark in Cinzel. **No tagline.**

- Emblem master (transparent, trimmed): [`mockups/refs/amelya-emblem-trans.png`](mockups/refs/amelya-emblem-trans.png)
- Emblem web (600px, transparent): [`mockups/refs/amelya-emblem-web.png`](mockups/refs/amelya-emblem-web.png) — use this in the app
- Source/originals (for regeneration): the two ChatGPT generations + the two style refs in [`mockups/refs/`](mockups/refs/)

**Logo usage**
- Primary lockup: emblem above/left of **AMELYA'S** (Cinzel 600, tracking `.16em`).
- Works on cream (primary), charcoal, and deep sage (the engraving glows on dark).
- Clear space ≥ the cap-height of the wordmark on all sides.
- **Favicon / ≤32px — TODO (Phase 2):** the full emblem muddies when tiny. Build a
  simplified small mark — a gold monogram **A** (Cinzel) inside the laurel ring, or
  the laurel medallion alone. Don't ship the detailed emblem as a 16/32px favicon.
- Asset hygiene (Phase 2): `amelya-emblem-web.png` is ~835KB — re-export a properly
  compressed PNG/SVG + a generated favicon set before production use.

**Brand voice (for UI copy):** calm, plain, reassuring. "Skincare, simply."
Honest about the demo (a mock checkout — no payment is taken). Never medical/curative claims.

---

## 2. Design language & reference

- **Reference vibe:** Aēsop / vintage apothecary / classical engraving — see the
  two style refs the owner chose in [`mockups/refs/`](mockups/refs/) (an ornate
  goddess crest and a minimalist arch profile). We took the *ornate engraved
  emblem* direction, made original as Amelya's.
- **Motifs:** laurel, circular medallion, **arches** (echo the emblem), an optional
  Greek-key (meander) hairline divider, small floral glyphs (❦ ❧) as quiet accents.
  Use sparingly — one ornament per view, not everywhere.
- **Visual north-star:** [`mockups/catalog-amelya.html`](mockups/catalog-amelya.html) — the catalogue rendered
  in-brand with the real products and these tokens. Every surface should feel like
  it belongs next to this page.
- **Feel:** generous whitespace, cream paper, hairline borders, low elevation
  (premium = flatter; rely on layering + borders, not heavy shadows). Serif for
  voice, sans for controls.

---

## 3. Design tokens (concrete values)

Tailwind-/shadcn-ready. In Phase 2 these become CSS variables + `tailwind.config`
theme extensions; shadcn components are themed to them.

### 3.1 Color

| Token | Hex | Use |
|---|---|---|
| `gold` | `#a9824b` | primary brand gold — buttons, accents, prices emphasis |
| `gold-deep` | `#8a6a3a` | gold text on cream (contrast-safe), category eyebrows |
| `gold-light` | `#c7a268` | gold on dark backgrounds, hover |
| `ink` | `#2b2723` | primary text, dark surfaces |
| `ink-muted` | `#6f685c` | secondary text, descriptions |
| `cream` | `#f5f0e4` | page background (primary) |
| `cream-soft` | `#faf7ef` | header / raised light surface |
| `panel` | `#fbf8f1` | cards |
| `line` | `#e3dccb` | hairline borders, dividers |
| `sage` | `#3d4a38` | footer, accent bands, "shopping as" bar |
| `sage-deep` | `#2f3a2b` | sage hover/pressed |
| `blush` | `#ecd9d2` | soft accent (sparingly — e.g. gift/sale chips) |

**Semantic / stock state**

| State | Background | Text | Notes |
|---|---|---|---|
| In stock | — | — | no badge (default) |
| Low stock | `#f3e3c2` | `#8a5a00` | pill badge "Low stock" |
| Sold out | `#e6e1d6` | `#6f685c` | pill badge "Sold out"; Add-to-cart disabled |
| Success | `#4b7a52` | `#fff` | confirmations |
| Danger | `#9c4a3c` | `#fff` | errors, destructive confirm |

Contrast: body text `ink` on `cream` ≈ AAA; never put `gold` on `cream` for long
text (use `gold-deep`).

### 3.2 Typography

| Role | Family | Notes |
|---|---|---|
| Display / headings / logo | **Cinzel** (serif, inscriptional caps) | hero, section titles, wordmark; ALL-CAPS, tracking `.04–.16em`; use sparingly |
| Product names / editorial body | **Cormorant Garamond** (serif) | product titles, descriptions, footer prose — the elegant "voice" |
| UI / controls / labels | **Jost** (humanist sans) | nav, buttons, prices, badges, form labels, captions |

Source: Google Fonts (swap to self-hosted in Phase 2 for perf/offline).

**Type scale** (base 16px / 1rem)

| Token | Size | Typical use |
|---|---|---|
| `xs` | 0.75rem / 12px | eyebrows, badges, captions (letter-spaced caps) |
| `sm` | 0.875rem / 14px | UI text, nav |
| `base` | 1rem / 16px | body / prices |
| `lg` | 1.125rem / 18px | lead paragraphs |
| `xl` | 1.375rem / 22px | product name |
| `2xl` | 1.75rem / 28px | section title |
| `3xl` | 2.5rem / 40px | page hero |
| `4xl` | 3.25rem / 52px | display hero (rare) |

Weights: Cinzel 400/500/600 · Cormorant 400/500/600 · Jost 300/400/500.
Line-height: body 1.6 · serif headings 1.15 · product name 1.15.
Tracking: caps eyebrows `.2em–.34em` · Cinzel headings `.04–.16em` · body normal.

### 3.3 Space, radius, elevation, layout

- **Spacing scale** (4px base — Tailwind default): 4, 8, 12, 16, 20, 24, 32, 40,
  48, 64, 80, 96.
- **Radius:** `sm` 4px · `md` 8px (cards) · `lg` 12px (panels) · `pill` 9999px
  (buttons, badges, filter tabs). Brand leans low-radius/editorial.
- **Elevation (subtle):** `sm` `0 1px 2px rgba(43,39,35,.06)` · `md`
  `0 6px 22px rgba(43,39,35,.07)`. Prefer hairline `line` borders over shadows.
- **Borders:** 1px `line` hairlines everywhere.
- **Layout:** max content width **1200px**, gutters 28px. Catalogue grid **4 cols**
  desktop / **2** ≤980px / **1–2** mobile, gap 26px. Product thumb aspect **4:5**.
- **Icons:** thin-line (e.g. Lucide), 1.5px stroke, `ink` or `gold`.

### 3.4 Formatting

- **Currency (NT$):** prefix `NT$`, comma thousands, **no decimals** →
  `NT$420`, `NT$1,000`. Source of truth is `priceNtd` in
  [`../data/catalog/products.json`](../data/catalog/products.json) (`currency: "NTD"`).
- **Dates:** `3 Jun 2026` (day month year).
- **Quantities:** `×1`, `×2`.

---

## 4. Surface inventory → data-domain map

Mirrors roadmap §5. Each surface reads/writes **one** data domain through the
`src/shop` reuse layer. Reads are identity-gated, own-resources-only; the only
mutations are cart edits.

| # | Surface | Data domain (via `src/shop`) | Interactivity | Identity |
|---|---|---|---|---|
| 1 | **App shell** (header/nav/footer, "Shopping as") | — | layout, tokens | shows demo customer |
| 2 | **Catalogue grid + filters** | `catalog/products.json` | read · browse / filter / search | public |
| 3 | **Product detail (PDP)** | `products.json` (+ `catalog/compatibility.md` for routine notes) | read · **add to cart** | public read |
| 4 | **Cart** | `carts` | read · **mutate** (add / remove / update qty) | own cart (demo customer) |
| 5 | **Orders** (history + detail/tracking) | `orders` (names joined from catalog) | read | **own-orders-only** |
| 6 | **Returns** (list + detail) | `returns` (+ `orders`) | read | **own-returns-only** |
| 7 | **Login / Register** | `credentials` (+ `accountLinks`) | write · sign in / sign up | public |
| 8 | **Account** (profile + accountCode + sign out) | `customers` / `accountLinks` | read · sign out | **own profile only** |
| 9 | **Routines** (build-your-routine) | `catalog/products.json` + `catalog/compatibility.md` (via `getRoutineGuide`) | read · pick products → AM/PM plan | public |
| 10 | **Admin / staff panel** (`/admin` — dashboard + handoffs / orders / stock) | `handoffs` · `orders` · `products` (ops-wide reads + staff-mutation fns) | read · **staff-mutate** (resolve handoff / advance order / restock) | **admin role only** |

**Auth shipped 2026-06-09** (was out of scope): real per-user login + signup
(scrypt-hashed `credentials`, an HMAC session cookie, a `web`-channel account-link).
A logged-in user resolves through the same `resolveLinkedCustomer` path as chat.
Browsing (surfaces 2–3) is public; the account surfaces (4–6, 8) require a session.

**Mock checkout shipped 2026-06-09** (surface 4 now also WRITES `orders`): the cart
Checkout button creates an unpaid `placed` order, decrements stock, clears the cart.
**Still out of scope here:** real payment/charging, password reset / email / OAuth,
address mutation.

**Admin / staff panel shipped 2026-06-10** (surface 10, was out of scope): an
**admin-role** login + an `/admin` area that works the queues the agent surfaces but
never acts on — resolve handoffs (status + note), advance orders (status + tracking),
restock products. Built on the existing auth: an optional `Credential.role` (`"admin"`),
a `requireAdmin()` gate run once in `web/app/admin/layout.tsx` (+ `/admin` in the
middleware matcher), and the header "Admin" link shown only for an admin session.
Reads are **ops-wide** (every customer's records, not own-only — the staff counterpart
of the customer reads); the writes are **direct, audited staff mutations**
(`resolveHandoffStatus` / `advanceOrderStatus` / `adjustProductStock` in `src/shop`),
**not** the customer `preview→confirm` path — the admin is the human authority. **No
money moves**: no refund/charge, and order *cancellation* is not an admin action here.
Seeded admin login: **`admin` / `amelya-admin`** (demo-grade). Mirrors the proactive
ops-digest email — the digest tells the owner what to fix, the panel is where they fix it.
**Routines builder shipped 2026-06-09** (surface 9, promoted from "optional polish"):
an interactive but **deterministic, faithful** page — the customer picks the products
they have, and it arranges them into the brand's stated AM/PM order and surfaces only
the cautions/pairings written in [`../data/catalog/compatibility.md`](../data/catalog/compatibility.md)
(the same source the chat `policy-oracle` skill uses). **No personalized or medical
advice, nothing inferred**; sets/accessories are excluded; the curated rules live in
`src/shop/routine-rules.ts` (mirrors compatibility.md — keep in sync). Read-only brand
content, public, no new data domain. **Optional, still not built:** static policy
pages from `data/policies/*`.

---

## 5. Low-fi wireframes

ASCII; brand styling per §2–3. Real product imagery is TBD — placeholders shown.

### 5.1 App shell (every page)

Auth shipped 2026-06-09: the old "Shopping as …" sage bar is **removed**. Identity
now lives in the header as an account control — a person icon + the name linking to
`/account` when signed in, or **Sign in** when not. The "private to you"
reassurance moved onto the Account page (§5.8). Below `md` the control collapses
into the hamburger menu.
```
┌──────────────────────────────────────────────────────────────────────┐
│ (emblem) AMELYA'S     Shop  Routines  Orders  Returns  Cart(2) │ 𝅼 ◐ Mei │ ← header (◐ = account icon; "Sign in" when logged out)
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                          « page content »                              │
│                                                                        │
├──────────────────────────────────────────────────────────────────────┤
│  AMELYA'S                                Mock checkout · no payment ·   │ ← sage footer
│  A companion to the assistant…              prices in NT$ · shared backend│
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 Catalogue grid (surface 2) — see live: mockups/catalog-amelya.html
```
                      NATURAL SKINCARE · TAIPEI
                         Skincare, simply.
        Gentle, fragrance-free essentials for an easy daily routine.

   ( All ) Cleanser  Moisturizer  Sunscreen  Toner  Sets  Accessories     ← pill filters

   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │  [image] │   │  [image] │   │  [image] │   │ [image]  │
   │          │   │          │   │          │   │ LOW STOCK│
   ├──────────┤   ├──────────┤   ├──────────┤   ├──────────┤
   │ CLEANSER │   │MOISTURIZER│  │MOISTURIZER│  │   SET    │
   │ Cloud    │   │ Clear Day │   │ Calm     │   │ Travel   │
   │ Cleanser │   │ Gel       │   │ Barrier  │   │ Mini Trio│
   │ NT$420   │   │ NT$560    │   │ NT$680   │   │ NT$720   │
   │ [Add to ⌄]│  │ [Add to ⌄]│  │ [Add to ⌄]│  │ [Add to ⌄]│
   └──────────┘   └──────────┘   └──────────┘   └──────────┘
   … 4-col grid, 9 products; "Sold out" card disables Add (Night Repair Oil)
```

### 5.3 Product detail / PDP (surface 3)
```
Shop / Cleanser / Cloud Cleanser                                   ← breadcrumb
┌────────────────────┐   CLEANSER
│                    │   Cloud Cleanser
│      [image]       │   NT$420            · In stock
│                    │   A gentle fragrance-free daily cleanser for simple routines.
│                    │
│                    │   Best for: first cleanser · gentle daily cleansing · dry/sensitive skin
└────────────────────┘   ─────────────────────────────────────────
                         Qty [ − 1 + ]     [   Add to cart   ]
                         ─────────────────────────────────────────
                         ❦ Routine & pairing  (from compatibility guide)
                         • First step, AM & PM
                         • Gentle enough to use before any other product
                         ─────────────────────────────────────────
                         Tags: fragrance-free · dry-skin · sensitive-skin
```
- Routine/pairing block renders **only from `compatibility.md`** facts for that
  product; no invented pairings. Medical/reaction questions are not answered here.
- Sold-out PDP: price shows "Sold out", Add disabled, no qty stepper.

### 5.4 Cart (surface 4)
```
Your Cart · 2 items
┌──────────────────────────────────────────────────────────────┐
│ [img]  Cloud Cleanser              NT$420   [ − 1 + ]  ✕ remove│
│ [img]  Sunny Shield SPF50          NT$520   [ − 1 + ]  ✕ remove│
├──────────────────────────────────────────────────────────────┤
│                                   Subtotal           NT$940    │
│                                   [      Checkout      ]        │
│                                   No payment is taken in this demo
│                                   [  Continue shopping  ]       │
└──────────────────────────────────────────────────────────────┘
Empty state:  "Your cart is empty.  ❧  Browse the catalogue →"
```
- Quantity / remove call the **reused cart service**. **Resolved (Phase 3):** the
  click *is* the consent — the server action reuses the chat `preview→confirm` path
  so the mutation **always writes the audit log** (no model intermediary to guard
  against). Qty ± needs no extra dialog; the destructive **remove** uses a
  lightweight two-step "Remove?" confirm. Full rationale in
  [`README.md`](README.md) "Cart mutations".
- **Checkout CTA (shipped 2026-06-09, mock — ARCHITECTURE §5):** the primary
  **Checkout** button turns the cart into a `placed` order via the same audited
  preview→confirm path (the click is the consent), then redirects to the new order.
  **No payment, no card, no address** — orders are created unpaid; stock decrements
  and the cart clears. Disabled/absent when the cart is empty.

### 5.5 Orders — list + detail (surface 5, own-orders-only)
```
Your Orders
┌──────────────────────────────────────────────────────────────┐
│ #1024 · 3 Jun 2026  · Delivered     NT$1,100        View →     │
│ #1019 · 21 May 2026 · Shipped       NT$680          View →     │
└──────────────────────────────────────────────────────────────┘

Order #1024 · Delivered
┌──────────────────────────────────────────────────────────────┐
│ Placed 3 Jun 2026 · Tracking TW123456789                      │
│ [img] Cloud Cleanser        ×1            NT$420              │
│ [img] Calm Barrier Cream    ×1            NT$680              │
│ ──────────────────────────────────────                       │
│ Total                                     NT$1,100           │
│ [ Request a return ]   → opens Returns intake                │
└──────────────────────────────────────────────────────────────┘
Empty: "No orders yet."   Unknown/non-owned id → same "not found" as the skills.
```

### 5.6 Returns — list + detail (surface 6, own-returns-only)
```
Your Returns
┌──────────────────────────────────────────────────────────────┐
│ RET-204 · for Order #1024 · Requested            View →       │
│ RET-198 · for Order #1011 · Refunded             View →       │
└──────────────────────────────────────────────────────────────┘

Return RET-204 · Requested
┌──────────────────────────────────────────────────────────────┐
│ Order #1024 · opened 3 Jun 2026                               │
│ Item: Calm Barrier Cream ×1                                   │
│ Reason: changed mind                                          │
│ Status: Requested — our team will follow up. (No auto-refund.)│
└──────────────────────────────────────────────────────────────┘
```
- Returns are **requests only** — never an auto-refund/money mutation (mirrors
  `returns-actions`). A return opens only against a delivered, owned order.

### 5.7 Shared states (all surfaces)
- **Loading:** cream skeleton blocks with a faint gold shimmer.
- **Empty:** one line + a quiet ❧ glyph + a single CTA back to the catalogue.
- **Error / not-found:** neutral message; **never leak existence** of non-owned ids
  (identical refusal to the skills). No raw stack/ids.

### 5.8 Routines — build-your-routine (surface 9, public)
```
BUILD YOUR ROUTINE
General morning & evening guidance for Amelya's products — pick what you have.

Your products:  [✓ Cloud Cleanser] [Soft Reset Toner] [✓ Clear Day Gel] …  ← gold pill toggles

┌─ Morning ───────────────┐   ┌─ Evening ───────────────┐
│ 1  Cloud Cleanser        │   │ 1  Cloud Cleanser        │
│    Cleanser              │   │    Cleanser              │
│ 2  Clear Day Gel         │   │ 2  Calm Barrier Cream    │
│    Moisturizer           │   │    Moisturizer           │
│ 3  Sunny Shield SPF50    │   │ 3  Night Repair Oil      │
│    Sunscreen · last step │   │    Facial oil · last step│
└──────────────────────────┘   └──────────────────────────┘

Good to know: gel AM / cream PM …      Take care: toner + oil — alternate nights …
— General guidance, not personalized/medical advice; escalate the rest to a human. —
```
Deterministic + faithful to `compatibility.md`: only stated AM/PM order, pairings, and
cautions; product names link to their PDPs; sets/accessories never offered; empty state
prompts a selection. Curated rules in `src/shop/routine-rules.ts` (keep in sync).

---

## 6. Shared component set (for scalability)

A small themed library (shadcn/ui + brand tokens) so new surfaces stay on-brand
for free (roadmap §7). Build in Phase 2 Foundation:

`AppShell` (header/nav/footer + "Shopping as") · `Logo` (emblem+wordmark, + small
mark) · `Button` (gold pill: primary/outline/disabled) · `Badge` (stock states) ·
`Price` (NT$ formatter) · `ProductCard` · `Filters` (pill tabs) · `QtyStepper` ·
`LineItem` (cart/order row) · `Section`/`PageHero` (Cinzel) · `EmptyState` ·
`Skeleton` · `DataList` (orders/returns rows).

**Scalability rule (state in `web/`'s README):** a new customer-visible data
domain = **one route + one typed data-access module reusing `src/shop` + existing
components** — never a rewrite. Tokens + component set keep it on-brand.

---

## 7. Reuse & safety reminders (carried into build phases)

- **Reuse `src/shop` server-side; never read `data/` or the JSON store directly
  from the browser.** (roadmap §3)
- Reads identity-gated, **own-resources-only**; unknown/non-owned ids refused
  **identically** (no existence leak).
- Cart is the only mutation; it **must still write the audit log**. **Resolved
  (Phase 3, see `README.md` "Cart mutations"):** the server action reuses the chat
  `preview→confirm` path back-to-back, so both audit-log writes fire and the audit
  is never dropped; the user's click is the consent, with a "Remove?" confirm for
  the destructive remove (roadmap §3, §8).
- **Login + signup AND a mock checkout shipped 2026-06-09** (scrypt `credentials`,
  HMAC session cookie, `web` account-link; checkout = cart → unpaid `placed` order
  via the same audited preview→confirm path; ARCHITECTURE §5). Shop mutations are now
  cart edits **+ checkout** (writes `orders`, decrements stock, clears cart); account
  writes are register/login/logout. **Still no real payment/charging, password-reset /
  OAuth / address mutation / staff view.** Adding any requires updating
  [`../ARCHITECTURE.md`](../ARCHITECTURE.md) §5 first.

---

## 8. Open questions handed to Phase 2

- Favicon/small-mark: monogram **A**-in-laurel vs laurel medallion (build + test).
- Real product imagery vs styled placeholders (the mockup uses gold glyph tiles).
- Self-host fonts + generate optimized emblem/favicon assets.
- Include the optional static "Routines"/compatibility + policy pages, or defer.
- Confirm `web/` import path to `src/shop` (tsconfig paths vs internal package) and
  the cart audit/confirm affordance — both flagged in roadmap §3/§8.

---

## Appendix — design-phase artifacts (throwaway, not the app)

Kept under [`mockups/`](mockups/) for reference; **not** shipped code:
- `catalog-amelya.html` — visual north-star (this brand, real products).
- `amelya-brand.html` — logo lockups on cream/charcoal/sage + favicon-size test.
- `refs/` — the two owner style refs, the two ChatGPT emblem generations, and the
  processed emblem (`-trans` / `-web`).
- [`tools/`](tools/) — Puppeteer screenshot helper (`shoot.mjs`) used to self-review
  these mockups. Installed in the **devcontainer** only (not the host). Safe to
  delete; consider gitignoring `tools/node_modules`.
