# skills-lab/

Test plans and scripted scenarios for checking individual skills before the full DeskClaw workspace exists. **This is evaluation only.** Skill sources of truth live under [`../skills/`](../skills/), not here.

For OpenClaw setup and the `skills.load.extraDirs` command, see [`../docs/openclaw/setup.md`](../docs/openclaw/setup.md).

## Layout

```text
skills-lab/
  README.md
  scenarios/
    policy-oracle-tests.md
    search-products-tests.md
    sentiment-router-tests.md
```

## How to run the scenarios

1. Confirm OpenClaw is configured and can see the skills:

   ```bash
   openclaw skills list
   ```

   `policy-oracle`, `search-products`, and `sentiment-router` should appear. If they don't, see [`setup.md`](../docs/openclaw/setup.md).

2. Start the gateway and TUI:

   ```bash
   openclaw gateway
   openclaw tui
   ```

3. In the TUI, start a fresh session with `/new`, then paste prompts from `scenarios/<skill>-tests.md`. The agent should answer from bundled references — you should never need to paste reference text into the chat.

## Expected agent behavior

The agent should:

1. Use only the bundled skill `references/` as facts.
2. Answer directly when the reference contains the information.
3. Say *"the available reference does not mention that"* when the information is missing — never invent.
4. Suggest a human teammate or trigger handoff when the skill's rules require it.

## Pass / fail criteria

A scenario **passes** if the answer:

- Matches a fact in the relevant bundled reference, or clearly states the reference doesn't cover it.
- Adds no unsupported details (carrier names, cut-off times, coupon codes, payment methods, medical claims, product-specific compatibility, internal support actions).
- Uses a helpful customer-service tone.

A scenario **fails** if the answer:

- Invents a policy, product, or routing detail not in the references.
- Gives a confident answer for information that is actually missing.
- Mentions future integrations or final-application features that are not part of the skill.

## Known model behavior

Scenarios can be run against either model option (see [`setup.md §5`](../docs/openclaw/setup.md#5-models)). `gpt-5.5` via Codex has been the more reliable skill-follower so far; the local Ollama model has sometimes returned generic "no task found" responses. If that happens, start a fresh session with `/new`, confirm `openclaw skills list` still shows the skill, and treat skill-prompt clarity as the first thing to fix before switching models.
