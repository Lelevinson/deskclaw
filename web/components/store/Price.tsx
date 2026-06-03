import { cn } from "@/lib/utils";
import { formatNtd } from "@/lib/format";

// NT$ price (DESIGN.md §3.4). Jost, gold-deep emphasis on cream (never raw gold
// for text on cream — §3.1 contrast rule).
export function Price({
  amount,
  className,
  size = "base",
}: {
  amount: number;
  className?: string;
  size?: "base" | "lg";
}) {
  return (
    <span
      className={cn(
        "font-sans font-medium tabular-nums text-gold-deep",
        size === "lg" ? "text-xl" : "text-base",
        className,
      )}
    >
      {formatNtd(amount)}
    </span>
  );
}
