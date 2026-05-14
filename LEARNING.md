# OpenClaw Sandbox - Learning & Notes

## 1. Core Architecture
*   **The Gateway:** The WebSocket hub (`openclaw gateway`) running in the background. It routes messages from channels to the AI.
*   **The Channels:** The input/output methods (Web UI, TUI, WhatsApp, Telegram).
*   **The Workspace:** The hidden brain (`/home/node/.openclaw/workspace`).
    *   `AGENTS.md` / `SOUL.md`: Define the system prompts and personality.
*   **Skills (MCP):** Node.js tools that the AI can execute (e.g., `read_file`, `goplaces`).
*   **Workspace Skills:** OpenClaw discovers custom skills from `/home/node/.openclaw/workspace/skills/<skill-name>/SKILL.md`. Skill names should use lowercase letters, numbers, and hyphens. The current lab skill source is `skills-lab/skills/policy-oracle/`, but it must be copied into the OpenClaw workspace skill layout before the TUI can load it automatically.

## 2. Crucial Commands
*   `openclaw onboard`: Setup wizard (skip daemon installation in Docker!).
*   `openclaw gateway`: Start the server.
*   `openclaw tui`: Launch the developer chat interface (requires gateway running).
*   `openclaw sessions list`: View all chat histories.
*   `openclaw reset`: Factory reset the configuration.
*   `openclaw skills list`: Check which skills OpenClaw currently sees.

## 3. Important Fixes (Docker on Windows)
*   **The "Local Install" Deadlock:** Do not run `npm install openclaw` in the shared workspace. The Windows-to-Linux bridge chokes on file I/O.
*   **The Fix:** Install globally in the container: `npm install -g openclaw@latest`.
*   **Bubblewrap Sandbox Trap:** Installing `bubblewrap` is not enough by itself. The devcontainer also needs `--security-opt seccomp=unconfined`, or namespace-based sandboxing will still fail with "No permissions to create new namespace".
*   **Cross-Platform `.env` Setup:** Do not rely on `initializeCommand` to create `.env`; it runs on the host OS, so shell commands differ across Windows and macOS. Copy `.env.example` to `.env` manually before opening the devcontainer.
*   **Context7 MCP:** Project-level Codex MCP config lives locally in ignored `.codex/config.toml`. Keep any `CONTEXT7_API_KEY` value in local `.env` or local Codex config only.
*   **The Zombie Process:** If the gateway refuses to stop and blocks port `18789`, kill it manually: `pkill -9 -f openclaw`.
*   **Local Models (Ollama):** Install Ollama natively on Windows, not in Docker. Connect OpenClaw to it using `http://host.docker.internal:11434`.
*   **Model Debugging:** `policy-oracle` has worked with `openai-codex/gpt-5.5`. If `ollama/gemma4:e4b` gives generic "no task found" answers, separate that as a model/prompt-following issue from OpenClaw skill file access.
*   **Dashboard Token in Devcontainers:** The dashboard may open in the host browser without the tokenized bootstrap URL because the container has no GUI/clipboard. If the page loads but asks for a gateway token, reveal it locally with:
    ```bash
    node -p "JSON.parse(require('fs').readFileSync('/home/node/.openclaw/openclaw.json','utf8')).gateway.auth.token"
    ```
    Paste the result into **Gateway Token** and do not share or commit it.
*   **Dashboard Browser Storage:** Prefer `http://localhost:18789/` consistently. `localhost` and `127.0.0.1` have separate browser storage, and stale dashboard auth can show `device token mismatch`; clear site data for both origins or use a private window.

## 4. Questions to Ask Later
*How do I write a custom Skill from scratch?*
*How do I create a new Agent profile that isn't the default 'main'?*
