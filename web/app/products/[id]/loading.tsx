import { Skeleton } from "@/components/store/Skeleton";

// PDP loading skeleton (DESIGN §5.7): breadcrumb + the two-column image / detail
// layout, mirroring the product page.
export default function ProductLoading() {
  return (
    <div className="py-10" role="status" aria-label="Loading product">
      <span className="sr-only">Loading…</span>
      <Skeleton className="mb-8 h-4 w-56" />
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <Skeleton className="aspect-[4/5] rounded-lg" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-6 h-11 w-56 rounded-pill" />
        </div>
      </div>
    </div>
  );
}
