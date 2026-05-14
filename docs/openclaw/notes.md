### first-time devcontainer setup
copy `.env.example` to `.env` manually before opening or rebuilding the devcontainer

### check project context7 mcp
do `codex mcp list` from the repo root; `context7` should show as enabled

### shutdown timed out error
do `pkill -9 -f openclaw`

### open openclaw workspace dir in vscode
do `code /home/node/.openclaw/workspace`

### openclaw repo skill location
use `/workspaces/deskclaw/skills/<skill-name>/SKILL.md` as the shared source of truth

skill names should use lowercase letters, numbers, and hyphens, like `policy-oracle`

### configure openclaw to scan repo skills
do this once per devcontainer/OpenClaw volume:

```bash
openclaw config set skills.load.extraDirs '["/workspaces/deskclaw/skills"]' --strict-json
```

confirm with `openclaw config get skills.load.extraDirs --json`

### remove old copied workspace skill
if `/home/node/.openclaw/workspace/skills/<skill-name>` exists with the same name, it wins over repo skills; remove it when testing repo-managed skills:

```bash
rm -rf /home/node/.openclaw/workspace/skills/<skill-name>
```

### check loaded openclaw skills
do `openclaw skills list`

### refresh skill behavior
start a fresh TUI session with `/new`; restart gateway/TUI if the skill list still looks stale

### check openclaw version
do `openclaw --version`

### manually update openclaw in the current container
do `npm install -g openclaw@latest`

normal container reopen/restart keeps the manually updated package; a future container rebuild reruns `postCreateCommand` and installs whatever `openclaw@latest` is at rebuild time

OpenClaw config and workspace state live in the persistent `/home/node/.openclaw` Docker volume, so a package update should not wipe model, gateway, token, or workspace settings; a newer OpenClaw may still migrate/rewrite config format on first run

### reset openclaw (full)
do `openclaw reset` then `rm -rf /home/node/.openclaw/* /home/node/.openclaw/.[!.]*`

### openclaw gateway service
select **NO**

### openclaw dashboard token in devcontainer
if the dashboard loads but says `unauthorized` or asks for a gateway token, get it manually inside the devcontainer:

```bash
node -p "JSON.parse(require('fs').readFileSync('/home/node/.openclaw/openclaw.json','utf8')).gateway.auth.token"
```

paste that into the dashboard's **Gateway Token** field; do not commit or share the printed token

### openclaw dashboard stale browser auth
use one browser origin consistently, preferably `http://localhost:18789/`; if `device token mismatch` appears, clear site data for `localhost:18789` and `127.0.0.1:18789` or use a private window
