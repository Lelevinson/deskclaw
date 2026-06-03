"use client";

import { useMemo, useState } from "react";

import type { Product } from "@shop/types.js";
import { cn } from "@/lib/utils";
import { formatCategory } from "@/lib/format";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "./EmptyState";
import { CATALOGUE_GRID } from "./catalogue-grid";

// Catalogue grid + pill category filters (DESIGN.md §5.2). Client-side filtering
// over the full catalogue the server already loaded via the src/shop reuse layer
// — no extra round-trips, no client data access. Grid is 4→2→1 responsive (§3.3).
const ALL = "All";

export function CatalogueBrowser({ products }: { products: Product[] }) {
  const [active, setActive] = useState<string>(ALL);

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const p of products) if (!seen.includes(p.category)) seen.push(p.category);
    return [ALL, ...seen];
  }, [products]);

  const visible =
    active === ALL ? products : products.filter((p) => p.category === active);

  return (
    <div className="flex flex-col gap-8">
      <div
        role="tablist"
        aria-label="Filter by category"
        className="flex flex-wrap justify-center gap-2"
      >
        {categories.map((cat) => {
          const selected = cat === active;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(cat)}
              className={cn(
                "rounded-pill border px-4 py-2 font-sans text-sm tracking-wide transition-colors focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
                selected
                  ? "border-gold bg-gold text-cream-soft"
                  : "border-line bg-cream-soft text-ink-muted hover:border-gold/50 hover:text-ink",
              )}
            >
              {cat === ALL ? ALL : formatCategory(cat)}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState message="Nothing in this category yet." />
      ) : (
        <div className={CATALOGUE_GRID}>
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
