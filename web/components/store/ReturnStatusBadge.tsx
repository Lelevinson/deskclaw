import type { ReturnStatus } from "@shop/types.js";
import { StatusPill, type StatusTone } from "./StatusPill";

// Return-status pill (DESIGN.md §5.6) — its own return vocabulary over the shared
// StatusPill shell (§3.1). Tones map from brand tokens: success for the settled
// end states (refunded / completed), amber for the in-progress states, a neutral
// hairline for a fresh "requested", and muted for a closed "rejected" (quiet, not
// alarming). No status implies the storefront issued money — a refund is a
// human/seeded outcome shown read-only (ARCHITECTURE §5).
const STATUS_TONE: Record<ReturnStatus, StatusTone> = {
  requested: "neutral",
  approved: "amber",
  refund_processing: "amber",
  exchange_shipped: "amber",
  refunded: "success",
  completed: "success",
  rejected: "muted",
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
    <StatusPill tone={STATUS_TONE[status]} className={className}>
      {STATUS_LABEL[status]}
    </StatusPill>
  );
}
