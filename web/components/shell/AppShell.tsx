import Link from "next/link";

import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { NAV } from "./nav";

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
      <div className="relative mx-auto flex max-w-content items-center justify-between px-7 py-4">
        <Logo />

        {/* Desktop inline nav — collapses to the hamburger below md, where it
            would otherwise crowd the AMELYA'S wordmark (the known overlap). */}
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {NAV.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-sm font-sans text-sm tracking-wide text-ink transition-colors hover:text-gold-deep focus-visible:text-gold-deep focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-cream-soft"
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
                className="cursor-default font-sans text-sm tracking-wide text-ink-muted/60"
              >
                {item.label}
              </span>
            ),
          )}
        </nav>

        <MobileNav items={NAV} cartCount={cartCount} />
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
    <div className="flex min-h-screen flex-col">
      <ShoppingAsBar customerName={customerName} />
      <Header cartCount={cartCount} />
      <main className="mx-auto w-full max-w-content flex-1 px-7">{children}</main>
      <Footer />
    </div>
  );
}
