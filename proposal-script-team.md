# DeskClaw: Presentation Script

## Slide 1: Title & Introduction
**Visual:** Title Slide - "DeskClaw: Full-Lifecycle Conversational Commerce Agent for Local D2C Brands". Names of team members. A clean, professional logo or graphic (e.g., a simple robot icon next to a smartphone).

**Speaker Script:**
"Good morning, everyone. Today, our team is excited to introduce DeskClaw, our proposal for a full-lifecycle conversational commerce agent for local Direct-to-Consumer, or D2C, brands.

D2C means these brands sell directly to customers, often through online stores, social media, and messaging platforms.

In simple terms, DeskClaw is an AI assistant designed to help these sellers handle conversations before, during, and after purchase, from product questions and buying decisions to policy support and human handoff when a conversation becomes sensitive.

The key idea is simple: customers already talk to brands through DMs, but small businesses cannot always respond instantly. DeskClaw proposes a privacy-first, local AI layer to bridge that gap."

## Slide 2: The Problem Statement (The Conversational Bottleneck)
**Visual:** A graphic showing a Shopee storefront and an overflowing Shopee Chat/Instagram inbox. Bullet points: Repetitive Queries, Lost Sales, Rigid Chatbots.

**Speaker Script:**
"To understand why DeskClaw is necessary, let's look at the reality for local sellers.

Many D2C brands now get discovered through social platforms like Instagram, TikTok, LINE, and WhatsApp. A customer might see a product at midnight and immediately ask: Is it still in stock? Can it arrive before the weekend? Is there a discount if I buy two?

The problem is that small sellers cannot always respond instantly across every platform. Even when marketplaces like Shopee provide built-in chat, the auto-replies are often rigid and cannot handle context, recommendations, or sensitive complaints.

So the core problem is a conversational bottleneck: customer interest happens in real time, but seller response capacity does not. That delay leads to repetitive manual work, frustrated customers, and lost sales."

## Slide 3: Project Objectives
**Visual:** A clean layout highlighting the Main Objective and three core Business Objectives (Support, Sales, Brand Safety).

**Speaker Script:**
"So based on that problem, our main objective is to design an intelligent conversational agent that improves both customer support and sales conversations for local D2C brands.

We break this into three objectives.

First is automated support. DeskClaw should answer common policy questions quickly, but the answers must be grounded in the business's own documents, not invented by the model.

Second is active sales. DeskClaw should help customers find suitable products and, in future extensions, support controlled discount or negotiation flows within business-approved limits.

Third is brand safety. If the customer becomes frustrated or the issue becomes sensitive, DeskClaw should stop the automated flow and escalate to a human.

So the goal is not to replace the business owner completely. The goal is to automate repetitive conversations while keeping the owner in control."

## Slide 4: Proposed Methodology
**Visual:** A central "Smart Orchestration Gateway" (OpenClaw) connected to a "Frozen LLM" (`gemma4:e4b`). Three branching paths extend from the gateway, labeled: 1. Support (RAG), 2. Sales (Tool Calling), 3. Safety (Sentiment).

**Speaker Script:**
"To achieve these objectives, our proposed methodology is a smart orchestration architecture.

The key idea is that the language model should not work alone. A normal chatbot mainly depends on whatever the model remembers or guesses. DeskClaw instead places OpenClaw in the middle as a gateway. In this context, the gateway is the layer that receives the customer message, sends it to the AI model, and connects it to external tools when needed.

These tools are small task-specific functions, or skills, that the AI can call. For example, one tool can search policy documents, another can look up product data, and another can detect when a customer should be escalated to a human.

When a message comes in, the gateway decides what kind of help is needed. If the customer asks about policies, DeskClaw uses RAG, or Retrieval-Augmented Generation, to pull the relevant answer from local business documents. If the customer is shopping, the system can use tool calling to search product data or simulate a controlled discount flow. And if the customer sounds frustrated, sentiment routing stops the automated response and sends the case to a human.

So our methodology is not to retrain a model from scratch. Instead, we use a local model as the reasoning layer, and OpenClaw as the orchestration layer that connects it to tools, data, and safety rules."

## Slide 5: Tools & Technologies
**Visual:** A layered prototype stack. Top: "Simulated Chat UI" with WhatsApp/Instagram/LINE-style message icons. Middle: "OpenClaw Gateway" as the largest central block. Side cards connected to it: "Ollama + Gemma 4" and "Node.js Skills". Bottom: "Docker Dev Container" as the development environment. Add small labels: "Gateway = routes messages + controls tool access" and "Skills = task-specific code functions".

**Suggested Slide Text:**
- Simulated chat interface
- OpenClaw Gateway for orchestration
- Ollama + local `gemma4` for reasoning
- Node.js skills for task-specific actions
- Docker Dev Container for consistent setup

**Speaker Script:**
"After the methodology, the next question is: what tools will we actually use to build it?

For the prototype, we will use a Docker Dev Container as our development environment. This helps keep the setup consistent across our team.

