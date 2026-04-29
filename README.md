# DeskClaw

DeskClaw is a local-first conversational commerce agent prototype for small direct-to-consumer brands. The project is intended to demonstrate automated support, basic product assistance, and safe human handoff using local business documents, local product data, OpenClaw, and a local Ollama model.

This repository is currently the planning and bootstrap workspace for the prototype. The main project direction is described in:

- [`PROPOSAL.md`](PROPOSAL.md)
- [`ARCHITECTURE.md`](ARCHITECTURE.md)
- [`AGENTS.md`](AGENTS.md)
- [`LEARNING.md`](LEARNING.md)

## Current Status

The repo is documentation-first right now. It has the project proposal, architecture notes, contributor guidance, OpenClaw setup notes, and a devcontainer configuration.

The actual DeskClaw prototype workspace, skills, knowledge files, catalog fixtures, and scripted chat scenarios are planned but not fully implemented yet.

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
openclaw sessions list
openclaw reset
```

When onboarding inside Docker, skip daemon/service installation.

## Team Collaboration Workflow

Use `PROPOSAL.md`, `ARCHITECTURE.md`, and `AGENTS.md` as the shared context before starting new work. Keep implementation changes small enough to review, and update the relevant root markdown file in the same change when scope, setup, prompts, or file layout changes.

Local-only state should stay local: `.env`, `.codex/`, and OpenClaw runtime data under `/home/node/.openclaw` should not be committed. Shared prompt files such as the future `deskclaw-workspace/SOUL.md` and `deskclaw-workspace/AGENTS.md` should be committed once the prototype workspace exists, because they define how the demo agent behaves.

## Planned Prototype Layout

The first implementation pass is expected to create a small OpenClaw workspace similar to:

```text
deskclaw-workspace/
  openclaw.config.json
  SOUL.md
  AGENTS.md
  knowledge/
    shipping.md
    returns.md
    faq.md
  catalog/
    products.json
  scenarios/
    support-chat.md
    sales-chat.md
    frustration-chat.md
  skills/
    sentiment_router.js
    policy_oracle.js
    search_products.js
```

## Scope

The current MVP focuses on:

- Simulated chat workflows
- Local policy and FAQ answers
- Basic local product recommendations
- Sentiment-based escalation to a human
- Local-first orchestration with OpenClaw and Ollama

Real messaging integrations, appointment booking, Gmail integration, dashboards, QR setup flows, and promo-code negotiation are future extensions, not part of the first prototype scope.
