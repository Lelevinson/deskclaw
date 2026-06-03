import type { OrderStatus } from "@shop/types.js";
import { StatusPill, type StatusTone } from "./StatusPill";

// Order-status pill (DESIGN.md §5.5) — its own order vocabulary over the shared
// StatusPill shell (§3.1). Tones map from brand tokens: success for the settled
// "delivered", amber for in-transit states, a neutral hairline for the
// early/processing states, and muted for cancelled (quiet, not alarming).
const STATUS_TONE: Record<OrderStatus, StatusTone> = {
  placed: "neutral",
  processing: "neutral",
  shipped: "amber",
  out_for_delivery: "amber",
  delivered: "success",
  cancelled: "muted",
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
    <StatusPill tone={STATUS_TONE[status]} className={className}>
      {STATUS_LABEL[status]}
    </StatusPill>
  );
}
