---
name: order-status
description: Look up DeskClaw demo order status and tracking details using MCP-backed shop tools after resolving the linked channel identity.
---

# order-status

Use this skill when a customer asks where their order is, asks for tracking, asks whether an order shipped or arrived, or asks about a recent order's status.

Customers may mention an order number, but the order number is only a filter after account lookup. Never treat a customer-typed order number, email, phone number, or internal customer id as proof of ownership.

## Required safety order

1. Check whether the message should be handled by `sentiment-router` first. If the customer is angry, asks for a human, reports harm, threatens chargeback/legal action, or has a refund/cancellation dispute, do not continue the order-status lookup.
2. Identify the customer with `shop_customer_lookup` when the channel identity is available. Use the channel identity, not a customer-provided order number or customer id, as proof of account ownership.
3. If the customer asks generally about recent orders, call `shop_orders_list_for_channel` with the same channel identity.
4. If the customer names an order number or asks about a specific order, call `shop_order_get` with the same channel identity and the order id or number as a filter.
5. Answer only from the tool result. Keep the reply short and customer-facing.

## Answering rules

When an order is found:

- Include the order number, order status, and total in NT$.
- Summarize the line items by product name and quantity.
- If tracking data exists, include the carrier, tracking status, tracking number, and estimated delivery or delivered time when present.
- Do not expose or invent shipping addresses, phone numbers, payment details beyond the recorded paid status, or any hidden carrier data.

When no linked account or no matching order is found:

- Do not guess from the order number.
- Ask the customer to verify or link their account, or suggest a human teammate.

## Boundaries

- This skill is read-only. It must not change orders, carts, addresses, refunds, returns, cancellations, payment, or tracking records.
- Checkout, cancellation, address changes, autonomous refunds, real carrier integrations, Gmail, WhatsApp/Instagram integration, dashboards, appointment booking, promo codes, and deep-link onboarding are out of scope.
- Return or exchange intake is a future `returns-actions` utility. For now, answer only order status and suggest a human teammate for return-specific next steps.
