# .claude/

Claude Code project configuration and AI-assisted **development** tooling for DeskClaw.

This is separate from [`../skills/`](../skills/), which holds the **product** skills OpenClaw loads at runtime. Keep the two from blurring:

| Folder | Audience | Purpose |
|---|---|---|
| [`../skills/`](../skills/) | OpenClaw (the product) | Customer-facing agent behaviors |
| `.claude/` | Claude Code (the dev harness) | Tooling that helps *build* the product |

## What lives here

- `commands/` — custom `/slash` commands for repeatable dev tasks (e.g. [`/verify-shop`](commands/verify-shop.md)).
- `skills/` — Claude Code (dev-harness) skills that help *build* DeskClaw. Not loaded by OpenClaw. See [`skills/README.md`](skills/README.md).
- `agents/` — project subagent definitions for delegating dev work. See [`agents/README.md`](agents/README.md).
- `settings.json` — shared, committed Claude Code project settings (add when there's a real setting to share, e.g. a permission allowlist via the `update-config` skill or `/fewer-permission-prompts`).
- `settings.local.json` — personal, **gitignored** overrides. Never commit this.

Each subfolder carries a short README explaining what belongs in it. Add actual commands/skills/agents when a real need appears — keep the convention, skip empty clutter.

## Future: UI / storefront work

When the mock storefront is built (see [`../ARCHITECTURE.md`](../ARCHITECTURE.md) §6 and [`../src/shop/README.md`](../src/shop/README.md) §7), Claude-side helpers for that work — commands, subagents, or notes — belong here, not under `skills/`.
