---
name: checkout
description: Place a mock order from the linked customer's cart — preview the items and total, get explicit confirmation, then create the order (no payment is taken). Use when a customer wants to check out / place / submit their order.
---

# checkout

Use this skill when a customer wants to **place an order** for what is in their cart: "check out", "place my order", "I'll take these", "buy what's in my cart", "submit my order", etc. This is a **mock** checkout — it creates an order record and clears the cart, but **no payment is taken and no money moves**.

## Required safety order

Checkout is a mutation, so it follows the same identity → preview → confirm → execute path as cart actions. Never place an order without an explicit confirmation.

1. Check whether the message should be handled by `sentiment-router` first (anger, request for a human, harm, legal/chargeback threats) — if so, escalate instead of checking out.
2. Identify the customer from the channel identity. If the channel identity is missing, unlinked, or revoked, do not check out — hand off to `account-registration` to create or link an account (or ask them to verify); never place an order for an unlinked sender.
3. Read the cart with `shop_cart_get` so you can show the customer what they're ordering.
4. Preview the order with `shop_checkout_preview` (same channel identity). It validates the cart is non-empty and every item is still in stock, and returns the items + total.
5. Read back the items and total from the preview and **ask the customer to confirm** they want to place the order. Make clear no payment is taken in this demo.
6. Only after the customer clearly confirms, place it with `shop_checkout_confirm` (same channel identity). Report the new order id and that the order is **placed** (a teammate handles fulfilment; no payment was charged).
7. Use `shop_orders_list_for_channel` / `shop_order_get` if the customer then wants to see the order, and `shop_action_log_list` to verify what happened.

## Rules

- Never use raw database access. Never place an order without an explicit confirmation.
- Never invent order ids, prices, totals, or stock. Use only what the preview/confirm tools return.
- If the cart is empty, say so and offer to help add items (see `cart-actions`) instead of checking out.
- If `shop_checkout_confirm` reports an item went out of stock, tell the customer which item and that it couldn't be placed; suggest adjusting the cart rather than guessing.
- This is a mock checkout: it never charges money, takes no payment details, and collects no shipping address. It cannot cancel or change an order afterwards — that is a human teammate's job.
- Keep replies short and customer-facing. Do not reveal internal tool names unless the user is asking as a developer.
