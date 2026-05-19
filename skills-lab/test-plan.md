# Skills Lab Test Plan

## Purpose

This test plan checks DeskClaw skill ideas in isolation.

The purpose is not to build the final DeskClaw app yet. The purpose is to learn whether repo-managed OpenClaw skills can be discovered, read their bundled reference files, and answer safely before we add production integrations or a full `deskclaw-workspace/`.

## Skills under test

- `policy-oracle`
  - Skill file: `skills/policy-oracle/SKILL.md`
  - Test documents:
    - `skills/policy-oracle/references/shipping.md`
    - `skills/policy-oracle/references/returns.md`
    - `skills/policy-oracle/references/faq.md`
    - `skills/policy-oracle/references/product-care.md`
  - Scenario file: `scenarios/policy-oracle-tests.md`
- `search-products`
  - Skill file: `skills/search-products/SKILL.md`
  - Test document: `skills/search-products/references/products.json`
  - Scenario file: `scenarios/search-products-tests.md`
- `sentiment-router`
  - Skill file: `skills/sentiment-router/SKILL.md`
  - Test document: `skills/sentiment-router/references/escalation-rules.md`
  - Scenario file: `scenarios/sentiment-router-tests.md`

## Behavior to verify

The agent should:

1. Use bundled skill references as the only source of truth.
2. Answer directly when a reference includes the information.
3. Not invent extra policy, product, or escalation details.
4. Say the available reference does not mention the answer when information is missing.
5. Suggest asking a human teammate or route to handoff when the skill rules call for it.

## Automatic skill-loading test steps

1. Configure OpenClaw to scan repo-managed skills:
   ```bash
   openclaw config set skills.load.extraDirs '["/workspaces/deskclaw/skills"]' --strict-json
   ```
2. Remove any older copied workspace skills with the same names:
   ```bash
   rm -rf /home/node/.openclaw/workspace/skills/policy-oracle
   rm -rf /home/node/.openclaw/workspace/skills/search-products
   rm -rf /home/node/.openclaw/workspace/skills/sentiment-router
   ```
3. Run `openclaw skills list` and confirm `policy-oracle`, `search-products`, and `sentiment-router` appear.
4. Start a new OpenClaw session with `/new`, or restart the gateway and TUI.
5. Ask the questions from the scenario files under `scenarios/`.
6. Pass the test only if the agent answers from bundled files in `references/` without needing reference text pasted into the chat.

## Model note

The automatic skill-loading test has worked with `openai-codex/gpt-5.5`. If
`ollama/gemma4:e4b` gives generic "no task found" answers, treat that as a
model/prompt-following issue to debug separately from skill file access.

## Pass criteria

A test passes if the answer:

- Matches a fact or rule in the relevant bundled reference files, or clearly says the available reference does not mention the answer.
- Does not add unsupported details such as carrier names, tracking rules, cut-off times, same-day delivery, coupon codes, payment methods, medical advice, product-specific claims, or internal support actions.
- Uses a helpful customer-service tone.

## Fail criteria

A test fails if the answer:

- Invents a policy, product, or routing detail not found in the bundled reference files.
- Gives a confident answer for missing information.
- Mentions future integrations or final application features that are not part of this skill test.
