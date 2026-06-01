# Shop Backend

This folder implements DeskClaw's local mock shop backend. It owns account identity, safe cart actions, MCP tool boundaries, and the local demo/storefront interface.

This is not where skills live, and it is not a test script. Agent behavior lives in [`../../skills/`](../../skills/), test scenarios live in [`../../skills-lab/scenarios/`](../../skills-lab/scenarios/), and operational commands live in [`../../docs/openclaw/setup.md`](../../docs/openclaw/setup.md#4-shop-mcp-tools).

## What This README Is For

Use this file when changing the shared shop backend contract: identity lookup, order/cart state, shop MCP tools, confirmation rules, or the local demo/storefront state model.

Do not use this file to list every skill. Skills are listed and developed through [`../../skills/README.md`](../../skills/README.md). The shop backend can contain inner tools that several skills reuse; for example, account identity lookup is a reusable inner tool, while `cart-actions` is the customer-facing skill that currently uses it.

## 1. Goal

DeskClaw should be able to perform useful customer-service actions without giving the model raw database access. The supported cart actions are adding an item, removing an item, and changing the quantity of an existing item. The supported order action is a read-only, identity-gated order-status lookup. The supported return action creates a return/exchange request for human review; it never issues refunds or cancellations. Handoff tools create durable escalation records.

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
data/shop/                       # committed order/cart runtime baseline state
src/shop/                        # shared shop logic and JSON store
src/mcp/shop-server.ts           # MCP tool server over stdio
src/cli/reset-shop-db.ts         # reset .local/shop-db.json from baseline data
skills/cart-actions/SKILL.md     # agent instructions for cart actions
skills-lab/scenarios/cart-actions-tests.md
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
| `shop_orders_list_for_channel` | Read recent orders for the linked channel identity. |
| `shop_order_get` | Read one linked customer order by id/order-number filter. |
| `shop_return_preview` | Validate and stage a return/exchange request for human review. |
| `shop_return_confirm` | Submit a staged return/exchange request after explicit customer confirmation. |
| `shop_return_status` | Read return/refund request status for a linked channel identity. |
| `shop_handoff_create` | Append a human handoff ticket for escalation/audit. |
| `shop_cart_get` | Read the current cart for a linked channel identity. |
| `shop_cart_preview_add_item` | Validate and stage an add-to-cart action for a linked channel identity. |
| `shop_cart_confirm_add_item` | Commit a known pending add-to-cart action for the same linked channel identity after explicit confirmation. |
| `shop_cart_confirm_latest_add_item` | Commit the latest matching pending add-to-cart action for the same linked channel identity after explicit confirmation. |
| `shop_cart_preview_remove_item` | Validate and stage a remove-from-cart action for a linked channel identity. |
| `shop_cart_confirm_remove_item` | Commit a known pending remove-from-cart action for the same linked channel identity after explicit confirmation. |
| `shop_cart_confirm_latest_remove_item` | Commit the latest matching pending remove-from-cart action for the same linked channel identity after explicit confirmation. |
| `shop_cart_preview_update_quantity` | Validate and stage a quantity change for an existing cart item. |
| `shop_cart_confirm_update_quantity` | Commit a known pending update-quantity action for the same linked channel identity after explicit confirmation. |
| `shop_cart_confirm_latest_update_quantity` | Commit the latest matching pending update-quantity action for the same linked channel identity after explicit confirmation. |
| `shop_action_log_list` | Inspect recent action logs for demos and debugging. |

Do not expose raw SQL, generic database-write tools, customer-id-only mutating tools, or order-number-only account reads to the agent.

## 5. Confirmation Rule

Cart writes and return request submissions require the same preview → confirmation → commit pattern for add, remove, update-quantity, and return-intake actions:

1. Preview with the matching cart preview tool or `shop_return_preview`.
2. Ask the customer to confirm the exact product, quantity, and price or cart effect.
3. Commit the existing pending action/request with the matching cart confirm tool or `shop_return_confirm` only after the customer clearly agrees. Use by-id cart confirm tools only when the exact pending action id is available.

If the customer is angry, reports harm, threatens chargeback/legal action, or asks for a human, use `sentiment-router` and hand off instead of mutating cart state.

## 6. Operational Commands

Build, reset, test, local demo, storefront render, and OpenClaw MCP setup commands live in [`../../docs/openclaw/setup.md`](../../docs/openclaw/setup.md#4-shop-mcp-tools). This file should not repeat them.

## 7. Local Demo UI / Storefront

The local browser demo (`npm run demo:server`) and static storefront snapshot (`npm run shop:storefront`) use the same shop concepts:

- products
- customers
- account links
- orders
- returns
- handoff tickets
- carts
- pending actions
- action logs

The browser demo lets reviewers exercise catalog/search, cart, order, return, and handoff flows against the same local state used by the tools. The static storefront snapshot is intentionally read-only and lighter weight; use it only as a quick state view, not as the primary flow-testing UI.
