# skills/

Repo-managed OpenClaw skills. **This folder is the canonical source.** Do not treat `/home/node/.openclaw/workspace/skills/` as the source of truth — that path is local OpenClaw runtime state in a Docker volume.

For loading these into OpenClaw (the `skills.load.extraDirs` command, precedence rules, and removing stale workspace copies), see [`../docs/openclaw/setup.md`](../docs/openclaw/setup.md).

## Folder shape

```text
skills/
  skill-name/
    SKILL.md
    references/
      supporting-file.md
```

Skill names use lowercase letters, numbers, and hyphens (e.g. `policy-oracle`).

## Current skills

- [`cart-actions/`](cart-actions/) — guides MCP-backed customer cart actions with preview, confirmation, execution, and audit logging.
- [`policy-oracle/`](policy-oracle/) — answers shipping, returns, FAQ, warranty, and product-care policy questions from bundled markdown references.
- [`search-products/`](search-products/) — recommends products from a bundled demo JSON catalog.
- [`sentiment-router/`](sentiment-router/) — classifies customer messages as `continue`, `handoff_recommended`, or `urgent_handoff`.

## Development loop

1. Edit or add a skill under `skills/<skill-name>/`.
2. `openclaw skills list` to confirm OpenClaw sees it.
3. In the TUI, `/new` to start a fresh session (skill snapshot is per-session).
4. Run the relevant prompts from [`../skills-lab/scenarios/`](../skills-lab/scenarios/).
5. Commit the skill files and any updated scenarios.
