import Link from "next/link";
import { notFound } from "next/navigation";

import { getReturn } from "@/lib/shop";
import type { ReturnRequest } from "@/lib/shop";
import { formatDate, formatOrderId, formatReturnId } from "@/lib/format";
import { ReturnStatusBadge } from "@/components/store/ReturnStatusBadge";

export const dynamic = "force-dynamic";

// A calm, read-only sentence describing where the request stands. Deliberately
// states facts only — never an action the customer can take here, and never a
// promise the storefront issues money: a refund/exchange is a human/seeded outcome
// the agent intakes but never auto-issues (ARCHITECTURE §5, DESIGN §5.6).
const STATUS_NOTE: Record<ReturnRequest["status"], string> = {
  requested:
    "We've received your request — our team will review it and follow up. No refund is issued automatically.",
  approved: "Your request was approved. Our team will arrange the next steps.",
  rejected: "This request was closed after review.",
  refund_processing: "Your refund is being processed.",
  refunded: "Your refund has been issued.",
  exchange_shipped: "Your exchange has shipped.",
  completed: "This return is complete.",
};

const RESOLUTION_LABEL: Record<ReturnRequest["resolution"], string> = {
  refund: "Refund",
  exchange: "Exchange",
};

// Return detail (surface 6, DESIGN.md §5.6). Server component reading the demo
// customer's OWN return via the src/shop reuse layer. getReturn returns null for an
// unknown OR a non-owned id (getReturnForChannel gives both the same "not found")
// — both render the neutral not-found, so the id never leaks existence or acts as
// proof of ownership (DESIGN §5.7, roadmap §3), exactly as Orders does.
//
// NOTE ON DATA SHAPE: a ReturnRequest is order-level — it carries no line items, so
// the §5.6 wireframe's "Item: … ×1" line is intentionally not rendered (we never
// invent data the service doesn't expose). The detail shows the linked order, the
// opened date, the reason, the resolution type, and the read-only status.
export default async function ReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ret = await getReturn(id);
  if (!ret) notFound();

  // The order a return is opened against is always one the same customer owns
  // (service invariant), so linking it is safe; /orders/[id] re-gates regardless.
  const meta: { label: string; value: string; href?: string }[] = [
    { label: "Order", value: formatOrderId(ret.orderId), href: `/orders/${ret.orderId}` },
    { label: "Opened", value: formatDate(ret.createdAt) },
    { label: "Resolution", value: RESOLUTION_LABEL[ret.resolution] },
  ];

  return (
    <div className="py-10">
      {/* Breadcrumb back to the returns list. */}
      <nav className="mb-6 font-sans text-sm text-ink-muted">
        <Link href="/returns" className="hover:text-gold-deep">
          Returns
        </Link>{" "}
        <span aria-hidden className="text-line">/</span>{" "}
        <span className="text-ink">{formatReturnId(ret.id)}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="font-display text-3xl text-ink">
          Return {formatReturnId(ret.id)}
        </h1>
        <ReturnStatusBadge status={ret.status} />
      </div>

      <div className="mt-8 rounded-lg border border-line bg-panel shadow-elev-sm">
        {/* Meta row: the order it is against · opened date · resolution type. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-line px-6 py-4 font-sans text-sm text-ink-muted">
          {meta.map((entry, i) => (
            <span key={entry.label} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-line">·</span>}
              <span>
                {entry.label}{" "}
                {entry.href ? (
                  <Link
                    href={entry.href}
                    className="text-ink tabular-nums underline-offset-4 hover:text-gold-deep hover:underline"
                  >
                    {entry.value}
                  </Link>
                ) : (
                  <span className="text-ink tabular-nums">{entry.value}</span>
                )}
              </span>
            </span>
          ))}
        </div>

        {/* Reason the return was opened. */}
        <div className="border-b border-line px-6 py-5">
          <span className="font-sans text-xs uppercase tracking-caps text-ink-muted">
            Reason
          </span>
          <p className="mt-2 font-serif text-lg leading-relaxed text-ink">
            {ret.reason}
          </p>
        </div>

        {/* Read-only status explainer — no refund/money action is ever offered here. */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="font-sans text-xs uppercase tracking-caps text-ink-muted">
              Status
            </span>
            <ReturnStatusBadge status={ret.status} />
          </div>
          <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">
            {STATUS_NOTE[ret.status]}
          </p>
          {/* Optional human-authored note (e.g. "Refunded NT$420 to original
              payment method") — a recorded fact, not an action. */}
          {ret.statusDetail && (
            <p className="mt-2 font-sans text-sm leading-relaxed text-ink">
              {ret.statusDetail}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/returns"
          className="font-sans text-sm tracking-wide text-gold-deep underline-offset-4 hover:underline"
        >
          ← All returns
        </Link>
      </div>
    </div>
  );
}