The most important tool in our stack is OpenClaw. Since OpenClaw may be unfamiliar, we can think of it as a gateway, or routing layer, between the customer, the AI model, and the business tools.

This gateway matters because a language model by itself can only generate text. Without a gateway, the AI might answer based only on its general knowledge, which can lead to wrong policies, hallucinated product details, or unsafe replies to angry customers. With OpenClaw in the middle, we can control what information the AI receives, what tools it can call, and when the conversation should be escalated. So OpenClaw is not magic, but it makes the system more manageable, modular, and extensible than a single hardcoded router.

The AI engine will be a local Gemma 4 model running through Ollama. This gives us a privacy-first prototype because customer messages do not need to be sent to a cloud model during testing.

The action layer will be built using Node.js skills. In practical terms, a skill is a small task-specific function that the AI can call through OpenClaw. Each skill has a specific job. For example, one skill can search policy documents, one can look up product data, and one can trigger human handoff when sentiment is negative.

For the customer interface, we will simulate WhatsApp, Instagram, or LINE-style messaging using a simple local chat interface or scripted message flow. This lets us demonstrate the experience without needing full production API access yet.

So the stack is: simulated chat for the interface, OpenClaw for orchestration, Gemma 4 for reasoning, Node.js skills for actions, and Docker for a consistent development environment."

## Slide 6: Dataset / Data Source
**Visual:** A clean knowledge-base layout titled "DeskClaw D2C Synthetic Knowledge Base". Show a simple creation flow: "Fictional Brand -> Policies -> Product Catalog -> Test Chats". Under it, show three data blocks: "Markdown Documents", "JSON/SQLite Catalog", and "Scripted Conversations". Use folder, database, and chat bubble icons.

**Suggested Slide Text:**
- Custom synthetic local-brand dataset
- Markdown policies: shipping, returns, product care, FAQs
- JSON/SQLite catalog: names, prices, tags, links, stock
- Scripted chats: support, sales, frustration scenarios
- Small prototype scale: megabytes, not big-data training

**Speaker Script:**
"For the dataset, we will create a custom synthetic knowledge base for a realistic local D2C brand.

We are using synthetic data because this is a proposal-stage prototype. It lets us test the system safely without using real customer conversations or private business records.

To create it, we will first define a fictional local brand and product category. Then we will manually prepare realistic business documents, such as shipping rules, return policy, product care instructions, and FAQs. For product data, we will create a small catalog in JSON or SQLite, similar to what a seller might keep in a spreadsheet. For testing, we will write scripted customer messages that represent common support questions, buying questions, and frustrated complaints.

The dataset will have three main parts.

First, policy documents. These will be Markdown files containing information like shipping rules, return policy, product care, and common FAQs. This is what the Policy Oracle will search when the customer asks a support question.

Second, a structured product catalog. This can be stored as JSON or SQLite, with fields like product name, price, tags, product link, and stock status. This gives the sales tools something realistic to query.

Third, scripted test conversations. These are sample customer messages for different situations: normal policy questions, product recommendation requests, and frustrated complaints. We can use these to test whether DeskClaw answers correctly or escalates to a human.

The expected dataset size is small, around megabytes, because the goal is not big-data training. The goal is to show how a local AI agent can retrieve and use the right business information without retraining the model."

## Slide 7: Expected Outcomes (Why It Matters)
**Visual:** Four outcome cards with simple icons: "Working Prototype", "Context Management", "Evaluation Results", and "Human Handoff Safety". Use a chat/laptop icon for prototype, a document-filter or funnel icon for context, a checklist/chart icon for evaluation, and a shield/person icon for safety.

**Suggested Slide Text:**
- Working prototype: policy Q&A + simulated sales support
- Context management: retrieve only relevant business data
- Evaluation results: scripted support, sales, and frustration tests
- Human handoff safety: escalate sensitive conversations

**Speaker Script:**
"To close the proposal, these are the outcomes we expect to deliver.

First, we expect to build a working prototype of DeskClaw. The prototype should demonstrate policy question answering through a local knowledge base, plus simulated sales-support actions such as product matching or discount logic.

Second, we expect to show how the architecture manages context. This is important because language models have token limits, so we cannot simply paste every policy document, product record, and previous message into the prompt. Instead, DeskClaw should retrieve only the relevant policy text, query only the needed product data, and keep only useful conversation state.

Third, we expect to evaluate the system using scripted customer conversations. These test cases will include normal policy questions, product recommendation requests, long conversations with changing context, and frustrated complaints. This lets us check whether DeskClaw retrieves the right information, responds appropriately, maintains useful context, and escalates when needed.

Finally, we expect to demonstrate a human handoff safety mechanism. This is important because the goal is not to let AI handle every situation blindly. The system should know when to stop automation and bring a human back into the conversation.

Overall, our expected outcome is a prototype that shows how OpenClaw can turn a local language model into a more useful, controlled, and business-aware conversational agent for D2C brands.

Thank you. We are happy to take your questions."
