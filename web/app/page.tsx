import { getCatalogue } from "@/lib/shop";
import { PageHero } from "@/components/store/PageHero";
import { CatalogueBrowser } from "@/components/store/CatalogueBrowser";
import { EmptyState } from "@/components/store/EmptyState";

// Catalogue grid (surface 2, DESIGN.md §5.2). Server component: reads the real
// catalogue through the src/shop reuse layer (never data/ directly), hands plain
// product data to the client browser for filtering.
export default async function CataloguePage() {
  const products = await getCatalogue();

  return (
    <div className="pb-8">
      <PageHero
        eyebrow="Natural Skincare · Taipei"
        title="Skincare, simply."
        lede="Gentle, fragrance-free essentials for an easy daily routine."
      />
      {products.length === 0 ? (
        <EmptyState message="The catalogue is unavailable right now." ctaLabel="Try again" />
      ) : (
        <CatalogueBrowser products={products} />
      )}
    </div>
  );
}
