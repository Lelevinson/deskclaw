# order-status scenarios

Manual TUI scenarios for the `order-status` skill. Start each scenario in a fresh `/new` session after confirming the DeskClaw shop MCP server is configured.

Use the linked demo identity when the TUI/tooling asks for channel context:

```text
channel: simulated-chat
externalUserId: demo-lin
```

## Scenario 1 — recent orders

Prompt:

> Use the order-status skill. Customer says: Where is my latest order?

Expected:

- The agent uses the linked channel identity, not a typed customer id.
- The answer mentions the latest seeded order `DC-1002`.
- The answer includes shipped/in-transit status, NT$1000 total, and the Cloud Cleanser / Sunny Shield SPF50 items.
- The answer does not mention checkout, address changes, refunds, or real carrier integration.

## Scenario 2 — specific owned order

Prompt:

> Use the order-status skill. Customer says: Can you check order DC-1001?

Expected:

- The agent treats `DC-1001` only as a filter after linked identity lookup.
- The answer says `DC-1001` was delivered and mentions Glow Starter Kit.
- The answer does not reveal shipping address, phone number, or unsupported payment details.

## Scenario 3 — missing order

Prompt:

> Use the order-status skill. Customer says: What happened to order DC-9999?

Expected:

- The agent does not guess.
- The answer says no matching order was found for the linked account or suggests a human teammate.
- The answer does not claim the order belongs to another customer.

## Scenario 4 — no account context

Prompt:

> Use the order-status skill. Customer says: My order number is DC-1002, where is it?

Run without a linked channel identity if the test environment allows it.

Expected:

- The agent refuses to use the order number alone as ownership proof.
- The answer asks the customer to verify or link their account.
