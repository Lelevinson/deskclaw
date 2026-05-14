# Policy Oracle Test Plan

## Purpose

This test plan checks the first DeskClaw skill idea, `policy-oracle`, in isolation.

The purpose is not to build the final DeskClaw app yet. The purpose is to learn whether a local policy-answering skill can be discovered by OpenClaw, read its bundled reference files, and answer safely before we add product-search skills, sentiment routing, or a full `deskclaw-workspace/`.

## Skill under test

- Skill name: `policy-oracle`
- OpenClaw-ready skill: `skills/policy-oracle/SKILL.md`
- Test documents:
  - `skills/policy-oracle/references/shipping.md`
  - `skills/policy-oracle/references/returns.md`
  - `skills/policy-oracle/references/faq.md`
  - `skills/policy-oracle/references/product-care.md`
- Test scenario file: `scenarios/policy-oracle-tests.md`

## Behavior to verify

The agent should:

1. Use the bundled policy references as the only source of truth.
2. Answer directly when the policy includes the information.
3. Not invent extra policy details.
4. Say the available policy does not mention the answer when information is missing.
5. Suggest asking a human teammate when information is missing or unclear.

## Automatic skill-loading test steps

1. Configure OpenClaw to scan repo-managed skills:
   ```bash
   openclaw config set skills.load.extraDirs '["/workspaces/deskclaw/skills"]' --strict-json
   ```
2. Remove any older copied workspace skill with the same name:
   ```bash
   rm -rf /home/node/.openclaw/workspace/skills/policy-oracle
   ```
3. Run `openclaw skills list` and confirm `policy-oracle` appears.
4. Start a new OpenClaw session with `/new`, or restart the gateway and TUI.
5. Ask the questions from `scenarios/policy-oracle-tests.md`.
6. Pass the test only if the agent answers from the bundled files in `references/` without needing policy text pasted into the chat.

## Model note

The automatic skill-loading test has worked with `openai-codex/gpt-5.5`. If
`ollama/gemma4:e4b` gives generic "no task found" answers, treat that as a
model/prompt-following issue to debug separately from skill file access.

## Pass criteria

A test passes if the answer:

- Matches a fact in the bundled policy reference files, or clearly says the available policy does not mention the answer.
- Does not add unsupported details such as carrier names, tracking rules, cut-off times, same-day delivery, coupon codes, payment methods, medical advice, or product-specific claims.
- Uses a helpful customer-service tone.

## Fail criteria

A test fails if the answer:

- Invents a policy detail not found in the bundled policy reference files.
- Gives a confident answer for missing information.
- Mentions future integrations or final application features that are not part of this skill test.
