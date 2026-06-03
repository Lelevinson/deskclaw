import { Skeleton, ListRowsSkeleton } from "@/components/store/Skeleton";

// Cart loading skeleton (DESIGN §5.7): heading + line rows (with thumbs) + a
// subtotal block, matching the cart's footprint.
export default function CartLoading() {
  return (
    <div className="py-10" role="status" aria-label="Loading your cart">
      <span className="sr-only">Loading…</span>
      <h1 className="font-display text-3xl text-ink">Your Cart</h1>
      <ListRowsSkeleton rows={2} withThumb />
      <div className="mt-6 flex flex-col items-end gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-11 w-40 rounded-pill" />
      </div>
    </div>
  );
}
