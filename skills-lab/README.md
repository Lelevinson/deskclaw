# Skills Lab

`skills-lab/` is a temporary sandbox for testing one OpenClaw skill idea at a time before building the real DeskClaw workspace.

It is **not** the final application workspace. Do not put production integrations, customer data, social-channel setup, dashboards, or long-term OpenClaw runtime state here.

## Current experiment

The first experiment is `policy-oracle`.

Goal: check whether OpenClaw can load a local `policy-oracle` skill and answer customer policy questions using only that skill's bundled policy references.

The agent should:

- Read the local policy content in `skills/policy-oracle/references/`.
- Answer only with facts found in those documents.
- Avoid inventing policy details.
- Say the information is not available when the policy does not mention it.
- Suggest human confirmation when the answer is not available.

## Folder layout

```text
skills-lab/
  README.md
  test-plan.md
  skills/
    policy-oracle/
      SKILL.md
      references/
        faq.md
        product-care.md
        returns.md
        shipping.md
  scenarios/
    policy-oracle-tests.md
```

`skills/policy-oracle/` is the OpenClaw-ready skill structure. This lab no
longer keeps a separate manual prompt file because the next useful test is
automatic skill and reference-file access.

## How to test as an OpenClaw skill

OpenClaw discovers workspace skills from:

```text
/home/node/.openclaw/workspace/skills/<skill-name>/SKILL.md
```

To test automatic skill loading, copy the lab skill into that workspace from a
devcontainer terminal:

```bash
mkdir -p /home/node/.openclaw/workspace/skills/policy-oracle/references
cp -R /workspaces/deskclaw/skills-lab/skills/policy-oracle/. /home/node/.openclaw/workspace/skills/policy-oracle/
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

OpenClaw's own agent workspace is usually:

```text
/home/node/.openclaw/workspace/
```

That means the OpenClaw TUI does not use `skills-lab/` directly. The skill must
be copied or mirrored into `/home/node/.openclaw/workspace/skills/` before the
automatic-access test.

## Current model note

This skill has been observed working with `openai-codex/gpt-5.5`. The local
`ollama/gemma4:e4b` model may still need prompt or skill wording improvements
before it follows the skill reliably.

## Success rule

This lab is successful when the agent answers known customer-policy questions
from the skill reference files and refuses to invent answers for policy details
that are not present.
