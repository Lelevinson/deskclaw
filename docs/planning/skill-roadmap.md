# Skill Roadmap (Planning)

Working doc for deciding which DeskClaw skills to build next, in what order, and what each needs. This is the durable handoff between the research/brainstorm session and the implementation sessions — planning chats don't share memory, so decisions live **here**, not in chat history.

**Status:** DECIDED (2026-05-29) — research run, futures table reviewed, backlog scoped. §4 is the committed plan; ARCHITECTURE §5 and the `skills/README.md` futures table were updated to match. Implementation sessions take the top open item.

## 1. Grounded truth (what exists today)

Implemented and tested skills (see [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) §3):

- `cart-actions` — add to cart, identity-gated, with preview → confirm → audit
- `policy-oracle` — shipping / returns / FAQ / warranty / product-care answers
- `search-products` — catalog recommendations
- `sentiment-router` — `continue` / `handoff_recommended` / `urgent_handoff`

Backend: the shop MCP (`shop_*` tools) over a local JSON store, reset from `data/`. The reusable pipeline is identity (account link) → preview → explicit confirm → execute → audit log.

## 2. Unverified input — review, don't trust

The "Possible Future Utilities" table in [`../../skills/README.md`](../../skills/README.md) was drafted by a previous AI and has **not** been validated. Treat it as raw input to challenge, not a plan:

- remove / update cart item
- order status lookup
- return request intake
- address / shipping preference update
- human handoff ticket creation
- mock storefront demo (UI, not a skill)

