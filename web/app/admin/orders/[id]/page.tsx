import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminOrder } from "@/lib/shop/admin";
import { formatDate, formatNtd, formatOrderId } from "@/lib/format";
import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { Price } from "@/components/store/Price";
import { LineItemRow } from "@/components/store/LineItemRow";
import { OrderAdvanceForm } from "@/components/admin/OrderAdvanceForm";

export const dynamic = "force-dynamic";

// Order detail + fulfilment (admin). Ops-wide read (any order); unknown id → neutral
// not-found. The advance form is a direct, audited staff write (no money moves).
export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  return (
    <div>
      <nav className="mb-6 font-sans text-sm text-ink-muted">
        <Link href="/admin/orders" className="rounded-sm hover:text-gold-deep focus-visible:text-gold-deep focus-visible:underline focus-visible:outline-none">
          Orders
        </Link>{" "}
        <span aria-hidden className="text-line">/</span>{" "}
        <span className="text-ink">{formatOrderId(order.id)}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="font-display text-2xl text-ink">Order {formatOrderId(order.id)}</h2>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-6 rounded-lg border border-line bg-panel shadow-elev-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-line px-6 py-4 font-sans text-sm text-ink-muted">
          <span>
            Placed <span className="text-ink tabular-nums">{formatDate(order.placedAt)}</span>
          </span>
          {order.shipping?.carrier && (
            <>
              <span aria-hidden className="text-line">·</span>
              <span>
                Carrier <span className="text-ink">{order.shipping.carrier}</span>
              </span>
            </>
          )}
          {order.shipping?.trackingNumber && (
            <>
              <span aria-hidden className="text-line">·</span>
              <span>
                Tracking <span className="text-ink tabular-nums">{order.shipping.trackingNumber}</span>
              </span>
            </>
          )}
        </div>

        <div className="px-6">
          {order.items.map((item) => (
            <LineItemRow
              key={item.productId}
              productId={item.productId}
              name={item.name}
              trailing={<Price amount={item.subtotalNtd} />}
              className="border-b border-line py-5 last:border-b-0"
            >
              <span className="font-sans text-sm tabular-nums text-ink-muted">
                ×{item.quantity} · {formatNtd(item.unitPriceNtd)} each
              </span>
            </LineItemRow>
          ))}
        </div>

        <div className="flex items-baseline justify-between gap-4 border-t border-line px-6 py-5">
          <span className="font-sans text-sm uppercase tracking-caps text-ink-muted">Total</span>
          <Price amount={order.totalNtd} size="lg" />
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-line bg-panel p-6 shadow-elev-sm">
        <h3 className="font-display text-lg text-ink">Update fulfilment</h3>
        <p className="mt-1 mb-5 font-serif text-sm text-ink-muted">
          Advance the status and attach tracking. Logged to the audit trail; no payment is
          taken or refunded in this demo.
        </p>
        <OrderAdvanceForm
          orderId={order.id}
          currentStatus={order.status}
          currentCarrier={order.shipping?.carrier}
          currentTracking={order.shipping?.trackingNumber}
        />
      </div>
    </div>
  );
}
