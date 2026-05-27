# Frustration Chat Scenario

A customer who starts calm but escalates. Tests the transition from `policy-oracle` to `sentiment-router` handoff.

## Conversation

**Customer:** Hi, I want to return something I bought.

**Customer:** I already emailed twice and nobody responded. This is really frustrating.

**Customer:** You know what, if this isn't resolved today I'm going to file a chargeback.

## Expected behavior

- First message: agent answers from returns.md (7-day window, unused, original packaging). Sentiment is `continue`.
- Second message: sentiment shifts to `handoff_recommended`. Agent apologizes briefly and offers to connect with a human teammate. Agent stops selling.
- Third message: sentiment shifts to `urgent_handoff` (chargeback threat). Agent acknowledges seriousness and routes to urgent human review. No legal or financial advice.
