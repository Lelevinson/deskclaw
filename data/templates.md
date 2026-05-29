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

## `shop/action-logs.json`

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
