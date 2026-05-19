# AGENTS.md

## Purpose

This repository is the planning and setup workspace for **DeskClaw**, a local-first conversational commerce agent for small D2C brands. The current project direction is now captured directly in the kept context files, so development should rely on those files instead of any separate presentation script.

At the time this file was created, the repo was **documentation-first**. It now contains the first repo-managed OpenClaw skills under `skills/`, but it does **not** yet contain the actual DeskClaw application, full OpenClaw workspace, production catalog location, or automated test suite. Most of the current value lives in the kept context files, environment notes, and early skill/test assets.

## Current State Of The Repo

What exists now:

- Project vision and architecture docs
- A current architecture blueprint and contributor guide
- OpenClaw learning notes and local operational reminders
- A devcontainer configuration for a Node.js-based local development environment
- A local `.env` file used by the devcontainer, with `.env.example` as the committed template
- A repo-managed `skills/` folder for shared OpenClaw AgentSkills
- A `skills-lab/` folder for isolated skill test plans and scenarios
- Early local references for policy answers, product recommendations, and escalation routing

What does not exist yet:

- `package.json`, `src/`, `app/`, or any checked-in application code
- A committed `deskclaw-workspace/` or equivalent OpenClaw workspace
- Final DeskClaw workspace knowledge-base markdown files like `shipping.md` and `returns.md`
- Final production-style product catalog location, SQLite databases, or channel integrations
- CI, linting, tests, or deployment automation

Treat this repository as the **project brief and bootstrap point**, not as a finished software system.

## Source Of Truth

Use the files in this order when making decisions:

1. [`ARCHITECTURE.md`](/workspaces/deskclaw/ARCHITECTURE.md): active prototype architecture, scope, and implementation boundary
2. [`README.md`](/workspaces/deskclaw/README.md): teammate setup and repository map
3. [`AGENTS.md`](/workspaces/deskclaw/AGENTS.md): contributor guidance and working agreements
4. [`docs/openclaw/LEARNING.md`](/workspaces/deskclaw/docs/openclaw/LEARNING.md): OpenClaw environment notes and setup lessons
5. [`docs/openclaw/notes.md`](/workspaces/deskclaw/docs/openclaw/notes.md): short local operational reminders
6. [`docs/archive/PROPOSAL.md`](/workspaces/deskclaw/docs/archive/PROPOSAL.md): historical proposal/presentation snapshot only

## New Chat Bootstrap

For a fresh chat in this repository, start by reading:

1. [`AGENTS.md`](/workspaces/deskclaw/AGENTS.md)
2. [`ARCHITECTURE.md`](/workspaces/deskclaw/ARCHITECTURE.md)
3. [`README.md`](/workspaces/deskclaw/README.md)

Read [`docs/openclaw/LEARNING.md`](/workspaces/deskclaw/docs/openclaw/LEARNING.md) and [`docs/openclaw/notes.md`](/workspaces/deskclaw/docs/openclaw/notes.md) when the task touches environment setup, OpenClaw operations, devcontainer behavior, or local tooling problems.

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

An initial implementation layout that matches the current architecture would likely look like:

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
    references/
      products.json
  sentiment-router/
    SKILL.md
    references/
      escalation-rules.md

skills-lab/
  test-plan.md
  scenarios/
    policy-oracle-tests.md
    search-products-tests.md
    sentiment-router-tests.md

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

This layout is **partially present**: `skills/policy-oracle/`, `skills/search-products/`, `skills/sentiment-router/`, and the `skills-lab/` scenario materials exist, while the full `deskclaw-workspace/`, final catalog location, and full demo conversations are still planned.

The current `skills/` folder holds the repo-managed OpenClaw-style skills. Configure OpenClaw once with `skills.load.extraDirs` so it scans `/workspaces/deskclaw/skills`. The `skills-lab/` folder now holds evaluation plans and scenarios, not the canonical skill source.

## Repository Map

Important files and folders currently in the repo:

