"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import type { RoutineGuide, RoutineProduct } from "@shop/types.js";
import { cn } from "@/lib/utils";

const STEP_LABEL: Record<RoutineProduct["step"], string> = {
  cleanser: "Cleanser",
  toner: "Toner",
  moisturizer: "Moisturizer",
  sunscreen: "Sunscreen",
  "facial-oil": "Facial oil",
};

function RoutineColumn({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: RoutineProduct[];
}) {
  return (
    <div className="rounded-md border border-line bg-panel p-6">
      <h3 className="font-display text-lg tracking-wide text-ink">{title}</h3>
      <p className="mt-1 font-serif text-sm text-ink-muted">{subtitle}</p>
      {items.length === 0 ? (
        <p className="mt-5 font-sans text-sm text-ink-muted/70">
          Nothing selected for this routine yet.
        </p>
      ) : (
        <ol className="mt-5 flex flex-col gap-3.5">
          {items.map((product, index) => (
            <li key={product.id} className="flex items-baseline gap-3">
              <span className="font-sans text-xs tabular-nums text-gold-deep">{index + 1}</span>
              <span className="flex flex-col">
                <Link
                  href={product.link}
                  className="rounded-sm font-serif text-base text-ink transition-colors hover:text-gold-deep focus-ring"
                >
                  {product.name}
                </Link>
                <span className="font-sans text-xs uppercase tracking-wide text-ink-muted">
                  {STEP_LABEL[product.step]}
                  {product.isFinalStep ? " · last step" : ""}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function RoutineBuilder({ guide }: { guide: RoutineGuide }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chosen = guide.products.filter((product) => selected.has(product.id));
  const byOrder = (a: RoutineProduct, b: RoutineProduct) => a.stepOrder - b.stepOrder;
  const am = chosen.filter((p) => p.times.includes("am")).sort(byOrder);
  const pm = chosen.filter((p) => p.times.includes("pm")).sort(byOrder);

  const applies = (whenAll: string[]) => whenAll.every((id) => selected.has(id));
  const pairings = guide.pairings.filter((note) => applies(note.whenAll));
  const cautions = guide.cautions.filter((note) => applies(note.whenAll));

  const pickers = guide.products
    .slice()
    .sort((a, b) => a.stepOrder - b.stepOrder || a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-sans text-sm uppercase tracking-caps text-ink-muted">Your products</h2>
        <p className="mt-1 font-serif text-sm text-ink-muted">
          Select the Amelya&rsquo;s products you have — we&rsquo;ll arrange them into a morning and
          evening routine.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {pickers.map((product) => {
            const on = selected.has(product.id);
            return (
              <button
                key={product.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(product.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-pill border px-4 py-2 font-sans text-sm tracking-wide transition-colors focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  on
                    ? "border-gold bg-gold text-cream-soft hover:bg-gold-deep"
                    : "border-gold/50 bg-transparent text-gold-deep hover:bg-gold/10",
                )}
              >
                {on && <Check className="size-3.5" aria-hidden />}
                {product.name}
              </button>
            );
          })}
        </div>
      </div>

      {chosen.length === 0 ? (
        <div className="rounded-md border border-dashed border-line bg-panel/60 p-10 text-center">
          <p className="font-serif text-base text-ink-muted">
            Pick the products you have to see your AM &amp; PM routine.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <RoutineColumn title="Morning" subtitle="Lightest to richest, finishing with sunscreen." items={am} />
          <RoutineColumn title="Evening" subtitle="Lightest to richest, finishing with a facial oil." items={pm} />
        </div>
      )}

      {chosen.length > 0 && (pairings.length > 0 || cautions.length > 0) && (
        <div className="grid gap-5 md:grid-cols-2">
          {pairings.length > 0 && (
            <div className="rounded-md border border-line bg-cream-soft p-6">
              <h3 className="font-sans text-sm uppercase tracking-caps text-gold-deep">Good to know</h3>
              <ul className="mt-3 flex flex-col gap-2.5">
                {pairings.map((note) => (
                  <li key={note.text} className="font-serif text-sm leading-relaxed text-ink">
                    {note.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {cautions.length > 0 && (
            <div className="rounded-md border border-stock-low-bg bg-stock-low-bg/40 p-6">
              <h3 className="font-sans text-sm uppercase tracking-caps text-stock-low-fg">Take care</h3>
              <ul className="mt-3 flex flex-col gap-2.5">
                {cautions.map((note) => (
                  <li key={note.text} className="font-serif text-sm leading-relaxed text-ink">
                    {note.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="border-t border-line pt-5 font-sans text-xs leading-relaxed text-ink-muted">
        {guide.disclaimer}
      </p>
    </div>
  );
}
