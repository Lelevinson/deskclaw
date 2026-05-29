# .claude/agents/

Project **subagent** definitions for Claude Code — specialized helpers to delegate dev work (for example a focused code reviewer or a test runner) so the main session stays uncluttered.

Shape:

```text
.claude/agents/
  agent-name.md
```

Each file has frontmatter (`name`, `description`, allowed tools) and a system prompt. Add one when a recurring dev task benefits from an isolated agent with its own tool set. Until then this folder just documents the convention.
