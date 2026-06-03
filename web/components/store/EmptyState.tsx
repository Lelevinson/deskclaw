import Link from "next/link";

// Quiet empty/error state (DESIGN.md §5.7): the shared calm voice — a ❧ glyph +
// one line + a CTA back to the catalogue. By default it renders the single
// catalogue CTA; pass `action` to supply a custom footer instead (e.g. the error
// boundary's "Try again" + catalogue link), so the empty and error surfaces share
// one glyph/voice/layout rather than each re-implementing it.
export function EmptyState({
  message,
  ctaHref = "/",
  ctaLabel = "Browse the catalogue",
  action,
}: {
  message: string;
  ctaHref?: string;
  ctaLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span aria-hidden className="font-serif text-3xl text-gold/40">
        ❧
      </span>
      <p className="font-serif text-lg text-ink-muted">{message}</p>
      {action ?? (
        <Link
          href={ctaHref}
          className="rounded-sm font-sans text-sm tracking-wide text-gold-deep underline-offset-4 hover:underline focus-visible:underline focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          {ctaLabel} →
        </Link>
      )}
    </div>
  );
}
