"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Phase 2 (Foundation) ships the Add-to-cart control visually, but cart MUTATION
// — the add + its mandatory audit-log write — is Phase 3 (roadmap §3, §6). So
// this is intentionally INERT: it never touches the cart service. A sold-out
// product disables it outright; otherwise a click only surfaces a "coming soon"
// note, keeping the wireframe faithful without writing un-audited state.
export function AddToCartButton({
  soldOut,
  size = "default",
  className,
}: {
  soldOut: boolean;
  size?: "default" | "sm";
  className?: string;
}) {
  const [noted, setNoted] = useState(false);

  if (soldOut) {
    return (
      <Button size={size} disabled className={className}>
        Sold out
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Button size={size} onClick={() => setNoted(true)}>
        Add to cart
      </Button>
      {noted && (
        <span className="font-sans text-xs text-ink-muted">
          Cart is coming soon in this demo.
        </span>
      )}
    </div>
  );
}
