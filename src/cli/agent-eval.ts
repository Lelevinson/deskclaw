/**
 * Agent-layer (model-in-the-loop) eval harness for the DeskClaw skills.
 *
 * Where `shop-eval.ts` tests the `src/shop` service functions directly (no model),
 * this drives the REAL agent through the running OpenClaw Gateway — one
 * `openclaw agent` turn per scenario step — and asserts the model-in-the-loop
 * behaviours the tool layer can't: skill routing, answer-only-from-data,
 * preview→confirm before a mutation, and escalation to a durable handoff record.
 *
 * It is the incremental "lighten it" follow-up the skill-roadmap §5 left open
 * (full agent-layer automation was deferred while it stayed manual TUI testing).
 * Cases live in `agent-eval-cases.ts`; assertions are rule-based (no LLM judge):
 * tool-call presence/absence, shared-store deltas, and loose reply regexes.
 *
 * REQUIREMENTS / SAFETY:
 *  - A running Gateway with a configured model (this repo uses `openai-codex/gpt-5.5`
 *    via the Codex login). Start it with `openclaw gateway`. If the Gateway is
 *    unreachable the harness SKIPS (exit 0) with guidance rather than failing.
 *  - Unlike `shop-eval`, this mutates the SHARED store (`.local/shop-db.json`) the
 *    Gateway's MCP server uses — it resets around cases and once at the end, so do
 *    NOT run it during a live chat session you care about. `npm run shop:reset`
 *    restores a clean demo.
 *
 * Run: `npm run agent:eval` (builds, then executes). Named PASS/FAIL per assertion;
 * non-zero exit if any case fails.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { CASES, type EvalCase, type ShopStore } from "./agent-eval-cases.js";

const DB_PATH = path.resolve(
  process.env.DESKCLAW_SHOP_DB_PATH ?? path.resolve(process.cwd(), ".local/shop-db.json"),
);
const RESET_SCRIPT = path.resolve(process.cwd(), "dist/cli/reset-shop-db.js");
const TURN_TIMEOUT_S = Number(process.env.AGENT_EVAL_TURN_TIMEOUT ?? 200);
const NONCE = Date.now().toString(36);

interface TurnResult {
  text: string;
  tools: string[];
  toolFailures: number;
}

function readStore(): ShopStore {
  try {
    return JSON.parse(readFileSync(DB_PATH, "utf8")) as ShopStore;
  } catch {
    return {};
  }
}

function resetStore(): void {
  execFileSync("node", [RESET_SCRIPT], { stdio: "ignore" });
}

function gatewayReachable(): boolean {
  try {
    execFileSync("openclaw", ["health"], { stdio: "ignore", timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

// Run one agent turn via the Gateway and pull out the reply text + the tools it called.
function runTurn(sessionKey: string, message: string): TurnResult {
  const raw = execFileSync(
    "openclaw",
    ["agent", "--session-key", sessionKey, "-m", message, "--json", "--timeout", String(TURN_TIMEOUT_S)],
    { encoding: "utf8", maxBuffer: 96 * 1024 * 1024, timeout: (TURN_TIMEOUT_S + 30) * 1000 },
  );
  // stdout is the JSON result; be tolerant of any leading noise.
  const start = raw.indexOf("{");
  const parsed = JSON.parse(start > 0 ? raw.slice(start) : raw);
  const meta = parsed?.result?.meta ?? {};
  return {
    text: String(meta.finalAssistantVisibleText ?? ""),
    tools: Array.isArray(meta.toolSummary?.tools) ? meta.toolSummary.tools.map(String) : [],
    toolFailures: Number(meta.toolSummary?.failures ?? 0),
  };
}

interface Failure {
  assertion: string;
  detail: string;
}

function evaluateCase(c: EvalCase): Failure[] {
  const fails: Failure[] = [];
  const reset = c.reset !== false;
  if (reset) resetStore();
  const before = readStore();

  // Same session key across all turns so preview→confirm shares context.
  const sessionKey = `agent:main:eval-${c.id}-${NONCE}`;
  const allTools = new Set<string>();
  const texts: string[] = [];
  let turnFailures = 0;

  for (let i = 0; i < c.turns.length; i++) {
    // Gated skills need a channel-asserted sender; state it on the first turn.
    const message = i === 0 && c.identity ? `${c.identity} ${c.turns[i]}` : c.turns[i];
    let r: TurnResult;
    try {
      r = runTurn(sessionKey, message);
    } catch (err) {
      fails.push({ assertion: `turn ${i + 1} ran`, detail: (err as Error).message.split("\n")[0] });
      return fails; // can't assert further on a dead turn
    }
    r.tools.forEach((t) => allTools.add(t));
    texts.push(r.text);
    turnFailures += r.toolFailures;
  }

  // Normalize smart punctuation so reply regexes can use plain ASCII quotes/dashes.
  const reply = texts
    .join("\n")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-");
  const toolList = [...allTools];
  const has = (sub: string) => toolList.some((t) => t.includes(sub));

  if (turnFailures > 0) {
    fails.push({ assertion: "no tool failures", detail: `${turnFailures} tool call(s) failed` });
  }
  for (const sub of c.expectTools ?? []) {
    if (!has(sub)) fails.push({ assertion: `called a *${sub}* tool`, detail: `tools seen: ${toolList.join(", ") || "(none)"}` });
  }
  for (const sub of c.forbidTools ?? []) {
    if (has(sub)) fails.push({ assertion: `did NOT call a *${sub}* tool`, detail: `tools seen: ${toolList.join(", ")}` });
  }
  for (const re of c.mustContain ?? []) {
    if (!re.test(reply)) fails.push({ assertion: `reply matches ${re}`, detail: `reply: ${reply.slice(0, 160)}…` });
  }
  for (const re of c.mustNotContain ?? []) {
    if (re.test(reply)) fails.push({ assertion: `reply does NOT match ${re}`, detail: `reply: ${reply.slice(0, 160)}…` });
  }
  if (c.storeCheck) {
    const err = c.storeCheck(before, readStore());
    if (err) fails.push({ assertion: "store changed as expected", detail: err });
  }
  return fails;
}

async function main(): Promise<void> {
  console.log("DeskClaw agent-layer eval (model-in-the-loop, via OpenClaw Gateway)\n");

  if (!gatewayReachable()) {
    console.log("⊘ SKIPPED — the OpenClaw Gateway is not reachable.");
    console.log("  Start it with `openclaw gateway` (needs a configured model — this repo");
    console.log("  uses openai-codex/gpt-5.5 via the Codex login), then re-run `npm run agent:eval`.");
    process.exit(0);
  }

  let passed = 0;
  const failedCases: string[] = [];
  for (const c of CASES) {
    process.stdout.write(`• ${c.id} (${c.skill}) … `);
    const fails = evaluateCase(c);
    if (fails.length === 0) {
      console.log("PASS");
      passed++;
    } else {
      console.log("FAIL");
      for (const f of fails) console.log(`    ✗ ${f.assertion} — ${f.detail}`);
      failedCases.push(c.id);
    }
  }

  // Leave a clean demo store behind.
  resetStore();

  console.log(`\n${passed}/${CASES.length} cases passed.`);
  if (failedCases.length > 0) {
    console.log(`Failed: ${failedCases.join(", ")}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("agent-eval crashed:", err);
  process.exit(1);
});
