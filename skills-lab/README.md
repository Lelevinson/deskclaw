# Skills Lab

`skills-lab/` contains test plans and scripted scenarios for checking individual OpenClaw skill ideas before building the full DeskClaw workspace.

It is **not** the skill source of truth and not the final application workspace. Do not put production integrations, customer data, social-channel setup, dashboards, or long-term OpenClaw runtime state here.

## Current experiments

The current skill experiments are:

- `policy-oracle`: answer customer policy questions using bundled policy references.
- `search-products`: recommend products using a bundled demo product catalog.
- `sentiment-router`: decide whether automation should continue or hand off to a human.

The agent should:

- Read only the relevant local references under `/workspaces/deskclaw/skills/<skill-name>/references/`.
- Answer only with facts found in those references.
- Avoid inventing policy details, product facts, or escalation actions.
- Say the information is not available when the relevant reference does not mention it.
- Suggest human confirmation or handoff when the skill rules call for it.

## Folder layout

```text
skills-lab/
  README.md
  test-plan.md
  scenarios/
    policy-oracle-tests.md
    search-products-tests.md
    sentiment-router-tests.md
```

The OpenClaw-ready skill structures live outside this lab:

```text
../skills/
  policy-oracle/
    SKILL.md
    references/
      faq.md
      product-care.md
      returns.md
      shipping.md
  search-products/
    SKILL.md
    references/
      products.json
  sentiment-router/
    SKILL.md
    references/
      escalation-rules.md
```

## How to test as an OpenClaw skill

Configure OpenClaw once so it scans the repo-managed skills folder:

```bash
openclaw config set skills.load.extraDirs '["/workspaces/deskclaw/skills"]' --strict-json
```

If older copied skills exist with the same names, remove them so the repo-managed skills are the versions under test:

```bash
rm -rf /home/node/.openclaw/workspace/skills/policy-oracle
rm -rf /home/node/.openclaw/workspace/skills/search-products
rm -rf /home/node/.openclaw/workspace/skills/sentiment-router
```

Then check whether OpenClaw sees the skills:

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

Then ask one of the scenario prompts, for example:

```text
Use the policy-oracle skill. How long does standard shipping take?
```

Continue with the remaining questions in `scenarios/`.
You should not need to paste reference text into the chat.

## Important path note

This lab lives in the git repo at:

```text
/workspaces/deskclaw/skills-lab/
```

The canonical skills live in:

```text
/workspaces/deskclaw/skills/
```

OpenClaw does not use `skills-lab/` directly. It loads the skill from the configured repo skill root.

## Current model note

`policy-oracle` has been observed working with `openai-codex/gpt-5.5`. The local
`ollama/gemma4:e4b` model may still need prompt or skill wording improvements
before it follows the skill reliably.

## Success rule

This lab is successful when the agent answers known customer-policy and product
questions from the skill reference files, refuses to invent unsupported details,
and routes frustrated or sensitive customer messages according to the escalation
rules.
