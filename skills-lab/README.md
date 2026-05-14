# Skills Lab

`skills-lab/` contains test plans and scripted scenarios for checking one OpenClaw skill idea at a time before building the full DeskClaw workspace.

It is **not** the skill source of truth and not the final application workspace. Do not put production integrations, customer data, social-channel setup, dashboards, or long-term OpenClaw runtime state here.

## Current experiment

The first experiment is `policy-oracle`.

Goal: check whether OpenClaw can load the repo-managed `policy-oracle` skill and answer customer policy questions using only that skill's bundled policy references.

The agent should:

- Read the local policy content in `/workspaces/deskclaw/skills/policy-oracle/references/`.
- Answer only with facts found in those documents.
- Avoid inventing policy details.
- Say the information is not available when the policy does not mention it.
- Suggest human confirmation when the answer is not available.

## Folder layout

```text
skills-lab/
  README.md
  test-plan.md
  scenarios/
    policy-oracle-tests.md
```

The OpenClaw-ready skill structure lives outside this lab:

```text
../skills/policy-oracle/
  SKILL.md
  references/
    faq.md
    product-care.md
    returns.md
    shipping.md
```

## How to test as an OpenClaw skill

Configure OpenClaw once so it scans the repo-managed skills folder:

```bash
openclaw config set skills.load.extraDirs '["/workspaces/deskclaw/skills"]' --strict-json
```

If an older copied skill exists with the same name, remove it so the repo-managed skill is the version under test:

```bash
rm -rf /home/node/.openclaw/workspace/skills/policy-oracle
```

Then check whether OpenClaw sees the skill:

```bash
openclaw skills list
```

Start or restart the gateway and TUI:

```bash
openclaw gateway
```

```bash
openclaw tui
```

In the TUI, start a fresh session:

```text
/new
```

Then ask:

```text
Use the policy-oracle skill. How long does standard shipping take?
```

Continue with the remaining questions in `scenarios/policy-oracle-tests.md`.
You should not need to paste the policy text into the chat.

## Important path note

This lab lives in the git repo at:

```text
/workspaces/deskclaw/skills-lab/
```

The canonical skill lives in:

```text
/workspaces/deskclaw/skills/policy-oracle/
```

OpenClaw does not use `skills-lab/` directly. It loads the skill from the configured repo skill root.

## Current model note

This skill has been observed working with `openai-codex/gpt-5.5`. The local
`ollama/gemma4:e4b` model may still need prompt or skill wording improvements
before it follows the skill reliably.

## Success rule

This lab is successful when the agent answers known customer-policy questions
from the skill reference files and refuses to invent answers for policy details
that are not present.
