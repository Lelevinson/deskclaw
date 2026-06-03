import { Skeleton } from "@/components/store/Skeleton";

// Order detail loading skeleton (DESIGN §5.7): breadcrumb + title + a meta row,
// line items (with thumbs), and a total — mirroring the single detail card.
export default function OrderDetailLoading() {
  return (
    <div className="py-10" role="status" aria-label="Loading order detail">
      <span className="sr-only">Loading…</span>
      <Skeleton className="mb-6 h-4 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-6 w-24 rounded-pill" />
      </div>
      <div className="mt-8 rounded-lg border border-line bg-panel shadow-elev-sm">
        <div className="border-b border-line px-6 py-4">
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="px-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-line py-5 last:border-b-0"
            >
              <Skeleton className="size-16 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-line px-6 py-5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  );
}
