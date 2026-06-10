/**
 * Owner-only outbound email (skill-dev part 2).
 *
 * The agent composes a subject + body (the skill gives guidance, the model writes
 * the prose) and calls `shop_owner_notify`, which lands here. KEY SAFETY PROPERTY:
 * there is NO recipient parameter anywhere in this module's public surface — the
 * `to` is ALWAYS `OWNER_EMAIL` from the environment. A customer can never be
 * emailed because there is no code path that accepts a customer address.
 *
 * Every send is recorded in the `notifications` domain + an audit log (the composed
 * body is persisted verbatim, which is what lets the demo prove the body is
 * LLM-written, not a server template). Rate-limited two ways: per-event dedupe
 * (one notification per (kind, dedupeKey) — e.g. one email per handoff id) and a
 * rolling daily cap as a runaway backstop. `DESKCLAW_NOTIFY_MODE=live` actually
 * sends via Resend; the default `dry` records + audits but makes no network call,
 * so tests / CI never send.
 */
import { randomUUID } from "node:crypto";

import { readShopDb, writeShopDb } from "./store.js";
import type { ServiceResult } from "./service.js";
import type { ActionLog, NotificationKind, NotificationRecord, ShopDatabase } from "./types.js";

// One notification per (kind, dedupeKey); a runaway backstop across all sends.
const DAILY_CAP = 50;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_FROM = "DeskClaw <onboarding@resend.dev>";

export interface NotifyInput {
  kind: NotificationKind;
  subject: string;
  body: string;
  // Source object id (handoff id / order id). The (kind, dedupeKey) pair is the
  // idempotency key so one underlying event sends exactly once.
  dedupeKey?: string;
}

// Swappable so tests can assert what was sent without hitting the network. The
// real implementation is `resendTransport`; the recipient is passed in by
// notifyOwner (always the owner), never chosen by the transport's caller.
export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  body: string;
  apiKey: string;
}
export type EmailTransport = (
  msg: EmailMessage
) => Promise<{ ok: true; providerId?: string } | { ok: false; error: string }>;

interface NotifyConfig {
  ownerEmail: string;
  apiKey: string;
  from: string;
  mode: "live" | "dry";
}

function nowIso(): string {
  return new Date().toISOString();
}

// Read config fresh on every call (mirrors store.ts) so tests and the demo can set
// env vars before invoking without re-importing the module.
function readConfig(): NotifyConfig {
  return {
    ownerEmail: (process.env.OWNER_EMAIL ?? "").trim(),
    apiKey: (process.env.RESEND_API_KEY ?? "").trim(),
    from: (process.env.NOTIFY_FROM ?? "").trim() || DEFAULT_FROM,
    mode: process.env.DESKCLAW_NOTIFY_MODE?.trim().toLowerCase() === "live" ? "live" : "dry"
  };
}

function appendAuditLog(db: ShopDatabase, log: Omit<ActionLog, "id" | "createdAt">): void {
  db.actionLogs.unshift({ id: `log_${randomUUID()}`, createdAt: nowIso(), ...log });
  db.actionLogs = db.actionLogs.slice(0, 200);
}

// The real Resend send: POST the composed email to the HTTP API with global fetch
// (Node 18+, no SDK dependency). Plain-text body keeps it simple and deliverable.
const resendTransport: EmailTransport = async ({ to, from, subject, body, apiKey }) => {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text: body })
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status}: ${detail.slice(0, 300)}` };
    }
    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, providerId: json.id };
  } catch (error) {
    return { ok: false, error: `Resend request failed: ${(error as Error).message}` };
  }
};

/**
 * Send (or, in dry mode, record) an owner notification. The transport is injectable
 * for tests; production callers omit it and get the real Resend send.
 */
export async function notifyOwner(
  input: NotifyInput,
  transport: EmailTransport = resendTransport
): Promise<ServiceResult<NotificationRecord>> {
  const subject = input.subject?.trim() ?? "";
  const body = input.body?.trim() ?? "";
  if (!subject || !body) {
    return { ok: false, error: "A subject and body are required to notify the owner." };
  }

  const config = readConfig();
  if (!config.ownerEmail) {
    return { ok: false, error: "OWNER_EMAIL is not configured; cannot send an owner notification." };
  }

  const db = await readShopDb();
  const dedupeKey = input.dedupeKey?.trim() || undefined;

  // Per-event dedupe: one notification per (kind, dedupeKey). A repeat returns the
  // existing record unchanged (no new send, no new row) — this is the rate limit
  // that stops the agent emailing twice for the same handoff/order.
  if (dedupeKey) {
    const existing = db.notifications.find(
      (n) => n.kind === input.kind && n.dedupeKey === dedupeKey && (n.status === "sent" || n.status === "recorded")
    );
    if (existing) {
      return { ok: true, data: existing };
    }
  }

  // Runaway backstop: cap successful sends/records in a rolling 24h window.
  const since = Date.parse(nowIso()) - DAY_MS;
  const recentCount = db.notifications.filter(
    (n) => (n.status === "sent" || n.status === "recorded") && Date.parse(n.createdAt) >= since
  ).length;
  if (recentCount >= DAILY_CAP) {
    return { ok: false, error: `Daily owner-notification cap (${DAILY_CAP}) reached; not sending.` };
  }

  const record: NotificationRecord = {
    id: `notif_${randomUUID()}`,
    kind: input.kind,
    subject,
    body,
    to: config.ownerEmail, // always the owner — structural, never customer-supplied
    status: "recorded",
    ...(dedupeKey ? { dedupeKey } : {}),
    createdAt: nowIso()
  };

  let sendError: string | undefined;
  if (config.mode === "live") {
    if (!config.apiKey) {
      record.status = "failed";
      sendError = "RESEND_API_KEY is not set; cannot send in live mode.";
      record.detail = sendError;
    } else {
      const result = await transport({
        to: config.ownerEmail,
        from: config.from,
        subject,
        body,
        apiKey: config.apiKey
      });
      if (result.ok) {
        record.status = "sent";
        if (result.providerId) record.providerId = result.providerId;
      } else {
        record.status = "failed";
        sendError = result.error;
        record.detail = result.error;
      }
    }
  }

  db.notifications.unshift(record);
  db.notifications = db.notifications.slice(0, 200);
  appendAuditLog(db, {
    type: "notify.owner",
    status: record.status === "failed" ? "failed" : "success",
    summary: `Owner notification (${record.kind}, ${record.status}): ${subject}`,
    metadata: {
      notificationId: record.id,
      kind: record.kind,
      mode: config.mode,
      to: record.to,
      dedupeKey: dedupeKey ?? null,
      providerId: record.providerId ?? null
    }
  });
  await writeShopDb(db);

  if (record.status === "failed") {
    return { ok: false, error: sendError ?? "Owner notification failed to send." };
  }
  return { ok: true, data: record };
}
