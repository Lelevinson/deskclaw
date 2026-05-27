# DeskClaw — Claude Code Bootstrap

Read these two files before doing anything else:

1. [`AGENTS.md`](AGENTS.md) — contributor rules, topic→file map, working agreements
2. [`ARCHITECTURE.md`](ARCHITECTURE.md) — scope, stack, status, planned layout, resolved decisions

Read [`docs/openclaw/setup.md`](docs/openclaw/setup.md) when the task touches OpenClaw, the devcontainer, or local tooling.

## Claude-specific notes

- **Topic→file map is in `AGENTS.md`.** Before editing any markdown file, check that map — one fact, one home.
- **Do not touch `docs/archive/PROPOSAL.md`.** It is a historical snapshot, not a live doc.
- **`deskclaw-workspace/` is now scaffolded.** `SOUL.md`, `AGENTS.md`, knowledge base, catalog, and demo scenarios are all present. Check `ARCHITECTURE.md §3` for current status before assuming something is missing.
- **Skills live in `skills/`, not `skills-lab/`.** `skills-lab/` is for evaluation scenarios only.
- **Prefer small, targeted edits.** This repo is documentation-heavy — a wrong edit in the wrong file breaks the single-ownership model.
- **When in doubt about scope**, check `ARCHITECTURE.md §5` (deferred extensions) before adding anything new.
