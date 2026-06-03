# skills-lab/

Manual evaluation scenarios for repo skills. **This folder is not a skill source.**

- Skill behavior lives under [`../skills/`](../skills/).
- Shared facts live under [`../data/`](../data/).
- This folder should contain only lab instructions and scenario prompts.

For OpenClaw setup and the `skills.load.extraDirs` command, see [`../docs/openclaw/setup.md`](../docs/openclaw/setup.md).

## Layout

```text
skills-lab/
  README.md
  scenarios/
    policy-oracle-tests.md
    product-compatibility-tests.md
    search-products-tests.md
    sentiment-router-tests.md
    cart-actions-tests.md
    order-status-tests.md
    returns-actions-tests.md
```

The `product-compatibility-tests.md` scenarios exercise the `policy-oracle` skill (compatibility/routine answers from `data/catalog/compatibility.md`), so they need no separate skill registration.

Do not add a `skills/` folder here. If a skill changes, edit [`../skills/`](../skills/) and update the matching scenario only when the expected behavior changes.

## Automated agent-layer eval (`npm run agent:eval`)

The prose scenarios below are run manually in the TUI. A subset of the
**model-in-the-loop** behavior is now also automated by
[`../src/cli/agent-eval.ts`](../src/cli/agent-eval.ts) (cases in
[`../src/cli/agent-eval-cases.ts`](../src/cli/agent-eval-cases.ts)), the incremental
follow-up the skill-roadmap §5 left open. It drives the **real agent** through the
running Gateway (one `openclaw agent` turn per step) and asserts what the
tool-level `npm run shop:eval` can't: skill routing, answer-only-from-data,
escalation to a durable handoff record, and preview→confirm before a mutation.

```bash
openclaw gateway          # needs a configured model (this repo: openai-codex/gpt-5.5 via Codex login)
npm run agent:eval        # builds, then runs every case; named PASS/FAIL, non-zero exit on failure
```

Notes:
- **Needs a running Gateway + model.** If the Gateway is unreachable the harness
  SKIPS (exit 0) with guidance rather than failing.
- **It is model-in-the-loop, so not perfectly deterministic.** Assertions lean on
  the stable signals (which `shop_*` tools were called, shared-store deltas) and
  keep reply-text regexes loose; an occasional flake is re-run, not a regression.
- **It mutates the shared store** (`.local/shop-db.json`) the Gateway uses — it
  resets around cases and once at the end, so don't run it during a live chat you
  care about; `npm run shop:reset` restores a clean demo.
- **Identity-gated skills:** the shop MCP tools take `channel`/`externalUserId` as
  explicit arguments the model supplies from the message's channel context. A bare
  CLI turn has no channel adapter, so gated cases (order-status, cart, returns)
  state the linked sender in-prompt (`+886900000001` → `customer-demo-lin`) to
  simulate what the WhatsApp adapter asserts. The safety-critical gating itself
  (unlinked/non-owned refusals, ownership, audit) stays covered deterministically
  by `npm run shop:eval` at the tool layer.

## How to run the scenarios (manual TUI)

1. Confirm OpenClaw is configured and can see the skills:

   ```bash
   openclaw skills list
   ```

   `policy-oracle`, `search-products`, `sentiment-router`, and `cart-actions` should appear. If they don't, see [`setup.md`](../docs/openclaw/setup.md).

2. Start the gateway and TUI:

   ```bash
   openclaw gateway
   openclaw tui
   ```

3. In the TUI, start a fresh session with `/new`, then paste prompts from `scenarios/<skill>-tests.md`. The agent should answer from repo data files — you should never need to paste reference text into the chat.

Some scenario prompts include phrases such as "Use the search-products skill" to force manual lab routing. Real customer messages should not need those phrases; the skill descriptions under [`../skills/`](../skills/) are what tell OpenClaw when normal customer wording should activate a skill.

## Expected agent behavior

The agent should:

1. Use only the referenced repo data files as facts.
2. Answer directly when the repo data contains the information.
3. Say *"the available data does not mention that"* when the information is missing — never invent.
4. Suggest a human teammate or trigger handoff when the skill's rules require it.

## Pass / fail criteria

A scenario **passes** if the answer:

- Matches a fact in the relevant repo data file, or clearly states the data doesn't cover it.
- Adds no unsupported details (carrier names, cut-off times, coupon codes, payment methods, medical claims, product-specific compatibility, internal support actions).
- Uses a helpful customer-service tone.

A scenario **fails** if the answer:

- Invents a policy, product, or routing detail not in the repo data.
- Gives a confident answer for information that is actually missing.
- Mentions future integrations or final-application features that are not part of the skill.

## Known model behavior

Scenarios can be run against either model option (see [`setup.md §6`](../docs/openclaw/setup.md#6-models)). `gpt-5.5` via Codex has been the more reliable skill-follower so far; the local Ollama model has sometimes returned generic "no task found" responses. If that happens, start a fresh session with `/new`, confirm `openclaw skills list` still shows the skill, and treat skill-prompt clarity as the first thing to fix before switching models.
