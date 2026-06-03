import { cn } from "@/lib/utils";
import type { StockStatus } from "@shop/types.js";

// Stock-state pill (DESIGN.md §3.1). In-stock shows no badge by default (the
// `inline` variant renders a quiet "In stock" line for the PDP status row).
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
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-1 font-sans text-xs font-medium uppercase tracking-caps",
        isLow
          ? "bg-stock-low-bg text-stock-low-fg"
          : "bg-stock-out-bg text-stock-out-fg",
        className,
      )}
    >
      {isLow ? "Low stock" : "Sold out"}
    </span>
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
