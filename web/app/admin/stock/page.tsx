import { getAdminProducts } from "@/lib/shop/admin";
import { formatCategory } from "@/lib/format";
import { EmptyState } from "@/components/store/EmptyState";
import { StockBadge } from "@/components/store/StockBadge";
import { StockAdjustForm } from "@/components/admin/StockAdjustForm";

export const dynamic = "force-dynamic";

// Stock (admin). Every product, scarcest first, so low/out-of-stock items lead. Each
// row carries an inline restock control (a direct, audited staff write that also
// recomputes the derived stock status).
export default async function AdminStockPage() {
  const products = await getAdminProducts();

  if (products.length === 0) {
    return <EmptyState message="No products in the catalogue." ctaHref="/admin" ctaLabel="Back to dashboard" />;
  }

  return (
    <div className="rounded-lg border border-line bg-panel px-6 shadow-elev-sm">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex flex-col gap-3 border-b border-line py-5 last:border-b-0 sm:flex-row sm:items-center sm:gap-4"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-serif text-base text-ink">{product.name}</span>
              <StockBadge status={product.stockStatus} />
            </div>
            <span className="font-sans text-xs uppercase tracking-caps text-ink-muted">
              {formatCategory(product.category)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-6 sm:justify-end">
            <span className="font-sans text-sm text-ink-muted">
              In stock:{" "}
              <span
                className={`tabular-nums ${product.stockQuantity === 0 ? "text-stock-out-fg" : product.stockQuantity <= 5 ? "text-stock-low-fg" : "text-ink"}`}
              >
                {product.stockQuantity}
              </span>
            </span>
            <StockAdjustForm productId={product.id} currentQuantity={product.stockQuantity} />
          </div>
        </div>
      ))}
    </div>
  );
}