Apply to each: Is it real demand for a small D2C skincare brand? Does it reuse the existing identity → preview → confirm → audit pipeline? What new data domain does it require? Does it change scope ([`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) §5)?

## 3. Research questions (for the brainstorm session)

Run the `deep-research` skill with something like:

> What customer-service actions does a conversational commerce / support agent for a small D2C skincare brand typically handle? Which are table-stakes vs nice-to-have, and what are the common safety and identity pitfalls for cart, order, and account actions?

Then use the findings to:

- confirm or cut each item in §2
- surface anything missing (e.g. product Q&A, restock alerts, order tracking, subscriptions)
- map each survivor onto the skill / inner-tool / data layers

### Findings (deep-research, 2026-05-29)

Ran `deep-research` (6 angles, 25 sources, 25 claims verified, 21 confirmed / 4 killed). Full report in the session task output; the load-bearing points:

**What customers actually ask for, ranked.**

- **Table-stakes (high confidence):** order status / tracking — "where's my order?" is the single highest-volume post-purchase query (~20–40% of contacts); returns / exchanges; product & ingredient-compatibility Q&A ("can I use this serum with retinol?" — called out as the canonical *skincare* example); subscription management (skip / pause / swap / cancel); gated address changes.
- **Nice-to-have (medium, 2-1 vote):** live inventory / restock checks; discount / promo issuance (usually code-validation gated by integration, not autonomous issuance).
- **Explicitly refuted — do not build:** autonomous cancellations and refunds (0-3 ✗). The agent may *intake* a refund/cancel and hand off; it must not auto-issue one. "Covers most requests day one" was also refuted (1-2).

**Safety spine (high confidence).**

- Customer-typed identifiers are weak proof: order numbers are short / sequential / guessable, and email-binding only resists enumeration — it is *not* strong identity proof against targeted account-takeover.
- Exposing tracking PII (carrier, ZIP, recipient name) without a gate enables social engineering, porch piracy, and chargeback fraud.
- **Account takeover (ATO) is the central fraud vector** — it rides on a legitimate-looking, already-authenticated account, so an authenticated session cannot be assumed honest.
- **Mutating actions are the highest-risk operations** (address change, stored-card reuse, refunds, loyalty/gift redemptions); they need step-up verification, explicit confirmation, audit, and often human review. Address changes are a top ATO signal.
- Human handoff is essential, not optional, for complex / high-stakes / emotional / edge cases — and the company, not the chatbot, is legally accountable for what the agent says or does (Moffatt v. Air Canada, 2024).

**DeskClaw-specific reframe (why this is good news for us).** The research's headline pitfall — "the customer-supplied order number / email is guessable and low-assurance" — is one DeskClaw *already designs out*. Identity is never a customer-typed value; it is the channel binding `channel + externalUserId → accountLink → customerId` ([`../../src/shop/service.ts`](../../src/shop/service.ts) `resolveLinkedCustomer`), and `cart-actions` already refuses a typed customer id as proof. So a read keyed on the resolved `customerId` (e.g. order status) is **safe by construction**: we expose only what the linked identity owns and never trust an identifier the sender chose. The existing identity → preview → confirm → audit pipeline is exactly the "step-up + confirm + audit for mutations" the sources demand; our gap is breadth (one mutation type, no orders), not the safety model.

## 4. Deliverable — prioritized backlog (DECIDED)

### Verdict on the §2 table

| §2 item | Verdict | Why |
|---|---|---|
| Remove / update cart item | **BUILD — first** | Cheapest possible win. Same `carts` domain, same identity gate, same preview→confirm→audit pipeline; only new `PendingAction` types. `cart-actions/SKILL.md` already names it as the next extension. Proves the pipeline generalizes to new mutation types and de-risks every later mutation. |
| Order status lookup | **BUILD — keystone** | The #1 real customer query (WISMO). Read-only and safe by construction under our channel binding. Introduces the `orders` data domain, which unlocks returns and the storefront orders view. |
| Return / exchange intake | **BUILD — scoped down** | Table-stakes, but autonomous refunds were *refuted*. Scope = capture an intake request (order + reason + exchange-vs-refund preference), preview/confirm/log it, then hand off for the actual money movement. Depends on the `orders` domain. |
| Address / shipping preference update | **DEFER** | Research's #1 ATO-exploit signal and a PII mutation. High risk for low demo value; keep out of scope and route such asks to handoff. Revisit only with stronger step-up verification. |
| Human handoff ticket creation | **BUILD — cheap, independent** | Sentiment-router only *classifies* today; there is no durable escalation record. Research elevates handoff + audit to mandatory. A `shop_handoff_create` tool that appends a handoff record gives the audit trail the sources demand. Reuses the append-only action-log infra; identity is optional (escalations can fire for unlinked senders). |
| Mock storefront demo | **DECIDED 2026-06-02 — next build (UI, not a skill)** | Was deferred until the `orders` domain existed; now scoped as one **interactive** web UI over shared shop state (browse → cart → own orders/returns), reusing `src/shop`, no checkout. Full plan: [`storefront-roadmap.md`](storefront-roadmap.md). |

### Newly surfaced by research

| Candidate | Verdict | Why |
|---|---|---|
| Product / ingredient-compatibility Q&A | **BUILD — small, independent** | Canonical skincare action ("can I use this with retinol?"). Falls between `policy-oracle` (policy) and `search-products` (catalog). Extension of `policy-oracle` backed by a new compatibility data file; no tools, no pipeline. Carries a regulated-product accuracy risk → answer only from data, escalate medical/reaction language to `sentiment-router`. |
| Subscription management | **DEFER** | Large new recurring-order domain, and the highest-value sub-action (cancel) sits in the refuted autonomous-mutation zone. Out of MVP scope. |
| Restock / back-in-stock alerts | **DEFER** | We already model `out_of_stock` + `stockStatus`, but "alert" implies async outbound notification, which needs a notification channel we don't have. Out of scope for a synchronous chat MVP. |

### Scoped backlog (each = one feature branch)

For each: customer value · type · tools+data · scope impact · order.

1. ✅ **cart-edit** (`cart-actions` extension) — "remove this" / "make it 2 instead". *Extension.* Tools: `shop_cart_preview_remove_item` / `_update_quantity` + matching confirm tools (by-id and confirm-latest); extended `PendingAction.type` union ([`types.ts`](../../src/shop/types.ts)). Data: none new (reuses `carts`). Scope: no new domain — fit current scope. **SHIPPED 2026-05-29** (branch `feat/cart-edit`): proved the identity → preview → confirm → execute → audit pipeline generalizes to new mutation types; quantity→0 routes to remove (not an update), over-stock and not-in-cart are refused, and the eval harness now exercises all three `PendingAction` types. **Next open item: 3 (order-status).**
2. ✅ **eval-harness (tool-level)** — not a customer skill; a safety net. *Inner-tooling / test infra.* Deterministic tests over `src/shop` service functions (identity gating, preview/confirm, expiry, audit logging) run from a seeded DB. Data: reuses `data/` baseline. Scope: closes the §3 "not implemented" gap; no product-scope change. **SHIPPED 2026-05-29** (branch `feat/eval-harness`): `src/cli/shop-eval.ts`, run via `npm run shop:eval` (`shop:test` is now an alias). 21 named assertions across identity/ownership (unlinked, revoked, typed-id-not-proof, cross-customer and cross-link confirm rejection), preview→confirm (no-mutation for all three types, confirm-required, no double-execution), expiry, per-type refusals, and audit logging for all three `PendingAction` types; per-test `data/` reset, non-zero exit on failure, clean DB at end. The standalone smoke test was retired and folded in. Skill/agent-layer automation stays manual per §5. See §"Eval harness" below. **Order: 2 — done before the first new data domain.**
3. ✅ **order-status** (new `order-status` skill) — "where's my order?". *New skill + new data domain.* Tools: `shop_orders_list_for_channel`, `shop_order_get` (read-only, identity-gated). Data: **new `data/shop/orders.json`** (orders owned by `customerId`, with status + line items + tracking fields). Scope: **new visible data domain → update ARCHITECTURE first** (done in this session). **SHIPPED 2026-06-01** (branch `feat/order-status`): both reads gate on `resolveLinkedCustomer` (unlinked/revoked refused), return only the linked `customerId`'s own orders, and refuse an unknown *or* non-owned order id with an identical not-found message so the order number is never itself proof and existence never leaks. Order lines store `productId + quantity + unitPriceNtd` (the historical paid price); the display name is joined from the catalog at read time, so names stay owned by `catalog/products.json`. No new `PendingAction` types and no mutations. The eval harness gained 7 order-status assertions (identity-gated reads, own-orders-only, unknown-id refused, typed-order-number-not-proof, happy-path detail incl. tracking); 32/32 pass. **Order: 3 (keystone — unlocks 4 and the storefront). Next open item: 4 (returns-intake).**
4. ✅ **returns-intake** (new `returns-actions` skill) — "I want to return / exchange this". *New skill, depends on `orders`.* Tools: `shop_return_preview` / `shop_return_confirm` (creates a return *request*, not a refund); reuses identity + preview→confirm→audit; hands off the money movement. **Plus a refund/return-status read** (read-only, identity-gated, safe by construction, over a `status` field on each return record): a *read folded into this skill*, not a separate skill, distinct from `policy-oracle` answering the generic "5–7 business days" timeframe. **SHIPPED 2026-06-01** (branch `feat/returns-intake`): a return can only be opened against a **delivered** order the resolved `customerId` owns — ownership reuses the order-status check, and an unknown *or* non-owned order id is refused identically (no existence leak, order number never proof). `shop_return_confirm` creates a record in the `requested` state **only** — it never mutates an order, cart, or money; every later status comes from a human/seeded fixture, the same way `orders.json` is seeded because there is no checkout. The status read became **two tools** mirroring order-status — `shop_returns_list_for_channel` / `shop_return_get` (own-returns-only; unknown / non-owned return ids refused identically) — rather than the single `shop_return_status` originally sketched. `PendingAction` became a discriminated union to add the `return.create` type (cart actions keep `productId`/`quantity`; a return carries `orderId`/`resolution`/`reason`). The eval harness gained 13 returns assertions (identity-gated preview/confirm/read, own-order-only intake, non-delivered refused, invalid resolution refused, preview-creates-no-record, confirm-creates-a-`requested`-request-not-a-refund, no double-confirm, cross-customer confirm rejected, own-returns-only status reads, seeded-refund status read); 45/45 pass. `data/shop/returns.json` added; the return-window + 5–7-business-day facts already live in `data/policies/returns.md` (unchanged — `policy-oracle` still owns the generic timeframe). Data: **new `data/shop/returns.json`** (per-return `status`). Scope: new sub-domain — ARCHITECTURE updated. **Order: 4 (after order-status). Next open items: 5 (handoff-ticket) and 6 (product-compatibility), independent.**
5. ✅ **handoff-ticket** (`sentiment-router` extension) — durable escalation record. *Extension + inner tools.* Tools: `shop_handoff_create` (append-only) + `shop_handoff_list` (ops/audit read). Data: **new `data/shop/handoffs.json`** + `ShopDatabase.handoffs` + a `HandoffRecord` type. **SHIPPED 2026-06-01** (branch `feat/handoff-ticket`): chose a **new `handoffs` domain over an action-log type** because a handoff carries its own status lifecycle (`open` → human-advanced `acknowledged`/`in_progress`/`resolved`/`closed`) that `ActionLog`'s fixed `success|failed|preview` verb cannot hold, and because `addLog` ring-buffers to the last 200 entries — an escalation record (research-mandated audit) must not silently age out. It still writes an `ActionLog` (`handoff.create`) too, so the action-log stays the unified audit trail while the `HandoffRecord` is the durable, queryable artifact — matching the `orders`/`returns` precedent (each its own domain with a `status`). **KEY DEPARTURE from cart/orders/returns: identity is OPTIONAL and never blocks an escalation** — `shop_handoff_create` resolves the linked customer *softly*, attaching a `customerId` when linked and recording the raw `channel` + `externalUserId` (no `customerId`) for an unlinked/revoked sender; it never accepts a typed customer id. Append-only: no preview/confirm (an escalation is the agent's judgment, not a customer-authorized mutation), no money/account mutation. `continue` records nothing. The `handoffs` domain is **staff/ops-only**, not customer-visible (ARCHITECTURE §6), so it adds no storefront UI obligation. The eval harness gained 8 handoff assertions (linked-sender record with `customerId`; **unlinked-sender record with no `customerId`**; revoked-link still records unattributed; success audit log; append-only two-creates-two-records touching no cart/order/return; invalid/`continue` classification refused; `shop_handoff_list` filters by `customerId`; backfill of a DB predating the `handoffs` array); 56/56 pass. Scope: small; record-keeping for an existing behavior. **Order: parallelizable — landed independent of orders. Next open item: 6 (product-compatibility).**
6. ✅ **product-compatibility** (`policy-oracle` extension) — ingredient/routine compatibility answers. *Extension, data-only.* Tools: none. Data: **new `data/catalog/compatibility.md`** (safe, brand-authored pairings/avoid-with facts). Scope: no new tool/pipeline; reuses the answer-only-from-data contract. **SHIPPED 2026-06-02** (branch `feat/product-compatibility`): `compatibility.md` is a CATALOG-domain fact file — it references products by `id`/`name` from `products.json` and never duplicates price/stock/description; it carries AM/PM routine order, safe pairings, "use with care / avoid combining" sequencing (the exfoliating toner is PM-only, don't stack it with the night oil — alternate nights), and an explicit **Missing / Unsupported Details** section. `policy-oracle` answers "can I use X with Y?" / "what order do I apply these?" **only** from that file; it refuses honestly for any product DeskClaw does not sell (e.g. retinol — not in the catalog), and a **hard rule escalates any medical/allergy/reaction/pregnancy/skin-condition question to `sentiment-router` (`urgent_handoff`)** — it never answers or reassures, not even to call a combination "safe." DATA-ONLY: no `src/`/MCP/tool/`PendingAction` changes and therefore **no shop-eval extension** (no service functions to test); verification is the four TUI scenarios in `skills-lab/scenarios/product-compatibility-tests.md` (safe pairing answered from data, avoid-with answered from data, not-in-data refused, medical/allergy routed to urgent_handoff), run with a fresh `/new`. **Order: parallelizable — independent of everything above. This closes the MVP skill backlog.**

**Dependency graph:** ~~`cart-edit`~~ → ~~`eval-harness`~~ → ~~`order-status`~~ → ~~`returns-intake`~~ → ~~`handoff-ticket`~~ → ~~`product-compatibility`~~ (all done — `product-compatibility` was independent of the chain). **The MVP skill backlog is now complete.** The only remaining MVP item is the `storefront UI` — **decided and scoped 2026-06-02** (its `orders`/`returns` prerequisites exist); plan in [`storefront-roadmap.md`](storefront-roadmap.md) (note: `handoffs` is staff/ops-only, so it is **not** part of that customer-visible storefront scope — ARCHITECTURE §6).

Implementation sessions take the top open item and follow the [`../../skills/README.md`](../../skills/README.md) workflow, one feature branch each.

### Completeness check (2026-05-29)

Walked the full customer journey (pre-purchase → buying → post-purchase → support → retention) plus skincare specifics to confirm nothing is missing. **The build backlog above is complete for the MVP.** Coverage by stage: discover/compare/gift and "in stock?" → `search-products` (catalog carries `stockStatus`); ingredient/routine compatibility → `product-compatibility`; "is this safe for my allergy/pregnancy?" → `sentiment-router` urgent handoff (safety by design); cart add/view/remove/update → `cart-actions` + `cart-edit`; "where's my order?" → `order-status`; return/exchange + refund-status → `returns-actions`; cancel/address change → deferred (intake + handoff); policy/care/refund-timeframe → `policy-oracle`; frustration/dispute + audit → `sentiment-router` + `handoff-ticket`.

One capability was added from this check (refund/return-status read, folded into item 4 above). Everything else surfaced was either already covered or a deliberate post-MVP deferral, now recorded in [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) §5:

- **Checkout (cart → paid order)** — no payment in a local mock and the riskiest mutation; deferred. Consequence: `data/shop/orders.json` is **seeded fixtures**, not agent-created — `order-status` and `returns-actions` read pre-existing orders. Stated so it is a decision, not a silent gap.
- **Self-service account registration & linking** for unlinked senders — **shipped 2026-06-09** (`account-registration` skill + `shop_account_register` / `shop_account_link_existing`; see ARCHITECTURE §5 in-scope). A new account is created bound to the sender's own channel identity; an existing account is linked only with its `accountCode` (a demo stand-in for an OTP). Still deferred: out-of-band code delivery, deep-link/QR onboarding, and repairing a revoked link from chat.
- **Loyalty / points / gift balance** — not in the data model; research flags it as cash-equivalent high-risk. Deferred.
- **Proactive / outbound** (post-purchase check-ins, review requests, abandoned-cart nudges) — no async outbound channel; deferred (same blocker as restock alerts).

Considered and **not** added (avoid padding): reorder/replenishment (retention, depends on order history — clearly post-MVP) and a multi-product routine builder (`search-products` + `product-compatibility` + the existing starter kit cover the MVP need).

## 5. Eval harness — recommendation

**Status: tool layer SHIPPED 2026-05-29** (`src/cli/shop-eval.ts`, `npm run shop:eval`). **Agent layer: incremental harness SHIPPED 2026-06-03** (`src/cli/agent-eval.ts`, `npm run agent:eval`) — the "lighten it incrementally" follow-up below. It drives the real agent through the OpenClaw Gateway (`openclaw agent --json` per turn) and asserts the model-in-the-loop behaviors the tool layer can't (skill routing, answer-only-from-data, escalation→handoff record, preview→confirm) over a curated case subset (`src/cli/agent-eval-cases.ts`); rule-based assertions (tool-call presence, store deltas, loose regexes), no LLM judge; needs a running Gateway + model (this repo: `openai-codex/gpt-5.5` via the Codex login) and SKIPS gracefully without one. It is model-in-the-loop (not perfectly deterministic) and mutates the shared store (resets around cases). Gated-skill cases inject the channel-asserted sender in-prompt (no real channel adapter in a bare CLI turn); the safety-critical gating stays covered deterministically by `shop:eval`. **Still open:** full scenario coverage + a real channel-adapter identity path remain manual.

**Build a tool-level harness now (backlog item 2), before the first new data domain. Defer full skill/agent scenario automation.**

The repo's own position (ARCHITECTURE §6) is to fix the operational limit — manual TUI testing — before skill count grows, and the research reinforces it (the company is legally accountable; mutating actions need audit; vendor guides omit the safety layer entirely). But "the eval harness" is really two layers with very different cost/value:

- **Tool layer (cheap, high value, build now):** the three-layer + MCP boundary means the safety-critical logic lives in plain TypeScript service functions. Deterministic tests can assert the things that actually protect customers — unlinked/revoked identity is refused, preview is required before confirm, a confirm of someone else's pending action is rejected, expiry works, every mutation writes an audit log — with no model in the loop. This is the regression net every new mutation type (cart-edit, returns) leans on.
- **Skill/agent layer (expensive, defer / keep manual):** does the model route to the right skill and ask for confirmation? This needs a model in the loop and is closer to the existing TUI scenarios in `skills-lab/`. Automating it (scripted prompts against OpenClaw + assertions) is real work for lower marginal safety; keep it manual for now and lighten it incrementally.

Sequencing note: do `cart-edit` *first* (tiny, fully inside the already-tested path) so the harness has two more `PendingAction` types to exercise as its initial target, then build the harness before `order-status` introduces the first new domain and the first PII-bearing read.

## Rules to respect

- ARCHITECTURE.md owns scope — add an item to §5 before building it if it changes scope.
- One capability per branch, tested in the TUI.
- Consider building the automated eval harness early ([`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) §3 lists it as not implemented) — it is the first thing that limits adding more skills.
