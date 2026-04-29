# AGENTS.md

## Purpose

This repository is the planning and setup workspace for **DeskClaw**, a local-first conversational commerce agent for small D2C brands. The current project direction is now captured directly in the kept root context files, so development should rely on those files instead of any separate presentation script.

At the time this file was created, the repo is **documentation-first**. It does **not** yet contain the actual DeskClaw application, OpenClaw workspace, skills, product catalog, or automated test suite. Most of the current value lives in the kept root context files and environment notes.

## Current State Of The Repo

What exists now:

- Project vision and proposal docs
- A current architecture blueprint and contributor guide
- OpenClaw learning notes and local operational reminders
- A devcontainer configuration for a Node.js-based local development environment
- A local `.env` file used by the devcontainer, with `.env.example` as the committed template

What does not exist yet:

- `package.json`, `src/`, `app/`, or any checked-in application code
- A committed `deskclaw-workspace/` or equivalent OpenClaw workspace
- Knowledge-base markdown files like `shipping.md` and `returns.md`
- Implemented skills such as `sentiment_router.js` or `policy_oracle.js`
- Product catalog fixtures, SQLite databases, or channel integrations
- CI, linting, tests, or deployment automation

Treat this repository as the **project brief and bootstrap point**, not as a finished software system.

## Source Of Truth

Use the files in this order when making decisions:

1. [`PROPOSAL.md`](/workspaces/deskclaw/PROPOSAL.md): primary project scope, goals, and prototype narrative
2. [`ARCHITECTURE.md`](/workspaces/deskclaw/ARCHITECTURE.md): current prototype architecture and scope boundaries
3. [`AGENTS.md`](/workspaces/deskclaw/AGENTS.md): contributor guidance and working agreements
4. [`LEARNING.md`](/workspaces/deskclaw/LEARNING.md): OpenClaw environment notes and setup lessons
5. [`notes.md`](/workspaces/deskclaw/notes.md): short local operational reminders

## New Chat Bootstrap

For a fresh chat in this repository, start by reading:

1. [`AGENTS.md`](/workspaces/deskclaw/AGENTS.md)
2. [`PROPOSAL.md`](/workspaces/deskclaw/PROPOSAL.md)
3. [`ARCHITECTURE.md`](/workspaces/deskclaw/ARCHITECTURE.md)

Read [`LEARNING.md`](/workspaces/deskclaw/LEARNING.md) and [`notes.md`](/workspaces/deskclaw/notes.md) when the task touches environment setup, OpenClaw operations, devcontainer behavior, or local tooling problems.

## Intended Product

DeskClaw is intended to support conversational customer service and sales workflows for local D2C brands.

Based on the current kept project context, the active project story is:

- **Automated support**: answer policy and FAQ questions using the business's own local documents
- **Simulated sales assistance**: help customers discover suitable products using local product data
- **Human handoff safety**: stop automation and escalate when the customer is frustrated or the issue is sensitive
- **Local-first orchestration**: use OpenClaw plus a local Ollama model rather than a cloud-first architecture
- **Prototype evaluation through scripted chats**: validate the system with support, sales, and frustration scenarios

Ideas such as deep-link setup flows, promo-code negotiation, additional channels, or a full dashboard can remain in the background as future extensions, but they are not the current main scope unless explicitly requested.

## MVP Scope

The current MVP should be interpreted as a **prototype demonstration**, not a full production system.

That prototype should cover:

- A simulated chat experience rather than full production messaging integrations
- OpenClaw as the orchestration gateway
- A local `gemma4` model through Ollama for reasoning
- Local markdown policy documents for support answers
- A small structured product catalog for basic product lookup or recommendation
- Sentiment-based escalation to a human
- Scripted conversation scenarios for evaluation

The implementation details should now be rebuilt directly from the current repo files and the team's rough plans, rather than relying on deleted generated planning folders.

## Proposed Initial File Layout

An initial implementation layout that matches the current proposal would likely look like:

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

This layout is **planned**, not present yet. If the team later prefers SQLite instead of JSON for catalog data, that can change without changing the main project direction.

## Repository Map

Important files and folders currently in the repo:

- [`README.md`](/workspaces/deskclaw/README.md): public project introduction and teammate development setup
- [`.devcontainer/devcontainer.json`](/workspaces/deskclaw/.devcontainer/devcontainer.json): local development container definition
- [`ARCHITECTURE.md`](/workspaces/deskclaw/ARCHITECTURE.md): short architecture snapshot
- [`PROPOSAL.md`](/workspaces/deskclaw/PROPOSAL.md): proposal narrative with objectives and methodology
- [`LEARNING.md`](/workspaces/deskclaw/LEARNING.md): OpenClaw operational notes and lessons learned
- [`notes.md`](/workspaces/deskclaw/notes.md): short command reminders for local OpenClaw usage
- [`.gitignore`](/workspaces/deskclaw/.gitignore): ignores local secret files such as `.env`

## Development Environment

