import Link from "next/link";

import { getAdminHandoffs, isUnresolved } from "@/lib/shop/admin";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/store/EmptyState";
import {
  AdminHandoffStatusBadge,
  HandoffClassificationBadge,
} from "@/components/admin/AdminHandoffStatusBadge";

export const dynamic = "force-dynamic";

// Handoff queue (admin). Ops-wide read of every escalation the agent filed; the
// unresolved ones float to the top so the queue reads as a worklist.
export default async function AdminHandoffsPage() {
  const handoffs = await getAdminHandoffs();
  const sorted = [...handoffs].sort((a, b) => {
    const aOpen = isUnresolved(a) ? 0 : 1;
    const bOpen = isUnresolved(b) ? 0 : 1;
    if (aOpen !== bOpen) return aOpen - bOpen;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });

  if (sorted.length === 0) {
    return <EmptyState message="No handoffs on record." ctaHref="/admin" ctaLabel="Back to dashboard" />;
  }

  return (
    <div className="rounded-lg border border-line bg-panel px-6 shadow-elev-sm">
      {sorted.map((handoff) => (
        <Link
          key={handoff.id}
          href={`/admin/handoffs/${handoff.id}`}
          className="flex flex-col gap-2 border-b border-line py-5 transition-colors last:border-b-0 hover:bg-cream-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:-mx-6 sm:px-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <HandoffClassificationBadge classification={handoff.classification} />
            <AdminHandoffStatusBadge status={handoff.status} />
            <span className="font-sans text-xs uppercase tracking-caps text-ink-muted">
              {handoff.category}
            </span>
            <span aria-hidden className="text-line">·</span>
            <span className="font-sans text-sm text-ink-muted">{formatDate(handoff.createdAt)}</span>
          </div>
          <p className="font-serif text-base text-ink">{handoff.summary}</p>
          <span className="font-sans text-xs text-ink-muted">
            {handoff.channel} · {handoff.externalUserId}
            {handoff.customerId ? " · linked" : " · unlinked"}
          </span>
        </Link>
      ))}
    </div>
  );
}
