# DeskClaw

A conversational commerce agent prototype for small D2C brands. The prototype shows automated support, basic product assistance, and safe human handoff using local business documents, a local product catalog, OpenClaw, and either a local Ollama model or `gpt-5.5` via the OpenAI Codex provider.

**This README covers what the repo is and how to start it.** For everything else, follow the pointers below.

| You want to know… | Open |
|---|---|
| What's in scope, the stack, what's done | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| How to work in this repo (rules, commit style, where to update what) | [`AGENTS.md`](AGENTS.md) |
| OpenClaw install / config / commands / fixes | [`docs/openclaw/setup.md`](docs/openclaw/setup.md) |
| What skills exist | [`skills/README.md`](skills/README.md) |
| How to run scenario tests | [`skills-lab/README.md`](skills-lab/README.md) |

## First-time setup

### Host prerequisites

Install on your own machine before opening the project:

- Docker Desktop (or another compatible Docker runtime)
- VS Code
- VS Code Dev Containers extension
- Ollama installed natively on the host — only required if you plan to run the local model option

The Dev Containers extension must be installed in your host VS Code before opening the repo. The devcontainer requests the OpenAI Codex/ChatGPT extension (`OpenAI.chatgpt`) inside the remote container, which provides the `gpt-5.5` option. See [`docs/openclaw/setup.md §5`](docs/openclaw/setup.md#5-models) for both model setups.

### Open the project

1. Clone the repository.
2. Copy `.env.example` to `.env`. Keep `.env` local; never commit real credentials.
3. Open the repository in VS Code.
4. Choose **Reopen in Container** when prompted.
5. If you plan to use the local model, make sure Ollama is running on the host.

`.env.example` includes `OLLAMA_HOST=http://host.docker.internal:11434` so the devcontainer can reach native Ollama on Windows/macOS.

### Configure OpenClaw to see the repo skills

Once the container is open, run the one-time OpenClaw config and verification commands in [`docs/openclaw/setup.md §2`](docs/openclaw/setup.md#2-first-time-setup-inside-the-devcontainer). That doc also covers commands, model setup, and troubleshooting.

## Devcontainer at a glance

The exact container definition lives in [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json). In short, it uses a Node.js / TypeScript devcontainer image, loads local environment variables from `.env`, forwards the OpenClaw gateway port, mounts named Docker volumes for CLI/OpenClaw runtime state, and installs the required CLIs globally inside the container.

Those named volumes survive normal **Rebuild Container** runs and hold auth/session/gateway state. Only remove them when intentionally resetting. OpenClaw is installed globally in the container, not under the shared workspace mount, because the Windows-Linux file bridge chokes on local installs there. See [`docs/openclaw/setup.md`](docs/openclaw/setup.md) for operational details.

## Repository map

```text
README.md                       # this file — what + first-time setup
ARCHITECTURE.md                 # scope, stack, status, layout, resolved decisions
AGENTS.md                       # contributor rules + topic→file map
docs/
  README.md                     # index of supporting docs
  openclaw/setup.md             # all OpenClaw ops in one place
  archive/PROPOSAL.md           # historical proposal — read-only
skills/                         # repo-managed OpenClaw skills (canonical)
skills-lab/                     # scenarios + pass/fail criteria (evaluation only)
.devcontainer/                  # devcontainer definition
```

## Scope (one paragraph)

The MVP is a prototype, not a product: simulated chat, local policy markdown for support answers, a small structured catalog for product recommendation, sentiment-based escalation, OpenClaw orchestration, and either a local Ollama model or `gpt-5.5` via the Codex provider. Real messaging integrations, appointment booking, Gmail, dashboards, QR/deep-link flows, and promo-code negotiation are deferred — full deferred list in [`ARCHITECTURE.md`](ARCHITECTURE.md) §5.
