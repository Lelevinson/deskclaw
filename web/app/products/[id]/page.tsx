import Link from "next/link";
import { notFound } from "next/navigation";

import { getProduct } from "@/lib/shop";
import { formatCategory } from "@/lib/format";
import { Price } from "@/components/store/Price";
import { ProductTile } from "@/components/store/ProductTile";
import { StockStatusText } from "@/components/store/StockBadge";
import { PdpAddToCart } from "@/components/store/PdpAddToCart";
import { AddToCartButton } from "@/components/store/AddToCartButton";

// Product detail / PDP (surface 3, DESIGN.md §5.3). Reads one product through the
// src/shop reuse layer; an unknown id returns null → notFound() renders the
// neutral 404 (no id echo, no existence leak).
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const soldOut = product.stockStatus === "out_of_stock";
  const categoryLabel = formatCategory(product.category);

  return (
    <div className="py-10">
      {/* Breadcrumb */}
      <nav className="mb-8 font-sans text-sm text-ink-muted" aria-label="Breadcrumb">
        <Link href="/" className="rounded-sm hover:text-gold-deep focus-visible:text-gold-deep focus-visible:underline focus-visible:outline-none">
          Shop
        </Link>
        <span className="px-2 text-line">/</span>
        <span>{categoryLabel}</span>
        <span className="px-2 text-line">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <ProductTile productId={product.id} alt={product.name} className="rounded-lg border border-line" aspect="aspect-[4/5]" sizes="(min-width: 768px) 560px, 90vw" />

        <div className="flex flex-col">
          <p className="font-sans text-xs uppercase tracking-eyebrow text-gold-deep">
            {categoryLabel}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium leading-tight text-ink">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            {soldOut ? (
              <span className="font-sans text-xl font-medium text-stock-out-fg">
                Sold out
              </span>
            ) : (
              <Price amount={product.priceNtd} size="lg" />
            )}
            <span className="text-line">·</span>
            <StockStatusText status={product.stockStatus} />
          </div>

          <p className="mt-5 font-serif text-lg text-ink-muted">
            {product.shortDescription}
          </p>

          {product.bestFor.length > 0 && (
            <p className="mt-4 font-sans text-sm text-ink-muted">
              <span className="text-ink">Best for:</span>{" "}
              {product.bestFor.join(" · ")}
            </p>
          )}

          <div className="rule-gold my-8" />

          {/* Add to cart — qty stepper + audited add. Sold-out: disabled, no stepper. */}
          {soldOut ? (
            <AddToCartButton productId={product.id} soldOut />
          ) : (
            <PdpAddToCart productId={product.id} stockQuantity={product.stockQuantity} />
          )}

          {product.tags.length > 0 && (
            <>
              <div className="rule-gold my-8" />
              <p className="font-sans text-sm text-ink-muted">
                <span className="text-ink">Tags:</span>{" "}
                {product.tags.join(" · ")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
