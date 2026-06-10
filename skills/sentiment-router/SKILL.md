---
name: sentiment-router
description: Classify customer message urgency and decide whether DeskClaw should continue automation, recommend human handoff, or urgently escalate sensitive or frustrated conversations.
---

# sentiment-router

Use this skill when a customer message shows frustration, anger, repeated unresolved problems, refund disputes, safety concerns, threats, sensitive personal issues, or when another skill is unsure whether automation should continue.

## Source of truth

Before deciding whether to escalate, read:

```text
{baseDir}/../../data/routing/escalation-rules.md
```

Use only those routing rules. Do not diagnose the customer, argue with the customer, or invent internal support actions.

## Output format

Answer with:

```text
Route: continue | handoff_recommended | urgent_handoff
Reason: <one short reason>
Suggested reply: <brief customer-facing response>
```

## Routing behavior

- Use `continue` for calm, ordinary support or shopping questions.
- Use `handoff_recommended` for frustration, repeated failed attempts, refund disputes, damaged/wrong-item complaints with anger, or when the customer explicitly asks for a human.
- Use `urgent_handoff` for safety concerns, threats, legal complaints, public social-media escalation threats, chargeback threats, discrimination/harassment claims, or medical/allergy harm.

Keep the suggested reply calm, brief, and human. Do not continue selling when handoff is recommended.

## Persisting the escalation

Classifying is not enough — a handoff needs a durable record a human can act on and audit. After you decide the route:

- For `continue`: **record nothing.** A calm conversation produces no handoff record.
- For `handoff_recommended` or `urgent_handoff`: call `shop_handoff_create` with the channel + `externalUserId` of the sender, the `classification` (the route you chose), a short `category` triage label (for example `refund_dispute`, `safety_reaction`, `human_requested`, `chargeback_threat`), the `reason` (your one-line internal reason), and a short customer-safe `summary` of the situation for the teammate picking it up.

Rules for the record:

- **Identity is optional and must never block the escalation.** Pass the channel + `externalUserId`; the tool links a `customerId` automatically when the sender is linked, and still records the escalation against the raw channel identity when they are unlinked or revoked. Never pass or trust a customer-typed id as proof.
- **It is append-only.** There is no preview/confirm step and no money or account mutation — the record is your escalation judgment, not a customer-authorized action. Each call writes one record (and an audit log); do not call it repeatedly for the same message.
- **Do not change the customer-facing output.** Still answer in the `Route / Reason / Suggested reply` format above. The record is an internal artifact; recording it must not delay or alter the reply you give the customer.

Staff can review escalations with `shop_handoff_list` (and the underlying audit entries with `shop_action_log_list`).

## Notifying the owner (outbound email)

A recorded handoff should also reach a human out-of-band. After `shop_handoff_create` succeeds (so you have the new handoff `id`), email the shop owner with `shop_owner_notify`:

- Pass `kind: "handoff"`, and `dedupeKey: <the handoff id returned by shop_handoff_create>` so the same escalation is never emailed twice.
- **Compose the `subject` and `body` yourself, in your own words — do not paste a template.** Write a short, calm internal note for the teammate who will pick this up. The body should cover, in prose: the `classification` (handoff_recommended / urgent_handoff), a one-line reason, the customer-safe summary, and how to reach the customer (their channel + `externalUserId`/contact). A subject that reads like a brief headline of the situation works well.
- This tool emails the **owner only** — it has no recipient field and can never message the customer. It does not change the customer-facing reply: still answer in the `Route / Reason / Suggested reply` format above. Sending the email is an internal step.
- Only notify for an actual handoff (`handoff_recommended` / `urgent_handoff`). For `continue` you record nothing and send nothing.
- If `shop_owner_notify` fails, do not retry in a loop and do not surface the failure to the customer — the durable handoff record already exists for staff.
