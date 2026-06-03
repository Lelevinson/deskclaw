import { cn } from "@/lib/utils";

// Styled placeholder for product imagery — real photography is deferred
// (DESIGN.md §8). A quiet gold ornament on a cream/panel tile, 4:5 aspect
// (§3.3). Decorative only.
export function ProductTile({
  className,
  glyph = "❦",
  aspect = "aspect-[4/5]",
}: {
  className?: string;
  glyph?: string;
  aspect?: string;
}) {
  return (
    <div
      className={cn(
        "product-tile relative flex items-center justify-center overflow-hidden",
        aspect,
        className,
      )}
      aria-hidden
    >
      <span className="select-none font-serif text-5xl text-gold/35">{glyph}</span>
    </div>
  );
}
