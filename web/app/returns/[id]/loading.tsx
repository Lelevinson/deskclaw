import { Skeleton } from "@/components/store/Skeleton";

// Return detail loading skeleton (DESIGN §5.7): breadcrumb + title + the meta /
// reason / status card, mirroring the read-only detail.
export default function ReturnDetailLoading() {
  return (
    <div className="py-10" role="status" aria-label="Loading return detail">
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
        <div className="border-b border-line px-6 py-5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-3 h-5 w-3/4" />
        </div>
        <div className="px-6 py-5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-3 h-4 w-full max-w-md" />
        </div>
      </div>
    </div>
  );
}
