# DeskClaw

DeskClaw is a local-first conversational commerce agent prototype for small direct-to-consumer brands. The project is intended to demonstrate automated support, basic product assistance, and safe human handoff using local business documents, local product data, OpenClaw, and a local Ollama model.

This repository is currently the planning and bootstrap workspace for the prototype. The current project direction is described in:

- [`ARCHITECTURE.md`](ARCHITECTURE.md)
- [`AGENTS.md`](AGENTS.md)
- [`docs/README.md`](docs/README.md)

The original proposal is archived at [`docs/archive/PROPOSAL.md`](docs/archive/PROPOSAL.md) for presentation context, but it is no longer the implementation source of truth.

## Current Status

The repo is still early and documentation-heavy, but it now has the first repo-managed OpenClaw skill folder under `skills/`.

What exists now:

- Proposal, architecture, contributor, and setup notes
- Devcontainer configuration for local OpenClaw/Ollama development
- Repo-managed `policy-oracle` skill in `skills/policy-oracle/`
- `skills-lab/` scenario and test-plan material for policy-oracle evaluation

What is still planned:

- Full DeskClaw/OpenClaw workspace files
- Product catalog fixtures
- Product-search and sentiment-routing skills
- Full scripted support, sales, and escalation demo conversations

## File Guide

- [`ARCHITECTURE.md`](ARCHITECTURE.md): active prototype architecture, scope, and implementation boundary
- [`AGENTS.md`](AGENTS.md): contributor rules and source-of-truth order
- [`docs/README.md`](docs/README.md): map of supporting documentation
- [`docs/openclaw/LEARNING.md`](docs/openclaw/LEARNING.md): OpenClaw/devcontainer lessons learned
- [`docs/openclaw/notes.md`](docs/openclaw/notes.md): short command reminders
- [`docs/archive/PROPOSAL.md`](docs/archive/PROPOSAL.md): historical proposal/presentation snapshot
- [`skills/`](skills): repo-managed OpenClaw skills
- [`skills-lab/`](skills-lab): test plans and scenarios for isolated skill experiments

## Development Setup

The recommended development workflow is to use the included VS Code devcontainer. This keeps the project Node.js, npm, OpenClaw, Codex, and Gemini CLI setup inside a Linux container, so Windows and macOS teammates do not need matching host Node/npm installations.

### Host Prerequisites

Install these on your own machine before opening the project:

- Docker Desktop or another compatible Docker runtime
- VS Code
- VS Code Dev Containers extension
- Ollama, installed natively on the host machine

On macOS, it is fine if you normally use Homebrew for your personal tools. The project Node/npm tools are installed inside the devcontainer, not through `brew`.

### First-Time Setup

1. Clone this repository.
2. Copy `.env.example` to `.env`.
3. Keep `.env` local and do not commit real credentials.
4. Open the repository in VS Code.
5. Choose **Reopen in Container** when prompted.
6. Make sure Ollama is running on the host machine.

The default `.env.example` assumes Ollama is reachable from the container at:

```text
http://host.docker.internal:11434
```

This is the expected Docker Desktop address on Windows and macOS.

### Devcontainer Notes

The devcontainer:

- Uses the Microsoft Node.js and TypeScript devcontainer image
- Loads local environment variables from `.env`
- Forwards port `18789` for the OpenClaw gateway
- Mounts persistent Docker volumes for Codex, Gemini, and OpenClaw state
- Installs `bubblewrap`, `@google/gemini-cli`, `@openai/codex`, and `openclaw@latest`

OpenClaw is intentionally installed globally inside the container instead of inside the shared repository folder. This avoids slow or fragile file operations across Windows/macOS host mounts.

Reopening or restarting the devcontainer keeps the already installed OpenClaw package version. Rebuilding the container reruns `postCreateCommand`, so it installs the latest OpenClaw available at rebuild time. To manually update OpenClaw inside the current container, run:

```bash
npm install -g openclaw@latest
```

OpenClaw config and workspace state live in the persistent `/home/node/.openclaw` volume, so a package update should not wipe gateway, model, token, or workspace settings. A newer OpenClaw version may still migrate or rewrite its config format when it first runs.

