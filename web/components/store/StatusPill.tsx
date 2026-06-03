import { cn } from "@/lib/utils";

// Shared status-pill primitive (DESIGN.md §3.1). The quiet pill *wrapper* — Jost
// caps, tracking, pill radius, hairline-or-tinted tone — was duplicated verbatim
// across StockBadge / OrderStatusBadge / ReturnStatusBadge (Phases 2–5). This
// owns only that shared shell; each surface keeps its OWN status vocabulary and
// maps its statuses to one of these brand tones (it does not centralize the
// vocabularies, which are surface-specific). Palette is brand-token-only:
//   neutral — hairline on cream, for early/fresh states (quiet)
//   amber   — stock-low warm, for in-progress/in-transit states
//   success — brand green, for settled end states (delivered/refunded/completed)
//   muted   — stock-out grey, for closed/cancelled states (quiet, not alarming)
// No tone implies the storefront moved money — those outcomes are read-only facts.
export type StatusTone = "neutral" | "amber" | "success" | "muted";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "border border-line bg-cream text-ink-muted",
  amber: "bg-stock-low-bg text-stock-low-fg",
  success: "bg-state-success-bg text-cream-soft",
  muted: "bg-stock-out-bg text-stock-out-fg",
};

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-1 font-sans text-xs font-medium uppercase tracking-caps",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
