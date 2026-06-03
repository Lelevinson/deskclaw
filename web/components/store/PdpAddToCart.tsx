"use client";

import { useState } from "react";

import { AddToCartButton } from "./AddToCartButton";
import { ASSISTED_QTY_MAX, QtyStepper } from "./QtyStepper";

// PDP add-to-cart row (DESIGN.md §5.3): a quantity stepper + the audited
// Add-to-cart. Owns the chosen quantity locally and hands it to the button; the
// stepper caps at the lesser of stock and the assisted-action ceiling so it never
// offers a quantity the server mutation would reject. Sold-out PDPs don't render
// this (no stepper) — the page shows a disabled Add instead.
export function PdpAddToCart({
  productId,
  stockQuantity,
}: {
  productId: string;
  stockQuantity: number;
}) {
  const [qty, setQty] = useState(1);
  const max = Math.min(stockQuantity, ASSISTED_QTY_MAX);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <QtyStepper value={qty} onChange={setQty} max={max} />
      <AddToCartButton productId={productId} soldOut={false} quantity={qty} />
    </div>
  );
}
