# sentiment-router Test Scenarios

Use these questions in OpenClaw TUI after following the setup steps in [`../README.md`](../README.md) and starting a fresh session.

The expected response format is:

```text
Route: continue | handoff_recommended | urgent_handoff
Reason: <one short reason>
Suggested reply: <brief customer-facing response>
```

## Test 1: Calm policy question

**Customer message:**

> Use the sentiment-router skill. Customer says: How long does standard shipping take?

**Expected result:**

The agent should classify this as `continue`.

**Pass if:**

- The route is `continue`.
- The reason says this is a normal policy or support question.
- The suggested reply does not escalate unnecessarily.

## Test 2: Calm product question

**Customer message:**

> Use the sentiment-router skill. Customer says: I am looking for a moisturizer under NT$700.

**Expected result:**

The agent should classify this as `continue`.

**Pass if:**

- The route is `continue`.
- The reason says this can continue as normal product guidance.
- The suggested reply does not mention a human handoff.

## Test 3: Explicit human request

**Customer message:**

> Use the sentiment-router skill. Customer says: I want to talk to a real person now.

**Expected result:**

The agent should classify this as `handoff_recommended`.

**Pass if:**

- The route is `handoff_recommended`.
- The reason mentions the customer asked for a human or real person.
- The suggested reply says a human teammate should help.

## Test 4: Frustrated repeated issue

**Customer message:**

> Use the sentiment-router skill. Customer says: I already asked twice and nobody fixed this. This is so frustrating.

**Expected result:**

The agent should classify this as `handoff_recommended`.

**Pass if:**

- The route is `handoff_recommended`.
- The reason mentions frustration or repeated unresolved attempts.
- The suggested reply does not keep pushing automation.

## Test 5: Angry wrong item complaint

**Customer message:**

> Use the sentiment-router skill. Customer says: You sent the wrong item and I am really angry. I want this fixed.

**Expected result:**

The agent should classify this as `handoff_recommended`.

**Pass if:**

- The route is `handoff_recommended`.
- The reason mentions anger and wrong item.
- The suggested reply apologizes briefly and routes to a human teammate.

## Test 6: Refund dispute

**Customer message:**

> Use the sentiment-router skill. Customer says: My refund still has not arrived and I am tired of waiting.

**Expected result:**

The agent should classify this as `handoff_recommended`.

**Pass if:**

- The route is `handoff_recommended`.
- The reason mentions refund dispute, waiting, or frustration.
- The suggested reply does not promise a refund result.

## Test 7: Allergy or injury concern

**Customer message:**

> Use the sentiment-router skill. Customer says: I used the product and my skin is burning. What should I do?

**Expected result:**

The agent should classify this as `urgent_handoff`.

**Pass if:**

- The route is `urgent_handoff`.
- The reason mentions safety, skin reaction, medical harm, or allergy concern.
- The suggested reply avoids medical advice and says a human should review urgently.

## Test 8: Chargeback threat

**Customer message:**

> Use the sentiment-router skill. Customer says: If you do not fix this today I will file a chargeback.

**Expected result:**

The agent should classify this as `urgent_handoff`.

**Pass if:**

- The route is `urgent_handoff`.
- The reason mentions chargeback threat.
- The suggested reply routes to urgent human review.

## Test 9: Public social media threat

**Customer message:**

> Use the sentiment-router skill. Customer says: I am going to post this all over Instagram if you ignore me again.

**Expected result:**

The agent should classify this as `urgent_handoff`.

**Pass if:**

- The route is `urgent_handoff`.
- The reason mentions public complaint or social-media escalation.
- The suggested reply stays calm and does not argue.

## Test 10: Resolved complaint

**Customer message:**

> Use the sentiment-router skill. Customer says: Thanks, that solved my problem.

**Expected result:**

The agent should classify this as `continue`.

**Pass if:**

- The route is `continue`.
- The reason says the complaint appears resolved or the tone is calm.
- The suggested reply does not escalate unnecessarily.
