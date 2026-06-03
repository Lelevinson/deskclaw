// Editorial page hero (DESIGN.md §5.2): eyebrow + Cinzel display line + lede.
// One ornament per view — keep it spare.
export function PageHero({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="flex flex-col items-center gap-4 py-12 text-center">
      {eyebrow && (
        <p className="font-sans text-xs uppercase tracking-eyebrow text-gold-deep">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-3xl text-ink md:text-4xl">{title}</h1>
      {lede && (
        <p className="max-w-xl font-serif text-lg text-ink-muted">{lede}</p>
      )}
    </header>
  );
}
