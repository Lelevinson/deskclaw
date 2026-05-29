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

**Planned next (in scope, not yet built)** — scoped in [`docs/planning/skill-roadmap.md`](docs/planning/skill-roadmap.md) §4; build order: cart-edit → tool-level eval harness → order-status → returns-intake, with handoff-ticket and product-compatibility Q&A as independent items. The `orders` data domain (introduced by order-status) is the first new visible data domain and the prerequisite for the mock storefront.

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

## 5. Extension scope

This section owns the boundary of what may be built. The detailed, ordered backlog lives in [`docs/planning/skill-roadmap.md`](docs/planning/skill-roadmap.md) §4; this section records only what is in scope and what is fenced out. Adding anything from the deferred list requires updating this file first.

### In scope (planned, not yet built)

Decided in the 2026-05-29 roadmap session. New data domains noted because they trigger storefront UI work (§6).

- **Cart edits** — remove item / change quantity. Extends `cart-actions`; no new data domain.
- **Tool-level evaluation harness** — deterministic tests over `src/shop` service functions (identity gating, preview/confirm, audit). Closes the "Not implemented" eval gap above for the tool layer.
- **Order status lookup** — read-only, identity-gated. Introduces the **`orders`** data domain (the first new *visible* data domain).
- **Return / exchange intake + status** — captures a return *request* and hands off the refund/exchange (never auto-issues money), plus a read-only refund/return-status check ("is my refund processed?"). Depends on the `orders` domain; adds a **`returns`** sub-domain.
- **Handoff ticket records** — durable escalation/audit records for `sentiment-router` handoffs.
- **Product / ingredient-compatibility Q&A** — extends `policy-oracle` from a brand-authored compatibility data file; answer-only-from-data, escalate reaction/medical language.

### Deferred (out of scope)

Explicitly **not** part of the prototype.

- Real WhatsApp / Instagram / Gmail integrations
- Deep-link or QR onboarding flows
- Dynamic discount / promo-code negotiation
- Custom Node.js/React dashboard for human handoff
- Appointment-booking skills
- **Autonomous cancellations or refunds** — the agent may intake and hand off; it must never issue a refund or cancel a paid order itself (research-refuted as an autonomous action).
- **Customer-initiated address / shipping-address mutation** — top account-takeover signal; route to handoff. Revisit only with stronger step-up verification.
- **Subscription management** — recurring-order domain; cancel sits in the autonomous-mutation no-go zone.
- **Restock / back-in-stock alerts** — requires an async outbound notification channel we do not have.
- **Checkout (cart → paid order)** — no payment exists in the local mock and it is the riskiest mutation. Consequence: `data/shop/orders.json` is **seeded fixture data**, not agent-created; `order-status` and `returns-actions` read pre-existing orders.
- **Self-service account linking** — creating/repairing an account link from chat is deferred with the deep-link/QR onboarding above. The demo ships one pre-linked customer; unlinked senders are asked to verify, not linked in-flow.
- **Loyalty / points / gift balance** — not in the data model and flagged as cash-equivalent high-risk; out of scope.
- **Proactive / outbound messaging** (post-purchase check-ins, review requests, abandoned-cart nudges) — requires an async outbound channel we do not have; same blocker as restock alerts.

## 6. Resolved decisions

- **Catalog format:** JSON. Simple, inspectable, sufficient for the MVP. Revisit if querying becomes a bottleneck.
- **Skill/tool split:** Customer-facing behaviors live as skills under `skills/`. Reusable typed operations, such as account identity lookup or cart mutation, live as inner tools under `src/`. Shared facts and local runtime baseline data live under `data/`.
- **Shop writes:** The agent must use typed MCP tools, not raw database access. Mutating actions require a linked channel identity, preview, explicit customer confirmation, execution, and audit logging.
- **Shared data ownership:** Product, policy, routing, customer, account-link, and shop state facts live under `data/`. Skills point to these files instead of copying them.
- **Escalation signals:** Defined in `data/routing/escalation-rules.md`. `handoff_recommended` = frustration, repeated failures, explicit human request. `urgent_handoff` = safety, legal, chargeback, social media threats.
- **Demo interface:** OpenClaw TUI only. No custom web UI for the first prototype.
- **Demo brand:** Intentionally a Taiwan-based skincare brand (NT$ pricing, skincare catalog). This is the course project's chosen domain, not a placeholder.
- **Skill ↔ UI integration order:** Build customer skills against the shared shop backend and `data/` first, and test them in the TUI (one feature branch per customer capability, spanning whatever skill/tool/data layers it needs). The mock storefront comes later as a single read-only view over the same shop state (catalog, carts, action logs) — it is wired to the shared state, not to individual skills. A new skill needs new UI work only when it introduces a new **visible data domain** (for example orders or returns), not once per skill.
- **Scaling unit:** The three-layer split (customer skill → inner tool → shared data, see [`skills/README.md`](skills/README.md)) plus the typed MCP boundary is what makes added skills cheap. The first expected limits are operational, not structural: manual TUI testing (mitigated by the not-yet-built eval harness in §3) and the whole-file JSON store. Address those before skill count grows; do not restructure the layers preemptively.

## 7. Source-of-truth order

If two files disagree:

1. `ARCHITECTURE.md` (this file) wins for scope, stack, and status
2. `docs/openclaw/setup.md` wins for OpenClaw commands and operational fixes
3. `data/` wins for shared business facts and local runtime baseline data
4. The actual skill files under `skills/` win for skill behavior
5. `AGENTS.md` wins for contributor rules
6. `docs/archive/PROPOSAL.md` is historical only — never authoritative
