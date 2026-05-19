# DeskClaw - Current Architecture Blueprint

This is the active implementation source of truth. The original proposal now lives at `docs/archive/PROPOSAL.md` for historical/presentation context.

## 1. The Stack

*   **Infrastructure:** Docker Dev Container (Windows WSL2 / local devcontainer workflow)
*   **AI Engine:** Target demo model is local Ollama `gemma4:e4b` via `http://host.docker.internal:11434`; `openai-codex/gpt-5.5` may be used temporarily for skill behavior debugging when the local model fails to follow the skill prompt.
*   **Gateway:** OpenClaw on `ws://127.0.0.1:18789`
*   **Prototype Interface:** Simulated chat flow or lightweight local chat UI for demos and testing

## 2. Current Prototype Scope

*   **Automated Support:** Answer shipping, returns, and FAQ questions from local business documents
*   **Basic Product Assistance:** Search a small local product catalog and recommend suitable items
*   **Human Handoff Safety:** Detect frustration or sensitive cases and escalate to a human
*   **Evaluation:** Validate the prototype with scripted support, sales, and frustration conversations

## 3. Current Implementation Snapshot

*   **Implemented:** repo-managed `policy-oracle` OpenClaw skill in `skills/policy-oracle/`
*   **Implemented:** policy reference markdown for shipping, returns, FAQ, and product care under the skill's `references/`
*   **Added for validation:** repo-managed `search-products` skill in `skills/search-products/` with a small JSON demo catalog
*   **Added for validation:** repo-managed `sentiment-router` skill in `skills/sentiment-router/` with local escalation rules
*   **Implemented:** policy, product-search, and sentiment-router scenarios in `skills-lab/`
*   **Local setup:** OpenClaw scans `/workspaces/deskclaw/skills` through `skills.load.extraDirs`
*   **Not yet implemented:** final `deskclaw-workspace/`, production-style catalog location, and full scripted demo conversations

## 4. Planned Local Data Sources

*   **Knowledge Base:** Markdown files such as `shipping.md`, `returns.md`, `faq.md`, and `product-care.md`; the first policy references currently live under `skills/policy-oracle/references/`
*   **Product Data:** Small structured catalog in JSON or SQLite; the first demo catalog currently lives under `skills/search-products/references/products.json`
*   **Demo Inputs:** Scripted customer conversations for support, sales, and escalation scenarios

## 5. Skill Layout

*   `policy-oracle`: repo-managed OpenClaw skill, located at `skills/policy-oracle/`
*   `search-products`: repo-managed OpenClaw skill, located at `skills/search-products/`
*   `sentiment-router`: repo-managed OpenClaw skill, located at `skills/sentiment-router/`
*   `escalate-to-human`: planned

OpenClaw should scan the repo-level `skills/` folder through local config:

```bash
openclaw config set skills.load.extraDirs '["/workspaces/deskclaw/skills"]' --strict-json
```

This keeps skill files version-controlled while leaving OpenClaw runtime state in `/home/node/.openclaw`. A copied skill in `/home/node/.openclaw/workspace/skills/` with the same name takes precedence and should be removed when testing the repo-managed version.

## 6. Deferred Extensions

These are possible later additions, but not part of the current MVP scope:

*   Real WhatsApp or Instagram integration
*   Deep-link or QR-based onboarding/setup flows
*   Dynamic discount or promo-code negotiation
*   Custom Node.js/React dashboard for human handoff

## 7. Open Questions

*Should the final workspace product catalog stay JSON or move to SQLite?*
*What exact frustration signals should trigger escalation?*
*What is the best minimal simulated chat interface for the prototype demo?*
