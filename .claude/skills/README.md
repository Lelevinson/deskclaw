# .claude/skills/

Claude Code **skills** — reusable instructions for the dev harness (Claude Code) when building DeskClaw.

Do not confuse these with [`../../skills/`](../../skills/): those are **product** skills OpenClaw loads at runtime for customers. The skills here are for *development* and are never shipped to OpenClaw.

Shape (same as any Claude Code skill):

```text
.claude/skills/
  skill-name/
    SKILL.md
```

Add one when a dev task is worth capturing as a reusable skill — for example "scaffold a new shop MCP tool" or "add a policy doc + matching scenario". Until then this folder just documents the convention.
