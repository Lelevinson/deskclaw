# DeskClaw: Full-Lifecycle Conversational Commerce Agent
## System Design Specification

### 1. Overview
DeskClaw is an advanced AI customer service and sales agent designed for local Direct-to-Consumer (D2C) brands. It operates over messaging channels (WhatsApp, Instagram) and is powered by a local Large Language Model (`gemma4:e4b`) via the OpenClaw Gateway. It moves beyond traditional static FAQs by actively driving sales, negotiating, and providing post-purchase support, all while maintaining a strict sentiment-based safety net.

### 2. Core Architecture & Stack
*   **AI Engine:** `gemma4:e4b` running locally via Ollama.
*   **Gateway/Orchestration:** OpenClaw running in a Docker Dev Container.
*   **Channels:** WhatsApp Business, Instagram.
*   **Data Sources:**
    *   Unstructured: Markdown/PDF files for company policies.
    *   Structured: JSON files or lightweight SQLite databases for products and inventory.

### 3. Core Features (The 5 Pillars)

#### 3.1. The "Policy Oracle" (RAG)
*   **Purpose:** Answer common pre- and post-sales questions regarding shipping, returns, and general business policies instantly and accurately.
*   **Mechanism:** Retrieval-Augmented Generation (RAG).
*   **Data Source:** Local Markdown files (e.g., `shipping.md`, `returns.md`).
*   **Action:** When a policy question is detected, the system searches the markdown files, retrieves the relevant text chunks, and injects them into the model's context window, instructing it to answer *only* based on the provided text.

#### 3.2. The "Personalized Matchmaker" (Database/Search)
*   **Purpose:** Act as a consultative salesperson, recommending products based on user needs rather than requiring them to browse a catalog.
*   **Mechanism:** Database querying and Tool Calling.
*   **Data Source:** A structured product catalog (JSON or SQLite) containing items, prices, links, and descriptive tags.
*   **Action:** The AI extracts user requirements from the conversation (e.g., "dry skin", "quiet keyboard") and calls a `search_products(tags)` skill. The system returns matching items, which the AI formats into a personalized recommendation with direct purchase links.

#### 3.3. The "Unboxing Concierge" (Deep Linking + Stateful Chat)
*   **Purpose:** Provide interactive, step-by-step setup assistance for complex products, reducing return rates and improving customer satisfaction.
*   **Mechanism:** Deep linking and context-aware state management.
*   **Action:** A QR code on the physical product box contains a WhatsApp deep link with a pre-filled payload (e.g., `Start Setup: Product X`). When the user sends this message, OpenClaw recognizes the command, loads the specific setup manual for "Product X" via RAG, and switches into "Concierge Mode", guiding the user step-by-step.

#### 3.4. The "Dynamic Negotiator" (Tool Calling/Logic)
*   **Purpose:** Close hesitant buyers or handle bulk orders by offering dynamic, margin-aware discounts.
*   **Mechanism:** Tool Calling and external API simulation.
*   **Action:** The system prompt defines acceptable discount margins (e.g., "max 15% off for orders over 3 items"). If the AI successfully negotiates a deal within these bounds, it calls a `generate_discount_code(percentage)` skill. This skill generates a unique, one-time promo code that the user can apply on the brand's e-commerce platform (e.g., Shopee/Shopify).

#### 3.5. The "Frustration Safety Net" (Sentiment Routing)
*   **Purpose:** Act as a foundational safeguard. Prevents the AI from exacerbating negative customer experiences.
*   **Mechanism:** Every incoming user message is pre-processed (either via a zero-shot prompt to Gemma or a dedicated lightweight sentiment classifier).
*   **Action:** If sentiment is classified as `Negative` or `Angry`, the AI immediately halts its automated response cycle and triggers the `escalate_to_human` skill, notifying the business owner to take over the chat.

### 4. Implementation Phasing (For Proposal)
*   **Phase 1 (MVP):** Implement OpenClaw infrastructure, RAG (Policy Oracle), and Sentiment Routing (Frustration Safety Net) using local markdown files.
*   **Phase 2:** Integrate structured data for the Personalized Matchmaker and implement the Deep Linking flow for the Unboxing Concierge.
*   **Phase 3:** Add complex tool calling for the Dynamic Negotiator (promo code generation) and human dashboard handoff.
