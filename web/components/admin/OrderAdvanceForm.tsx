"use client";

import { useState, useTransition } from "react";

import type { OrderStatus } from "@shop/types.js";
import { Button } from "@/components/ui/button";
import { advanceOrder } from "@/lib/shop/admin-actions";

// Advance an order's fulfilment status and optionally attach carrier + tracking. A
// direct staff write (audited). Stock is never touched here, and no money moves —
// order *cancellation* is intentionally not offered (out of scope, ARCHITECTURE §5).
const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "placed", label: "Placed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
];

const fieldClass =
  "w-full rounded-sm border border-line bg-cream-soft px-3 py-2 font-sans text-sm text-ink focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-panel";

export function OrderAdvanceForm({
  orderId,
  currentStatus,
  currentCarrier,
  currentTracking,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  currentCarrier?: string;
  currentTracking?: string;
}) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [carrier, setCarrier] = useState(currentCarrier ?? "");
  const [tracking, setTracking] = useState(currentTracking ?? "");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const submit = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await advanceOrder(orderId, status, {
        carrier: carrier.trim() || undefined,
        trackingNumber: tracking.trim() || undefined,
      });
      setFeedback(
        result.ok
          ? { ok: true, message: "Order updated." }
          : { ok: false, message: result.error ?? "Could not update the order." },
      );
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-xs uppercase tracking-caps text-ink-muted">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-xs uppercase tracking-caps text-ink-muted">
            Carrier <span className="lowercase tracking-normal">(optional)</span>
          </span>
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            disabled={pending}
            placeholder="e.g. Black Cat Express"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-xs uppercase tracking-caps text-ink-muted">
            Tracking # <span className="lowercase tracking-normal">(optional)</span>
          </span>
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            disabled={pending}
            placeholder="e.g. BC123456789TW"
            className={fieldClass}
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : "Update order"}
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
