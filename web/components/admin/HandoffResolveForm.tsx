"use client";

import { useState, useTransition } from "react";

import type { HandoffStatus } from "@shop/types.js";
import { Button } from "@/components/ui/button";
import { resolveHandoff } from "@/lib/shop/admin-actions";

// Work a handoff: advance its status and optionally leave a resolution note. A
// DIRECT staff write (no preview/confirm) — the admin is the human authority — but
// the underlying service still writes an audit log. The select offers the full
// lifecycle so an admin can also correct a mistaken transition.
const STATUS_OPTIONS: { value: HandoffStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const fieldClass =
  "w-full rounded-sm border border-line bg-cream-soft px-3 py-2 font-sans text-sm text-ink focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-panel";

export function HandoffResolveForm({
  handoffId,
  currentStatus,
  currentNote,
}: {
  handoffId: string;
  currentStatus: HandoffStatus;
  currentNote?: string;
}) {
  const [status, setStatus] = useState<HandoffStatus>(currentStatus);
  const [note, setNote] = useState(currentNote ?? "");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const submit = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await resolveHandoff(handoffId, status, note.trim() || undefined);
      setFeedback(
        result.ok
          ? { ok: true, message: "Handoff updated." }
          : { ok: false, message: result.error ?? "Could not update the handoff." },
      );
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-xs uppercase tracking-caps text-ink-muted">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as HandoffStatus)}
          disabled={pending}
          className={fieldClass}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-xs uppercase tracking-caps text-ink-muted">
          Resolution note <span className="lowercase tracking-normal">(optional)</span>
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={pending}
          rows={3}
          placeholder="e.g. Called the customer, refund approved by Mei."
          className={fieldClass}
        />
      </label>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {feedback && (
          <p
            role="alert"
            className={`font-sans text-sm ${feedback.ok ? "text-sage-deep" : "text-stock-out-fg"}`}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </div>
  );
}
