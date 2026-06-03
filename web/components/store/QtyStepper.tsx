"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Quantity stepper for the PDP (DESIGN.md §5.3). Local-state only this phase —
// it does not write the cart (Phase 3 owns the audited mutation), it just lets
// the customer choose a quantity the inert Add-to-cart will eventually use.
export function QtyStepper({
  max,
  className,
}: {
  max: number;
  className?: string;
}) {
  const [qty, setQty] = useState(1);
  const ceiling = Math.max(1, Math.min(max, 99));
  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(ceiling, q + 1));

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-pill border border-line bg-cream-soft",
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={qty <= 1}
        aria-label="Decrease quantity"
        className="flex h-10 w-10 items-center justify-center rounded-l-pill text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span
        aria-live="polite"
        className="w-8 text-center font-sans text-base tabular-nums text-ink"
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={qty >= ceiling}
        aria-label="Increase quantity"
        className="flex h-10 w-10 items-center justify-center rounded-r-pill text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
