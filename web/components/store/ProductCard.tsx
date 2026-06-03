import Link from "next/link";

import type { Product } from "@shop/types.js";
import { Price } from "./Price";
import { ProductTile } from "./ProductTile";
import { StockBadge } from "./StockBadge";
import { AddToCartButton } from "./AddToCartButton";

// Catalogue card (DESIGN.md §5.2). Image tile (+ stock badge overlay), category
// eyebrow, Cormorant product name, NT$ price, and the (inert this phase)
// Add-to-cart. The tile + text link to the PDP; the button is its own control.
export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stockStatus === "out_of_stock";
  return (
    <article className="group flex flex-col overflow-hidden rounded-md border border-line bg-panel shadow-elev-sm transition-shadow hover:shadow-elev-md">
      <Link
        href={product.link}
        className="block focus-ring"
      >
        <div className="relative">
          <ProductTile />
          {product.stockStatus !== "in_stock" && (
            <StockBadge status={product.stockStatus} className="absolute right-3 top-3" />
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="font-sans text-xs uppercase tracking-eyebrow text-gold-deep">
          {product.category}
        </p>
        <Link
          href={product.link}
          className="focus-visible:outline-none focus-visible:underline"
        >
          <h3 className="font-serif text-xl font-medium leading-tight text-ink">
            {product.name}
          </h3>
        </Link>
        <Price amount={product.priceNtd} className="mt-1" />
        <div className="mt-auto pt-4">
          <AddToCartButton productId={product.id} soldOut={soldOut} size="sm" />
        </div>
      </div>
    </article>
  );
}
