import Link from "next/link";

import { getReturns } from "@/lib/shop";
import { formatDate, formatOrderId, formatReturnId } from "@/lib/format";
import { EmptyState } from "@/components/store/EmptyState";
import { ReturnStatusBadge } from "@/components/store/ReturnStatusBadge";

// Returns read live, shared, mutable state (the same store the chat agent and the
// seeded fixtures populate — a human reviewer can advance a return's status outside
// the app). Never statically cache it so a status change shows current next visit.
export const dynamic = "force-dynamic";

// Returns list (surface 6, DESIGN.md §5.6). Server component: reads the demo
// customer's OWN returns through the src/shop reuse layer (identity-gated,
// own-returns-only — listReturnsForChannel filters to the resolved customer). No
// mutation here; returns are read-only request records (the chat returns-actions
// skill opens them, never the storefront — ARCHITECTURE §5, DESIGN §5.6).
export default async function ReturnsPage() {
  const returns = await getReturns();

  if (returns.length === 0) {
    return (
      <div className="py-10">
        <h1 className="font-display text-3xl text-ink">Your Returns</h1>
        <EmptyState message="No returns yet." />
      </div>
    );
  }

  return (
    <div className="py-10">
      <h1 className="font-display text-3xl text-ink">
        Your Returns{" "}
        <span className="font-sans text-base font-normal tracking-normal text-ink-muted">
          · {returns.length} {returns.length === 1 ? "return" : "returns"}
        </span>
      </h1>

      <div className="mt-8 rounded-lg border border-line bg-panel px-6 shadow-elev-sm">
        {returns.map((ret) => (
          <Link
            key={ret.id}
            href={`/returns/${ret.id}`}
            className="flex flex-col gap-2 rounded-sm border-b border-line py-5 transition-colors last:border-b-0 hover:bg-cream-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:-mx-6 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
          >
            {/* Identity column: return number · the order it is against · opened date. */}
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="font-sans text-sm font-medium tabular-nums text-ink">
                {formatReturnId(ret.id)}
              </span>
              <span aria-hidden className="text-line">·</span>
              <span className="font-sans text-sm text-ink-muted">
                for Order {formatOrderId(ret.orderId)}
              </span>
              <span aria-hidden className="text-line">·</span>
              <span className="font-sans text-sm text-ink-muted">
                {formatDate(ret.createdAt)}
              </span>
            </div>

            {/* Status + affordance. */}
            <div className="flex items-center justify-between gap-6 sm:justify-end">
              <ReturnStatusBadge status={ret.status} />
              <span className="font-sans text-sm tracking-wide text-gold-deep">
                View →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
