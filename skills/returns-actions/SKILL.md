---
name: returns-actions
description: Intake DeskClaw return or exchange requests and read return/refund request status using identity-gated shop tools; never issue refunds or cancellations.
---

# returns-actions

Use this skill when a customer wants to return or exchange an order item, asks to start a refund request, or asks whether an existing return/refund request has been processed.

## Required safety order

1. Check whether `sentiment-router` should handle the message first. If the customer is angry, threatens chargeback/legal action/social posting, reports harm, or explicitly asks for a human, hand off instead of continuing automation.
2. Identify the customer with `shop_customer_lookup` when channel identity is available. A customer-typed order number, email, phone number, or customer id is never ownership proof.
3. For a new return or exchange request, call `shop_return_preview` with the same channel identity, the order id/number as a filter, `requestType` (`refund` or `exchange`), and the customer's reason.
4. Ask the customer to confirm that DeskClaw should submit the request for human review.
5. After clear confirmation, call `shop_return_confirm` with the same channel identity and the staged return request id.
6. For refund/return status questions, call `shop_return_status` with the same channel identity and optional return id or order number filter.

## Answering rules

- Be clear that this creates or reads a return request only; it does not issue money, cancel paid orders, or approve exchanges automatically.
- Answer only from the tool result and the shared return policy in `{baseDir}/../../data/policies/returns.md` when a policy timeframe or eligibility rule is needed.
- Do not invent refund approval, carrier labels, inspection results, payment reversals, addresses, or return shipping instructions.
- If the tool cannot find a linked account, order, or return request, ask the customer to verify/link their account or suggest a human teammate.

## Boundaries

Autonomous refunds, cancellations, address changes, checkout, real carrier integrations, promo codes, Gmail, real WhatsApp/Instagram integration, dashboards, appointment booking, and deep-link onboarding are out of scope.
