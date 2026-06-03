"use client";

import { useOptimistic, useState, useTransition } from "react";
import { X } from "lucide-react";

import type { CartLine } from "@shop/types.js";
import { Price } from "./Price";
import { LineItemRow } from "./LineItemRow";
import { ASSISTED_QTY_MAX, QtyStepper } from "./QtyStepper";
import { removeFromCart, updateCartQuantity } from "@/lib/shop/cart-actions";

// One cart row (DESIGN.md §5.4): thumb · name → PDP · price · qty stepper · remove.
// The stepper change and remove are audited mutations (same src/shop path as chat).
// Remove is destructive, so it uses an explicit two-step "Remove?" confirm — the
// UI affordance standing in for the chat confirm beat (roadmap §3); the lighter
// qty step needs none (the step itself is the consent, DESIGN §5.4).
export function CartLineItem({ line }: { line: CartLine }) {
  const [pending, startTransition] = useTransition();
  // Optimistic quantity: shows the chosen value immediately, and React resets it
  // to the real `line.quantity` when the transition ends — so a rejected update
  // rolls back on its own, and an external change (chat agent, another tab) that
  // revalidates this row reconciles the displayed qty without manual bookkeeping.
  const [optimisticQty, setOptimisticQty] = useOptimistic(line.quantity);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // An out-of-stock line can only be removed: the service rejects any quantity
  // update on an out-of-stock product, so we don't offer a stepper that would
  // always fail (it would invite a doomed decrement).
  const outOfStock = line.stockStatus === "out_of_stock";

  const changeQty = (next: number) => {
    if (next === optimisticQty) return;
    setError(null);
    startTransition(async () => {
      setOptimisticQty(next);
      const result = await updateCartQuantity(line.productId, next);
      if (!result.ok) setError(result.error ?? "Could not update quantity.");
    });
  };

  const remove = () => {
    setError(null);
    startTransition(async () => {
      const result = await removeFromCart(line.productId);
      if (!result.ok) {
        setConfirmingRemove(false);
        setError(result.error ?? "Could not remove item.");
      }
      // On success the row disappears with the revalidated cart.
    });
  };

  return (
    <div className="flex flex-col gap-3 border-b border-line py-5 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      {/* Thumb + name/price — takes the remaining row width on desktop. */}
      <LineItemRow productId={line.productId} name={line.name} className="min-w-0 flex-1">
        <div className="mt-1">
          <Price amount={line.priceNtd} />
        </div>
        {outOfStock && (
          <p className="mt-1 font-sans text-xs text-stock-out-fg">
            Sold out — remove to update your cart.
          </p>
        )}
        {error && (
          <p className="mt-1 font-sans text-xs text-stock-out-fg" role="alert">
            {error}
          </p>
        )}
      </LineItemRow>

      {/* Controls — stack below the name on mobile, inline on desktop. */}
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <QtyStepper
          value={optimisticQty}
          onChange={changeQty}
          max={ASSISTED_QTY_MAX}
          disabled={pending || outOfStock}
        />

        <div className="sm:w-28 sm:text-right">
          <Price amount={line.subtotalNtd} />
        </div>

        <div className="sm:w-24 sm:text-right">
          {confirmingRemove ? (
            <div className="flex items-center justify-end gap-2 font-sans text-xs">
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="rounded-sm text-stock-out-fg underline-offset-4 hover:underline focus-visible:underline focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:opacity-50"
              >
                Remove?
              </button>
              <button
                type="button"
                onClick={() => setConfirmingRemove(false)}
                disabled={pending}
                className="rounded-sm text-ink-muted underline-offset-4 hover:underline focus-visible:underline focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:opacity-50"
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingRemove(true)}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-sm font-sans text-xs text-ink-muted transition-colors hover:text-ink focus-visible:text-ink focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:opacity-50"
            >
              <X className="size-3.5" /> remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
