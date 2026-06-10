# OpenClaw Setup & Operations

Single source of truth for OpenClaw install, configuration, repo-skill loading, day-to-day commands, and known fixes. Other docs should link here instead of repeating commands.

## 1. Architecture (in one paragraph)

OpenClaw runs as a local gateway (`openclaw gateway`) on `ws://127.0.0.1:18789`. Channels (TUI, dashboard) connect to the gateway, the gateway routes to a model (local Ollama or `gpt-5.5` via the OpenAI Codex provider — see [§6](#6-models)), and the model uses **skills** — instruction folders with a `SKILL.md`. DeskClaw's shared skills live in [`skills/`](../../skills/), shared facts live in [`data/`](../../data/), and skills are loaded via the `skills.load.extraDirs` config below. Cart/account actions additionally use a local shop MCP server; see [`../../src/shop/README.md`](../../src/shop/README.md).

## 2. First-time setup inside the devcontainer

Run once per devcontainer / OpenClaw volume:

```bash
openclaw config set skills.load.extraDirs '["/workspaces/deskclaw/skills"]' --strict-json
openclaw config get skills.load.extraDirs --json
openclaw skills list
```

The third command should show `policy-oracle`, `search-products`, `sentiment-router`, and `cart-actions`. If a skill of the same name already exists under `/home/node/.openclaw/workspace/skills/`, the workspace copy wins — remove it to test the repo-managed version:

```bash
rm -rf /home/node/.openclaw/workspace/skills/<skill-name>
```

During `openclaw onboard`, **skip** daemon/service installation when prompted (Docker).

## 3. Daily commands

```bash
openclaw gateway                       # start the server
openclaw tui                           # chat interface (needs gateway running)
openclaw skills list                   # which skills OpenClaw sees
openclaw sessions list                 # past chats
openclaw --version
```

Inside the TUI, start a fresh session with `/new` after editing a `SKILL.md` to make sure the updated skill is loaded. The watcher may hot-reload, but `/new` is the reliable path.

## 4. Shop MCP tools

Build the shop tools and reset the mock runtime database:

```bash
npm run build
npm run shop:reset
```

Run the local shop eval harness (deterministic tool-level safety tests):

```bash
npm run shop:eval
```

Configure OpenClaw to see the shop MCP server:

```bash
openclaw mcp set deskclaw-shop '{"command":"node","args":["--env-file-if-exists=/workspaces/deskclaw/.env","/workspaces/deskclaw/dist/mcp/shop-server.js"],"cwd":"/workspaces/deskclaw"}'
openclaw mcp list
```

The `--env-file-if-exists=.env` flag is what loads the **outbound-email** secrets
(`RESEND_API_KEY`, `OWNER_EMAIL`, `NOTIFY_FROM`, `DESKCLAW_NOTIFY_MODE`) into the
MCP server process for `shop_owner_notify` (see [ARCHITECTURE.md](../../ARCHITECTURE.md) §5).
Without it the server still runs, but owner notifications stay in `dry` mode (no
`OWNER_EMAIL` → recorded, never sent). Restart the gateway after changing `.env`.

Run the MCP server directly only when debugging the server process:

```bash
npm run shop:mcp
```

Rebuild with `npm run build` after TypeScript changes. Reset with `npm run shop:reset` when scenarios need a clean cart.

### Proactive ops digest (scheduled, owner-facing)

DeskClaw can **proactively** email the owner a morning ops digest — open handoffs,
orders stuck in `processing`, and low-stock products — with no human in the
conversation. The trigger fires one real agent turn against the running gateway; the
agent inspects the store read-only (`shop_handoff_list`, `shop_orders_list_ops`,
`shop_low_stock_list`) and sends a model-composed summary via the owner-only
`shop_owner_notify` (`kind: "ops_digest"`, deduped by date → one digest/day). See
the `ops-digest` skill and [ARCHITECTURE.md](../../ARCHITECTURE.md) §5.

Run it manually (the demo trigger), with the gateway up:

```bash
npm run ops:digest
```

It **skips gracefully** (exit 0) if the gateway is unreachable. Whether the email is
actually sent vs only recorded follows the **MCP server's** env — `DESKCLAW_NOTIFY_MODE`
in `.env` (see §4): `live` sends via Resend, the default records-only. Setting the var
on the `ops:digest` command itself has no effect; it must be in `.env` and the gateway
restarted, because the gateway spawns the MCP process that does the send.

To make it **scheduled**, point OS cron at it (OpenClaw has no built-in scheduler), e.g.
a daily 08:00 run:

```cron
0 8 * * *  cd /workspaces/deskclaw && npm run ops:digest >> /tmp/deskclaw-ops-digest.log 2>&1
```

**Honest local-first caveat:** this is not an always-on server. The cron job only fires
while the machine is awake **and** `openclaw gateway` is running — if either is down at
08:00, that day's digest is silently missed (the next run sends the next day's). For a
live demo, just run `npm run ops:digest` on stage, or set a short cron interval during it.

## 5. Updating OpenClaw

```bash
npm install -g openclaw@latest         # manual update inside the current container
```

Container **reopen/restart** keeps the manually updated package. Container **rebuild** reruns `postCreateCommand` and installs whatever `openclaw@latest` resolves to at rebuild time. Config and workspace state live in the persistent `/home/node/.openclaw` Docker volume, so a package update should not wipe gateway/model/token settings; a newer version may migrate config format on first run.

## 6. Models

DeskClaw supports two models. Either can be selected in OpenClaw — pick whichever fits the moment.

- **Local Ollama** (e.g. `gemma3:4b` — confirm the exact tag you've pulled with `ollama list`). Install Ollama natively on the host (not in Docker); the devcontainer reaches it at `http://host.docker.internal:11434` via the `OLLAMA_HOST` variable in `.env`. Good for offline, privacy-preserving, or zero-cost runs.
- **`gpt-5.5` via the OpenAI Codex provider.** The `@openai/codex` CLI is installed by the devcontainer's `postCreateCommand`. Auth/session state lives in the persistent `deskclaw-codex` Docker volume mounted at `/home/node/.codex`. Re-authenticate with `codex login` inside the devcontainer. Good when the local model struggles to follow a skill prompt.

If a skill behaves wrong, treat it as a prompt/skill-wording issue first — `/new` for a fresh session, re-read the relevant `SKILL.md` and `data/` file, and iterate on the skill instructions before blaming the model.

## 7. Docker / devcontainer gotchas

- **Do not** run `npm install openclaw` inside the shared workspace mount; the Windows↔Linux file bridge causes lockups. Always install globally inside the container.
- **Bubblewrap sandbox:** installing `bubblewrap` is not enough by itself; the devcontainer also needs `--security-opt seccomp=unconfined`, or namespace sandboxing fails with "No permissions to create new namespace".
- **`.env` setup:** copy `.env.example` to `.env` manually before opening or rebuilding the container. Do not rely on `initializeCommand` for this — it runs on the host OS and breaks across Windows/macOS.
- **Named volumes** `deskclaw-codex`, `deskclaw-gemini`, `deskclaw-claude`, `deskclaw-data` survive normal rebuilds and hold local auth/session/runtime state. Only remove them when intentionally resetting.

## 8. Common fixes

- **Gateway won't stop / port 18789 stuck:** `pkill -9 -f openclaw`
- **Dashboard asks for a gateway token:** the container has no GUI/clipboard, so reveal the token manually:
  ```bash
  node -p "JSON.parse(require('fs').readFileSync('/home/node/.openclaw/openclaw.json','utf8')).gateway.auth.token"
  ```
  Paste into the dashboard's **Gateway Token** field. Do not commit or share it.
- **Dashboard says `device token mismatch`:** `localhost:18789` and `127.0.0.1:18789` use separate browser storage. Pick one origin (prefer `localhost`) and clear site data for the other, or use a private window.
- **WhatsApp QR login fails with missing `@whiskeysockets/baileys`:** for extension/demo-channel experiments, install the bundled plugin runtime dependencies inside the global OpenClaw package:
  ```bash
  cd /usr/local/share/npm-global/lib/node_modules/openclaw
  npm install --no-save --legacy-peer-deps @whiskeysockets/baileys@7.0.0-rc.9 https-proxy-agent@^9.0.0 jimp@^1.6.1 typebox@1.1.33 undici@8.1.0
  ```
- **WhatsApp downloaded plugin conflict:** if setup downloads `/home/node/.openclaw/extensions/whatsapp` and then fails with a missing internal module like `plugin-sdk/root-alias.cjs/bundled-channel-config-schema`, move the downloaded extension aside and use the bundled plugin:
  ```bash
  mv /home/node/.openclaw/extensions/whatsapp /home/node/.openclaw/extensions/whatsapp.disabled-20260520
  openclaw plugins enable whatsapp
  ```
  Restart the gateway after enabling.
- **WhatsApp identity wiring for gated skills:** connecting WhatsApp is a channel/config step (above), but the identity-gated skills (`cart-actions`, `order-status`, `returns-actions`) resolve the customer via `channel + externalUserId → accountLink`. Over WhatsApp the `externalUserId` is the sender's **phone number**, so bind it to the demo customer by adding/adjusting an `account-links` row in [`../../data/customers/account-links.json`](../../data/customers/account-links.json) (`"channel": "whatsapp"`, `"externalUserId": "+886…"`, `"status": "linked"`), then `npm run shop:reset`. The identity-free skills (`policy-oracle`, `search-products`, `sentiment-router`) work over WhatsApp with no wiring. This is a demo channel/config path, not the deferred "build our own WhatsApp integration" (ARCHITECTURE §5).
- **Full reset:** `openclaw reset` then `rm -rf /home/node/.openclaw/* /home/node/.openclaw/.[!.]*`

## 9. Context7 MCP for Codex

Project-scoped Codex MCP config lives in the gitignored `.codex/config.toml`:

```toml
[mcp_servers.context7]
url = "https://mcp.context7.com/mcp"
```

Codex loads project-scoped config only after the project is trusted. Restart Codex from the repo root and verify with `codex mcp list`. For higher rate limits, set `CONTEXT7_API_KEY` in local `.env` and reference it via `env_http_headers` in `.codex/config.toml`. Do not commit real API keys.

## 10. Open questions for later

- How to write a custom skill from scratch (template / examples).
- How to create a non-default agent profile.
