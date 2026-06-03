"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/store/EmptyState";

// Neutral error boundary (DESIGN §5.7). Reuses EmptyState for the shared calm
// voice (glyph + line) and supplies its own footer: a quiet retry + a way back to
// the catalogue. Deliberately shows NO error details — never the message, stack,
// or any id (the same no-existence-leak discipline as the not-found refusal).
// Error boundaries must be client components.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-10">
      <EmptyState
        message="Something went wrong on our side."
        action={
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => reset()}>
              Try again
            </Button>
            <Link
              href="/"
              className="rounded-sm font-sans text-sm tracking-wide text-gold-deep underline-offset-4 hover:underline focus-visible:underline focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              Browse the catalogue →
            </Link>
          </div>
        }
      />
    </div>
  );
}
