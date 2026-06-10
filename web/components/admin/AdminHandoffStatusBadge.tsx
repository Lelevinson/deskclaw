import type { HandoffClassification, HandoffStatus } from "@shop/types.js";
import { StatusPill, type StatusTone } from "@/components/store/StatusPill";

// Handoff-status pill (admin queue) — its own vocabulary over the shared StatusPill
// shell (DESIGN §3.1), mirroring OrderStatusBadge. Early/queued states read quiet
// (neutral), active work is amber, resolved is the settled success green, closed is
// muted. The agent only ever creates "open"; the rest are admin/human transitions.
const STATUS_TONE: Record<HandoffStatus, StatusTone> = {
  open: "neutral",
  acknowledged: "neutral",
  in_progress: "amber",
  resolved: "success",
  closed: "muted",
};

const STATUS_LABEL: Record<HandoffStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function AdminHandoffStatusBadge({
  status,
  className,
}: {
  status: HandoffStatus;
  className?: string;
}) {
  return (
    <StatusPill tone={STATUS_TONE[status]} className={className}>
      {STATUS_LABEL[status]}
    </StatusPill>
  );
}

// Escalation severity — urgent reads warm (amber), a plain recommendation reads quiet.
const CLASSIFICATION_TONE: Record<HandoffClassification, StatusTone> = {
  urgent_handoff: "amber",
  handoff_recommended: "neutral",
};

const CLASSIFICATION_LABEL: Record<HandoffClassification, string> = {
  urgent_handoff: "Urgent",
  handoff_recommended: "Recommended",
};

export function HandoffClassificationBadge({
  classification,
  className,
}: {
  classification: HandoffClassification;
  className?: string;
}) {
  return (
    <StatusPill tone={CLASSIFICATION_TONE[classification]} className={className}>
      {CLASSIFICATION_LABEL[classification]}
    </StatusPill>
  );
}
