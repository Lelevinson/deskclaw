import type { RoutineNote, RoutineStep, RoutineTime } from "./types.js";

// ⚠️ MIRRORS data/catalog/compatibility.md — the prose brand guidance the
// `policy-oracle` skill answers from. Encode ONLY facts STATED there; keep both in
// sync. No inferred pairings, results, skin-type, ingredient, or medical claims.
// The /routines builder is faithful and deterministic, like the skill.

// Catalog `category` → routine step + order (1 = first … 4 = final). Step order is
// the brand's stated "lightest to richest": cleanser → toner → moisturizer → final
// (sunscreen in the AM, facial oil in the PM). Categories not listed here are NOT
// routine steps (e.g. `set`, `accessory`) and are excluded.
export const STEP_BY_CATEGORY: Record<string, { step: RoutineStep; stepOrder: number }> = {
  cleanser: { step: "cleanser", stepOrder: 1 },
  toner: { step: "toner", stepOrder: 2 },
  moisturizer: { step: "moisturizer", stepOrder: 3 },
  sunscreen: { step: "sunscreen", stepOrder: 4 },
  "facial oil": { step: "facial-oil", stepOrder: 4 },
};

// Per-product AM/PM timing + whether it is the final step of its routine. Every
// entry is stated in compatibility.md (§ Routine order / Safe pairings). A product
// without an entry here has no STATED timing and is intentionally NOT offered.
export const ROUTINE_TIMING: Record<string, { times: RoutineTime[]; isFinalStep: boolean }> = {
  "cloud-cleanser": { times: ["am", "pm"], isFinalStep: false }, // "first step in both the AM and PM"
  "soft-reset-toner": { times: ["pm"], isFinalStep: false }, // "a PM-only step"
  "clear-day-gel": { times: ["am"], isFinalStep: false }, // "the lightweight gel in the AM"
  "calm-barrier-cream": { times: ["pm"], isFinalStep: false }, // "the richer cream in the PM"
  "sunny-shield-spf50": { times: ["am"], isFinalStep: true }, // "morning-only … always applied last in the AM"
  "night-repair-oil": { times: ["pm"], isFinalStep: true }, // "a facial oil is the final step … in the PM"
};

// Conditional cautions — shown only when ALL listed products are selected.
export const ROUTINE_CAUTIONS: RoutineNote[] = [
  {
    whenAll: ["soft-reset-toner"],
    text: "Soft Reset Exfoliating Toner is a PM-only step. Introduce it slowly — a few nights a week at first — and it's intended for people already comfortable with exfoliating products, not a first beginner routine.",
  },
  {
    whenAll: ["soft-reset-toner", "night-repair-oil"],
    text: "Don't use the Soft Reset Toner and the Night Repair Oil on the same night — alternate them on different nights instead.",
  },
  {
    whenAll: ["soft-reset-toner", "sunny-shield-spf50"],
    text: "After a night using the Soft Reset Toner, always apply Sunny Shield SPF50 the next morning.",
  },
];

// Positive pairings — shown only when ALL listed products are selected.
export const ROUTINE_PAIRINGS: RoutineNote[] = [
  {
    whenAll: ["clear-day-gel", "calm-barrier-cream"],
    text: "Use the lightweight Clear Day Gel in the AM and the richer Calm Barrier Cream in the PM.",
  },
  {
    whenAll: ["calm-barrier-cream", "night-repair-oil"],
    text: "In the PM, apply Calm Barrier Cream first, then Night Repair Oil last to seal the routine.",
  },
];

export const ROUTINE_DISCLAIMER =
  "General routine guidance for Amelya's products — not personalized or medical advice. For anything about your skin, allergies, pregnancy, or products we don't sell, chat with us or a teammate.";
