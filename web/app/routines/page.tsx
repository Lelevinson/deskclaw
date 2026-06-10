import { getRoutineGuide } from "@/lib/shop";
import { RoutineBuilder } from "@/components/store/RoutineBuilder";

// Reads the live catalog (shared store) for the routine-step products; never cache
// statically so a catalog change is reflected.
export const dynamic = "force-dynamic";

// Routines (surface 9, DESIGN.md §5.8). PUBLIC, read-only brand content — an
// interactive but deterministic routine builder. It arranges the products the
// customer picks into the brand's stated AM/PM order and surfaces only the
// cautions/pairings written in data/catalog/compatibility.md (the same source the
// chat policy-oracle skill uses). No personalized or medical advice, nothing
// invented — see lib/shop getRoutineGuide → src/shop routine-rules.
export default async function RoutinesPage() {
  const guide = await getRoutineGuide();

  return (
    <section className="py-12">
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="font-display text-3xl tracking-wide text-ink">Build Your Routine</h1>
        <p className="max-w-2xl font-serif text-lg text-ink-muted">
          General morning and evening guidance for Amelya&rsquo;s products — pick what you have, and
          we&rsquo;ll put it in order.
        </p>
      </header>

      <RoutineBuilder guide={guide} />
    </section>
  );
}
