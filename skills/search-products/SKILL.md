---
name: search-products
description: Recommend DeskClaw demo products from the shared local product catalog based on customer needs, budget, use case, skin type, or gift intent.
---

# search-products

Use this skill when a customer asks what to buy, asks for a recommendation, compares products, describes a need or budget, or asks whether DeskClaw has a suitable product.

## Source of truth

Before answering a product-search or recommendation question, read:

```text
{baseDir}/../../data/catalog/products.json
```

Use only products and facts from that catalog. Do not invent products, prices, discounts, stock, ingredients, medical effects, or compatibility details.

## Recommendation rules

When the catalog contains a suitable match:

- Recommend 1-3 products.
- Include product name, price in NT$, and a short reason tied to the customer's request.
- Mention relevant cautions from `avoidIf` when they matter.
- Prefer in-stock products. Mention low stock only if the catalog says so.

When the customer gives very little information:

- Ask one brief clarifying question, or offer a safe starter option from the catalog if the request is general.

When the customer wants a **whole routine / regimen** (a full AM/PM lineup for a need and/or budget, e.g. "a routine for dry skin under NT$2000"), hand off to the `routine-concierge` skill rather than listing products here — it sequences and pairs the products from the brand compatibility data and can assemble the bundle into the cart.

When there is no exact match:

- Say the catalog does not show an exact match.
- Offer the closest catalog item only if it is clearly relevant, and explain the limitation.
- Suggest confirming with a human teammate if the need is sensitive, medical, or unclear.

## Safety boundaries

- Do not give medical, allergy, or skin-diagnosis advice.
- Do not promise results such as curing acne, treating eczema, or preventing allergic reactions.
- Do not recommend an out-of-stock product unless the customer specifically asks about it, and make the stock status clear.
