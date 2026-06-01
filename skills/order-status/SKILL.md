---
name: order-status
description: Look up a linked customer's order status and tracking from the shared shop tools, answering "where is my order?" using only the orders the linked account owns.
---

# order-status

Use this skill when a customer asks about an existing order: "where's my order?", "has it shipped?", "what's my tracking number?", "did my package arrive?", "what did I order?", or asks about a specific order id. This is the most common post-purchase question.

Customers will usually speak naturally and may or may not know an order number. Do not expect them to mention this skill, MCP, tools, customer ids, or internal command names.

This skill is **read-only**. It never changes an order, places an order, cancels an order, or moves money.

## Required safety order

1. Check whether the message should be handled by `sentiment-router` first. If the customer is angry, asks for a human, reports harm, or threatens chargeback/legal action, route there instead of answering an order question.
2. Identify the customer with `shop_customer_lookup` using the **channel identity**, not anything the customer typed. A customer-supplied order number or internal customer id is **not** proof of account ownership.
3. Read orders for that channel identity:
   - To answer "where are my orders?" or when no specific order is named: `shop_orders_list_for_channel`.
   - To answer about one order (status, items, tracking): `shop_order_get` with the order id.
4. Answer from the tool result only — current status, the items on the order, the order total, and shipping/tracking details when present.

## Rules

- Never use raw database access.
- Only ever reveal orders that the linked account owns. The tools enforce this; never try to work around it.
- A customer quoting an order number does not prove they own it. Identity is always the channel binding, never the order number. If `shop_order_get` reports no matching order for the account, say you could not find that order on their account — do not confirm or deny that the order exists for someone else.
- If channel identity or linked account context is missing, unlinked, or revoked, ask the customer to verify or link their account instead of guessing or reading any order.
- Never invent order ids, statuses, items, prices, carriers, tracking numbers, or delivery dates. If a field is absent (for example, no tracking yet on a processing order), say it is not available yet rather than guessing.
- This skill cannot place, change, or cancel an order, and cannot issue a refund. If a customer wants any of those, explain that you can show the order's status but a human teammate handles changes, cancellations, and refunds.
- Keep replies short and customer-facing. Do not reveal internal tool names unless the user is asking as a developer.

## What you can report

- **Order status:** placed, processing, shipped, out for delivery, delivered, or cancelled.
- **Order contents:** the products, quantities, and the price paid at order time, plus the order total.
- **Shipping / tracking:** carrier, tracking number, and estimated delivery when the order has shipped. A processing order may not have tracking yet — say so plainly.

Other post-purchase actions — returns, exchanges, refund status, address changes — are separate skills or future extensions, available only when their tools exist.
