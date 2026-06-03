import { PageHero } from "@/components/store/PageHero";
import { Skeleton, ProductCardSkeleton } from "@/components/store/Skeleton";
import { CATALOGUE_GRID } from "@/components/store/catalogue-grid";

// Catalogue loading skeleton (DESIGN §5.7). The hero copy is static, so it renders
// for real; the filter pills + 4-col product grid show shimmering placeholders
// while the server reads the catalogue.
export default function CatalogueLoading() {
  return (
    <div className="pb-8" role="status" aria-label="Loading the catalogue">
      <span className="sr-only">Loading…</span>
      <PageHero
        eyebrow="Natural Skincare · Taipei"
        title="Skincare, simply."
        lede="Gentle, fragrance-free essentials for an easy daily routine."
      />
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-pill" />
          ))}
        </div>
        <div className={CATALOGUE_GRID}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
