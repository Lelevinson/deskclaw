# skills/

Repo-managed OpenClaw skills. **This folder is the canonical source.** Do not treat `/home/node/.openclaw/workspace/skills/` as the source of truth — that path is local OpenClaw runtime state in a Docker volume.

For loading these into OpenClaw (the `skills.load.extraDirs` command, precedence rules, and removing stale workspace copies), see [`../docs/openclaw/setup.md`](../docs/openclaw/setup.md).

## Folder shape

```text
skills/
  skill-name/
    SKILL.md
```

Skill names use lowercase letters, numbers, and hyphens (e.g. `policy-oracle`).

Shared business facts live under [`../data/`](../data/), not inside skill folders. The current skills should contain only `SKILL.md`; point to the owning `data/` file instead of adding local data files.

## Mental model

DeskClaw has three different layers. Do not mix them:

| Layer | What it means | Where it lives |
|---|---|---|
| Customer-facing skill | The agent behavior a customer experiences, such as answering a policy question or adding an item to cart. | `skills/<skill-name>/SKILL.md` |
| Inner tool / utility | A reusable typed operation that a skill can call, such as checking account identity or committing a cart action. | `src/` MCP server code, currently [`../src/shop/`](../src/shop/) |
| Shared facts / state | Product, policy, routing, customer, account-link, cart, and action-log data. | [`../data/`](../data/) |

Example: `cart-actions` is the customer-facing skill. `shop_customer_lookup` is an inner tool used by that skill, and likely by future account-owned utilities too. The identity lookup is not its own customer-facing skill unless customers need a standalone "verify my account" conversation.

## Current Customer-Facing Skills

- [`cart-actions/`](cart-actions/) — guides MCP-backed customer cart actions with preview, confirmation, execution, and audit logging.
- [`order-status/`](order-status/) — answers "where's my order?" with read-only, identity-gated order status and tracking lookups over the linked customer's own orders.
- [`returns-actions/`](returns-actions/) — intakes a return/exchange **request** against the linked customer's own delivered order via preview → confirm → audit (never issues a refund — hands the money movement to a human), and answers read-only refund/return-status questions ("is my refund processed yet?").
- [`policy-oracle/`](policy-oracle/) — answers shipping, returns, FAQ, warranty, and product-care policy questions from shared policy data, plus product-compatibility and routine-ordering questions ("can I use X with Y?", "what order do I apply these?") from the brand-authored `data/catalog/compatibility.md`; it answers only from that data, refuses products DeskClaw does not sell, and escalates any medical/allergy/reaction/skin-condition question to `sentiment-router`.
- [`search-products/`](search-products/) — recommends products from the shared demo catalog.
- [`sentiment-router/`](sentiment-router/) — classifies customer messages as `continue`, `handoff_recommended`, or `urgent_handoff`, and on either handoff signal persists a durable escalation record (optional identity, append-only) for staff to act on.

## Current Inner Tools

These are not OpenClaw skills. They are reusable tool operations that skills can call.

| Inner tool | Used by | Purpose |
|---|---|---|
| `shop_customer_lookup` | `cart-actions`, future account-owned skills | Map `channel + externalUserId` to the linked customer account. |
| `shop_catalog_search` | `cart-actions`, future shop actions | Resolve customer wording to a product id. |
| `shop_cart_get` | `cart-actions` | Read the linked customer's current cart. |
| `shop_cart_preview_add_item` | `cart-actions` | Validate and stage an add-to-cart action before confirmation. |
| `shop_cart_confirm_add_item` | `cart-actions` | Commit a known pending add-to-cart action. |
| `shop_cart_confirm_latest_add_item` | `cart-actions` | Commit the latest matching pending add-to-cart action after customer confirmation. |
| `shop_cart_preview_remove_item` | `cart-actions` | Validate and stage a remove-from-cart action before confirmation. |
| `shop_cart_confirm_remove_item` | `cart-actions` | Commit a known pending remove-from-cart action. |
| `shop_cart_confirm_latest_remove_item` | `cart-actions` | Commit the latest matching pending remove-from-cart action after customer confirmation. |
| `shop_cart_preview_update_quantity` | `cart-actions` | Validate and stage a change to an existing cart item's quantity before confirmation. |
| `shop_cart_confirm_update_quantity` | `cart-actions` | Commit a known pending update-quantity action. |
| `shop_cart_confirm_latest_update_quantity` | `cart-actions` | Commit the latest matching pending update-quantity action after customer confirmation. |
| `shop_orders_list_for_channel` | `order-status` | List order summaries for the linked customer; returns only that customer's own orders. |
| `shop_order_get` | `order-status` | Read one order's full detail (status, items, tracking) only if it belongs to the linked customer; unknown / non-owned ids are refused identically. |
| `shop_return_preview` | `returns-actions` | Validate and stage a return/exchange *request* against a delivered order the linked customer owns, before confirmation. |
| `shop_return_confirm` | `returns-actions` | Commit a staged return request, creating a record in the `requested` state for human review. Never issues a refund or exchange. |
| `shop_returns_list_for_channel` | `returns-actions` | List the linked customer's own return/exchange requests with their status. |
| `shop_return_get` | `returns-actions` | Read one return's status only if it belongs to the linked customer; unknown / non-owned ids are refused identically. |
| `shop_handoff_create` | `sentiment-router` | Append a durable escalation record on a `handoff_recommended` / `urgent_handoff` route. Optional identity (links a `customerId` when resolvable, records the raw channel identity otherwise); append-only, no preview/confirm, writes an audit log. |
| `shop_handoff_list` | staff triage, demos/debugging | List escalation records for audit (optional `customerId` filter). Staff/ops-only, not a customer-facing read. |
| `shop_action_log_list` | `cart-actions`, demos/debugging | Inspect what happened for verification. |

