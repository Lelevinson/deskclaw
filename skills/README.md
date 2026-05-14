# DeskClaw Skills

This folder contains the repo-managed OpenClaw skills for the DeskClaw prototype.

Keep shared skill work here so teammates can review and version it with Git. Do not treat `/home/node/.openclaw/workspace/skills/` as the source of truth; that path is local OpenClaw runtime state in a Docker volume.

## One-time OpenClaw setup

Each developer should run this once inside the devcontainer so OpenClaw scans this repo folder:

```bash
openclaw config set skills.load.extraDirs '["/workspaces/deskclaw/skills"]' --strict-json
```

Check that OpenClaw can see the skills:

```bash
openclaw skills list
```

If a copied skill already exists in `/home/node/.openclaw/workspace/skills/` with the same name, that workspace copy takes precedence over this repo folder. Remove the copied workspace version when testing the repo-managed version:

```bash
rm -rf /home/node/.openclaw/workspace/skills/<skill-name>
```

## Folder shape

Use AgentSkills-compatible folders:

```text
skills/
  skill-name/
    SKILL.md
    references/
      supporting-file.md
```

Skill names should use lowercase letters, numbers, and hyphens, for example:

```text
policy-oracle
search-products
sentiment-router
```

## Development loop

1. Edit or add a skill under `skills/<skill-name>/`.
2. Run `openclaw skills list`.
3. Start a fresh TUI session with `/new`.
4. Test with the relevant scenario prompts.
5. Commit the skill files and any updated docs or scenarios.

OpenClaw builds a skill snapshot for each session. The skills watcher can hot-reload `SKILL.md` edits, but `/new` is the reliable way to make sure the current skill list and descriptions are used.
