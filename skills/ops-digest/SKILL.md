---
name: ops-digest
description: Compile and email the shop owner a proactive morning ops digest — open handoffs, orders stuck in processing, and low-stock products — by inspecting the shared store read-only. Use when a scheduled run asks for the daily/morning ops digest (no customer is involved).
---

# ops-digest

Use this skill when a **scheduled run** (no human in the conversation) asks you to compile the **morning ops digest** for the shop owner — prompts like "run the morning ops digest", "send the daily ops summary", etc. This is an **internal, owner-facing** task: you inspect the shop **read-only** and email a short summary to the **owner only**. There is no customer here — never message a customer from this skill.

## What the digest covers

Inspect three things, all read-only:

1. **Open handoffs** — escalations a teammate still needs to work. Read with `shop_handoff_list`. Treat records whose `status` is `open` (and, if useful, `acknowledged` / `in_progress`) as needing attention; `resolved` / `closed` do not.
2. **Orders stuck in processing** — orders that have not shipped in a while. Read with `shop_orders_list_ops` using `status: "processing"` and `stalerThanDays: 2` (orders in processing not updated for 2+ days). These are the ones to flag.
3. **Low-stock products** — items at or under the low-stock threshold (this includes anything out of stock). Read with `shop_low_stock_list` (it takes no input; results are scarcest-first).

These three reads are **ops-wide and read-only** — they are the only inspection you do. Do not call any mutating tool, do not look up or contact customers, and do not act on what you find (the digest informs the owner; the owner decides what to do).

## Composing the digest

Write the digest **yourself, in your own words — do not paste a template.** Keep it short and scannable:

- Start with a one-line health summary (e.g. how many items need attention overall, or "all clear").
- Then a short section for each of the three areas above, with the count and the notable items: the oldest / highest-priority open handoffs (classification + category + how to reach the sender), the orders stuck in processing (order id + how long), and the low-stock products (name + remaining quantity), scarcest first.
- Only include what the tools actually returned. Never invent handoffs, orders, products, counts, or quantities.

## Sending it

Email the owner with `shop_owner_notify`:

- Pass `kind: "ops_digest"` and `dedupeKey: <today's date as YYYY-MM-DD>` so the digest is sent **at most once per day** (a re-run the same day is a no-op).
- This emails the **owner only** — it has no recipient field and can never message a customer.
- **Quiet days still send.** If there are no open handoffs, no stuck orders, and nothing low on stock, send a brief "all clear" digest anyway, so the owner knows the proactive run fired and nothing is wrong (silence must not be ambiguous between "all good" and "it didn't run").
- If `shop_owner_notify` fails, do not retry in a loop — the next scheduled run will send the following digest.

## Rules

- Read-only only: the sole write this skill ever causes is the owner notification record (and its audit log) via `shop_owner_notify`. Never touch carts, orders, returns, handoffs, or customer accounts.
- This is owner-facing. There is no customer-facing reply to produce and no customer to contact.
- Never use raw database access; use the tools above. Do not reveal internal tool names in the email body — write it as a plain note to the owner.
