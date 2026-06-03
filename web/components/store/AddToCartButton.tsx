"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addToCart } from "@/lib/shop/cart-actions";

// Add-to-cart (DESIGN.md §5.2/§5.3). The click IS the consent (roadmap §3) — it
// calls the audited addToCart server action, which reuses the chat preview→confirm
// path so the mutation always writes the audit log. Sold-out is disabled outright.
// Used on catalogue cards (quantity defaults to 1) and the PDP (PdpAddToCart
// passes the chosen quantity).
export function AddToCartButton({
  productId,
  soldOut,
  quantity = 1,
  size = "default",
  className,
}: {
  productId: string;
  soldOut: boolean;
  quantity?: number;
  size?: "default" | "sm";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (soldOut) {
    return (
      <Button size={size} disabled className={className}>
        Sold out
      </Button>
    );
  }

  const onClick = () => {
    setError(null);
    setAdded(false);
    startTransition(async () => {
      const result = await addToCart(productId, quantity);
      if (result.ok) {
        setAdded(true);
      } else {
        setAdded(false);
        setError(result.error ?? "Could not add to cart.");
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Button size={size} onClick={onClick} disabled={pending}>
        {pending ? "Adding…" : "Add to cart"}
      </Button>
      {added && !error && (
        <span className="font-sans text-xs text-ink-muted">
          Added ·{" "}
          <Link
            href="/cart"
            className="rounded-sm text-gold-deep underline-offset-4 hover:underline focus-visible:underline focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            View cart
          </Link>
        </span>
      )}
      {error && <span className="font-sans text-xs text-stock-out-fg">{error}</span>}
    </div>
  );
}
