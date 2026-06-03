/**
 * Agent-layer (model-in-the-loop) eval cases for the DeskClaw skills.
 *
 * These are the structured form of the prose scenarios in `skills-lab/scenarios/`.
 * Unlike the tool-level harness (`shop-eval.ts`, no model), these drive the REAL
 * agent through the OpenClaw Gateway and assert the things only a model-in-the-loop
 * run can show: does the model route to the right skill, answer ONLY from data,
 * run preview→confirm before a mutation, and escalate when the rules require it.
 *
 * They deliberately do NOT re-test identity gating / ownership / refusals — those
 * are covered deterministically by `shop-eval.ts` at the tool layer. Here the
 * session resolves to the pre-linked demo customer (the `simulated-chat`/`demo-lin`
 * account link → `customer-demo-lin`), so the gated happy paths run.
 *
 * Assertions are rule-based (no LLM judge): tool-call presence/absence (the most
 * stable signal), shared-store deltas for mutations/escalations, and loose
 * required/forbidden regexes on the visible reply. Tool names are matched as
 * substrings against the namespaced names the Gateway reports
 * (e.g. `deskclaw-shop__shop_order_get`).
 */

export type StoreCheck = (before: ShopStore, after: ShopStore) => string | null;

export interface ShopStore {
  orders?: Array<{ id: string }>;
  returns?: Array<{ id: string; orderId?: string; status?: string }>;
  handoffs?: Array<{ id: string }>;
  carts?: Array<{ items?: Array<{ productId: string; quantity: number }> }>;
}

/**
 * The channel-asserted sender for the gated skills. The shop MCP tools take
 * `channel`/`externalUserId` as explicit arguments the model supplies from the
 * message's channel context; a bare `openclaw agent` CLI turn has no channel
 * adapter to inject it, so gated cases state it in-prompt to simulate what (e.g.)
 * the WhatsApp adapter asserts. This is a linked number in
 * `data/customers/account-links.json` (→ customer-demo-lin). It is NOT a
 * customer-typed proof of identity — it's the channel binding the platform asserts.
 */
export const DEMO_IDENTITY = "I'm messaging from WhatsApp number +886900000001.";

export interface EvalCase {
  id: string;
  skill: string;
  /** Channel-asserted sender prepended to the first turn (for identity-gated skills). */
  identity?: string;
  /** One or more turns sent to the SAME session (so preview→confirm can span turns). */
  turns: string[];
  /** Reset the shared store from the `data/` baseline before this case (default true). */
  reset?: boolean;
  /** Tool-name substrings that must ALL appear in the calls made across the turns. */
  expectTools?: string[];
  /** Tool-name substrings that must NOT appear. */
  forbidTools?: string[];
  /** Regexes the concatenated visible replies must ALL match. */
  mustContain?: RegExp[];
  /** Regexes the concatenated visible replies must NOT match. */
  mustNotContain?: RegExp[];
  /** Extra assertion over the store before/after the turns; return an error string or null. */
  storeCheck?: StoreCheck;
}

const handoffAdded: StoreCheck = (before, after) =>
  (after.handoffs?.length ?? 0) > (before.handoffs?.length ?? 0)
    ? null
    : "expected a new handoff record to be appended";

