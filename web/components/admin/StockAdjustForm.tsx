"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { restockProduct } from "@/lib/shop/admin-actions";

// Set a product's absolute stock quantity (a restock / correction). Direct staff
// write (audited); the service recomputes the derived stock status. Compact enough
// to sit inline on a stock-table row.
export function StockAdjustForm({
  productId,
  currentQuantity,
}: {
  productId: string;
  currentQuantity: number;
}) {
  const [quantity, setQuantity] = useState(String(currentQuantity));
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const submit = () => {
    setFeedback(null);
    const parsed = Number(quantity);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setFeedback({ ok: false, message: "Whole number ≥ 0." });
      return;
    }
    startTransition(async () => {
      const result = await restockProduct(productId, parsed, "admin restock");
      setFeedback(
        result.ok
          ? { ok: true, message: "Updated." }
          : { ok: false, message: result.error ?? "Could not update." },
      );
    });
  };

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`stock-${productId}`}>
          New stock quantity
        </label>
        <input
          id={`stock-${productId}`}
          type="number"
          min={0}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={pending}
          className="w-20 rounded-sm border border-line bg-cream-soft px-2 py-1.5 text-right font-sans text-sm tabular-nums text-ink focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
        />
        <Button type="button" size="sm" variant="outline" onClick={submit} disabled={pending}>
          {pending ? "…" : "Set"}
        </Button>
      </div>
      {feedback && (
        <p
          role="alert"
          className={`font-sans text-xs ${feedback.ok ? "text-sage-deep" : "text-stock-out-fg"}`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
