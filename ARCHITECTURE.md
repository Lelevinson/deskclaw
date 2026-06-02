# DeskClaw Architecture

Single source of truth for **what we're building, what we're not, what's done, and what's planned**. If a scope/stack/status question can be answered, the answer lives in this file or nowhere.

For OpenClaw commands and setup, see [`docs/openclaw/setup.md`](docs/openclaw/setup.md).
For contributor rules and where-to-update guidance, see [`AGENTS.md`](AGENTS.md).

## 1. Product

DeskClaw is a local-first conversational commerce agent prototype for small D2C brands. The prototype must demonstrate:

- **Automated support** — answer policy and FAQ questions from local business documents.
- **Basic product assistance** — search a small local catalog and recommend suitable items.
- **Controlled shop actions** — expose safe local tools for account/cart changes with confirmation and audit logs.
- **Human handoff safety** — detect frustration or sensitive cases and escalate.
- **Scripted evaluation** — validate behavior with policy, product-recommendation, and escalation scenarios.

## 2. Stack

| Layer | Choice |
|---|---|
| Infrastructure | Docker devcontainer (Windows WSL2 / local) |
| Gateway | OpenClaw on `ws://127.0.0.1:18789` |
| Models | Local Ollama (e.g. `gemma3:4b`) **or** `gpt-5.5` via the OpenAI Codex provider — either is acceptable, see [setup.md §6](docs/openclaw/setup.md#6-models) |
| Interface | Simulated chat / OpenClaw TUI (primary); optional WhatsApp via OpenClaw's bundled plugin; plus a mock storefront web UI (planned) |
| Shop tools | Local TypeScript MCP server backed by a resettable JSON database |
| Storefront (planned) | Next.js + TypeScript, Tailwind CSS + shadcn/ui; server-side reuse of `src/shop` over the same JSON store — see [storefront-roadmap.md](docs/planning/storefront-roadmap.md) |

## 3. Status

**Implemented**

- Repo-managed OpenClaw skills under [`skills/`](skills/): `policy-oracle` (shipping / returns / FAQ / warranty / product-care answers, plus product-compatibility and routine-ordering answers from a brand-authored data file — answer-only-from-data, escalating any medical/allergy/reaction/skin-condition question to `sentiment-router`), `search-products`, `sentiment-router` (classifies `continue` / `handoff_recommended` / `urgent_handoff`, and on either handoff signal persists a durable escalation record via `shop_handoff_create`), `cart-actions` (add / remove / change-quantity, all gated by the identity → preview → confirm → audit pipeline), `order-status` (read-only, identity-gated order/tracking lookup), `returns-actions` (identity-gated return/exchange **request** intake via the same preview → confirm → audit pipeline — never auto-issues a refund — plus a read-only refund/return-status check)
- Shared business data under [`data/`](data/): catalog (products + brand-authored product/routine compatibility guidance), policies, routing rules, customers, account links, shop runtime baseline state, seeded orders, seeded returns, and seeded handoff/escalation records
- Shop MCP server under `src/mcp/shop-server.ts` and shared shop logic under `src/shop/`
- **Tool-level eval harness** under `src/cli/shop-eval.ts` (`npm run shop:eval`): deterministic, no-model tests over the `src/shop` service functions, asserting the safety-critical guarantees (identity gating, ownership proof, preview→confirm, expiry, refusals, audit logging) across all three cart action types, plus the read-only order-status reads (identity-gated, own-orders-only, unknown / non-owned order ids refused without leaking existence) and the returns-intake flow (identity-gated; a return can only be opened against a delivered order the resolved customer owns; preview→confirm creates a return *request* — never a refund/money mutation; no double-confirm; own-returns-only status reads), plus the handoff/escalation records (append-only with **optional** identity — a linked sender attaches a `customerId`, an unlinked/revoked sender is still recorded; no preview/confirm; `continue` records nothing; writes an audit log). Run from a per-test `data/` reset; named PASS/FAIL with a non-zero exit on failure.
- Scripted test scenarios under [`skills-lab/scenarios/`](skills-lab/scenarios/)
- Devcontainer + Ollama wiring + Codex provider + repo-skill loading via `skills.load.extraDirs`

**Not implemented**

- Automated evaluation at the **skill/agent (model-in-the-loop) layer** — the `skills-lab/` scenario files still require manual TUI testing (the tool layer is covered by the eval harness above; deferred by [`docs/planning/skill-roadmap.md`](docs/planning/skill-roadmap.md) §5)
- CI, linting, deployment
- Mock e-commerce website UI — **decided and scoped 2026-06-02, not yet built** (the one remaining in-scope MVP item now that the skill backlog is closed). Interactive companion storefront on the existing `src/shop` backend (no checkout), Next.js + Tailwind + shadcn/ui; plan in [`docs/planning/storefront-roadmap.md`](docs/planning/storefront-roadmap.md), scope in §5/§6 below.

**MVP skill backlog complete** — scoped in [`docs/planning/skill-roadmap.md`](docs/planning/skill-roadmap.md) §4; build order: ~~cart-edit~~ (shipped 2026-05-29) → ~~tool-level eval harness~~ (shipped 2026-05-29) → ~~order-status~~ (shipped 2026-06-01) → ~~returns-intake~~ (shipped 2026-06-01) → ~~handoff-ticket~~ (shipped 2026-06-01) → ~~product-compatibility Q&A~~ (shipped 2026-06-02). The `orders`, `returns`, and `handoffs` data domains are in place. All customer skills are built; the only remaining MVP item is the **mock storefront UI** — decided and scoped 2026-06-02 (interactive companion on the existing backend, no checkout), plan in [`docs/planning/storefront-roadmap.md`](docs/planning/storefront-roadmap.md), scope in §5/§6.

## 4. Repository layout

```text
skills/                       # canonical, repo-managed
  cart-actions/
    SKILL.md
  order-status/
    SKILL.md
  returns-actions/
    SKILL.md
  policy-oracle/
    SKILL.md
  search-products/
    SKILL.md
  sentiment-router/
    SKILL.md

src/
  shop/                       # shared local mock shop logic
    README.md                 # shop backend contract
  mcp/shop-server.ts          # safe MCP tool surface for agent actions
  cli/reset-shop-db.ts        # reset local runtime DB from baseline data
  cli/shop-eval.ts            # tool-level eval harness (npm run shop:eval)

data/
  README.md                   # data ownership rules
  templates.md                # commented shape examples for data files
  catalog/products.json       # product facts shared by skills + tools
  catalog/compatibility.md    # brand-authored product/routine compatibility guidance (policy-oracle)
  policies/{faq,product-care,returns,shipping}.md
  routing/escalation-rules.md
  customers/{customers,account-links}.json
  shop/{carts,orders,returns,handoffs,pending-actions,action-logs}.json

skills-lab/                   # evaluation only, not a skill source
  README.md                   # how to run + pass/fail criteria
  scenarios/
    {policy-oracle,product-compatibility,search-products,sentiment-router,cart-actions,order-status,returns-actions}-tests.md
```

This is the tracked repo layout, not generated runtime state. Personal OpenClaw runtime data stays in `/home/node/.openclaw` and is not committed.

## 5. Extension scope

This section owns the boundary of what may be built. The detailed, ordered backlog lives in [`docs/planning/skill-roadmap.md`](docs/planning/skill-roadmap.md) §4; this section records only what is in scope and what is fenced out. Adding anything from the deferred list requires updating this file first.

### In scope

The customer **skills** below were decided in the 2026-05-29 roadmap session and are **all shipped** (the MVP skill backlog is complete). The **storefront UI** is the one remaining in-scope item — decided and scoped 2026-06-02, not yet built. New data domains are noted because they trigger storefront UI work (§6).

- ~~**Cart edits** — remove item / change quantity. Extends `cart-actions`; no new data domain.~~ **Shipped 2026-05-29.**
- ~~**Tool-level evaluation harness** — deterministic tests over `src/shop` service functions (identity gating, preview/confirm, audit).~~ **Shipped 2026-05-29** (`npm run shop:eval`); closed the "Not implemented" eval gap above for the tool layer.
- ~~**Order status lookup** — read-only, identity-gated. Introduces the **`orders`** data domain (the first new *visible* data domain).~~ **Shipped 2026-06-01** (`shop_orders_list_for_channel` / `shop_order_get`, `data/shop/orders.json`); the `orders` domain is now in place.
- ~~**Return / exchange intake + status** — captures a return *request* and hands off the refund/exchange (never auto-issues money), plus a read-only refund/return-status check ("is my refund processed?"). Depends on the `orders` domain; adds a **`returns`** sub-domain.~~ **Shipped 2026-06-01** (`shop_return_preview` / `shop_return_confirm` create a return *request* in the `requested` state only; `shop_returns_list_for_channel` / `shop_return_get` are read-only own-returns-only status checks; new `data/shop/returns.json`). The `returns` sub-domain is now in place.
- ~~**Handoff ticket records** — durable escalation/audit records for `sentiment-router` handoffs.~~ **Shipped 2026-06-01** (`shop_handoff_create` / `shop_handoff_list`, new `data/shop/handoffs.json`). Append-only with **optional** identity (an unlinked/revoked sender can still be escalated; a `customerId` is linked only when resolvable); no preview/confirm; `continue` records nothing; writes an audit log. The `handoffs` domain is **staff/ops-only**, not customer-visible (see §6), so it adds no storefront UI obligation.
- ~~**Product / ingredient-compatibility Q&A** — extends `policy-oracle` from a brand-authored compatibility data file; answer-only-from-data, escalate reaction/medical language.~~ **Shipped 2026-06-02** (new `data/catalog/compatibility.md`, no tools). `policy-oracle` answers "can I use X with Y?" / "what order do I apply these?" only from that file, refuses products DeskClaw does not sell, and escalates any medical/allergy/reaction/pregnancy/skin-condition question to `sentiment-router` (`urgent_handoff`) rather than answering it. This **closes the MVP skill backlog** — only the storefront UI remains.

- **Mock storefront web UI** — **decided 2026-06-02, not yet built; the next build.** An interactive companion storefront (browse catalog → manage cart → view own orders/returns) that **reuses the existing `src/shop` backend server-side** — no checkout, no payments, no new business logic in the web app. Stack: Next.js + TypeScript, Tailwind + shadcn/ui. It is a customer-facing view over shared shop state, **distinct from** the still-deferred staff "Custom Node.js/React dashboard for human handoff" below (the `handoffs` domain is staff/ops-only, §6). Full plan, phasing, and the reuse-layer contract in [`docs/planning/storefront-roadmap.md`](docs/planning/storefront-roadmap.md).

### Deferred (out of scope)

Explicitly **not** part of the prototype.

- Real WhatsApp / Instagram / Gmail integrations
- Deep-link or QR onboarding flows
- Dynamic discount / promo-code negotiation
- Custom Node.js/React dashboard for human handoff
- Appointment-booking skills
- **Autonomous cancellations or refunds** — the agent may intake and hand off; it must never issue a refund or cancel a paid order itself (research-refuted as an autonomous action).
- **Customer-initiated address / shipping-address mutation** — top account-takeover signal; route to handoff. Revisit only with stronger step-up verification.
- **Subscription management** — recurring-order domain; cancel sits in the autonomous-mutation no-go zone.
- **Restock / back-in-stock alerts** — requires an async outbound notification channel we do not have.
- **Checkout (cart → paid order)** — no payment exists in the local mock and it is the riskiest mutation. Consequence: `data/shop/orders.json` is **seeded fixture data**, not agent-created; `order-status` and `returns-actions` read pre-existing orders.
- **Self-service account linking** — creating/repairing an account link from chat is deferred with the deep-link/QR onboarding above. The demo ships one pre-linked customer; unlinked senders are asked to verify, not linked in-flow.
- **Loyalty / points / gift balance** — not in the data model and flagged as cash-equivalent high-risk; out of scope.
- **Proactive / outbound messaging** (post-purchase check-ins, review requests, abandoned-cart nudges) — requires an async outbound channel we do not have; same blocker as restock alerts.

## 6. Resolved decisions

- **Catalog format:** JSON. Simple, inspectable, sufficient for the MVP. Revisit if querying becomes a bottleneck.
- **Skill/tool split:** Customer-facing behaviors live as skills under `skills/`. Reusable typed operations, such as account identity lookup or cart mutation, live as inner tools under `src/`. Shared facts and local runtime baseline data live under `data/`.
- **Shop writes:** The agent must use typed MCP tools, not raw database access. Mutating actions require a linked channel identity, preview, explicit customer confirmation, execution, and audit logging.
- **Shared data ownership:** Product, policy, routing, customer, account-link, and shop state facts live under `data/`. Skills point to these files instead of copying them.
- **Escalation signals:** Defined in `data/routing/escalation-rules.md`. `handoff_recommended` = frustration, repeated failures, explicit human request. `urgent_handoff` = safety, legal, chargeback, social media threats. `sentiment-router` records a durable escalation against these signals via `shop_handoff_create` (it does not redefine the taxonomy); the record carries the `classification` verbatim.
- **Handoffs are a staff/ops-only data domain:** The `handoffs` domain is an internal triage/audit artifact, not something a customer queries about themselves. `shop_handoff_list` is therefore an ops read (optional `customerId` filter, like `shop_action_log_list`), not an identity-gated own-only customer read. Consequently `handoffs` does **not** count as a new *customer-visible* data domain, so — unlike `orders` and `returns` — it triggers no storefront UI work under "Skill ↔ UI integration order" below.
- **Demo interface:** OpenClaw TUI is the primary demo/testing channel. OpenClaw's **bundled WhatsApp plugin** can additionally connect a real WhatsApp number to the gateway for demos (operational steps and gotchas in [`docs/openclaw/setup.md`](docs/openclaw/setup.md) §8) — that is a channel/config step OpenClaw supports natively, **distinct from** the deferred *building our own WhatsApp / Instagram / Gmail integration* in §5. We **do** build a customer-facing mock storefront web UI (decided 2026-06-02; see "Skill ↔ UI integration order" below and [`docs/planning/storefront-roadmap.md`](docs/planning/storefront-roadmap.md)), but **not** a custom staff/ops handoff dashboard and **not** our own messaging-API integration for the first prototype. To exercise the identity-gated skills over WhatsApp, the sender's WhatsApp phone number is bound as the `externalUserId` on an `account-links` row (see setup.md §8); the identity-free skills (`policy-oracle`, `search-products`, `sentiment-router`) need no such wiring.
- **Demo brand:** Intentionally a Taiwan-based skincare brand (NT$ pricing, skincare catalog). This is the course project's chosen domain, not a placeholder.
- **Skill ↔ UI integration order:** Build customer skills against the shared shop backend and `data/` first, and test them in the TUI (one feature branch per customer capability, spanning whatever skill/tool/data layers it needs). The mock storefront comes later as one **interactive** web UI over the same shop state (catalog, carts, orders, returns) — wired to the shared backend, not to individual skills. Decided 2026-06-02: it is interactive (browse → manage cart → view own orders/returns) and **reuses the `src/shop` service layer server-side rather than reimplementing shop logic or reading the JSON store directly**; it adds **no checkout/payments** (those stay deferred, §5). A new skill needs new UI work only when it introduces a new **visible data domain** (for example orders or returns), not once per skill — so the storefront scales the same way the skills do (add a route + a typed reuse module, not a rewrite). Full plan and the reuse-layer contract: [`docs/planning/storefront-roadmap.md`](docs/planning/storefront-roadmap.md).
- **Scaling unit:** The three-layer split (customer skill → inner tool → shared data, see [`skills/README.md`](skills/README.md)) plus the typed MCP boundary is what makes added skills cheap. The first expected limits are operational, not structural: manual TUI testing (mitigated by the not-yet-built eval harness in §3) and the whole-file JSON store. Address those before skill count grows; do not restructure the layers preemptively.

## 7. Source-of-truth order

If two files disagree:

1. `ARCHITECTURE.md` (this file) wins for scope, stack, and status
2. `docs/openclaw/setup.md` wins for OpenClaw commands and operational fixes
3. `data/` wins for shared business facts and local runtime baseline data
4. The actual skill files under `skills/` win for skill behavior
5. `AGENTS.md` wins for contributor rules
6. `docs/archive/PROPOSAL.md` is historical only — never authoritative
