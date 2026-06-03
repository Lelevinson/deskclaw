import Link from "next/link";

import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

// Planned storefront IA (DESIGN.md §5.1). "Shop", "Orders" (Phase 4), and "Cart"
// (Phase 3) are live; the later-phase surfaces stay muted + inert so the nav reads
// complete and honest without dead links/404s. The Cart label carries a live count
// (DESIGN §5.1).
const NAV: { label: string; href?: string }[] = [
  { label: "Shop", href: "/" },
  { label: "Routines" },
  { label: "Orders", href: "/orders" },
  { label: "Returns" },
  { label: "Cart", href: "/cart" },
];

function ShoppingAsBar({ customerName }: { customerName: string }) {
  return (
    <div className="bg-sage text-cream-soft">
      <div className="mx-auto max-w-content px-7 py-2 text-center font-sans text-xs tracking-wide">
        Shopping as{" "}
        <span className="font-medium text-gold-light">{customerName}</span> — your
        cart, orders &amp; returns are private to you
      </div>
    </div>
  );
}

function Header({ cartCount }: { cartCount: number }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-cream-soft/95 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between px-7 py-4">
        <Logo />
        <nav className="flex items-center gap-6">
          {NAV.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="font-sans text-sm tracking-wide text-ink transition-colors hover:text-gold-deep"
              >
                {item.label === "Cart" && cartCount > 0 ? (
                  <>
                    Cart
                    <span className="ml-1 tabular-nums text-gold-deep">({cartCount})</span>
                  </>
                ) : (
                  item.label
                )}
              </Link>
            ) : (
              <span
                key={item.label}
                aria-disabled
                title="Coming soon in this demo"
                className="hidden cursor-default font-sans text-sm tracking-wide text-ink-muted/60 sm:inline"
              >
                {item.label}
              </span>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 bg-sage text-cream-soft">
      <div className="mx-auto flex max-w-content flex-col gap-6 px-7 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-display text-lg tracking-wordmark">Amelya&rsquo;s</span>
          <p className="max-w-xs font-serif text-base text-cream-soft/80">
            A companion to the assistant — the same shop, quietly browsable.
          </p>
        </div>
        <p className="font-sans text-xs leading-relaxed tracking-wide text-cream-soft/70 sm:text-right">
          No checkout in this demo
          <br />
          Prices in NT$ · shared backend
        </p>
      </div>
    </footer>
  );
}

export function AppShell({
  customerName,
  cartCount,
  children,
}: {
  customerName: string;
  cartCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-h-screen flex-col")}>
      <ShoppingAsBar customerName={customerName} />
      <Header cartCount={cartCount} />
      <main className="mx-auto w-full max-w-content flex-1 px-7">{children}</main>
      <Footer />
    </div>
  );
}
