---
description: Reset shop state and run the shop backend checks (typecheck + eval harness)
---

Verify the DeskClaw shop backend is healthy. Run these in order and report pass/fail for each:

1. `npm run check` — TypeScript typecheck, no emit.
2. `npm run shop:eval` — build + the tool-level eval harness. It runs against a temp sandbox DB (it does **not** touch `.local/shop-db.json`, so it is safe during a live session), resetting from the `data/` baseline per test, and runs every identity, ownership, preview→confirm, expiry, refusal, and audit-log assertion across all three cart action types plus catalog search. Each assertion prints a named PASS/FAIL; the run exits non-zero if any fails. (`npm run shop:test` is an alias for the same harness.)
3. `npm run shop:reset` — leave a clean runtime DB so a fresh OpenClaw TUI run starts from baseline.

Then summarize: did all steps pass, and is the DB clean (empty cart, 0 pending actions, 0 logs)?

Do not commit anything. This command is verification only.
