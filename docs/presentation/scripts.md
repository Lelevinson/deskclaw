# DeskClaw — Final Presentation Scripts

Spoken scripts, slide by slide. Companion to [`outline.md`](outline.md) and the HTML mocks in [`slides/`](slides/).

**How to read this**
- `[click]` = advance slide. `[pause]` = beat for emphasis.
- Times are targets, not limits — say it naturally.
- **RECAP** marks a slide shown at the proposal: keep it fast, don't re-teach.
- Voice: first-person plural, warm, confident. This is a *final* — we're showing what we delivered, not what we hope to do.

> Status: **COMPLETE — all three blocks scripted** (P1 why/what · P2 how/verified · P3 demo/close), aligned to the final project state (PRs through #39). Presenter assignments are placeholders: [P1] / [P2] / [P3].

---

## P1 — Presenter 1 (~4.5 min)

### Opening line (before P1-01, ~10s)
> "Hi everyone — we're the team behind DeskClaw. Back in April we pitched you an idea; today we're going to show you what it became — and where it grew past the plan."

*(Presenter blocks are placeholders — assign [P1] / [P2] / [P3] among yourselves; names live on the title slide only.)*

### P1-01 — Title (~20s) · *RECAP*
> "Quick reminder of what DeskClaw is: a **full-lifecycle conversational commerce agent for local D2C brands**. [pause] You've seen the name — what's new today is everything *behind* it. Let's start with the problem we set out to solve."

*[click]*

### P1-02 — Problem: Conversational Bottleneck (~45s) · *RECAP*
> "You'll remember the core problem — the **conversational bottleneck**. Shopping has moved into the chat window: 60% of people discover products on Instagram, 90% of Taiwanese consumers use LINE every day, and roughly 90% of Asian users buy through social channels. [pause] But small D2C brands answer those chats by hand — the same questions over and over — or they bolt on a rigid chatbot that can't actually *do* anything. The result is repetitive queries, lost sales, and frustrated customers. [pause] That was our starting point. So — what did we build?"

*[click]*

### P1-03 — What DeskClaw is (~50s) · *NEW*
> "DeskClaw is a **local-first conversational commerce agent** for a small D2C skincare brand — we built a fictional one called **Amelya's** to make it real. [pause] The key word is **full-lifecycle**: it doesn't just answer FAQs. It walks the customer through the whole journey — **discover** a product, **buy** it, **track** the order, **return** it if needed — and it knows when to **hand off to a human**. [pause] It lives in two places that share one brain: the **chat agent** — which customers reach over **real WhatsApp** — and a companion **web storefront**. Same data, same rules, two front doors. [pause] And one more thing, which we'll come back to: it doesn't only *react*. DeskClaw also works **proactively, for the owner**."

*[click]*

### P1-04 — From proposal to delivery (~70s) · *NEW — the key slide*
> "Now, the honest part — what changed since April. [pause] We proposed three pillars: automated support, active sales, and brand safety. Two of them we delivered and went *further* on. The third — 'active sales' — we'd pitched as **margin-aware price negotiation**. [pause] When we actually researched what small skincare brands need, the evidence said: **don't** let a bot haggle or move money on its own — it's risky and it's not what customers actually ask for. So we **cut** it. [pause] And we spent that effort where the real demand was: the **post-purchase lifecycle** — cart, checkout, orders, returns — plus a proper **evaluation harness**, and then something we never promised in April: a **proactive ops agent** that emails the owner and a staff panel to act on it. You'll see both later. [pause] So the scope didn't shrink — it got *sharper*, and then it grew past the proposal. The word 'full-lifecycle' in our title is actually **more true today** than it was in the proposal. That's the story of this project: **evidence over ambition**."

*[click]*

### P1-05 — What we built / scope (~45s) · *ADAPTED from Objectives*
> "Here's the finished scope, mapped to that journey. **Discover** — product search, recommendations, even a full skincare-routine concierge. **Ask** — policy and product answers, grounded only in the brand's own documents. **Buy** — build a cart and check out, safely. **Track** — order and delivery status. **Return** — file a return or exchange request. And across all of it, **escalate** to a human the moment something's sensitive. [pause] Every one of these was chosen from research — including the things we *deliberately left out*, which we'll be upfront about at the end. [pause] So that's the *what*. [P2] will show you the *how* — how we make all of this safe by design."

*[hand off to P2]*

---

## P2 — Presenter 2 (~5 min)

### P2-01 — Architecture: three layers + the MCP boundary (~70s)
> "So how is this built so it's actually safe? Three layers, with one hard rule between them. [click] At the top, the **skill** — that's just instructions, the agent's playbook for a situation. In the middle, **typed tools** — small, validated operations like 'preview adding this item' or 'look up this order.' And at the bottom, the **shared data**. [pause] Here's the rule that makes it safe: **the model never touches the database directly.** It can only act by calling a typed tool — there's no 'run this SQL' escape hatch. So every action the agent takes is one we defined, validated, and logged. [pause] And because the tools and data are shared, adding a new skill is cheap — most of the time it's new instructions plus maybe one new tool. That's how we got from four skills to ten without the thing collapsing under its own weight."

*[click]*

### P2-02 — The safety pipeline (~70s)
> "Every action that *changes* something runs through the same four steps. [click] **Identity** — and this is the important one — we never trust an ID the customer types. Identity comes from the channel itself: who sent the message. So you can't read someone else's orders by guessing an order number. **Preview** — the tool shows exactly what will happen. **Confirm** — nothing commits until the customer explicitly says yes. **Audit** — every action is logged. [pause] And some guarantees are *structural*, not just promises. The owner-notification tool has **no recipient field** — it can only email the owner, so a customer can never be emailed by accident. The agent **never moves money** — refunds and cancellations always go to a human. [pause] We didn't bolt safety on at the end. The pipeline *is* the architecture."

*[click]*

### P2-03 — The agentic loop (~80s) · *showpiece — concept here, live in the demo*
> "Now the part we're proudest of. DeskClaw isn't only reactive — it works **on its own**, for the owner. [click] Here's the loop. A **schedule** wakes the agent in the morning — **no human prompt at all.** It reads the shop, read-only — open handoffs, orders stuck in processing, low stock — and it **composes and sends the owner an email**: a morning ops digest, in its own words, not a template. [pause] The owner reads it, logs into the **admin panel**, and clears the queue — resolves the handoff, ships the order, restocks the product. And the next morning's digest reflects what's fixed. [pause] That's a full operational loop: the agent surfaces the work, a human closes it. And this isn't a mock-up — we've run it live: the agent triaged a real WhatsApp complaint, escalated it, and a real email landed in the owner's inbox. You'll see that in a minute. [pause] One honest caveat: it's local-first, so 'proactive' means *while our machine and gateway are running* — there's no always-on server. But the agent behavior is real."

*[click]*

### P2-04 — Evaluation: how we know it works (~70s)
> "Last thing from me — how do we *know* any of this works, instead of just hoping? We test it on two levels. [click] **Tool level** — deterministic tests with no model involved, that assert the safety guarantees directly: unlinked identity is refused, you can't confirm someone else's action, every mutation writes a log. That suite is at **97 passing, zero failing**. **Agent level** — we drive the *real* model through **14 scenarios** and check it routes to the right skill, answers only from data, and asks before mutating. [pause] Both run automatically in **CI** on every change. And the whole loop has been verified **live, end-to-end**. [pause] So when we say it's safe, that's not a claim — it's a test suite. [pause] Now — let's actually watch it work."

*[hand off to P3 for the live demo]*

## P3 — Presenter 3 (~5 min)

### P3-01 — Ten skills, two sides of the counter (~35s)
> "Here's everything DeskClaw can do today — ten skills. [click] Nine face the **customer**: search, a routine concierge, policy answers, cart, checkout, order tracking, returns, account registration, and escalation. And one faces the **owner**: the proactive ops digest, with an email channel and an admin panel around it. [pause] I'm not going to walk through cards — it's faster to just show you. Let's run it for real."

*[click → demo slide stays on screen; switch to the live windows]*

### P3-02 — Live demo (~3.5 min) · *the centerpiece*

**(Beat 1 — pre-staged registration, ~20s)** *[show the WhatsApp thread on the phone/screen]*
> "Before the talk, we registered as a brand-new customer — over **real WhatsApp**. Here's the conversation: we said 'I'd like an account', the agent — you'll see it answers as *Amelya's Concierge*, the brand DeskClaw is serving — confirmed the name, created the account, and gave us an **account code**. Keep that code in mind; it comes back in a minute. [pause] Notice what we *didn't* do: we never typed an ID to prove who we are. The WhatsApp number itself is the identity."

**(Beat 2 — routine concierge, live, ~60s)** *[type: "can you build me a morning and night routine for dry skin, under NT$2000?"]*
> "Now, one natural ask — a full skincare routine, with a budget." *(while the model works:)* "What's happening behind the scenes: it's searching the catalog, checking the brand's own compatibility rules — which products pair, what order to apply — and pricing the bundle. No outside knowledge, only the brand's data." *[regimen appears]* "There's the regimen — morning and night, under budget. It offers to add the bundle… let's say yes." *[confirm; per-item previews appear]* "And here's the thing to watch: **it never adds a single item without asking.** Every line gets a preview and a yes. That's the safety rail from [P2]'s section — live."

**(Beat 3 — checkout, live, ~30s)** *[type: "check out please" → preview → "yes"]*
> "Checkout: it previews the items and the total, waits for the yes… and the order is placed. No payment — that's by design, the agent never touches money — but it's a real order record, stock decremented, audit logged."

**(Beat 4 — cross-channel bridge, live, ~40s)** *[switch to storefront, register/log in with the account code, open Orders]*
> "Now the bridge. Same brand, different door — the web storefront. We sign in using that **account code** from WhatsApp… and look at the orders page: **the order we just placed in chat is right there.** One identity, two channels, one brain. The web session resolves through exactly the same identity path as the chat did."

**(Beat 5 — the climax: the agent wakes alone, ~60s)** *[terminal: `npm run ops:digest`]*
> "Last one — the part nobody asked for in chat. Every morning, a schedule wakes the agent with **no human prompt**. We'll trigger that morning right now." *(while it runs:)* "It's reading the shop on its own: open escalations, orders stuck in processing, products running low… and now it's writing the owner an email — its own words, not a template." *[switch to Gmail; the digest lands]* "There it is — a real email, in the owner's real inbox. [pause] And the loop closes on the human side:" *[log into `/admin`]* "the admin panel shows the same queues — there's the handoff from the digest — and a human resolves it. [pause] Agent surfaces the work, human closes it. That's the whole thesis on one screen."

*[click → P3-03]*

### P3-03 — Honest close: limits & where it goes (~45s)
> "Where this stands, honestly. Some things are **fenced on purpose** — the agent never moves money, never changes a shipping address, never messages customers unprompted. Those were research calls, not gaps. [pause] Some things are **real limits** — it's local-first, so 'proactive' only runs while our machine is up; the account code stands in for a real one-time code we'd deliver out-of-band in production. [pause] And the future is cheap by design: a new channel — Instagram, LINE, Telegram — is a **gateway adapter**, not a rewrite, because identity, tools, and safety all live below the channel."

*[click]*

### P3-04 — Takeaways + Thank You (~20s)
> "So: a full-lifecycle commerce agent — ten skills, twenty-nine typed tools, a hundred-plus tests — that can sell, support, escalate, and even run the morning ops — and **can't** spend a single dollar without a human. [pause] Evidence over ambition. Thanks — we're happy to take questions."
