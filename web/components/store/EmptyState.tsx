import Link from "next/link";

// Quiet empty state (DESIGN.md §5.7): one line + a ❧ glyph + a single CTA back
// to the catalogue.
export function EmptyState({
  message,
  ctaHref = "/",
  ctaLabel = "Browse the catalogue",
}: {
  message: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span aria-hidden className="font-serif text-3xl text-gold/40">
        ❧
      </span>
      <p className="font-serif text-lg text-ink-muted">{message}</p>
      <Link
        href={ctaHref}
        className="font-sans text-sm tracking-wide text-gold-deep underline-offset-4 hover:underline"
      >
        {ctaLabel} →
      </Link>
    </div>
  );
}
