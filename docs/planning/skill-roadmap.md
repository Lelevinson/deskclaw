# Skill Roadmap (Planning)

Working doc for deciding which DeskClaw skills to build next, in what order, and what each needs. This is the durable handoff between the research/brainstorm session and the implementation sessions — planning chats don't share memory, so decisions live **here**, not in chat history.

**Status:** BRIEF — agenda is set; the deliverable (§4) is not yet filled in. The research/brainstorm session fills §3–§4 and updates scope.

## 1. Grounded truth (what exists today)

Implemented and tested skills (see [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) §3):

- `cart-actions` — add to cart, identity-gated, with preview → confirm → audit
- `policy-oracle` — shipping / returns / FAQ / warranty / product-care answers
- `search-products` — catalog recommendations
- `sentiment-router` — `continue` / `handoff_recommended` / `urgent_handoff`

Backend: the shop MCP (`shop_*` tools) over a local JSON store, reset from `data/`. The reusable pipeline is identity (account link) → preview → explicit confirm → execute → audit log.

## 2. Unverified input — review, don't trust

The "Possible Future Utilities" table in [`../../skills/README.md`](../../skills/README.md) was drafted by a previous AI and has **not** been validated. Treat it as raw input to challenge, not a plan:

- remove / update cart item
- order status lookup
- return request intake
- address / shipping preference update
- human handoff ticket creation
- mock storefront demo (UI, not a skill)

Apply to each: Is it real demand for a small D2C skincare brand? Does it reuse the existing identity → preview → confirm → audit pipeline? What new data domain does it require? Does it change scope ([`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) §5)?

## 3. Research questions (for the brainstorm session)

Run the `deep-research` skill with something like:

> What customer-service actions does a conversational commerce / support agent for a small D2C skincare brand typically handle? Which are table-stakes vs nice-to-have, and what are the common safety and identity pitfalls for cart, order, and account actions?

Then use the findings to:

- confirm or cut each item in §2
- surface anything missing (e.g. product Q&A, restock alerts, order tracking, subscriptions)
- map each survivor onto the skill / inner-tool / data layers

## 4. Deliverable (fill in during the session)

A prioritized, scoped backlog. For each chosen skill:

- name + one-line customer value
- new skill? extension of an existing one? inner-tool-only?
- inner tools + data it needs
- scope impact — does [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) §5 need updating first?
- rough order / dependencies

Then: rewrite the futures table in [`../../skills/README.md`](../../skills/README.md) to match, and update ARCHITECTURE §5 for anything newly in scope. Implementation sessions take the top item and follow the [`../../skills/README.md`](../../skills/README.md) workflow, one feature branch each.

## Rules to respect

- ARCHITECTURE.md owns scope — add an item to §5 before building it if it changes scope.
- One capability per branch, tested in the TUI.
- Consider building the automated eval harness early ([`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) §3 lists it as not implemented) — it is the first thing that limits adding more skills.