- [`README.md`](/workspaces/deskclaw/README.md): public project introduction and teammate development setup
- [`.devcontainer/devcontainer.json`](/workspaces/deskclaw/.devcontainer/devcontainer.json): local development container definition
- [`ARCHITECTURE.md`](/workspaces/deskclaw/ARCHITECTURE.md): short architecture snapshot
- [`docs/README.md`](/workspaces/deskclaw/docs/README.md): supporting documentation map
- [`docs/archive/PROPOSAL.md`](/workspaces/deskclaw/docs/archive/PROPOSAL.md): archived proposal narrative with objectives and methodology
- [`docs/openclaw/LEARNING.md`](/workspaces/deskclaw/docs/openclaw/LEARNING.md): OpenClaw operational notes and lessons learned
- [`docs/openclaw/notes.md`](/workspaces/deskclaw/docs/openclaw/notes.md): short command reminders for local OpenClaw usage
- [`.gitignore`](/workspaces/deskclaw/.gitignore): ignores local secret files such as `.env`
- [`.gitattributes`](/workspaces/deskclaw/.gitattributes): keeps common text files on LF line endings across Windows/devcontainer workflows
- [`skills/`](/workspaces/deskclaw/skills): repo-managed OpenClaw skills that teammates can review and share
- [`skills-lab/`](/workspaces/deskclaw/skills-lab): skill test plans and scripted evaluation prompts

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
- Treat [`ARCHITECTURE.md`](/workspaces/deskclaw/ARCHITECTURE.md) as the current scope lock unless the team decides to revise the project direction
- In a new chat, read [`AGENTS.md`](/workspaces/deskclaw/AGENTS.md), [`ARCHITECTURE.md`](/workspaces/deskclaw/ARCHITECTURE.md), and [`README.md`](/workspaces/deskclaw/README.md) before making scope assumptions
- On every new user prompt or task, re-check whether any kept context file needs an update before finishing the work
- Use the project-level Context7 MCP server when current library, framework, setup, configuration, or API documentation would reduce guesswork; resolve the relevant library or tool docs through Context7 instead of relying only on memory.
- Preserve the project's local-first and privacy-first assumptions unless the user approves a change in direction
- Use `ARCHITECTURE.md`, `README.md`, `AGENTS.md`, and the supporting docs under `docs/` as the build baseline and keep them synchronized with implementation changes
- Keep docs synchronized with implementation changes; this repo currently depends heavily on documentation accuracy
- If any kept context file becomes outdated, inconsistent, contradicted by implementation, or missing an important project decision, update that markdown file during that same task instead of leaving it stale for later
- Prefer small, inspectable local files for the first MVP: markdown knowledge, OpenClaw AgentSkills, straightforward config
- Keep shared skills in repo-level `skills/`; use local OpenClaw config `skills.load.extraDirs` to scan that folder instead of copying skill files into `/home/node/.openclaw/workspace/skills/`
- Treat large all-file diffs with equal insertions/deletions as possible line-ending churn; check before committing
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

To stay aligned with the current MVP scope:

- Do **not** treat Gmail integration as part of the active project scope
- Do **not** treat appointment-booking skills as part of the active project scope
- Do **not** assume a real multi-channel production integration is required for the first prototype
- Do **not** assume deep-link onboarding, QR flows, promo-code generation, or a custom human dashboard are required in the first implementation pass
- Do treat support answers, basic product assistance, local orchestration, and frustration-based human escalation as the core project

If future work wants to add any of the deferred ideas, update `ARCHITECTURE.md` first or clearly mark the new work as an extension. Update the archived proposal only if the team needs a revised presentation artifact.

## Practical Next Steps

If development starts from this repo, the likely order is:

1. Create `deskclaw-workspace/` and the initial OpenClaw config files from the MVP plan
2. Finish validating `skills/policy-oracle/`, `skills/search-products/`, and `skills/sentiment-router/` through `skills.load.extraDirs`
3. Decide whether the final workspace catalog should stay JSON or move to SQLite
4. Create the first final local knowledge documents, product catalog location, and workspace prompts
5. Verify OpenClaw can talk to Ollama through the forwarded gateway setup
6. Add scripted conversation fixtures for support, sales, and escalation testing
7. Only after that, consider extensions beyond the current MVP scope
7. Only after that, consider extensions beyond the current MVP scope

## Summary

The repo currently represents **DeskClaw as a well-defined concept with an early implementation plan**, not a built product. The clearest development path is to treat [`ARCHITECTURE.md`](/workspaces/deskclaw/ARCHITECTURE.md) as the scope anchor, then create the first real project assets around a local OpenClaw prototype for support, basic product assistance, and safe human handoff.
