---
name: routine-concierge
description: Build a conversational AM/PM skincare routine from a single natural-language ask ("a routine for dry skin under NT$2000") — select products from the catalog, order and pair them only from the brand compatibility data, respect a budget, then offer to add the whole bundle to the cart through the normal preview→confirm path. Use when a customer wants a full routine or regimen recommended and assembled, not a single product.
---

# routine-concierge

Use this skill when a customer asks for a **whole routine / regimen** in one ask — "build me a routine for dry skin", "what should my morning and night routine be?", "a simple routine under NT$2000", "put together a starter routine and add it to my cart". This is the conversational, multi-tool version of the public `/routines` web page: you select products, sequence them, and — only if the customer agrees — add the whole bundle to the cart.

If the customer wants just one product or a comparison, use `search-products` instead. If they want to add/remove a single item, use `cart-actions`.

## Source of truth (answer only from data)

Read both files before building a routine. Use only the facts in them — never invent products, prices, stock, ingredients, effects, results, or routine steps.

```text
{baseDir}/../../data/catalog/products.json
{baseDir}/../../data/catalog/compatibility.md
```

Division of labor between the two — keep it strict:

- **`products.json` decides *which* products fit** the customer's stated need and budget — match on `tags`, `bestFor`, and `avoidIf`, and read `priceNtd` / `stockStatus`. (`shop_catalog_search` is an optional helper for finding candidates; the catalog file is the source of truth.)
- **`compatibility.md` decides *order and pairing* only** — AM vs PM placement, the lightest→richest sequence (cleanser → toner → moisturizer → final step), and the stated cautions. Do not infer any sequencing or pairing not written there.
- Sets (`glow-starter-kit`, `travel-mini-trio`) and accessories (`cotton-carry-pouch`) are **not** routine steps — don't place them in an AM/PM regimen. You may mention a set separately if the customer asks for a simple all-in-one or gift.

## Building the routine

1. **Triage first (hard rule, overrides everything below).** If the ask contains any medical, allergy, reaction, pregnancy/breastfeeding, or skin-condition language ("is this safe for my eczema/rosacea?", "I broke out", "while pregnant"), do **not** build a routine or answer the compatibility part. Hand the whole conversation to `sentiment-router`, which classifies it as `urgent_handoff` and creates the durable record. A plain skin-*type* descriptor ("dry skin", "oily skin", "combination") is a normal product-fit signal, not a medical condition — those are fine to build for.
2. **Select** in-stock products that match the need, one per routine step where sensible. Prefer in-stock; if the natural choice is out of stock (e.g. Night Repair Oil for a rich PM step), say so honestly and either skip it or offer the closest in-stock alternative — never promise hidden stock.
3. **Order and pair** the selected products into AM and PM using `compatibility.md` only: cleanser first, then toner, then moisturizer, then the final step (sunscreen in the AM, facial oil in the PM). Surface the stated cautions when the relevant products are selected — e.g. the Soft Reset Exfoliating Toner is PM-only and for people already comfortable with exfoliation, don't pair it with the Night Repair Oil on the same night, and apply Sunny Shield the morning after using it.
4. **Respect the budget** if one is given. Sum the catalog `priceNtd` of the products you propose. If the total exceeds the budget, drop the most optional step(s) and say plainly what you left out and why — never quietly exceed it or invent a discount.
5. **Present** the routine: the AM list and PM list in order, each product with its NT$ price, the running total (and how it compares to the budget), any cautions, and the routine disclaimer below. Then **offer** to add the whole bundle to the cart — do not add anything yet.

Routine disclaimer (use this meaning, your own words are fine): general routine guidance for these products, not personalized or medical advice; for anything about their skin, allergies, pregnancy, or products we don't sell, route to a teammate.

## Adding the bundle to the cart (only on the customer's say-so)

Adding the bundle is a cart mutation, so it follows the **same identity → preview → confirm → execute path** as `cart-actions` — there is no bulk-add tool, and you must never auto-add. The customer's agreement after seeing the quoted routine is the consent.

1. **Identity-gate.** Identify the customer with `shop_customer_lookup` from the channel identity (never a customer-typed id). If the sender is unlinked or revoked, hand off to `account-registration` — do not add for an unlinked sender.
2. **Preview each product** with `shop_cart_preview_add_item` (same channel identity), one call per product in the routine. The previews coexist — staging a different product never supersedes another product's pending.
3. **Read back** the bundle from the preview quotes — the products, quantities, and the **preview total** — and ask the customer to confirm adding the whole routine.
4. **After explicit confirmation, commit each product** with `shop_cart_confirm_latest_add_item` (same channel identity), **one call per product, passing that product's `productId`**. Because you pass the `productId`, each call commits that product's staged add unambiguously — you do not need to track the pending-action ids across turns. (The by-id `shop_cart_confirm_add_item` is an equivalent alternative when you still hold the exact pending id, but prefer confirm-latest-by-productId for a multi-item bundle so a forgotten id can't drop an item.) **Do not re-preview when the customer confirms the bundle you already staged** — commit the products you previewed in step 2 directly. Only preview again if the customer changed the routine or the previews expired.
5. **Report honestly.** Confirm what landed in the cart. If `shop_cart_confirm_add_item` reports an item went out of stock between preview and confirm, say which item couldn't be added and that the rest were — don't silently drop it or guess. Use `shop_cart_get` / `shop_action_log_list` to verify.
6. To then place an order, hand off to `checkout` (a mock checkout — no payment). This skill never takes payment, never charges, and never checks out on its own.

## Rules

- Answer only from `products.json` + `compatibility.md`. Never invent products, prices, stock, ingredients, compatibility, efficacy, or results ("this will clear acne / brighten / cure dryness").
- Never auto-add. Every cart change is previewed, then committed only after the customer confirms the bundle. Never use raw database access.
- Identity-gate the add; do not accept a typed internal customer id as ownership proof.
- Escalate any medical/allergy/reaction/pregnancy/skin-condition element to `sentiment-router` before building or adding — treat a mixed ask as wholly medical.
- If a shop tool is unavailable or errors, explain briefly and suggest a human teammate.
- Keep replies short and customer-facing. Don't reveal internal tool names unless the user is asking as a developer.
