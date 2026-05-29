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
- [`policy-oracle/`](policy-oracle/) — answers shipping, returns, FAQ, warranty, and product-care policy questions from shared policy data.
- [`search-products/`](search-products/) — recommends products from the shared demo catalog.
- [`sentiment-router/`](sentiment-router/) — classifies customer messages as `continue`, `handoff_recommended`, or `urgent_handoff`.

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
| `shop_action_log_list` | `cart-actions`, demos/debugging | Inspect what happened for verification. |

## Planned Utilities (backlog)

These are scoped but not yet built. The full reasoning, research basis, and ordering live in [`../docs/planning/skill-roadmap.md`](../docs/planning/skill-roadmap.md) §4; scope is owned by [`../ARCHITECTURE.md`](../ARCHITECTURE.md) §5. Build the top open item, one feature branch each. Build order: **cart-edit → tool-level eval harness → order-status → returns-intake**; `handoff-ticket` and `product-compatibility` are independent.

| Customer-facing utility | Type | Inner tools / data | Notes |
|---|---|---|---|
| Remove / update cart item | `cart-actions` extension | preview/confirm remove + update-quantity tools; extend `PendingAction.type` | First branch. No new data domain; reuses the identity → preview → confirm → audit pipeline. |
| Order status lookup | new `order-status` skill | read-only `shop_orders_list_for_channel` / `shop_order_get`; new `data/shop/orders.json` | Highest-volume real query. Safe by construction — keyed on the resolved `customerId`, never a typed order number. New visible data domain. |
| Return / exchange intake | new `returns-actions` skill (depends on orders) | `shop_return_preview` / `shop_return_confirm`; new `data/shop/returns.json`; `data/policies/returns.md` | Creates a return *request* then hands off; never auto-refunds. |
| Human handoff ticket | `sentiment-router` extension | `shop_handoff_create` (append-only record); optional identity | Durable escalation/audit record. Independent of orders. |
| Product / ingredient-compatibility Q&A | `policy-oracle` extension | new `data/catalog/compatibility.md`; no tools | Answer only from data; escalate reaction/medical language to `sentiment-router`. |
| Mock storefront demo | UI, not a skill | reads shared shop state (catalog, carts, orders, action logs) | Build after the `orders` domain exists; one read-only view, not per skill. |

### Reviewed and deferred

Cut or postponed in the 2026-05-29 roadmap session (see [`../ARCHITECTURE.md`](../ARCHITECTURE.md) §5 "Deferred"): customer-initiated **address / shipping-address mutation** (top account-takeover signal → handoff), **subscription management**, **restock / back-in-stock alerts**, and any **autonomous cancellation or refund** (intake-and-handoff only).

## Development Workflow

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
10. Later, integrate the mock UI against the same backend/data, then use the UI to verify visible state changes.
