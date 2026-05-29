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
