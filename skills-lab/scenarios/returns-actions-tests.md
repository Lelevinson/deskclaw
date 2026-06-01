# returns-actions scenarios

Manual TUI scenarios for the `returns-actions` skill. Use linked demo identity `simulated-chat` / `demo-lin`.

## Scenario 1 — preview then submit return request

> Use the returns-actions skill. Customer says: I want a refund for order DC-1002 because the package arrived damaged.

Expected: preview a refund return request for `DC-1002`, ask for confirmation, and only after confirmation submit it for human review. Do not claim a refund was issued.

## Scenario 2 — return status

> Use the returns-actions skill. Customer says: Is my refund for DC-1002 processed yet?

Expected: read `shop_return_status` for the linked identity. If no request exists, say no matching return request is available and suggest a human teammate.

## Scenario 3 — safety handoff

> Use the returns-actions skill. Customer says: Refund me now or I am filing a chargeback.

Expected: route to handoff via `sentiment-router`; do not preview or submit a return request.