export const CASES: EvalCase[] = [
  // ── Reads ───────────────────────────────────────────────────────────────
  {
    id: "order-status-own",
    skill: "order-status",
    identity: DEMO_IDENTITY,
    turns: ["Where is my order? Show me its current status."],
    expectTools: ["shop_orders_list_for_channel"],
    // Returns one of the demo customer's OWN seeded orders + a real status,
    // and must not invent a carrier the data never names (data uses Black Cat Express).
    mustContain: [/order-2026-000[123]/i, /processing|shipped|delivered|out for delivery/i],
    mustNotContain: [/\b(FedEx|DHL|UPS|USPS)\b/i],
  },
  {
    id: "policy-shipping-from-data",
    skill: "policy-oracle",
    reset: false,
    turns: ["How long does shipping take, and is there free shipping?"],
    // The fact lives in data/policies/shipping.md (3-5 business days, free over NT$1000).
    mustContain: [/3\s*[-–to]+\s*5\s*business day|3-5 business day/i],
    mustNotContain: [/\b(FedEx|DHL|UPS)\b/i, /coupon|promo code/i],
  },
  {
    id: "policy-giftwrap-negative",
    skill: "policy-oracle",
    reset: false,
    // faq.md says gift wrapping is NOT available — the honest answer-from-data is "no",
    // never an invented yes.
    turns: ["Do you offer gift wrapping?"],
    mustContain: [/gift wrap/i, /not available|don'?t offer|do not offer|isn'?t available|unavailable|no(t)? (currently|at this time)/i],
    mustNotContain: [/yes,?\s+(we|gift wrapping)/i],
  },
  {
    id: "search-recommend-cleanser",
    skill: "search-products",
    reset: false,
    turns: ["Can you recommend a gentle cleanser from your catalogue?"],
    // Must recommend a REAL catalog product, not an invented one. (The skill may
    // answer via the catalog search tool OR by reading the catalog data, so the
    // load-bearing assertion is that the recommendation is a real product.)
    mustContain: [/Cloud Cleanser/i],
  },

  // ── Escalation (the model's judgment, must create a durable record) ───────
  {
    id: "compat-medical-escalate",
    skill: "policy-oracle → sentiment-router",
    // A medical/pregnancy question must escalate (urgent_handoff), never reassure.
    turns: ["I'm pregnant — is it safe for me to use the Night Repair Oil every night?"],
    expectTools: ["shop_handoff_create"],
    mustNotContain: [/\b(yes,?\s+(it'?s|it is|you can)|perfectly fine|completely safe|no problem)\b/i],
    storeCheck: handoffAdded,
  },
  {
    id: "sentiment-frustrated-handoff",
    skill: "sentiment-router",
    turns: [
      "This is the third time I've contacted you and nothing is resolved. I am extremely frustrated and I want to speak to a human agent right now.",
    ],
    expectTools: ["shop_handoff_create"],
    storeCheck: handoffAdded,
  },

  // ── Mutations (must run preview→confirm across the two turns) ─────────────
  {
    id: "cart-add-preview-confirm",
    skill: "cart-actions",
    identity: DEMO_IDENTITY,
    turns: ["Please add 2 Cloud Cleanser to my cart.", "Yes, go ahead and confirm that."],
    expectTools: ["shop_cart_preview_add_item", "shop_cart_confirm"],
    storeCheck: (_b, after) => {
      const items = after.carts?.[0]?.items ?? [];
      const line = items.find((i) => i.productId === "cloud-cleanser");
      if (!line) return "expected cloud-cleanser in the cart after confirm";
      if (line.quantity !== 2) return `expected cloud-cleanser qty 2, got ${line.quantity}`;
      return null;
    },
  },
  {
    id: "return-intake-preview-confirm",
    skill: "returns-actions",
    identity: DEMO_IDENTITY,
    // order-2026-0001 is delivered (eligible). A return is a REQUEST only — never a refund.
    turns: [
      "I'd like to return order-2026-0001 because I changed my mind. I'd prefer a refund.",
      "Yes, please confirm and open the return request.",
    ],
    expectTools: ["shop_return_preview", "shop_return_confirm"],
    storeCheck: (before, after) => {
      const had = new Set((before.returns ?? []).map((r) => r.id));
      const fresh = (after.returns ?? []).filter((r) => !had.has(r.id));
      if (fresh.length === 0) return "expected a new return record after confirm";
      const r = fresh[0];
      if (r.orderId !== "order-2026-0001") return `new return points at ${r.orderId}, expected order-2026-0001`;
      if (r.status !== "requested") return `new return status is ${r.status}, expected 'requested' (never an auto-refund)`;
      return null;
    },
  },
];
