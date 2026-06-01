# data/

Source-of-truth data for DeskClaw's local prototype.

Use this folder for shared business facts and structured local records that more than one skill, tool, or future UI may need. Skills should point here instead of copying the same facts into skill folders.

## Layout

```text
data/
  templates.md                 # commented shape examples for data files
  catalog/
    products.json              # product facts shared by recommendation + shop tools
  policies/
    faq.md
    product-care.md
    returns.md
    shipping.md
  routing/
    escalation-rules.md
  customers/
    customers.json
    account-links.json
  shop/
    carts.json
    orders.json
    returns.json
    handoffs.json
    pending-actions.json
    action-logs.json
```

## Ownership Rules

- Put a shared fact in exactly one data file.
- Product names, prices, stock, tags, and recommendation metadata live only in `catalog/products.json`.
- Customer records and channel-to-account ownership links live under `customers/`.
- Runtime shop state is reset from the committed `shop/*.json` files, then written to `.local/shop-db.json`.
- Use final file names now. Do not add temporary suffixes such as `.seed`, `.demo`, `.mock`, or `.initial` unless the file is truly a short-lived test fixture.
- Shape examples and field notes live in [`templates.md`](templates.md). Actual `.json` data files must stay valid JSON, so do not put comments inside them.
- Skill files may describe how to use the data, but should not duplicate the data.
- Local runtime state, credentials, and OpenClaw workspace state must stay out of this folder.

## Current Coverage

The current skills need these data groups:

| Skill / tool area | Data used |
|---|---|
| `policy-oracle` | `policies/*.md` |
| `search-products` | `catalog/products.json` |
| `sentiment-router` | `routing/escalation-rules.md` |
| `cart-actions` and shop tools | `catalog/products.json`, `customers/*.json`, `shop/*.json` |
| `order-status` and order tools | `shop/orders.json`, `catalog/products.json` (line names joined at read time), `customers/*.json` |
| `returns-actions` and return tools | `shop/returns.json`, `shop/orders.json` (a return links to a delivered owned order), `customers/*.json` |
| `sentiment-router` handoff records and handoff tools | `shop/handoffs.json`, `customers/*.json` (a `customerId` is linked only when the sender is linked; identity is optional) |

This is scalable enough for the MVP because data is split by domain instead of copied into each skill. It is not meant to be a production database. If future utilities need orders, addresses, returns, payments, tickets, or staff users, add a new domain folder here and update the owning skill/tool docs in the same change.
