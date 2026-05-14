# DeskClaw: Full-Lifecycle Conversational Commerce Agent

> Historical proposal snapshot. Use the root `ARCHITECTURE.md` as the current implementation source of truth.

## 1. Presentation Title
**DeskClaw: Full-Lifecycle Conversational Commerce Agent for Local D2C Brands**
*Members: [Your Name/Team]*

## 2. Introduction / Background
Local Direct-to-Consumer (D2C) brands increasingly rely on social media platforms (WhatsApp, Instagram) for customer engagement. However, traditional e-commerce platforms (like Shopee or Shopify) act as static digital catalogs lacking conversational interfaces. As a result, businesses struggle to scale personalized customer service and consultative sales, which are crucial for maintaining brand loyalty and driving revenue in modern retail.

## 3. Problem Statement
Small and medium-sized D2C businesses waste hours manually answering repetitive pre- and post-sales questions via Direct Messages. They also lose potential sales because they cannot provide immediate, 24/7 product guidance when customers ask which item fits their needs. Existing chatbot solutions are often rigid, robotic, and lack the ability to handle context, grounded business policies, and sensitive complaints, which can actively frustrate customers instead of helping them.

## 4. Objectives
**Main Objective:** Develop an intelligent, conversational commerce agent that automates customer service and actively drives sales without requiring businesses to surrender privacy to cloud AI providers.

**Specific Objectives:**
*   Develop a hybrid AI architecture that securely queries local business documents and product data without altering the core Large Language Model (LLM).
*   Improve customer satisfaction by providing instant, accurate answers to policy inquiries using Retrieval-Augmented Generation (RAG).
*   Support sales conversations through personalized product matchmaking based on customer needs.
*   Reduce the risk of PR disasters by implementing a sentiment analysis layer that automatically routes frustrated users to human agents.
*   Leave room for future extensions such as controlled discount negotiation, without making them part of the first prototype scope.

## 5. Proposed Methodology
**Approach:** The system uses a "smart orchestration" architecture that wraps around a frozen, local foundation model. Instead of retraining the model, the system leverages external tools, retrieval mechanisms, and strict prompt engineering to guide the AI's behavior.

**Models:** 
*   Local LLM: `gemma4:e4b` (running via Ollama) to ensure data privacy and zero inference costs.
*   Zero-shot classification for sentiment analysis.

**System Workflow:**
1.  **Policy Oracle (RAG):** The system searches local markdown documents such as shipping, returns, and FAQ files to provide instant, accurate answers to policy inquiries by injecting relevant text into the LLM's context.
2.  **Basic Product Assistance (Database Query):** For shopping inquiries, the LLM extracts user requirements and triggers external functions to query a small structured product catalog, returning grounded recommendations.
3.  **Frustration Safety Net (Sentiment Routing):** Operating continuously, a zero-shot sentiment classifier or lightweight routing step monitors the conversation. If negative emotion is detected, the AI halts and automatically escalates the thread to a human manager.
4.  **Prototype Evaluation:** The system is tested through scripted support, sales, and frustration scenarios using a simulated chat interface rather than full production channel integrations.

**Future Extensions (Not in the current prototype scope):**
*   Controlled discount or negotiation flows
*   Deep-link or QR-based setup assistance
*   Direct production integrations with messaging platforms

## 6. Dataset / Data Source
*   **Dataset Name:** DeskClaw D2C Synthetic Knowledge Base
*   **Source:** Custom-generated datasets designed to simulate a realistic local brand.
*   **Type of Data:** 
    *   *Unstructured Data:* Markdown files containing company policies and FAQs (e.g., shipping, returns, product care).
    *   *Structured Data:* JSON files or lightweight SQLite databases representing a small product catalog (including product names, tags, prices, and links).
    *   *Evaluation Data:* Scripted chat scenarios covering support questions, product discovery, and frustrated complaints.
*   **Expected Size:** Small-scale (megabytes) optimized for rapid prototyping, local testing, and demonstration.

## 7. Tools & Technologies
*   **AI Engine:** Ollama running the `gemma4:e4b` local model.
*   **Orchestration / Gateway:** OpenClaw (Node.js/WebSocket hub) to handle tool execution and routing.
*   **Programming Languages:** JavaScript (Node.js) for OpenClaw Skills and Python for data handling (if needed).
*   **Infrastructure:** Docker Dev Container running on Windows WSL2.
*   **Prototype Interface:** Simulated WhatsApp/Instagram/LINE-style chat interface or scripted message flow for the first demo.

## 8. Expected Outcomes
*   A fully functional prototype demonstrating local-first support and sales-assistance patterns running entirely on local hardware.
*   Measurable reduction in simulated human response time for repetitive policy inquiries.
*   A grounded demonstration of product guidance based on local structured data rather than free-form model guessing.
*   A robust demonstration of an AI agent that transitions safely from automated conversation to human intervention based on emotional context.
