import * as React from "react";

import { cn } from "@/lib/utils";

// Amelya's text input — cream field, hairline border, gold focus ring
// (DESIGN.md §3.3). Matches the Button's restraint: no heavy shadow.
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-11 w-full rounded-md border border-line bg-cream-soft px-3 font-sans text-sm text-ink placeholder:text-ink-muted/60 transition-colors focus-ring focus-visible:border-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
