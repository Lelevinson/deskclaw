"use client";

import { useMemo, useState } from "react";

import type { Product } from "@shop/types.js";
import { cn } from "@/lib/utils";
import { formatCategory } from "@/lib/format";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "./EmptyState";

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
                "rounded-pill border px-4 py-2 font-sans text-sm tracking-wide transition-colors",
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
        <div className="grid grid-cols-1 gap-[26px] min-[600px]:grid-cols-2 min-[980px]:grid-cols-4">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