### Repo-Managed Skills

DeskClaw skills should be developed in the repo-level `skills/` folder so they can be reviewed and shared through Git.

Run this once inside the devcontainer so OpenClaw scans the repo skills folder:

```bash
openclaw config set skills.load.extraDirs '["/workspaces/deskclaw/skills"]' --strict-json
```

Then confirm OpenClaw sees the skills:

```bash
openclaw skills list
```

Do not use `/home/node/.openclaw/workspace/skills/` as the source of truth for project skills. That path is local OpenClaw runtime state in a Docker volume. If a copied workspace skill exists with the same name, remove it before testing the repo-managed version because workspace skills take precedence.

### Context7 MCP For Codex

Use a local, project-scoped Codex MCP config at `.codex/config.toml` for Context7. The `.codex/` folder is intentionally ignored so local Codex state and API keys do not get committed.

Create or update the local config with:

```toml
[mcp_servers.context7]
url = "https://mcp.context7.com/mcp"
```

Codex loads project-scoped config only after the project is trusted. After opening the devcontainer, restart Codex from the repository root and verify with:

```bash
codex mcp list
```

For higher Context7 rate limits, create a Context7 API key, add it to your local `.env` as `CONTEXT7_API_KEY=...`, then use `env_http_headers` in your local `.codex/config.toml`. Do not commit real API keys.

## Useful OpenClaw Commands

Inside the devcontainer:

```bash
openclaw onboard
openclaw gateway
openclaw tui
openclaw skills list
openclaw config get skills.load.extraDirs --json
openclaw --version
openclaw sessions list
openclaw reset
```

When onboarding inside Docker, skip daemon/service installation.

## Team Collaboration Workflow

Use `ARCHITECTURE.md`, `README.md`, and `AGENTS.md` as the shared context before starting new work. Keep implementation changes small enough to review, and update the relevant markdown file in the same change when scope, setup, prompts, or file layout changes.

Local-only state should stay local: `.env`, `.codex/`, and OpenClaw runtime data under `/home/node/.openclaw` should not be committed. Shared prompt files such as the future `deskclaw-workspace/SOUL.md` and `deskclaw-workspace/AGENTS.md` should be committed once the prototype workspace exists, because they define how the demo agent behaves.

Line endings are pinned through `.gitattributes` for common text files. If VS Code shows many unstaged changes with no real text edits, check for line-ending churn before committing.

## Skills Lab

The skill test material lives in:

```text
skills-lab/
  README.md
  test-plan.md
  scenarios/
    policy-oracle-tests.md
```

This folder is for isolated skill evaluation notes and scenarios only. Actual shared OpenClaw skills live in the repo-level `skills/` folder.

Current skill source:

```text
skills/
  policy-oracle/
    SKILL.md
    references/
      faq.md
      product-care.md
      returns.md
      shipping.md
```

## Planned Prototype Layout

The working project layout is expected to grow toward:

```text
skills/
  policy-oracle/
    SKILL.md
    references/
      faq.md
      product-care.md
      returns.md
      shipping.md
  search-products/
    SKILL.md
  sentiment-router/
    SKILL.md

skills-lab/
  test-plan.md
  scenarios/
    policy-oracle-tests.md

deskclaw-workspace/
  openclaw.config.json
  SOUL.md
  AGENTS.md
  knowledge/
    shipping.md
    returns.md
    faq.md
    product-care.md
  catalog/
    products.json
  scenarios/
    support-chat.md
    sales-chat.md
    frustration-chat.md
```

In this layout, `skills/` remains the Git source of truth for shared OpenClaw skills. The future `deskclaw-workspace/` is for the demo agent's workspace-level prompts, config, local catalog, and scripted conversations.

## Scope

The current MVP focuses on:

- Simulated chat workflows
- Local policy and FAQ answers
- Basic local product recommendations
- Sentiment-based escalation to a human
- Local-first orchestration with OpenClaw and Ollama

Real messaging integrations, appointment booking, Gmail integration, dashboards, QR setup flows, and promo-code negotiation are future extensions, not part of the first prototype scope.
