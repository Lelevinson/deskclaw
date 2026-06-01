# Data Templates

These templates document the expected shape of each committed data file. They use comments for explanation, so treat them as examples only. Actual `.json` files must stay valid JSON with no comments.

When adding a new data file, use the final filename from the start, add its template here, and update [`README.md`](README.md) in the same change.

## `catalog/products.json`

```jsonc
{
  "version": 1,
  "catalogName": "DeskClaw Product Catalog",
  "currency": "NTD",
  "products": [
    {
      "id": "stable-product-id", // lowercase id used by tools and carts
      "name": "Customer-facing product name",
      "category": "cleanser",
      "priceNtd": 420,
      "stockStatus": "in_stock", // in_stock | low_stock | out_of_stock
      "stockQuantity": 24,
      "tags": ["searchable", "customer", "terms"],
      "bestFor": ["customer need this product fits"],
      "avoidIf": ["customer need or condition this product should avoid"],
      "shortDescription": "One short customer-safe description.",
      "link": "/products/stable-product-id"
    }
  ]
}
```

## `customers/customers.json`

```jsonc
{
  "version": 1,
  "customers": [
    {
      "id": "customer-stable-id", // internal account id, never accepted as ownership proof by itself
      "displayName": "Customer Display Name"
    }
  ]
}
```

## `customers/account-links.json`

```jsonc
{
  "version": 1,
  "accountLinks": [
    {
      "id": "link-customer-channel",
      "customerId": "customer-stable-id",
      "channel": "whatsapp", // examples: whatsapp, simulated-chat
      "externalUserId": "+886900000001", // identity supplied by the channel
      "status": "linked", // linked | revoked
      "linkedAt": "2026-05-28T00:00:00.000Z"
    }
  ]
}
```

## `shop/carts.json`