## Planned Utilities (backlog)

The full reasoning, research basis, and ordering live in [`../docs/planning/skill-roadmap.md`](../docs/planning/skill-roadmap.md) §4; scope is owned by [`../ARCHITECTURE.md`](../ARCHITECTURE.md) §5. Build order: **~~cart-edit~~ → ~~tool-level eval harness~~ → ~~order-status~~ → ~~returns-intake~~ → ~~handoff-ticket~~ → ~~product-compatibility~~ (all shipped)**. The MVP skill backlog is complete; the only remaining MVP item is the deferred mock storefront UI (a read-only view, not a skill).

| Customer-facing utility | Type | Inner tools / data | Notes |
|---|---|---|---|
| ✅ Remove / update cart item | `cart-actions` extension | preview/confirm remove + update-quantity tools; extended `PendingAction.type` | **Shipped 2026-05-29.** No new data domain; reuses the identity → preview → confirm → audit pipeline. |
| ✅ Order status lookup | new `order-status` skill | read-only `shop_orders_list_for_channel` / `shop_order_get`; new `data/shop/orders.json` | **Shipped 2026-06-01.** Highest-volume real query. Safe by construction — keyed on the resolved `customerId`, never a typed order number; unknown / non-owned order ids refused identically. New visible data domain now in place. |
| ✅ Return / exchange intake + refund status | new `returns-actions` skill (depends on orders) | `shop_return_preview` / `shop_return_confirm` (request only); read-only `shop_returns_list_for_channel` / `shop_return_get`; new `data/shop/returns.json` (per-return `status`) | **Shipped 2026-06-01.** Creates a return *request* in the `requested` state then hands off the money movement; never auto-refunds. Opened only against a **delivered** order the resolved customer owns; unknown / non-owned order & return ids refused identically. Includes the read-only "is my refund processed?" status check. |
| ✅ Human handoff ticket | `sentiment-router` extension | `shop_handoff_create` (append-only) + `shop_handoff_list` (ops read); new `data/shop/handoffs.json` | **Shipped 2026-06-01.** Durable escalation/audit record with optional identity (an unlinked/revoked sender is still escalatable). New `handoffs` domain over an action-log type (handoffs carry a status lifecycle); `continue` records nothing. Staff/ops-only — not customer-visible, so no storefront UI obligation. Independent of orders. |
| ✅ Product / ingredient-compatibility Q&A | `policy-oracle` extension | new `data/catalog/compatibility.md`; no tools | **Shipped 2026-06-02.** Answers "can I use X with Y?" / routine-order questions only from the brand-authored data file; refuses products DeskClaw does not sell (e.g. retinol); escalates any medical/allergy/reaction/skin-condition question to `sentiment-router` (`urgent_handoff`). Data-only — no tools, no pipeline. Closes the MVP skill backlog. |
| Mock storefront demo | UI, not a skill | reads shared shop state (catalog, carts, orders, action logs) | Build after the `orders` domain exists; one read-only view, not per skill. |

### Reviewed and deferred

Cut or postponed in the 2026-05-29 roadmap session — full list and reasoning in [`../ARCHITECTURE.md`](../ARCHITECTURE.md) §5 "Deferred": customer-initiated **address / shipping-address mutation** (top account-takeover signal → handoff), **subscription management**, **restock / back-in-stock alerts**, any **autonomous cancellation or refund** (intake-and-handoff only), **checkout / cart→order** (no payment in the mock; `orders.json` is seeded fixtures), **self-service account linking**, **loyalty / points**, and **proactive / outbound messaging**. A completeness pass over the full customer journey confirmed the backlog above is otherwise complete for the MVP ([`../docs/planning/skill-roadmap.md`](../docs/planning/skill-roadmap.md) §4).

## Development Workflow

**Start a fresh implementation chat per utility.** Decisions and scope live in [`../docs/planning/skill-roadmap.md`](../docs/planning/skill-roadmap.md) §4 and [`../ARCHITECTURE.md`](../ARCHITECTURE.md), not in chat history — so each utility begins clean by reading those, which keeps context small and sessions independent.

Use this order when adding one customer utility at a time:

1. Name the customer-facing utility in plain language.
2. Decide whether it is a new skill, an extension of an existing skill, or only a new inner tool.
3. If it changes project scope, update [`../ARCHITECTURE.md`](../ARCHITECTURE.md) first.
4. Define the data it needs under [`../data/`](../data/) and update [`../data/templates.md`](../data/templates.md) when the shape changes.
5. Add or update inner tools under `src/` only when the skill needs typed stateful actions.
6. Update the skill behavior in `skills/<skill-name>/SKILL.md`.
7. Add or update scenario prompts under [`../skills-lab/scenarios/`](../skills-lab/scenarios/).
8. Run code checks and smoke tests for any tool code.
9. Run TUI scenarios with a fresh `/new` session.
10. Review the diff before opening the PR (for example with `/code-review`); fix or note any findings, then open the PR.
11. Later, integrate the mock UI against the same backend/data, then use the UI to verify visible state changes.
