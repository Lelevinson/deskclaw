"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { checkout } from "@/lib/shop/cart-actions";

// Places the mock order. The click is the consent (same model as add-to-cart).
// On success the server action redirects to the new order; only failures
// (empty cart / out of stock) return here to render inline.
export function CheckoutButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-stretch gap-2">
      <Button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await checkout();
            if (result && !result.ok) setError(result.error ?? "Could not place your order.");
          });
        }}
      >
        {pending ? "Placing order…" : "Checkout"}
      </Button>
      {error && (
        <p role="alert" className="text-center font-sans text-sm text-stock-out-fg">
          {error}
        </p>
      )}
      <p className="text-center font-sans text-xs text-ink-muted">No payment is taken in this demo.</p>
    </div>
  );
}