```jsonc
{
  "version": 1,
  "carts": [
    {
      "customerId": "customer-stable-id",
      "items": [
        {
          "productId": "stable-product-id",
          "quantity": 1,
          "addedAt": "2026-05-28T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

## `shop/orders.json`

Seeded order fixtures (there is no checkout in the prototype, so orders are not agent-created). Each order is owned by a `customerId`; `order-status` only ever returns orders owned by the resolved linked customer. Line items store the `productId`, `quantity`, and the **price paid at order time** (`unitPriceNtd`) — a historical order fact. The display name is joined from `catalog/products.json` at read time, so product names stay owned by the catalog, not duplicated here.

```jsonc
{
  "version": 1,
  "orders": [
    {
      "id": "order-2026-0001", // stable order id; NOT proof of ownership on its own
      "customerId": "customer-stable-id",
      "status": "shipped", // placed | processing | shipped | out_for_delivery | delivered | cancelled
      "placedAt": "2026-05-20T09:12:00.000Z",
      "updatedAt": "2026-05-22T01:05:00.000Z",
      "items": [
        {
          "productId": "stable-product-id",
          "quantity": 1,
          "unitPriceNtd": 420 // price paid per unit at order time, not the live catalog price
        }
      ],
      "totalNtd": 420,
      "shipping": {
        // optional; a not-yet-shipped order may omit this block or individual fields
        "carrier": "Black Cat Express",
        "trackingNumber": "TW480012345678",
        "estimatedDelivery": "2026-05-25",
        "shippedAt": "2026-05-22T01:05:00.000Z",
        "deliveredAt": "2026-05-25T03:40:00.000Z" // only once delivered
      }
    }
  ]
}
```

## `shop/returns.json`

Seeded return/exchange request records. A return is opened against a **delivered** order the same `customerId` owns; `returns-actions` only ever returns the linked customer's own records. The agent can only ever create a return in the `requested` state — it intakes a request and hands the actual refund/exchange to a human (ARCHITECTURE §5). Every later status (and the seeded fixtures) is set by a human reviewer, the same way `orders.json` is seeded because there is no checkout.

```jsonc
{
  "version": 1,
  "returns": [
    {
      "id": "return-2026-0001", // stable return id; NOT proof of ownership on its own
      "customerId": "customer-stable-id",
      "orderId": "order-2026-0001", // always an order this same customer owns
      "status": "refunded", // requested | approved | rejected | refund_processing | refunded | exchange_shipped | completed
      "resolution": "refund", // refund | exchange
      "reason": "Short customer-stated reason for the return or exchange.",
      "createdAt": "2026-05-10T08:20:00.000Z",
      "updatedAt": "2026-05-14T02:30:00.000Z",
      "statusDetail": "Optional human-authored note, e.g. refund amount and destination."
    }
  ]
}
```

## `shop/handoffs.json`

Seeded escalation/handoff records. `sentiment-router` appends one (via `shop_handoff_create`) whenever it routes to `handoff_recommended` or `urgent_handoff`; `continue` records nothing. **Identity is optional**: `customerId` is present only when the sender is a linked customer — an unlinked or revoked sender is still recorded, with just the raw `channel` + `externalUserId`. The agent only ever creates a record in the `open` state; every later status (and the seeded fixtures) is set by a human reviewer. This is a **staff/ops-only** domain (not customer-visible), so the read tool `shop_handoff_list` is an ops read with an optional `customerId` filter, not an identity-gated own-only customer read.

```jsonc
{
  "version": 1,
  "handoffs": [
    {
      "id": "handoff-2026-0001", // stable record id; NOT proof of ownership on its own
      "classification": "handoff_recommended", // handoff_recommended | urgent_handoff (from routing/escalation-rules.md; never "continue")
      "category": "refund_dispute", // short triage label, e.g. refund_dispute | safety_reaction | human_requested | chargeback_threat
      "reason": "One short internal reason for the escalation (the sentiment-router Reason: line).",
      "summary": "Short customer-safe summary of the situation for the human picking it up.",
      "channel": "simulated-chat", // always recorded
      "externalUserId": "demo-lin", // always recorded so a human can reach the sender
      "customerId": "customer-demo-lin", // OPTIONAL — present only when the sender is a linked customer
      "status": "open", // open | acknowledged | in_progress | resolved | closed (agent only ever creates "open")
      "createdAt": "2026-05-12T01:15:00.000Z",
      "updatedAt": "2026-05-14T02:35:00.000Z",
      "statusDetail": "Optional human-authored note, e.g. who resolved it and how."
    }
  ]
}
```

## `shop/pending-actions.json`

```jsonc
{
  "version": 1,
  "pendingActions": [
    {
      "id": "pending-stable-id",
      "type": "cart.add_item",
      "status": "pending", // pending | completed | cancelled | expired
      "customerId": "customer-stable-id",
      "accountLinkId": "link-customer-channel",
      "productId": "stable-product-id",
      "quantity": 1,
      "summary": "Add 1 x Product Name to Customer Display Name's cart.",
      "createdAt": "2026-05-28T00:00:00.000Z",
      "expiresAt": "2026-05-28T01:00:00.000Z",
      "completedAt": "2026-05-28T00:05:00.000Z" // optional, only when completed
    }
  ]
}
```

`pendingActions` is a discriminated union on `type`. A cart action (`cart.add_item` | `cart.remove_item` | `cart.update_quantity`) carries `productId` + `quantity` as above. A `return.create` action carries `orderId`, `resolution` (`refund` | `exchange`), and `reason` instead, and confirming it creates a `returns` record in the `requested` state — it never issues a refund:

```jsonc
{
  "id": "pending-stable-id",
  "type": "return.create",
  "status": "pending",
  "customerId": "customer-stable-id",
  "accountLinkId": "link-customer-channel",
  "orderId": "order-2026-0001",
  "resolution": "refund",
  "reason": "Short customer-stated reason.",
  "summary": "Open a refund request for Customer Display Name on order order-2026-0001.",
  "createdAt": "2026-05-28T00:00:00.000Z",
  "expiresAt": "2026-05-28T01:00:00.000Z"
}
```

## `shop/action-logs.json`

`type` is the action that happened, e.g. `cart.add_item`, `cart.add_item.preview`, `return.create`, or `handoff.create` (escalations also write an audit log here, in addition to the durable record in `shop/handoffs.json`). For a `handoff.create` entry, `customerId` is present only when the escalated sender was a linked customer.

```jsonc
{
  "version": 1,
  "actionLogs": [
    {
      "id": "log-stable-id",
      "type": "cart.add_item",
      "status": "success", // success | failed | preview
      "customerId": "customer-stable-id",
      "summary": "Customer-safe summary of what happened.",
      "createdAt": "2026-05-28T00:00:00.000Z",
      "metadata": {
        "pendingActionId": "pending-stable-id",
        "accountLinkId": "link-customer-channel",
        "channel": "whatsapp",
        "productId": "stable-product-id",
        "quantity": 1
      }
    }
  ]
}
```

## `policies/*.md`

```markdown
# Policy Area

## Customer-Facing Rule

Write only the policy facts the agent may answer from.

## Missing / Unsupported Details

List details the agent must not invent if customers ask.
```

## `routing/escalation-rules.md`

```markdown
# Escalation Rules

## continue

- Calm support or shopping cases that automation may handle.

## handoff_recommended

- Frustration, repeated failed attempts, explicit human requests, or non-urgent disputes.

## urgent_handoff

- Safety, legal, chargeback, harassment, medical/allergy harm, or public escalation threats.
```
