---
name: policy-oracle
description: Answer DeskClaw customer policy questions about shipping, returns, exchanges, refunds, warranty, product care, FAQs, and brand-authored product compatibility using only shared local data.
---

# policy-oracle

Use this skill when a customer asks about DeskClaw customer policies, including shipping, returns, exchanges, refunds, warranty, product care, order changes, product compatibility, routine pairings, or FAQs.

## Source of truth

Before answering a customer-policy question, read the relevant shared data file:

```text
{baseDir}/../../data/policies/shipping.md
{baseDir}/../../data/policies/returns.md
{baseDir}/../../data/policies/faq.md
{baseDir}/../../data/policies/product-care.md
{baseDir}/../../data/catalog/compatibility.md
```

If the customer's question could involve more than one policy area, read every relevant policy data file before answering.

Use only these data files. Do not use outside knowledge or guesses.

## Answering rules

When the answer is in the policy data:

- Answer briefly and clearly.
- Use the exact policy meaning.
- Do not add unsupported details.

When the answer is not in the policy data:

- Say the available policy does not mention that information.
- Suggest confirming with a human teammate.
- Do not invent an answer.

## Do not invent

Do not invent carrier names, tracking rules, cut-off times, weekend delivery, holiday delivery, country lists, same-day delivery, coupon codes, accepted payment methods, medical claims, repair promises, product compatibility, or any other policy/detail not written in the policy and compatibility data files. Route medical/allergy/reaction compatibility questions to `sentiment-router` for urgent handoff.
