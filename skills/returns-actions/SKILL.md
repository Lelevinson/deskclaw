---
name: returns-actions
description: Intake a return or exchange REQUEST against a linked customer's own delivered order with preview and confirmation, then hand off the actual refund/exchange to a human; also read the status of an existing return ("is my refund processed yet?"). Never issues a refund or exchange itself.
---

# returns-actions

Use this skill when a customer wants to return or exchange something they ordered — "I want to return this", "can I exchange the cleanser for a different one?", "this arrived broken, I'd like my money back" — or when they ask about a return they already opened — "is my refund approved yet?", "has my refund been processed?", "what's the status of my return?".

Customers speak naturally and may or may not know an order number or return number. Do not expect them to mention this skill, MCP, tools, customer ids, or internal command names.

This skill **only intakes a request and hands off the money movement.** It never issues a refund, never sends an exchange, and never moves money. Creating a return creates a *request record* for a human teammate to review.

## Required safety order

Intake (return or exchange) follows the same identity → preview → confirm → execute → audit path as every other mutation. Never skip the preview or the confirmation.

1. Check whether the message should be handled by `sentiment-router` first. If the customer is angry, disputing a charge, threatening a chargeback or legal action, or reporting harm from a product, route there instead of intaking a return.
2. Identify the customer with `shop_customer_lookup` using the **channel identity**, not anything the customer typed. A customer-supplied order number, return number, or internal customer id is **not** proof of account ownership.
3. Find the order. If the customer did not give a clear order id, read their orders with `shop_orders_list_for_channel` (or `shop_order_get` for a specific one, via the `order-status` tools) and confirm which order they mean. A return can only be opened against a **delivered** order the linked account owns.
4. Preview the request with `shop_return_preview` using the same channel identity, the chosen `orderId`, the `resolution` (`refund` or `exchange`), and a short customer-stated `reason`.
5. Read the preview back to the customer — the order, whether it is a refund or exchange, and the reason — and ask them to confirm. Make clear that you are submitting a request a teammate will review, not issuing the refund/exchange yourself.
6. After the customer clearly confirms, commit with `shop_return_confirm` using the same channel identity and the `pendingActionId` from the preview.
7. Tell the customer the request is submitted, give them the return id, and explain that a human teammate handles the actual refund or exchange — approved refunds are processed in 5–7 business days. **This is the handoff.** Do not promise an outcome, amount, or date beyond what the policy states.

For a status question ("is my refund processed yet?"):

1. Identify the customer by channel identity as above.
2. Read returns with `shop_returns_list_for_channel` (all of the customer's returns) or `shop_return_get` for a specific return id.
3. Report only the status the record shows. Do not predict or promise a status the record does not have.

## Rules

- Never use raw database access.
- **Never issue, approve, or process a refund or exchange.** You intake a request and hand off; a human teammate and the payment system do the rest. If a customer demands an immediate refund, explain that you can open the request and a teammate handles the money.
- Never mutate a return without explicit customer confirmation. After the customer confirms a preview, commit the existing pending request; do not create another preview unless the previous one expired or the customer changed the order, resolution, or reason.
- Only ever reveal or act on orders and returns the linked account owns. The tools enforce this; never try to work around it.
- A customer quoting an order number or a return number does not prove they own it. Identity is always the channel binding. If a tool reports no matching order or return for the account, say you could not find it on their account — do not confirm or deny that it exists for someone else.
- A return can only be opened on a **delivered** order. If the order has not been delivered (or was cancelled), say it is not eligible for a return yet rather than opening one.
- Only one open return per order. If the customer already has a return in progress for that order, read its status and tell them where it stands instead of opening a duplicate.
- If channel identity or linked account context is missing, unlinked, or revoked, ask the customer to verify or link their account instead of guessing or reading any order or return.
- Never invent order ids, return ids, statuses, amounts, dates, or policy terms. For the generic "how long does a refund take?" timeframe, answer from the returns policy (`policy-oracle`), not by guessing per-return.
- If a shop tool is unavailable or returns an error, explain briefly and suggest a human teammate.
- Keep replies short and customer-facing. Do not reveal internal tool names unless the user is asking as a developer.

## What you can do

- **Intake a return or exchange request** against a delivered order the customer owns, after preview and confirmation. The result is a request in the `requested` state for human review.
- **Report the status of an existing return:** `requested`, `approved`, `rejected`, `refund_processing`, `refunded`, `exchange_shipped`, or `completed`, plus any note attached to it.

Actual refunds, exchanges, cancellations, and order or address changes are handled by a human teammate, not by this skill. Generic policy questions (return window, refund timeframe, who pays return shipping) belong to `policy-oracle`.
