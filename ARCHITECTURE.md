# DeskClaw Architecture

Single source of truth for **what we're building, what we're not, what's done, and what's planned**. If a scope/stack/status question can be answered, the answer lives in this file or nowhere.

For OpenClaw commands and setup, see [`docs/openclaw/setup.md`](docs/openclaw/setup.md).
For contributor rules and where-to-update guidance, see [`AGENTS.md`](AGENTS.md).

## 1. Product

DeskClaw is a local-first conversational commerce agent prototype for small D2C brands. The prototype must demonstrate:

- **Automated support** — answer policy and FAQ questions from local business documents.
- **Basic product assistance** — search a small local catalog and recommend suitable items.
- **Human handoff safety** — detect frustration or sensitive cases and escalate.
- **Scripted evaluation** — validate behavior with support, sales, and frustration scenarios.

## 2. Stack

| Layer | Choice |
|---|---|
| Infrastructure | Docker devcontainer (Windows WSL2 / local) |
| Gateway | OpenClaw on `ws://127.0.0.1:18789` |
| Models | Local Ollama (e.g. `gemma3:4b`) **or** `gpt-5.5` via the OpenAI Codex provider — either is acceptable, see [setup.md §5](docs/openclaw/setup.md#5-models) |
| Interface | Simulated chat / OpenClaw TUI for demos and testing |

## 3. Status

**Implemented**

- Repo-managed OpenClaw skills under [`skills/`](skills/): `policy-oracle`, `search-products`, `sentiment-router`
- Policy references for shipping, returns, FAQ, and product care under `skills/policy-oracle/references/`
- Demo product catalog under `skills/search-products/references/products.json`
- Escalation rules under `skills/sentiment-router/references/escalation-rules.md`
- Scripted test scenarios under [`skills-lab/scenarios/`](skills-lab/scenarios/)
- Devcontainer + Ollama wiring + Codex provider + repo-skill loading via `skills.load.extraDirs`

**Not implemented**

- `deskclaw-workspace/` (workspace prompts, final catalog location, conversation fixtures)
- `package.json`, `src/`, or any application code
- Automated evaluation harness (the scenario files currently require manual TUI testing)
- CI, linting, deployment

## 4. Planned file layout

```text
skills/                       # canonical, repo-managed
  policy-oracle/
    SKILL.md
    references/{faq,product-care,returns,shipping}.md
  search-products/
    SKILL.md
    references/products.json
  sentiment-router/
    SKILL.md
    references/escalation-rules.md

skills-lab/                   # evaluation only, not a skill source
  README.md                   # how to run + pass/fail criteria
  scenarios/
    {policy-oracle,search-products,sentiment-router}-tests.md

deskclaw-workspace/           # planned
  openclaw.config.json
  SOUL.md
  AGENTS.md
  knowledge/{shipping,returns,faq,product-care}.md
  catalog/products.json
  scenarios/{support,sales,frustration}-chat.md
```

The layout under `skills/` and `skills-lab/` is current; everything under `deskclaw-workspace/` is planned.

## 5. Deferred extensions (out of MVP scope)

These are explicitly **not** part of the first prototype. Adding any of them requires updating this file first.

- Real WhatsApp / Instagram / Gmail integrations
- Deep-link or QR onboarding flows
- Dynamic discount / promo-code negotiation
- Custom Node.js/React dashboard for human handoff
- Appointment-booking skills

## 6. Open questions

These need a decision before the next implementation step. Each should land in a commit that resolves it.

- [ ] Should the final workspace catalog stay JSON or move to SQLite?
- [ ] What exact frustration signals should trigger `urgent_handoff` vs `handoff_recommended`?
- [ ] What is the minimal simulated chat interface for the demo (TUI only? lightweight web UI?)?
- [ ] Is the demo brand intentionally Taiwan skincare (NT$, skincare catalog), or should the catalog be made domain-neutral?

## 7. Source-of-truth order

If two files disagree:

1. `ARCHITECTURE.md` (this file) wins for scope, stack, and status
2. `docs/openclaw/setup.md` wins for OpenClaw commands and operational fixes
3. The actual skill files under `skills/` win for skill behavior
4. `AGENTS.md` wins for contributor rules
5. `docs/archive/PROPOSAL.md` is historical only — never authoritative
