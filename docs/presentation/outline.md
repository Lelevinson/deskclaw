# DeskClaw — Final Presentation Outline

Working outline for the final-term presentation. Companion files:

- [`scripts.md`](scripts.md) — spoken scripts, slide by slide.
- [`slides/`](slides/) — one self-contained, **full-page** HTML mock per slide (rich layout, not a fixed slide box), for copying layout/visuals into Canva. Open each `.html` in a browser.

> Status: **COMPLETE — P1 + P2 + P3 all built** (13 slides + full scripts + demo ops checklist), synced to the final project state (PRs through #39, 97/97 + 14 evals verified). Remaining work is yours: rebuild in Canva from the HTML mocks, record the backup video, assign [P1]/[P2]/[P3], rehearse to time.

---

## Logistics

- **3 presenters**, **~15 minutes**, **live demo** (run on `main`, with a recorded backup).
- This is a **final** presentation: the proposal was already delivered (April 2026), so kept slides are **recapped, not re-explained** — the new job is to show the journey from proposal → delivered.

### Presenter split

| Block | Presenter | Theme | Time | Slides |
|---|---|---|---|---|
| **A** | P1 | Why & What (problem + scope decisions) | ~4.5 min | P1-01 … P1-05 |
| **B** | P2 | How it's built & verified (architecture, safety, eval) | ~5 min | P2-* |
| **C** | P3 | See it & where it goes (live demo + future) | ~5 min | P3-* |

---

## Brand / design tokens (match these in Canva)

Pulled from the proposal deck so the final matches.

| Token | Value | Use |
|---|---|---|
| Cream (background) | `#F3EDD5` | Every slide background |
| Ink (text) | `#26241F` | Body text, rules, dark pill |
| Red (primary) | `#C62D2C` | DESKCLAW wordmark, display headings, accents |
| Red bright | `#FF4B45` | Mascot antennae, highlighter marks, "cut" markers |
| Teal | `#16D2C4` | Mascot eyes, journey dots, "kept/added" markers |
| Plum (deep) | `#7A1E1A` | Source captions, secondary accents, shadows |
| Display font | **Playfair Display**, *italic* | Big headline words (e.g. *Conversational Bottleneck*) |
| Label font | **Archivo**, 800 (uppercase, tracked) | Eyebrow labels (e.g. PROBLEM STATEMENT) |
| Wordmark font | **Archivo**, 900 | "DESKCLAW" |
| Body font | **Inter**, 400/600 | Bullets and supporting text |

> In Canva: Playfair Display ≈ your italic serif; Archivo ≈ the bold label sans (or Helvetica/Arial Bold); Inter ≈ body. Same hex codes throughout.

Extras the full-page mocks add (keep if you like them, drop if not): a faint paper-grain texture, soft drop-shadows on cards, a highlighter swipe behind key words, and a gentle entrance animation. All optional — the core palette/fonts above are what must match.

### Real assets available (use instead of mockups where you can)

In [`../assets/`](../assets/): `deskclaw-logo.png` + `deskclaw-logo-full.png` (swap for the mascot placeholder on the title slide), `storefront-catalogue.png`, `storefront-product.png`, `storefront-routines.png`, `admin-dashboard.png`. These are real product screenshots — ideal for P1-03 ("what it is"), the P2 agentic-loop / admin beat, and P3 (skills catalogue + demo backup stills).

### Mascot pose set — ✅ GENERATED (in [`assets/`](assets/))

One slide-relevant pose of the DeskClaw crab per slide — recurring character, Duolingo-owl style. **All 13 poses are generated and live as `assets/p<slide>.png`** (e.g. `assets/p1-02.png`; `p3-03-alt.png` is an alternate shrug take — pick whichever reads better in Canva). The prompt table below is kept for regeneration.

Placement rules:
- Big mascot on P1-01 / P3-02 / P3-04; **small corner accent** on dense slides (P2-04, P3-01).
- "Animation" = static pose + Canva element animation (rise/pop/wiggle). If one true animation, spend it on the title or the P2-03 alarm-clock beat.
- To regenerate a pose: attach the existing pose (or `docs/assets/deskclaw-logo-full.png`) as the reference image, prompt "this exact character, new pose", and append: `flat vector mascot, red crab with headset, simple shapes, no text, no extra characters, white background`.

| Slide | Pose prompt (append the style string) |
|---|---|
| P1-01 | use the real logo as-is |
| P1-02 | overwhelmed crab buried under a pile of chat speech bubbles, sweat drop, frazzled antennae |
| P1-03 | friendly concierge crab, welcoming open claws, holding a small green leaf sprig |
| P1-04 | detective crab examining documents with a magnifying glass |
| P1-05 | tour-guide crab pointing proudly at a wooden signpost with arrows |
| P2-01 | builder crab in a yellow hard hat stacking three labeled blocks |
| P2-02 | guard crab holding a shield, other claw raised in a firm "stop" |
| P2-03 | sleepy-but-working crab at a desk at dawn, coffee cup, typing an email, alarm clock ringing |
| P2-04 | scientist crab in a lab coat holding a clipboard with a big checkmark |
| P3-01 | performer crab juggling ten small colorful icons |
| P3-02 | showman crab in a spotlight, ta-da pose, confetti |
| P3-03 | sincere crab shrugging with one claw open, honest smile |
| P3-04 | crab peeking from the bottom corner, waving one claw |

---

## P1 — Why & What  (Presenter 1, ~4.5 min)

**Goal:** set up the problem, say plainly what DeskClaw is, and tell the proposal → delivery evolution story. **No architecture, safety mechanics, or eval** (those are P2).

| # | Slide | Kept / New | Purpose | ~Time | File |
|---|---|---|---|---|---|
| P1-01 | Title | **Kept** (refresh: "Final") | Re-introduce DeskClaw + team | 20s | [`slides/p1-01-title.html`](slides/p1-01-title.html) |
| P1-02 | Problem — Conversational Bottleneck | **Kept** (recap) | Why this matters; the social-commerce stats | 45s | [`slides/p1-02-problem.html`](slides/p1-02-problem.html) |
| P1-03 | What DeskClaw is | **New** | One-line definition + the lifecycle + two surfaces + the proactive-owner teaser | 50s | [`slides/p1-03-what-is-deskclaw.html`](slides/p1-03-what-is-deskclaw.html) |
| P1-04 | From proposal to delivery | **New** | The evolution beat: what changed and why | 70s | [`slides/p1-04-evolution.html`](slides/p1-04-evolution.html) |
| P1-05 | What we built (scope) | **Adapted** (from Objectives) | Capabilities mapped to the journey; hand off to P2 | 45s | [`slides/p1-05-scope.html`](slides/p1-05-scope.html) |

**Adjustment notes for kept slides:**
- **P1-01 / P1-02** were shown at proposal. Don't re-teach them — the script does a fast recap and pivots to "…and here's what we actually did about it."
- **P1-05** replaces the proposal's *Objectives* slide: same three pillars (Automated Support / Active Sales / Brand Safety) but reframed as *delivered* capabilities, and honest about the one pillar we deliberately narrowed (margin negotiation → cut).

---

## Skill inventory (authoritative — source for the P3 catalogue)

Two altitudes, on purpose:

- **P1-05 = the *journey* (evergreen).** Six stages — Discover · Ask · Buy · Track · Return · Escalate. New skills slot into an existing stage, so this slide **never needs restructuring** as you add features.
- **P3 "All skills" = the *full list* (living).** This is the one slide you keep current. Design it as a card grid so adding a skill = adding one card.

DeskClaw now has **two actors**, and the deck should show both:

**A. Customer side** — the journey on P1-05. 9 customer-facing skills + storefront features:

| Stage | Skill(s) / feature | Notes |
|---|---|---|
| Discover | `search-products`, `routine-concierge`, `/routines` builder | recommendations; conversational AM/PM routine-builder skill + the deterministic storefront page |
| Ask | `policy-oracle` | policy + product-compatibility + routine-ordering, answer-only-from-data |
| Buy | `cart-actions`, `checkout` | add/remove/update cart; mock checkout (no payment) |
| Track | `order-status` | read-only, identity-gated |
| Return | `returns-actions` | return/exchange **request** + refund-status read |
| Escalate | `sentiment-router` | classify + durable handoff record + **emails the owner** |
| Access (cross-cutting) | `account-registration`, web `/login` `/register` `/account` | create/link account; storefront auth (incl. admin role) |

**B. Owner / ops side** — the agentic, human-in-the-loop layer (PRs #27–#30, 2026-06-10):

| Capability | Skill / surface | Notes |
|---|---|---|
| Proactive digest | `ops-digest` skill (`npm run ops:digest`) | **autonomous** — scheduled run wakes the agent with no human prompt; read-only store inspection → owner email. **The showpiece.** |
| Outbound notify | `shop_owner_notify` (Resend) | first async outbound channel; **owner-only by construction**, model-composed body, rate-limited, live/dry. Used by `sentiment-router` + `checkout` + `ops-digest`. |
| Staff ops panel | web `/admin` (admin role) | resolve handoffs / advance orders / restock; audited; **no money movement**. Closes the loop the digest opens. |

**10 skills total** (9 customer-facing + `ops-digest`) · **29 typed MCP tools** · **97 deterministic + 14 model-in-the-loop evals** (verified by running `shop:eval` 2026-06-11; README badges synced in PR #40) · CI green. Channels: terminal chat + **real WhatsApp** (OpenClaw plugin) + web storefront, with a **cross-channel bridge** (PR #35–#37: register in chat → get your account code → log in on the web with the same account; `shop_account_code_get` recovers it). **Project is feature-frozen as of PR #39 — treat as final.**

> Persona note for the demo/scripts: to customers the agent is **"Amelya's Concierge" 🌿** (warm boutique tone); **"DeskClaw" is the platform name.** Title slide = DeskClaw; live demo, the agent introduces itself as Amelya's.

> The project is **feature-frozen for the presentation** — but if anything does land late, the structure absorbs it: customer skills slot into their journey stage on P1-05 (no change) + a card on the P3 catalogue; owner/ops capabilities go in table B and the agentic-loop beat. These two tables are the source of truth.

## P2 — How it's built & verified  (Presenter 2, ~5 min)

**Goal:** show that DeskClaw is *safe by design* and *proven*, and reveal the agentic loop. This is the engineering-credibility block.

| # | Slide | Purpose | ~Time | File |
|---|---|---|---|---|
| P2-01 | Architecture — three layers + MCP boundary | The model never touches the database; everything goes through typed tools. Why a new skill is cheap. | 70s | [`slides/p2-01-architecture.html`](slides/p2-01-architecture.html) |
| P2-02 | The safety pipeline | identity → preview → confirm → audit; channel-bound identity; structural guarantees (owner-only email, no autonomous money movement). | 70s | [`slides/p2-02-safety.html`](slides/p2-02-safety.html) |
| P2-03 | The agentic loop *(showpiece)* | Scheduled run wakes the agent unprompted → reads the store → emails the owner → staff resolves in `/admin`. Verified live. | 80s | [`slides/p2-03-agentic-loop.html`](slides/p2-03-agentic-loop.html) |
| P2-04 | Evaluation — how we know it works | Two-layer harness (deterministic `shop:eval` 97/97 + 14 model-in-the-loop `agent:eval`) + GitHub Actions CI + live end-to-end verification. | 70s | [`slides/p2-04-evaluation.html`](slides/p2-04-evaluation.html) |

**Notes:**
- P2-03 is the *concept/diagram* of the agentic loop; the **live run** of it is the demo climax in P3. Don't double-spend — P2 explains it, P3 shows it.
- Keep P2-01/02 at "how it's safe," not a code tour. The audience needs the *shape* (typed boundary, gated mutations), not the TypeScript.
- The honest caveat to state on P2-03: "proactive" fires only while the machine + gateway are up (local-first, no always-on server).

## P3 — See it & where it goes  (Presenter 3, ~5 min)

**Goal:** the payoff. Fast skill catalogue, the live demo as the centerpiece, then an honest close. The demo *shows* what P2 explained — don't re-explain, narrate.

| # | Slide | Purpose | ~Time | File |
|---|---|---|---|---|
| P3-01 | Ten skills, two sides | The living card grid — 9 customer skills + the owner loop. Narrate fast; the demo proves it. | 35s | [`slides/p3-01-skills-catalogue.html`](slides/p3-01-skills-catalogue.html) |
| P3-02 | Live demo | Stays on screen *during* the demo — the 5 beats as a visible path so the audience always knows where we are. | ~3.5 min | [`slides/p3-02-live-demo.html`](slides/p3-02-live-demo.html) |
| P3-03 | Honest close — limits & where it goes | Fenced-on-purpose vs honest limits vs future. | 45s | [`slides/p3-03-future-work.html`](slides/p3-03-future-work.html) |
| P3-04 | Takeaways + Thank You | One-line summary, stats, repo link, mascot. | 20s | [`slides/p3-04-thank-you.html`](slides/p3-04-thank-you.html) |

### Demo arc (5 beats)

1. **Register in chat** (`account-registration`) — new customer over WhatsApp/terminal; agent states the account code. *Pre-stage recommended (see below) — show the thread, don't type it live.*
2. **Routine concierge** — one ask ("AM/PM routine for dry skin under NT$2000") → regimen → bundle into cart, **confirmed per item** (the rails, live).
3. **Checkout** — preview → confirm → order placed (no payment, by design).
4. **Cross-channel bridge** — storefront login with the same account → the order is *there*. One identity, two doors.
5. **Climax: the agent wakes alone** — `npm run ops:digest` → model-composed email lands in the owner's Gmail → log into `/admin` → the dashboard mirrors the digest → resolve the handoff.

### Demo ops — checklist & gotchas (the difference between a demo and an incident)

**Night before:** `git pull` + `npm run build`; run `npm run shop:eval` (expect 97/97); **record the backup video** of the full arc; charge the phone (WhatsApp beat).

**30 min before:**
- Start `openclaw gateway`; send one throwaway terminal message to confirm the model answers.
- **`npm run shop:reset`** — critical twice over: it seeds the demo-ready ops state (1 open handoff, 1 order stuck in processing, 2 low-stock products) **and clears `notifications`, which resets the ops-digest once-per-day dedupe.** If you fired a digest earlier that day without a reset, the live one will silently send nothing.
- Check `.env`: `RESEND_API_KEY`, `OWNER_EMAIL`, `DESKCLAW_NOTIFY_MODE=live` (default is `dry` = records but never sends). Resend's free sender only delivers to the signed-up owner inbox — that's fine, that's the demo.
- Open tabs in order: storefront home · `/login` · owner Gmail · terminal. Phone unlocked on the WhatsApp thread.

**Pre-stage beat 1:** do the registration over WhatsApp *before* the talk and show the thread on screen ("we registered as a new customer this morning — here's the conversation"). Live registration takes 3–4 model turns and burns a minute of demo time for low drama. Beats 2–5 run live.

**Fallback ladder:** model slow → talk over it (script has filler lines). Gateway dies → switch to the backup video, same narration. Email doesn't land in ~20s → show the owner's screenshot of the previously delivered live email (exists from the e2e verification) and move on; the `/admin` beat still works because the digest state is in the store.

**Persona note:** on screen the agent answers as **Amelya's Concierge 🌿** — say once that DeskClaw is the platform, Amelya's is the brand it's serving.
