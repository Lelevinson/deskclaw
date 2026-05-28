# Commerce Action Pipeline

This doc owns DeskClaw's mock commerce action design: local data, MCP tools, confirmation rules, and how a future mock storefront should plug in.

## 1. Goal

DeskClaw should be able to perform useful customer-service actions without giving the model raw database access. The first supported action is adding a product to a customer's cart.

The safe pipeline is:

```text
customer message
-> skill decides intent
-> MCP tool validates and previews the action
-> agent asks the customer to confirm
-> MCP tool commits the action
-> local database records cart state and action log
-> future website reads the same database/backend state
```

Customers should not need to name a skill or tool. The skill should infer intent from normal shopping/support wording, while channel or account context supplies the customer identity needed by the MCP tools.

## 2. Files

```text
data/commerce.seed.json          # committed demo seed data
src/commerce/                    # shared business logic and JSON store
src/mcp/commerce-server.ts       # MCP tool server over stdio
src/cli/reset-commerce-db.ts     # reset .local/commerce-db.json from seed
skills/cart-actions/SKILL.md     # agent instructions for commerce actions
skills-lab/scenarios/cart-actions-tests.md
```

Runtime data is written to `.local/commerce-db.json`, which is gitignored. Do not commit runtime cart state or action logs.

## 3. Setup

Install dependencies and build:

```bash
npm install
npm run build
npm run commerce:reset
```

Run the MCP server directly for smoke testing:

```bash
npm run commerce:mcp
```

Configure OpenClaw to see the server:

```bash
openclaw mcp set deskclaw-commerce '{"command":"node","args":["/workspaces/deskclaw/dist/mcp/commerce-server.js"],"cwd":"/workspaces/deskclaw"}'
openclaw mcp list
```

Rebuild with `npm run build` after TypeScript changes. Reset local demo state with `npm run commerce:reset` when scenarios need a clean cart.

## 4. Tool Surface

The MCP server exposes typed tools only:

| Tool | Purpose |
|---|---|
| `commerce_customer_lookup` | Map a channel identity, such as a WhatsApp sender id, to a customer id. |
| `commerce_catalog_search` | Search products from customer wording. |
| `commerce_cart_get` | Read a customer's current cart. |
| `commerce_cart_preview_add_item` | Validate and stage an add-to-cart action. |
| `commerce_cart_confirm_add_item` | Commit a staged add-to-cart action after explicit confirmation. |
| `commerce_cart_confirm_latest_add_item` | Commit the latest matching staged add-to-cart action after explicit confirmation. |
| `commerce_action_log_list` | Inspect recent action logs for demos and debugging. |

Do not expose raw SQL or generic database-write tools.

## 5. Confirmation Rule

Cart writes require two steps:

1. Preview with `commerce_cart_preview_add_item`.
2. Ask the customer to confirm the exact product, quantity, and price.
3. Commit with `commerce_cart_confirm_latest_add_item` only after the customer clearly agrees.

If the customer is angry, reports harm, threatens chargeback/legal action, or asks for a human, use `sentiment-router` and hand off instead of mutating cart state.

## 6. Future Website

The mock storefront should use the same commerce concepts:

- products
- customers
- carts
- pending actions
- action logs

The website should show product catalog, customer cart, and action logs so reviewers can see that agent actions changed real local state.
