import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminHandoff } from "@/lib/shop/admin";
import { formatDate } from "@/lib/format";
import {
  AdminHandoffStatusBadge,
  HandoffClassificationBadge,
} from "@/components/admin/AdminHandoffStatusBadge";
import { HandoffResolveForm } from "@/components/admin/HandoffResolveForm";

export const dynamic = "force-dynamic";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-4 last:border-b-0 sm:flex-row sm:gap-4">
      <span className="font-sans text-xs uppercase tracking-caps text-ink-muted sm:w-40 sm:shrink-0">
        {label}
      </span>
      <div className="font-serif text-base text-ink">{children}</div>
    </div>
  );
}

// Handoff detail + resolution (admin). Ops-wide read (any handoff, not own-only);
// unknown id → neutral not-found. The resolve form is a direct, audited staff write.
export default async function AdminHandoffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const handoff = await getAdminHandoff(id);
  if (!handoff) notFound();

  return (
    <div>
      <nav className="mb-6 font-sans text-sm text-ink-muted">
        <Link href="/admin/handoffs" className="rounded-sm hover:text-gold-deep focus-visible:text-gold-deep focus-visible:underline focus-visible:outline-none">
          Handoffs
        </Link>{" "}
        <span aria-hidden className="text-line">/</span>{" "}
        <span className="text-ink">{handoff.category}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-2xl text-ink">Escalation</h2>
        <HandoffClassificationBadge classification={handoff.classification} />
        <AdminHandoffStatusBadge status={handoff.status} />
      </div>

      <div className="mt-6 rounded-lg border border-line bg-panel px-6 shadow-elev-sm">
        <DetailRow label="Category">{handoff.category}</DetailRow>
        <DetailRow label="Summary">{handoff.summary}</DetailRow>
        <DetailRow label="Internal reason">{handoff.reason}</DetailRow>
        <DetailRow label="Customer contact">
          {handoff.channel} · {handoff.externalUserId}
          {handoff.customerId ? (
            <span className="ml-2 font-sans text-xs text-ink-muted">(linked · {handoff.customerId})</span>
          ) : (
            <span className="ml-2 font-sans text-xs text-ink-muted">(unlinked sender)</span>
          )}
        </DetailRow>
        <DetailRow label="Raised">{formatDate(handoff.createdAt)}</DetailRow>
        <DetailRow label="Last updated">{formatDate(handoff.updatedAt)}</DetailRow>
        {handoff.statusDetail && <DetailRow label="Resolution note">{handoff.statusDetail}</DetailRow>}
      </div>

      <div className="mt-8 rounded-lg border border-line bg-panel p-6 shadow-elev-sm">
        <h3 className="font-display text-lg text-ink">Work this handoff</h3>
        <p className="mt-1 mb-5 font-serif text-sm text-ink-muted">
          Advance the status and leave a note for the record. This is logged to the audit
          trail; it does not message the customer.
        </p>
        <HandoffResolveForm
          handoffId={handoff.id}
          currentStatus={handoff.status}
          currentNote={handoff.statusDetail}
        />
      </div>
    </div>
  );
}
