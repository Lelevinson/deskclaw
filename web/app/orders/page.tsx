import Link from "next/link";

import { getOrders } from "@/lib/shop";
import { formatDate, formatOrderId } from "@/lib/format";
import { EmptyState } from "@/components/store/EmptyState";
import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { Price } from "@/components/store/Price";

// Orders read live, shared, mutable state (the same store the chat agent and the
// seeded fixtures populate). Never statically cache it — an order whose status
// changes outside the app should show current on the next visit.
export const dynamic = "force-dynamic";

// Order history (surface 5, DESIGN.md §5.5). Server component: reads the demo
// customer's OWN orders through the src/shop reuse layer (identity-gated,
// own-orders-only — listOrdersForChannel filters to the resolved customer). No
// mutation here; orders are read-only (checkout/payments are out of scope,
// ARCHITECTURE §5).
export default async function OrdersPage() {
  const orders = await getOrders();

  if (orders.length === 0) {
    return (
      <div className="py-10">
        <h1 className="font-display text-3xl text-ink">Your Orders</h1>
        <EmptyState message="No orders yet." />
      </div>
    );
  }

  return (
    <div className="py-10">
      <h1 className="font-display text-3xl text-ink">
        Your Orders{" "}
        <span className="font-sans text-base font-normal tracking-normal text-ink-muted">
          · {orders.length} {orders.length === 1 ? "order" : "orders"}
        </span>
      </h1>

      <div className="mt-8 rounded-lg border border-line bg-panel px-6 shadow-elev-sm">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="flex flex-col gap-2 rounded-sm border-b border-line py-5 transition-colors last:border-b-0 hover:bg-cream-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:-mx-6 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
          >
            {/* Identity column: order number · date · status. */}
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="font-sans text-sm font-medium tabular-nums text-ink">
                {formatOrderId(order.id)}
              </span>
              <span aria-hidden className="text-line">·</span>
              <span className="font-sans text-sm text-ink-muted">
                {formatDate(order.placedAt)}
              </span>
              <OrderStatusBadge status={order.status} />
            </div>

            {/* Total + affordance. */}
            <div className="flex items-center justify-between gap-6 sm:justify-end">
              <Price amount={order.totalNtd} />
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
