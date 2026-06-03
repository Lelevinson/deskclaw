import { cn } from "@/lib/utils";
import type { StockStatus } from "@shop/types.js";
import { StatusPill } from "./StatusPill";

// Stock-state pill (DESIGN.md §3.1) — its own stock vocabulary over the shared
// StatusPill shell. In-stock shows no badge by default (the StockStatusText
// variant renders a quiet "In stock" line for the PDP status row).
export function StockBadge({
  status,
  className,
}: {
  status: StockStatus;
  className?: string;
}) {
  if (status === "in_stock") return null;
  const isLow = status === "low_stock";
  return (
    <StatusPill tone={isLow ? "amber" : "muted"} className={className}>
      {isLow ? "Low stock" : "Sold out"}
    </StatusPill>
  );
}

// Plain-text availability for the PDP status row ("· In stock" / "· Sold out").
export function StockStatusText({ status }: { status: StockStatus }) {
  const label =
    status === "in_stock"
      ? "In stock"
      : status === "low_stock"
        ? "Low stock"
        : "Sold out";
  return (
    <span
      className={cn(
        "font-sans text-sm",
        status === "out_of_stock" ? "text-stock-out-fg" : "text-ink-muted",
      )}
    >
      {label}
    </span>
  );
}
