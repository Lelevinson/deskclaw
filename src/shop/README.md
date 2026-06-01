# Shop Backend

This folder implements DeskClaw's local mock shop backend. It owns account identity, safe cart actions, MCP tool boundaries, and the future mock storefront interface.

This is not where skills live, and it is not a test script. Agent behavior lives in [`../../skills/`](../../skills/), test scenarios live in [`../../skills-lab/scenarios/`](../../skills-lab/scenarios/), and operational commands live in [`../../docs/openclaw/setup.md`](../../docs/openclaw/setup.md#4-shop-mcp-tools).

## What This README Is For

Use this file when changing the shared shop backend contract: identity lookup, cart state, shop MCP tools, confirmation rules, or the future mock storefront state model.

Do not use this file to list every skill. Skills are listed and developed through [`../../skills/README.md`](../../skills/README.md). The shop backend can contain inner tools that several skills reuse; for example, account identity lookup is a reusable inner tool, while `cart-actions` is the customer-facing skill that currently uses it.

## 1. Goal

DeskClaw should be able to perform useful customer-service actions without giving the model raw database access. The first supported action is adding a product to a customer's cart.

The safe pipeline is:

```text
customer message
-> channel context provides `channel` + `externalUserId`
-> shop account-link lookup maps that identity to a customer account
-> skill decides intent
-> MCP tool validates and previews the action
-> agent asks the customer to confirm
-> MCP tool commits the action
-> local database records cart state and action log
-> future website reads the same database/backend state
```

Customers should not need to name a skill, tool, or internal customer id. The skill should infer intent from normal shopping/support wording, while channel or account context supplies the linked identity needed by the MCP tools.

## 2. Files

```text
data/catalog/products.json       # product facts shared by skills and shop tools
data/customers/                  # customers and linked channel identities
data/shop/                       # committed shop runtime baseline state
src/shop/                        # shared shop logic and JSON store
src/mcp/shop-server.ts           # MCP tool server over stdio
src/cli/reset-shop-db.ts         # reset .local/shop-db.json from baseline data
src/cli/shop-eval.ts             # deterministic tool-level eval harness (npm run shop:eval)
skills/cart-actions/SKILL.md     # agent instructions for cart actions
skills/order-status/SKILL.md     # agent instructions for read-only order/tracking lookups
skills-lab/scenarios/cart-actions-tests.md
skills-lab/scenarios/order-status-tests.md
```

Runtime data is assembled from `data/` files and written to `.local/shop-db.json`, which is gitignored. Do not commit runtime cart state or action logs.

## 3. Identity Contract

Account-owned actions require a linked channel identity. A customer-provided internal account id is not enough.

```text
channel + externalUserId
-> accountLinks[]
-> customerId
```

The current data has one linked customer:

```text
channel: simulated-chat
externalUserId: demo-lin
customerId: customer-demo-lin
```

If the channel identity is missing, unlinked, or revoked, the agent must not read or mutate account-owned cart state. It should ask the customer to verify or link their account instead.

## 4. Tool Surface

The MCP server exposes typed tools only:

| Tool | Purpose |
|---|---|
| `shop_customer_lookup` | Map a channel identity, such as a WhatsApp sender id, to a linked customer account. |
| `shop_catalog_search` | Search products from customer wording. |
| `shop_cart_get` | Read the current cart for a linked channel identity. |
| `shop_cart_preview_add_item` | Validate and stage an add-to-cart action for a linked channel identity. |
| `shop_cart_confirm_add_item` | Commit a staged add-to-cart action for the same linked channel identity after explicit confirmation. |
| `shop_cart_confirm_latest_add_item` | Commit the latest matching staged add-to-cart action for the same linked channel identity after explicit confirmation. |
| `shop_cart_preview_remove_item` / `shop_cart_preview_update_quantity` | Validate and stage a remove or quantity-change cart action for a linked channel identity. |
| `shop_cart_confirm_remove_item` / `shop_cart_confirm_update_quantity` (+ `_latest_` variants) | Commit a staged remove or quantity-change action for the same linked channel identity after explicit confirmation. |
| `shop_orders_list_for_channel` | List order summaries for a linked channel identity; returns only that customer's own orders (read-only). |
| `shop_order_get` | Read one order's full detail (status, items, tracking) only if it belongs to the linked customer; an unknown or non-owned order id is refused identically, so the order id is never proof of ownership (read-only). |
| `shop_action_log_list` | Inspect recent action logs for demos and debugging. |

Do not expose raw SQL, generic database-write tools, or customer-id-only mutating tools to the agent. Read tools are still identity-gated on the linked channel identity: `order-status` reads never accept a customer-typed order number or customer id as proof, and only ever return orders the linked account owns.

## 5. Confirmation Rule

Cart writes require two steps:

1. Preview with `shop_cart_preview_add_item`.
2. Ask the customer to confirm the exact product, quantity, and price.
3. Commit with `shop_cart_confirm_latest_add_item` only after the customer clearly agrees.

If the customer is angry, reports harm, threatens chargeback/legal action, or asks for a human, use `sentiment-router` and hand off instead of mutating cart state.

## 6. Operational Commands

Build, reset, test, and OpenClaw MCP setup commands live in [`../../docs/openclaw/setup.md`](../../docs/openclaw/setup.md#4-shop-mcp-tools). This file should not repeat them.

## 7. Future Website

The mock storefront should use the same shop concepts:

- products
- customers
- account links
- carts
- orders
- pending actions
- action logs

The website should show product catalog, customer cart, orders, and action logs so reviewers can see that agent actions changed real local state. Orders are the first read-only post-purchase domain the storefront can surface.
