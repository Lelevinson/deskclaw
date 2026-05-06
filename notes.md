### first-time devcontainer setup
copy `.env.example` to `.env` manually before opening or rebuilding the devcontainer

### check project context7 mcp
do `codex mcp list` from the repo root; `context7` should show as enabled

### shutdown timed out error
do `pkill -9 -f openclaw`

### open openclaw workspace dir in vscode
do `code /home/node/.openclaw/workspace`

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
