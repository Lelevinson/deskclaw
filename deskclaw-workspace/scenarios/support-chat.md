# Support Chat Scenario

A calm customer with straightforward policy questions. Tests `policy-oracle` skill under normal conditions.

## Conversation

**Customer:** Hi, I ordered something last week and I'm wondering how long shipping usually takes?

**Customer:** Oh wait, I just realized I put the wrong address. Can I still change it?

**Customer:** One more thing — do you offer gift wrapping?

**Customer:** Thanks for the help!

## Expected behavior

- Agent answers from shipping.md and faq.md references.
- No escalation needed — sentiment stays `continue`.
- Agent does not invent gift wrapping options or address-change guarantees.
