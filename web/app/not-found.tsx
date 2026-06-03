import { EmptyState } from "@/components/store/EmptyState";

// Neutral not-found (DESIGN.md §5.7) — never leaks whether an id existed. Used
// for unknown product ids and any unmatched route.
export default function NotFound() {
  return (
    <div className="py-10">
      <EmptyState message="We couldn't find that page." />
    </div>
  );
}
