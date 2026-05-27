# AGENTS.md

Rules for contributors and AI agents working in this repo. **This file owns the rules and the topic→file map. It does not own scope, stack, status, or setup commands** — those live in the files linked below.

## Read first

For any new chat or task, read in order:

1. [`AGENTS.md`](AGENTS.md) — this file
2. [`ARCHITECTURE.md`](ARCHITECTURE.md) — scope, stack, status, planned layout
3. [`README.md`](README.md) — onboarding

Read [`docs/openclaw/setup.md`](docs/openclaw/setup.md) when the task touches OpenClaw, the devcontainer, or local tooling.

## Topic → file map

If you have a question or want to change something, this table tells you where to look or edit. Update **one** file, not three.

| Question / change | File |
|---|---|
| Is X in scope? Is X done? What's the stack? | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| How do I install / configure / debug OpenClaw? | [`docs/openclaw/setup.md`](docs/openclaw/setup.md) |
| How do I start the project for the first time? | [`README.md`](README.md) |
| How should I work in this repo? (commit style, rules) | [`AGENTS.md`](AGENTS.md) — this file |
| What skills exist and how are they named? | [`skills/README.md`](skills/README.md) |
| How a skill *behaves* | the skill's own `SKILL.md` under [`skills/`](skills/) |
| The facts a skill answers from | the skill's `references/` files |
| How do I run the scenario tests? Pass/fail rules? | [`skills-lab/README.md`](skills-lab/README.md) |
| The actual test prompts | [`skills-lab/scenarios/`](skills-lab/scenarios/) |
| Historical proposal narrative | [`docs/archive/PROPOSAL.md`](docs/archive/PROPOSAL.md) — read-only |

Rule: if a fact appears in more than one file, one of them is wrong. Fix it in the owning file and replace the other with a link.

## Working agreements

- **Be explicit about implemented vs. planned.** Status changes go in `ARCHITECTURE.md` §3.
- **Treat `ARCHITECTURE.md` as the scope lock.** Adding a deferred extension requires updating `ARCHITECTURE.md` §5 first.
- **Keep docs in sync with implementation in the same change.** If you add code that contradicts a doc, fix the doc in the same commit.
- **One fact, one home.** Before adding content, check the topic→file map. If unclear, link to the owning file rather than copying.
- **Preserve local-first / privacy-first assumptions** unless the user approves a change.
- **Prefer small, inspectable local files** for the MVP: markdown knowledge, AgentSkills, simple config.
- **Use Context7 MCP** when current library/API docs would reduce guesswork; do not rely on memory for API shapes.
- **Treat large all-file diffs with equal insertions/deletions as line-ending churn** — check before committing.
- **Never commit secrets, generated auth files, or personal OpenClaw workspace state.**
- **Prefer simulated/local test flows** before attempting real channel integrations.

## Scope guardrails

The following are explicitly **out** of MVP scope (full list in [`ARCHITECTURE.md`](ARCHITECTURE.md) §5):

- Gmail, WhatsApp, Instagram, or other real channel integrations
- Appointment booking
- Deep-link / QR onboarding, promo-code generation, custom dashboards

To work on any of these, update `ARCHITECTURE.md` first or label the work clearly as an extension.

## Commit style

```text
<type>: <summary>
```

`type` is one of `docs`, `chore`, `update`, `fix`, `feat`. Subjects are lowercase after the prefix and short. Add a body when the reason isn't obvious from the subject. Examples:

```text
docs: collapse OpenClaw notes into setup.md
chore: enable bubblewrap sandbox in devcontainer
update: container config and proposal script
fix: correct shipping policy reference path
```

## Practical next steps

If implementation work resumes from here, the likely order is:

1. Decide the open questions in [`ARCHITECTURE.md`](ARCHITECTURE.md) §6.
2. Validate `policy-oracle`, `search-products`, and `sentiment-router` via the scenario files in [`skills-lab/scenarios/`](skills-lab/scenarios/).
3. Create `deskclaw-workspace/` and the initial OpenClaw config from the planned layout in `ARCHITECTURE.md` §4.
4. Verify OpenClaw can reach the configured model — local Ollama or `gpt-5.5` via Codex ([setup.md §5](docs/openclaw/setup.md#5-models)).
5. Add an automated scenario runner so the tests produce a pass/fail score instead of requiring manual TUI input.
6. Only after that, consider any deferred extension.
