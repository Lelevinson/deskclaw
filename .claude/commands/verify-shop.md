---
description: Reset shop state and run the shop backend checks (typecheck + smoke test)
---

Verify the DeskClaw shop backend is healthy. Run these in order and report pass/fail for each:

1. `npm run check` — TypeScript typecheck, no emit.
2. `npm run shop:test` — build + smoke test. This resets `.local/shop-db.json` and runs every identity/cart/confirmation assertion.
3. `npm run shop:reset` — leave a clean runtime DB so a fresh OpenClaw TUI run starts from baseline.

Then summarize: did all steps pass, and is the DB clean (empty cart, 0 pending actions, 0 logs)?

Do not commit anything. This command is verification only.