The current dev environment is defined in [`.devcontainer/devcontainer.json`](/workspaces/deskclaw/.devcontainer/devcontainer.json):

- Display name: `DeskClaw Dev`
- Base image: Microsoft Node.js and TypeScript devcontainer (`4-24-bookworm`)
- Remote user: `node`
- Local `.env` is loaded into the container through `runArgs`; copy `.env.example` to `.env` manually before opening the container
- `.env.example` includes `OLLAMA_HOST=http://host.docker.internal:11434` for native Ollama on Windows/macOS
- Persistent volumes mount to:
  - `/home/node/.gemini`
  - `/home/node/.codex`
  - `/home/node/.openclaw`
- Port `18789` is forwarded and labeled for the OpenClaw gateway
- `postCreateCommand` installs:
  - `bubblewrap`
  - `@google/gemini-cli`
  - `@openai/codex`
  - `openclaw@latest`

## Secrets And Local State

- `.env` is intentionally gitignored and should stay local
- `.env.example` is intentionally non-secret and should be copied to `.env` on each developer machine
- Do not copy secrets into markdown docs, scripts, or committed config
- If `.env` contains live credentials, treat them as sensitive developer-only state
- OpenClaw runtime state is expected to live in the mounted `/home/node/.openclaw` volume, not in the repo root

## Working Agreements For Contributors

- Be explicit about what is **implemented** versus what is only **planned**
- Treat [`PROPOSAL.md`](/workspaces/deskclaw/PROPOSAL.md) and [`ARCHITECTURE.md`](/workspaces/deskclaw/ARCHITECTURE.md) as the current scope lock unless the team decides to revise the project direction
- In a new chat, read [`AGENTS.md`](/workspaces/deskclaw/AGENTS.md), [`PROPOSAL.md`](/workspaces/deskclaw/PROPOSAL.md), and [`ARCHITECTURE.md`](/workspaces/deskclaw/ARCHITECTURE.md) before making scope assumptions
- On every new user prompt or task, re-check whether any kept context file needs an update before finishing the work
- Use the project-level Context7 MCP server when current library, framework, setup, configuration, or API documentation would reduce guesswork; resolve the relevant library or tool docs through Context7 instead of relying only on memory.
- Preserve the project's local-first and privacy-first assumptions unless the user approves a change in direction
- Use the current root markdown files as the build baseline and keep them synchronized with implementation changes
- Keep docs synchronized with implementation changes; this repo currently depends heavily on documentation accuracy
- If any kept context file becomes outdated, inconsistent, contradicted by implementation, or missing an important project decision, update that markdown file during that same task instead of leaving it stale for later
- Prefer small, inspectable local files for the first MVP: markdown knowledge, simple JavaScript skills, straightforward config
- If new code is added, also add the missing project scaffolding around it: package manager manifest, scripts, and basic verification steps
- Do not commit secrets, generated auth files, or personal OpenClaw workspace state
- Prefer simulated or local test flows before attempting real channel integrations

## Commit Style

Use the repository's existing short prefix style for commit subjects:

```text
docs: update teammate setup notes
chore: enable bubblewrap sandbox in devcontainer
update: container config and proposal script
```

Commit subjects should be concise, lowercase after the prefix, and written as `<type>: <summary>`. Prefer `docs:` for documentation-only changes, `chore:` for setup/tooling maintenance, and `update:` for broader mixed changes. Add a short commit body when the reason or scope is not obvious from the subject.

## Scope Guardrails

To stay aligned with the current proposal presented to the teacher:

- Do **not** treat Gmail integration as part of the active project scope
- Do **not** treat appointment-booking skills as part of the active project scope
- Do **not** assume a real multi-channel production integration is required for the first prototype
- Do **not** assume deep-link onboarding, QR flows, promo-code generation, or a custom human dashboard are required in the first implementation pass
- Do treat support answers, basic product assistance, local orchestration, and frustration-based human escalation as the core project

If future work wants to add any of the deferred ideas, update the proposal-facing docs first or clearly mark the new work as an extension.

## Practical Next Steps

If development starts from this repo, the likely order is:

1. Create `deskclaw-workspace/` and the initial OpenClaw config files from the MVP plan
2. Add the first local knowledge documents and a small starter product catalog
3. Implement `sentiment_router`, `policy_oracle`, and a minimal product search skill
4. Verify OpenClaw can talk to Ollama through the forwarded gateway setup
5. Add scripted conversation fixtures for support, sales, and escalation testing
6. Only after that, consider extensions beyond the currently presented proposal scope

## Summary

The repo currently represents **DeskClaw as a well-defined concept with an early implementation plan**, not a built product. The clearest development path is to treat [`PROPOSAL.md`](/workspaces/deskclaw/PROPOSAL.md) and [`ARCHITECTURE.md`](/workspaces/deskclaw/ARCHITECTURE.md) as the scope anchor, then create the first real project assets around a local OpenClaw prototype for support, basic product assistance, and safe human handoff.
