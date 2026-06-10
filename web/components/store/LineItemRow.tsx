import Link from "next/link";

import { cn } from "@/lib/utils";
import { ProductTile } from "./ProductTile";

// Shared product-line row (DESIGN.md §5.4/§5.5). The thumb → PDP + name → PDP unit
// was duplicated between the cart line (CartLineItem) and the order-detail item row
// (orders/[id]); this owns that shared markup. Each surface composes its own extras:
//   - `children` render under the name (cart: price + stock/error notes; order: the
//     "×n · NT$… each" meta line)
//   - `trailing` renders at the row end (order: the line subtotal; cart leaves it
//     unset and arranges its qty/remove controls as a sibling for responsive stacking)
// Deliberately not abstracted further — no qty/remove/price logic lives here, only
// the proven-duplicated thumb+name (per the Phase 6 "don't over-abstract" rule).
export function LineItemRow({
  productId,
  name,
  children,
  trailing,
  className,
}: {
  productId: string;
  name: string;
  children?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Link
        href={`/products/${productId}`}
        className="shrink-0 rounded-md focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
        aria-label={name}
      >
        <ProductTile productId={productId} alt={name} className="w-16 rounded-md border border-line" aspect="aspect-square" sizes="64px" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${productId}`}
          className="block truncate font-serif text-xl font-medium leading-tight text-ink hover:text-gold-deep focus-visible:underline focus-visible:outline-none"
        >
          {name}
        </Link>
        {children}
      </div>
      {trailing}
    </div>
  );
}
