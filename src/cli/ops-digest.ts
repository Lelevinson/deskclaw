/**
 * Proactive ops-digest trigger (skill-dev part 2).
 *
 * This is the *schedule's hands*: it fires ONE real `openclaw agent` turn against
 * the running Gateway asking the agent to compile the morning ops digest. The agent
 * (via the `ops-digest` skill) then inspects the shared store read-only
 * (`shop_handoff_list`, `shop_orders_list_ops`, `shop_low_stock_list`) and emails the
 * owner a model-composed summary through the owner-only `shop_owner_notify`.
 *
 * It is "proactive" because nothing in a conversation asks for it — a schedule does.
 * OpenClaw has no native scheduler, so the schedule itself lives outside this repo
 * (an OS cron entry calling `npm run ops:digest`, or a manual demo trigger). HONEST
 * LOCAL-FIRST CAVEAT: this only ever runs while the machine + `openclaw gateway` are
 * up; there is no always-on server. See docs/openclaw/setup.md.
 *
 * Reuses the same Gateway-driving approach as `agent-eval.ts`. Whether an email is
 * actually sent vs only recorded is governed by the MCP server's env
 * (`DESKCLAW_NOTIFY_MODE=live` to send via Resend; default = dry record-only).
 *
 * Run: `npm run ops:digest` (builds, then executes). Exits 0 on a completed turn or a
 * graceful skip (Gateway down); non-zero only on an unexpected failure.
 */
import { execFileSync } from "node:child_process";

const TURN_TIMEOUT_S = Number(process.env.OPS_DIGEST_TURN_TIMEOUT ?? 200);

function gatewayReachable(): boolean {
  try {
    execFileSync("openclaw", ["health"], { stdio: "ignore", timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

function main(): void {
  if (!gatewayReachable()) {
    console.log("Ops digest skipped: the OpenClaw Gateway is not reachable.");
    console.log("Start it with `openclaw gateway` (it needs a configured model), then re-run.");
    console.log("Local-first: the scheduled digest only fires while the machine + gateway are up.");
    return; // graceful skip, exit 0 — a cron run on a sleeping machine is not an error
  }

  // Pass today's date so the agent uses it as the once-per-day dedupeKey (the model
  // should not guess the date). YYYY-MM-DD matches the skill's dedupe instruction.
  const today = new Date().toISOString().slice(0, 10);
  const sessionKey = `agent:main:ops-digest-${today}`;
  const message =
    `Run the morning ops digest for the shop owner (today is ${today}). ` +
    `Use the ops-digest skill: inspect open handoffs, orders stuck in processing, and ` +
    `low-stock products read-only, then email the owner the digest via shop_owner_notify ` +
    `with kind "ops_digest" and dedupeKey "${today}". This is an internal owner-facing run — ` +
    `there is no customer to reply to.`;

  console.log(`Triggering ops digest for ${today}...`);
  const raw = execFileSync(
    "openclaw",
    ["agent", "--session-key", sessionKey, "-m", message, "--json", "--timeout", String(TURN_TIMEOUT_S)],
    { encoding: "utf8", maxBuffer: 96 * 1024 * 1024, timeout: (TURN_TIMEOUT_S + 30) * 1000 },
  );

  const start = raw.indexOf("{");
  const parsed = JSON.parse(start > 0 ? raw.slice(start) : raw);
  const meta = parsed?.result?.meta ?? {};
  const tools: string[] = Array.isArray(meta.toolSummary?.tools)
    ? meta.toolSummary.tools.map(String)
    : [];
  // The gateway reports namespaced tool names (e.g. "deskclaw-shop__shop_owner_notify"),
  // so match as a substring rather than an exact element.
  const sent = tools.some((t) => t.includes("shop_owner_notify"));

  console.log(`Tools called: ${tools.length ? tools.join(", ") : "(none)"}`);
  console.log(
    sent
      ? "Ops digest sent to the owner (recorded in the notifications domain; live vs dry per DESKCLAW_NOTIFY_MODE)."
      : "Warning: the agent did not call shop_owner_notify — no digest was recorded. Check the gateway logs / model.",
  );
}

main();
