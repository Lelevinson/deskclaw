# DeskClaw Architecture

Single source of truth for **what we're building, what we're not, what's done, and what's planned**. If a scope/stack/status question can be answered, the answer lives in this file or nowhere.

For OpenClaw commands and setup, see [`docs/openclaw/setup.md`](docs/openclaw/setup.md).
For contributor rules and where-to-update guidance, see [`AGENTS.md`](AGENTS.md).

## 1. Product

DeskClaw is a local-first conversational commerce agent prototype for small D2C brands. The prototype must demonstrate:

- **Automated support** — answer policy and FAQ questions from local business documents.
- **Basic product assistance** — search a small local catalog and recommend suitable items.
- **Controlled shop actions** — expose safe local tools for account/cart changes with confirmation and audit logs.
- **Human handoff safety** — detect frustration or sensitive cases and escalate.
- **Scripted evaluation** — validate behavior with policy, product-recommendation, and escalation scenarios.

## 2. Stack

| Layer | Choice |
|---|---|
| Infrastructure | Docker devcontainer (Windows WSL2 / local) |
| Gateway | OpenClaw on `ws://127.0.0.1:18789` |
| Models | Local Ollama (e.g. `gemma3:4b`) **or** `gpt-5.5` via the OpenAI Codex provider — either is acceptable, see [setup.md §6](docs/openclaw/setup.md#6-models) |
| Interface | Simulated chat / OpenClaw TUI for demos and testing |
| Shop tools | Local TypeScript MCP server backed by a resettable JSON database |

## 3. Status

**Implemented**

- Repo-managed OpenClaw skills under [`skills/`](skills/): `policy-oracle`, `search-products`, `sentiment-router`, `cart-actions`
- Shared business data under [`data/`](data/): catalog, policies, routing rules, customers, account links, and shop runtime baseline state
- Shop MCP server under `src/mcp/shop-server.ts` and shared shop logic under `src/shop/`
- Scripted test scenarios under [`skills-lab/scenarios/`](skills-lab/scenarios/)
- Devcontainer + Ollama wiring + Codex provider + repo-skill loading via `skills.load.extraDirs`

**Not implemented**

- Automated evaluation harness (the scenario files currently require manual TUI testing)
- CI, linting, deployment
- Mock e-commerce website UI

## 4. Repository layout

```text
skills/                       # canonical, repo-managed
  cart-actions/
    SKILL.md
  policy-oracle/
    SKILL.md
  search-products/
    SKILL.md
  sentiment-router/
    SKILL.md

src/
  shop/                       # shared local mock shop logic
    README.md                 # shop backend contract
  mcp/shop-server.ts          # safe MCP tool surface for agent actions
  cli/reset-shop-db.ts        # reset local runtime DB from baseline data

data/
  README.md                   # data ownership rules
  templates.md                # commented shape examples for data files
  catalog/products.json       # product facts shared by skills + tools
  policies/{faq,product-care,returns,shipping}.md
  routing/escalation-rules.md
  customers/{customers,account-links}.json
  shop/{carts,pending-actions,action-logs}.json

skills-lab/                   # evaluation only, not a skill source
  README.md                   # how to run + pass/fail criteria
  scenarios/
    {policy-oracle,search-products,sentiment-router,cart-actions}-tests.md
```

This is the tracked repo layout, not generated runtime state. Personal OpenClaw runtime data stays in `/home/node/.openclaw` and is not committed.

## 5. Deferred extensions (out of MVP scope)

These are explicitly **not** part of the first prototype. Adding any of them requires updating this file first.

- Real WhatsApp / Instagram / Gmail integrations
- Deep-link or QR onboarding flows
- Dynamic discount / promo-code negotiation
- Custom Node.js/React dashboard for human handoff
- Appointment-booking skills

## 6. Resolved decisions

- **Catalog format:** JSON. Simple, inspectable, sufficient for the MVP. Revisit if querying becomes a bottleneck.
- **Skill/tool split:** Customer-facing behaviors live as skills under `skills/`. Reusable typed operations, such as account identity lookup or cart mutation, live as inner tools under `src/`. Shared facts and local runtime baseline data live under `data/`.
- **Shop writes:** The agent must use typed MCP tools, not raw database access. Mutating actions require a linked channel identity, preview, explicit customer confirmation, execution, and audit logging.
- **Shared data ownership:** Product, policy, routing, customer, account-link, and shop state facts live under `data/`. Skills point to these files instead of copying them.
- **Escalation signals:** Defined in `data/routing/escalation-rules.md`. `handoff_recommended` = frustration, repeated failures, explicit human request. `urgent_handoff` = safety, legal, chargeback, social media threats.
- **Demo interface:** OpenClaw TUI only. No custom web UI for the first prototype.
- **Demo brand:** Intentionally a Taiwan-based skincare brand (NT$ pricing, skincare catalog). This is the course project's chosen domain, not a placeholder.

## 7. Source-of-truth order

If two files disagree:

1. `ARCHITECTURE.md` (this file) wins for scope, stack, and status
2. `docs/openclaw/setup.md` wins for OpenClaw commands and operational fixes
3. `data/` wins for shared business facts and local runtime baseline data
4. The actual skill files under `skills/` win for skill behavior
5. `AGENTS.md` wins for contributor rules
6. `docs/archive/PROPOSAL.md` is historical only — never authoritative
