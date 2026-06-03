import { cn } from "@/lib/utils";

// Loading skeleton primitive (DESIGN.md §5.7): a cream block with a faint gold
// shimmer. The `.skeleton` class (globals.css) owns the fill + the reduced-motion-
// aware shimmer sweep; this just sizes/shapes it. Decorative — hidden from a11y
// tree (the surrounding loading.tsx carries the role/label).
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-md", className)} />;
}

// A product-card skeleton matching ProductCard's footprint (tile + text + button),
// for the catalogue grid loading state.
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-line bg-panel">
      <Skeleton className="aspect-[4/5] rounded-none" />
      <div className="flex flex-col gap-2 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="mt-4 h-9 w-full rounded-pill" />
      </div>
    </div>
  );
}

// Full list-page loading state (orders / returns list): a display heading +
// shimmering rows. Wrapped as a status region for assistive tech.
export function ListPageSkeleton({
  title,
  rows = 3,
  withThumb = false,
}: {
  title: string;
  rows?: number;
  withThumb?: boolean;
}) {
  return (
    <div className="py-10" role="status" aria-label={`Loading ${title}`}>
      <span className="sr-only">Loading…</span>
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      <ListRowsSkeleton rows={rows} withThumb={withThumb} />
    </div>
  );
}

// A list-row skeleton (orders / returns list, cart line) — a panel card with N
// hairline-divided rows, each a thumb-or-label block plus a trailing block.
export function ListRowsSkeleton({
  rows = 3,
  withThumb = false,
}: {
  rows?: number;
  withThumb?: boolean;
}) {
  return (
    <div className="mt-8 rounded-lg border border-line bg-panel px-6 shadow-elev-sm">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-line py-5 last:border-b-0"
        >
          {withThumb && <Skeleton className="size-16 shrink-0" />}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-pill" />
        </div>
      ))}
    </div>
  );
}
