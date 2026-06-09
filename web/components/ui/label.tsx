import * as React from "react";

import { cn } from "@/lib/utils";

// Amelya's form label — Jost (sans), quiet ink, tracked.
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("font-sans text-sm font-medium tracking-wide text-ink", className)}
        {...props}
      />
    );
  },
);
Label.displayName = "Label";

export { Label };
