"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Quantity stepper (DESIGN.md §5.3/§5.4). Fully controlled: the parent owns the
// value and decides what a change means — local selection on the PDP
// (PdpAddToCart), or an audited update-quantity server action on a cart line
// (CartLineItem). `disabled` covers the in-flight (pending) state.
export function QtyStepper({
  value,
  onChange,
  max,
  min = 1,
  disabled = false,
  className,
}: {
  value: number;
  onChange: (qty: number) => void;
  max: number;
  min?: number;
  disabled?: boolean;
  className?: string;
}) {
  const ceiling = Math.max(min, Math.min(max, 99));
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(ceiling, value + 1));

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-pill border border-line bg-cream-soft",
        disabled && "opacity-60",
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className="flex h-10 w-10 items-center justify-center rounded-l-pill text-ink-muted transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span
        aria-live="polite"
        className="w-8 text-center font-sans text-base tabular-nums text-ink"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= ceiling}
        aria-label="Increase quantity"
        className="flex h-10 w-10 items-center justify-center rounded-r-pill text-ink-muted transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

// Assisted cart actions are capped at 10 units in the src/shop service
// (validateQuantity). Steppers cap at the lesser of stock and this ceiling so the
// control never offers a quantity the audited mutation would reject.
export const ASSISTED_QTY_MAX = 10;
