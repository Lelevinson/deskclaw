# DeskClaw - Current Architecture Blueprint

## 1. The Stack

*   **Infrastructure:** Docker Dev Container (Windows WSL2 / local devcontainer workflow)
*   **AI Engine:** Target local Ollama model `gemma4:e4b` via `http://host.docker.internal:11434`; `openai-codex/gpt-5.5` may be used temporarily for skill behavior debugging when the local model fails to follow the skill prompt.
*   **Gateway:** OpenClaw on `ws://127.0.0.1:18789`
*   **Prototype Interface:** Simulated chat flow or lightweight local chat UI for demos and testing

## 2. Current Prototype Scope

*   **Automated Support:** Answer shipping, returns, and FAQ questions from local business documents
*   **Basic Product Assistance:** Search a small local product catalog and recommend suitable items
*   **Human Handoff Safety:** Detect frustration or sensitive cases and escalate to a human
*   **Evaluation:** Validate the prototype with scripted support, sales, and frustration conversations

## 3. Planned Local Data Sources

*   **Knowledge Base:** Markdown files such as `shipping.md`, `returns.md`, `faq.md`, and `product-care.md`
*   **Product Data:** Small structured catalog in JSON or SQLite
*   **Demo Inputs:** Scripted customer conversations for support, sales, and escalation scenarios

## 4. Planned Skills

*   `policy-oracle` (OpenClaw skill name)
*   `search-products`
*   `sentiment-router`
*   `escalate_to_human`

## 5. Deferred Extensions

These are possible later additions, but not part of the current proposal scope:

*   Real WhatsApp or Instagram integration
*   Deep-link or QR-based onboarding/setup flows
*   Dynamic discount or promo-code negotiation
*   Custom Node.js/React dashboard for human handoff

## 6. Open Questions

*Should the first product catalog use JSON or SQLite?*
*What exact frustration signals should trigger escalation?*
*What is the best minimal simulated chat interface for the prototype demo?*
