import Link from "next/link";
import { notFound } from "next/navigation";

import { getOrder } from "@/lib/shop";
import type { OrderView } from "@/lib/shop";
import { formatDate, formatNtd, formatOrderId } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { Price } from "@/components/store/Price";
import { ProductTile } from "@/components/store/ProductTile";

export const dynamic = "force-dynamic";

// Build the order's meta line (placed · carrier · tracking · delivery) from only
// the fields that are present — a not-yet-shipped order has no tracking, so we
// never render an empty "Tracking —" chip.
function orderMeta(order: OrderView): { label: string; value: string }[] {
  const meta: { label: string; value: string }[] = [
    { label: "Placed", value: formatDate(order.placedAt) },
  ];
  const shipping = order.shipping;
  if (shipping?.carrier) meta.push({ label: "Carrier", value: shipping.carrier });
  if (shipping?.trackingNumber)
    meta.push({ label: "Tracking", value: shipping.trackingNumber });
  if (order.status === "delivered" && shipping?.deliveredAt)
    meta.push({ label: "Delivered", value: formatDate(shipping.deliveredAt) });
  // Only advertise an estimate while delivery is still genuinely pending — never
  // on a delivered order (even one missing its deliveredAt) or a cancelled one,
  // where a future "Est. delivery" date would read as misleading.
  else if (
    order.status !== "delivered" &&
    order.status !== "cancelled" &&
    shipping?.estimatedDelivery
  )
    meta.push({ label: "Est. delivery", value: formatDate(shipping.estimatedDelivery) });
  return meta;
}

// Order detail / tracking (surface 5, DESIGN.md §5.5). Server component reading
// the demo customer's OWN order via the src/shop reuse layer. getOrder returns
// null for an unknown OR a non-owned id (findOwnedOrder makes the two
// indistinguishable) — both render the neutral not-found, so the id never leaks
// existence or acts as proof of ownership (DESIGN §5.7, roadmap §3).
export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const meta = orderMeta(order);

  return (
    <div className="py-10">
      {/* Breadcrumb back to the history list. */}
      <nav className="mb-6 font-sans text-sm text-ink-muted">
        <Link href="/orders" className="hover:text-gold-deep">
          Orders
        </Link>{" "}
        <span aria-hidden className="text-line">/</span>{" "}
        <span className="text-ink">{formatOrderId(order.id)}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="font-display text-3xl text-ink">
          Order {formatOrderId(order.id)}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-8 rounded-lg border border-line bg-panel shadow-elev-sm">
        {/* Meta / tracking row. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-line px-6 py-4 font-sans text-sm text-ink-muted">
          {meta.map((entry, i) => (
            <span key={entry.label} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-line">·</span>}
              <span>
                {entry.label}{" "}
                <span className="text-ink tabular-nums">{entry.value}</span>
              </span>
            </span>
          ))}
        </div>

        {/* Line items. */}
        <div className="px-6">
          {order.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 border-b border-line py-5 last:border-b-0"
            >
              <Link
                href={`/products/${item.productId}`}
                className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={item.name}
              >
                <ProductTile
                  className="w-16 rounded-md border border-line"
                  aspect="aspect-square"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.productId}`}
                  className="block truncate font-serif text-xl font-medium leading-tight text-ink hover:text-gold-deep focus-visible:underline"
                >
                  {item.name}
                </Link>
                <span className="font-sans text-sm tabular-nums text-ink-muted">
                  ×{item.quantity} · {formatNtd(item.unitPriceNtd)} each
                </span>
              </div>
              <Price amount={item.subtotalNtd} />
            </div>
          ))}
        </div>

        {/* Total. */}
        <div className="flex items-baseline justify-between gap-4 border-t border-line px-6 py-5">
          <span className="font-sans text-sm uppercase tracking-caps text-ink-muted">
            Total
          </span>
          <Price amount={order.totalNtd} size="lg" />
        </div>
      </div>

      {/* On a delivered order the wireframe (§5.5) shows a "Request a return" CTA
          → Returns intake. Phase 5 ships Returns READ-ONLY (roadmap §6, DESIGN §4):
          the cart is the storefront's only mutation (DESIGN §4/§7), so opening a
          return — a preview→confirm write — stays out of the storefront's scope and
          would need an ARCHITECTURE §5 update first. The honest affordance: the
          request itself is made through the assistant (chat returns-actions, which
          creates a `requested` record), while the storefront shows returns
          read-only. So the request button stays inert, with a live link to view
          existing returns. */}
      {order.status === "delivered" && (
        <div className="mt-6 flex flex-col items-start gap-2">
          <Button
            variant="outline"
            disabled
            title="Returns are requested through the assistant in this demo"
          >
            Request a return
          </Button>
          <p className="font-sans text-xs text-ink-muted">
            Ask the assistant to open a return for this order.{" "}
            <Link
              href="/returns"
              className="text-gold-deep underline-offset-4 hover:underline"
            >
              View your returns →
            </Link>
          </p>
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/orders"
          className="font-sans text-sm tracking-wide text-gold-deep underline-offset-4 hover:underline"
        >
          ← All orders
        </Link>
      </div>
    </div>
  );
}
