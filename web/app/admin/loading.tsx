import { Skeleton } from "@/components/store/Skeleton";

// Admin loading state — three shimmering stat cards under the (already-rendered)
// admin header/nav from layout.tsx.
export default function AdminLoading() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading admin">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-6 shadow-elev-sm">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-12" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}
