import Link from "next/link";

import { countCartItems, getCart } from "@/lib/shop";
import { formatNtd } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CartLineItem } from "@/components/store/CartLineItem";
import { EmptyState } from "@/components/store/EmptyState";

// The cart reads live, shared, per-request mutable state (the same store the chat
// agent writes). Never statically cache it, or a cart change made outside the app
// — e.g. in chat — wouldn't show until an in-app mutation revalidated the route.
export const dynamic = "force-dynamic";

// Cart (surface 4, DESIGN.md §5.4). Server component: reads the demo customer's
// own cart through the src/shop reuse layer (identity-gated, own-cart-only). The
// rows mutate via audited server actions (lib/shop/cart-actions) — the only writes
// the storefront makes. No checkout CTA (out of scope, ARCHITECTURE §5).
export default async function CartPage() {
  const cart = await getCart();
  const itemCount = countCartItems(cart);

  if (cart.items.length === 0) {
    return (
      <div className="py-10">
        <h1 className="font-display text-3xl text-ink">Your Cart</h1>
        <EmptyState message="Your cart is empty." />
      </div>
    );
  }

  return (
    <div className="py-10">
      <h1 className="font-display text-3xl text-ink">
        Your Cart{" "}
        <span className="font-sans text-base font-normal tracking-normal text-ink-muted">
          · {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </h1>

      <div className="mt-8 rounded-lg border border-line bg-panel px-6 shadow-elev-sm">
        {cart.items.map((line) => (
          <CartLineItem key={line.productId} line={line} />
        ))}
      </div>

      <div className="mt-6 flex flex-col items-end gap-4">
        <div className="flex w-full max-w-xs items-baseline justify-between">
          <span className="font-sans text-sm uppercase tracking-caps text-ink-muted">
            Subtotal
          </span>
          <span className="font-sans text-xl font-medium tabular-nums text-gold-deep">
            {formatNtd(cart.totalNtd)}
          </span>
        </div>

        <div className="rule-gold w-full max-w-xs" />
        <p className="font-serif text-sm italic text-ink-muted">
          No checkout in this demo
        </p>

        <Button asChild variant="outline">
          <Link href="/">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
