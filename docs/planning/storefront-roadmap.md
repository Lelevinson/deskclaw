# Storefront Roadmap (Planning)

Durable handoff for building the DeskClaw mock storefront. Like [`skill-roadmap.md`](skill-roadmap.md), decisions live **here**, not in chat history — each implementation chat reads this doc + [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) and takes the top open phase.

**Status:** DECIDED (2026-06-02) — scope, stack, and styling chosen in the planning session below. The MVP **skill** backlog is closed ([`skill-roadmap.md`](skill-roadmap.md) §4); the storefront is the one remaining in-scope MVP item. ARCHITECTURE §2/§3/§5/§6 were updated to match this decision. **Build progress (§6):** Phase 1 Design (PR #12), Phase 2 Foundation (PR #14), Phase 3 Cart (PR #16), and Phase 4 Orders (PR #18) are merged; **Phase 5 Returns is next.**

## 1. What this is (and is not)

The storefront is a **companion view** to the conversational agent, not a replacement for it. DeskClaw is a *conversational* commerce prototype; the store makes the same shared shop state visible and lightly interactive in a browser, on the same backend the skills already use.

- **It IS:** an e-commerce-grade web UI to browse the catalog, manage a cart, and view the linked customer's orders and returns — running on the **existing `src/shop` backend**, styled to the skincare brand.
- **It is NOT:** a new commerce engine. No checkout, no payments, no money movement, no new business logic that lives only in the web app.

### Decided (2026-06-02 planning session)

| Decision | Choice | Why |
|---|---|---|
| **Scope / interactivity** | Interactive over the real backend, **no checkout** | Feels like a real store (browse → cart → account views) while reusing `src/shop`. Checkout/payments stay deferred (ARCHITECTURE §5) — they are the riskiest mutation and off-mission for a chat-first agent. |
| **Tech stack** | **Next.js + TypeScript** | React framework; server side imports the existing `src/shop` service functions directly (one source of truth), SSR, the de-facto e-commerce default, most scalable. |
| **Styling** | **Tailwind CSS + shadcn/ui + design tokens** | Utility CSS + copy-in, fully-ownable components + a brand token file. Fast, consistent by construction, trivially themeable to the Taiwan skincare brand (NT$). |

## 2. Scope boundary (what stays out)

These remain **deferred** (ARCHITECTURE §5) and must NOT be built into the storefront without updating ARCHITECTURE first:

- **Checkout / cart → paid order / payments.** `orders.json` stays seeded fixtures. The cart is real and mutable; turning a cart into an order is out.
- **Self-service account linking / login / auth.** The demo ships one pre-linked customer; the storefront shops **as that pre-linked demo customer** (see §4 identity). No signup/login UI.
- **Address / shipping-address mutation** (top ATO signal), **subscription management**, **loyalty/points**, **restock alerts**, **proactive/outbound** — all deferred.
- **Staff/ops handoff dashboard.** The "Custom Node.js/React dashboard for human handoff" is a *separate* deferred item (ARCHITECTURE §5). `handoffs` is a staff/ops-only domain (§6) and is **not** part of this customer-facing storefront. If a staff view is ever wanted, it is its own decision and its own surface — do not fold it into the customer store.

## 3. Architecture — how the web app reuses the backend

The single most important rule: **the storefront reuses `src/shop`; it does not reimplement shop logic and does not read the JSON store directly.**

- Next.js **server-side** (server components / route handlers / server actions) imports the same typed service functions in [`../../src/shop/`](../../src/shop/) that the MCP tools wrap. Identity gating, ownership checks, and audit logging are preserved because it is the *same code path*, not a parallel one.
- The browser never touches `data/` or the DB; it calls server actions/handlers that call `src/shop`.
- Reads are identity-gated and own-resources-only exactly as the skills are (orders/returns are the linked customer's own; unknown/non-owned ids refused identically). The UI must not introduce a read that leaks existence or trusts a client-supplied id as proof.
- The runtime store stays the resettable JSON DB (`.local/shop-db.json`, reset via `npm run shop:reset`). The web app and the agent share one store, so a cart change in chat shows up in the store and vice-versa.

**Cart mutations from the UI — RESOLVED (Phase 3, 2026-06-03).** The chat pipeline is identity → preview → explicit confirm → execute → audit, where "confirm" guards against the *model* acting without consent. In a UI the user's click is the consent. **Decision:** the server actions in `web/lib/shop/cart-actions.ts` call the same `src/shop` path the chat tools use — `preview…ForChannel` then `confirmLatest…ForChannel` **back-to-back** — so identity gating, ownership, stock re-validation, and **both audit-log writes** (`*.preview` + success) fire exactly as in chat; the audit log is never dropped. The deliberate click stands in for the chat confirm beat (qty ± needs no dialog); the destructive **remove** gets a lightweight two-step "Remove?" confirm. Full rationale in [`../../web/README.md`](../../web/README.md) "Cart mutations" and DESIGN §5.4/§7.

## 4. Identity in the storefront

The skills resolve identity via `channel + externalUserId → accountLink → customerId`. The storefront has no login (auth is deferred), so it operates as the **pre-linked demo customer**:

- Treat the web session as a fixed channel identity (e.g. a `web-demo` channel + the demo customer's `externalUserId`, or directly the demo `customerId` resolved once on the server) bound to the existing pre-linked demo customer in [`../../data/customers/account-links.json`](../../data/customers/account-links.json).
- Show a clear "Shopping as <demo customer>" indicator so the demo is honest about who the session is.
- Do not build customer switching, signup, or login. If a second demo persona is ever needed, add another seeded account-link, not an auth system.

## 5. Surface inventory → data-domain map

The UI mirrors the data-domain split (same property that makes skills cheap to add). Each surface reads/writes one domain through the reuse layer:

| Surface | Data domain (via `src/shop`) | Interactivity |
|---|---|---|
| Catalog grid + filters | `catalog/products.json` | Read; browse/search/filter |
| Product detail (PDP) | `catalog/products.json` (+ `catalog/compatibility.md` for routine/pairing notes) | Read; "add to cart" |
| Cart | `carts` | Read + **mutate** (add / remove / update qty) — reuses cart service |
| Order history + order detail/tracking | `orders` (names joined from catalog) | Read, own-orders-only |
| Returns list + return detail | `returns` (+ `orders`) | Read, own-returns-only |
| Global shell (header/nav/footer, brand) | — | Layout, design tokens |

Out of scope here: a `handoffs`/ops view (staff-only, §2). Policy/FAQ/compatibility content *may* surface as static info pages sourced from `data/policies/*` + `data/catalog/compatibility.md` if useful, but that is optional polish, not a core surface.

## 6. Phasing — one branch per phase

This is a **multi-branch build**, not one chat (same one-capability-per-branch discipline as the skills). Suggested order:

1. ~~**Design discovery** (`feat/storefront-design`)~~ — **DONE (merged 2026-06-03, PR #12).** Output is [`../../web/DESIGN.md`](../../web/DESIGN.md): brand = **Amelya's**, design tokens, surface→data-domain map, and low-fi wireframes for all 6 surfaces.
2. ~~**Foundation** (`feat/storefront-foundation`)~~ — **DONE (merged 2026-06-03, PR #14).** Scaffolded Next.js + TypeScript + Tailwind + shadcn/ui under `web/`; encoded the DESIGN tokens; wired the **`src/shop` reuse layer** (the seam is `web/lib/shop/`, `import "server-only"`; `@shop/*` alias + Next `extensionAlias` `.js`→`.ts`; data seam via `DESKCLAW_DATA_DIR`/`DESKCLAW_SHOP_DB_PATH` so app + agent share one store; identity pinned to the existing `simulated-chat`/`demo-lin` link — see [`../../web/README.md`](../../web/README.md)); added `listProducts()`/`getProductById()` to `src/shop/service.ts`; built the app shell + shared component set; shipped the **catalogue grid + PDP vertical slice** reading the real catalog. Add-to-cart is rendered but **inert** — cart mutation is Phase 3.
3. ~~**Cart** (`feat/storefront-cart`)~~ — **DONE (2026-06-03, PR pending review).** Cart view (surface 4) + add/remove/update through the reused cart service via `"use server"` actions in `web/lib/shop/cart-actions.ts`. **Resolved the mutation/audit question** (§3, §8): server actions call the chat `preview→confirm` path back-to-back so both audit-log writes fire (audit never dropped); the click is the consent, with a "Remove?" confirm for remove. Header `Cart(n)` is live. Documented in `web/README.md` "Cart mutations" + DESIGN §5.4/§7.
4. ~~**Orders** (`feat/storefront-orders`)~~ — **DONE (merged 2026-06-03, PR #18).** Order history list + order detail/tracking (surface 5), own-orders-only, **read-only** (checkout stays out of scope, §2). `getOrders()`/`getOrder(id)` in `web/lib/shop/index.ts` reuse the chat tools' `listOrdersForChannel`/`getOrderForChannel` — identity gating + ownership are the one real code path; an unknown OR non-owned id returns `null` → neutral not-found (no existence leak, identical refusal). Orders nav is live. The delivered-order "Request a return" CTA stays inert until Phase 5. See `web/README.md` "Orders".
5. **Returns** (`feat/storefront-returns`) — returns list + detail, own-returns-only.
6. **Polish** (`feat/storefront-polish`) — responsive, empty/loading/error states, accessibility pass, brand finish.

Each phase: read this doc + ARCHITECTURE, build the one surface against the shared backend, verify in the browser (and that the shared store reflects changes), `/code-review` before the PR.

## 7. Scalability — why "more utilities later" stays cheap

The storefront scales the same way the skills do: **the UI mirrors the data-domain split.** Adding a future customer-visible domain → add **one route + one typed data-access module that reuses `src/shop` + components from the shared library**, not a rewrite. Design tokens + the shadcn/ui component set keep every new surface on-brand for free. State the rule in `web/`'s README so it survives.

## 8. Open questions for the build chats

- ~~**Cart mutation vs. the preview/confirm pipeline + audit log** (§3)~~ — **RESOLVED in Phase 3 (2026-06-03):** server actions reuse the chat `preview→confirm` path back-to-back; both audit writes fire, audit never dropped; click = consent, "Remove?" confirm for remove. See §3 and `web/README.md` "Cart mutations".
- **Where `web/` lives and how it shares `src/shop`** — same repo, top-level `web/`; decide import path / tsconfig path mapping vs. a small internal package. Keep it a monorepo-simple import if possible.
- **Dev/run wiring** — how the storefront runs in the devcontainer (port, `npm` script), and whether it reuses `npm run shop:reset` for a clean demo state. Add to [`../openclaw/setup.md`](../openclaw/setup.md) when built.
- **Testing** — model-in-the-loop skill eval stays manual; for the UI, decide if a light Playwright smoke (catalog renders, add-to-cart writes the store) is worth it or out of scope for the prototype. Note the decision; don't silently skip.
- **Static content pages** (policies/FAQ/compatibility) — include or defer.

## 9. Rules to respect

- **ARCHITECTURE owns scope.** Anything beyond this decided scope (checkout, auth, address mutation, staff dashboard) requires updating [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) §5 **first**.
- **Reuse `src/shop`; never reimplement shop logic or read the JSON store directly from the web app.**
- **Preserve the safety properties:** identity gating, own-resources-only reads, identical refusal for unknown/non-owned ids, audit logging on mutations.
- **One phase per branch**, verified in the browser, `/code-review` before each PR.
