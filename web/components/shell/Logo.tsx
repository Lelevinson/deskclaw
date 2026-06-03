import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

// Primary lockup (DESIGN.md §1): emblem + AMELYA'S wordmark in Cinzel, tracking
// .16em, no tagline. The detailed emblem is the ~835KB web export — optimizing
// it + a proper small-mark favicon are deferred to a later phase (DESIGN §8).
export function Logo({
  className,
  emblemSize = 40,
}: {
  className?: string;
  emblemSize?: number;
}) {
  return (
    <Link
      href="/"
      aria-label="Amelya's — home"
      className={cn("inline-flex items-center gap-3", className)}
    >
      <Image
        src="/amelya-emblem.png"
        alt=""
        width={emblemSize}
        height={emblemSize}
        priority
        className="h-auto w-auto"
        style={{ height: emblemSize, width: "auto" }}
      />
      <span className="font-display text-xl tracking-wordmark text-ink">
        Amelya&rsquo;s
      </span>
    </Link>
  );
}
