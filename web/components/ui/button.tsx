import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Amelya's button — gold pill primary, gold-outline secondary (DESIGN.md §3.3, §6).
// Jost (sans), pill radius, low elevation, hairline borders over heavy shadow.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill font-sans text-sm font-medium tracking-wide transition-colors focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-100 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-gold text-cream-soft hover:bg-gold-deep disabled:bg-stock-out-bg disabled:text-stock-out-fg",
        outline:
          "border border-gold/60 bg-transparent text-gold-deep hover:bg-gold/10 disabled:border-line disabled:text-ink-muted",
        ghost: "bg-transparent text-ink-muted hover:text-ink hover:bg-line/40",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
