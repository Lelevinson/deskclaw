import Image from "next/image";

import { cn } from "@/lib/utils";

// Product imagery tile, 4:5 (DESIGN §3.3). When `productId` is given it shows the
// product photo from /public/<id>.png over the cream tile (the photos are shot on a
// matching cream background, so they blend seamlessly); the quiet gold ornament
// stays behind as the loading/fallback backdrop. Without a productId it is just the
// decorative placeholder (skeletons, etc.).
export function ProductTile({
  productId,
  alt,
  className,
  glyph = "❦",
  aspect = "aspect-[4/5]",
  sizes = "(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw",
}: {
  productId?: string;
  alt?: string;
  className?: string;
  glyph?: string;
  aspect?: string;
  sizes?: string;
}) {
  return (
    <div
      className={cn(
        "product-tile relative flex items-center justify-center overflow-hidden",
        aspect,
        className,
      )}
    >
      <span className="select-none font-serif text-5xl text-gold/35" aria-hidden>
        {glyph}
      </span>
      {productId && (
        <Image src={`/${productId}.png`} alt={alt ?? ""} fill sizes={sizes} className="object-cover" />
      )}
    </div>
  );
}
