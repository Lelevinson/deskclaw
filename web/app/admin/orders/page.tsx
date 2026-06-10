import Link from "next/link";

import { getAdminOrders, getStuckOrders } from "@/lib/shop/admin";
import { formatDate, formatOrderId } from "@/lib/format";
import { EmptyState } from "@/components/store/EmptyState";
import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { StatusPill } from "@/components/store/StatusPill";
import { Price } from "@/components/store/Price";

export const dynamic = "force-dynamic";

// Orders queue (admin). Ops-wide read of every order, with the ones stuck in
// processing (2+ days) flagged and floated to the top — the digest's "stuck orders".
export default async function AdminOrdersPage() {
  const [orders, stuck] = await Promise.all([getAdminOrders(), getStuckOrders()]);
  const stuckIds = new Set(stuck.map((o) => o.id));
  const sorted = [...orders].sort((a, b) => {
    const aStuck = stuckIds.has(a.id) ? 0 : 1;
    const bStuck = stuckIds.has(b.id) ? 0 : 1;
    if (aStuck !== bStuck) return aStuck - bStuck;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });

  if (sorted.length === 0) {
    return <EmptyState message="No orders on record." ctaHref="/admin" ctaLabel="Back to dashboard" />;
  }

  return (
    <div className="rounded-lg border border-line bg-panel px-6 shadow-elev-sm">
      {sorted.map((order) => (
        <Link
          key={order.id}
          href={`/admin/orders/${order.id}`}
          className="flex flex-col gap-2 border-b border-line py-5 transition-colors last:border-b-0 hover:bg-cream-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:-mx-6 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="font-sans text-sm font-medium tabular-nums text-ink">
              {formatOrderId(order.id)}
            </span>
            <span aria-hidden className="text-line">·</span>
            <span className="font-sans text-sm text-ink-muted">{formatDate(order.placedAt)}</span>
            <OrderStatusBadge status={order.status} />
            {stuckIds.has(order.id) && <StatusPill tone="amber">Stuck</StatusPill>}
          </div>
          <div className="flex items-center justify-between gap-6 sm:justify-end">
            <Price amount={order.totalNtd} />
            <span className="font-sans text-sm tracking-wide text-gold-deep">View →</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
