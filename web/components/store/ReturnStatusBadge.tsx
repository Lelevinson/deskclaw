import { cn } from "@/lib/utils";
import type { ReturnStatus } from "@shop/types.js";

// Return-status pill (DESIGN.md §5.6). Same quiet pill language as OrderStatusBadge
// / StockBadge (§3.1): Jost caps, tracking, pill radius. Palette drawn only from
// brand tokens — success green (§3.1) for the settled end states (refunded /
// completed), warm amber (stock-low) for the in-progress states, a neutral hairline
// for a fresh "requested", and a muted grey (stock-out) for a closed "rejected"
// (quiet, not alarming). No status implies the storefront issued money — a refund
// is a human/seeded outcome shown read-only (ARCHITECTURE §5).
const STATUS_STYLE: Record<ReturnStatus, string> = {
  requested: "border border-line bg-cream text-ink-muted",
  approved: "bg-stock-low-bg text-stock-low-fg",
  refund_processing: "bg-stock-low-bg text-stock-low-fg",
  exchange_shipped: "bg-stock-low-bg text-stock-low-fg",
  refunded: "bg-state-success-bg text-cream-soft",
  completed: "bg-state-success-bg text-cream-soft",
  rejected: "bg-stock-out-bg text-stock-out-fg",
};

const STATUS_LABEL: Record<ReturnStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  refund_processing: "Refund processing",
  exchange_shipped: "Exchange shipped",
  refunded: "Refunded",
  completed: "Completed",
  rejected: "Rejected",
};

export function ReturnStatusBadge({
  status,
  className,
}: {
  status: ReturnStatus;
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
