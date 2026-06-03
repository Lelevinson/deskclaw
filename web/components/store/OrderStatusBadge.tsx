import { cn } from "@/lib/utils";
import type { OrderStatus } from "@shop/types.js";

// Order-status pill (DESIGN.md §5.5). Same quiet pill language as StockBadge
// (§3.1): Jost caps, tracking, pill radius. The palette is drawn only from brand
// tokens — the success green (§3.1) for the settled "delivered", warm amber
// (stock-low) for in-transit states, a neutral hairline for the early/processing
// states, and a muted grey (stock-out) for cancelled (quiet, not alarming).
const STATUS_STYLE: Record<OrderStatus, string> = {
  placed: "border border-line bg-cream text-ink-muted",
  processing: "border border-line bg-cream text-ink-muted",
  shipped: "bg-stock-low-bg text-stock-low-fg",
  out_for_delivery: "bg-stock-low-bg text-stock-low-fg",
  delivered: "bg-state-success-bg text-cream-soft",
  cancelled: "bg-stock-out-bg text-stock-out-fg",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-1 font-sans text-xs font-medium uppercase tracking-caps",
        STATUS_STYLE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
