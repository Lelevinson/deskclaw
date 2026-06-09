import Link from "next/link";
import { User } from "lucide-react";

import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { NAV } from "./nav";

// The header account control (DESIGN §5.1). Logged in: a person icon + the
// customer's name linking to /account (where the profile + Sign out live). Logged
// out: a "Sign in" link. This replaced the old sage "Shopping as …" banner.
function AccountControl({ customerName }: { customerName: string | null }) {
  if (!customerName) {
    return (
      <Link
        href="/login"
        className="rounded-sm font-sans text-sm tracking-wide text-ink transition-colors hover:text-gold-deep focus-visible:text-gold-deep focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-cream-soft"
      >
        Sign in
      </Link>
    );
  }
  return (
    <Link
      href="/account"
      aria-label={`Account — signed in as ${customerName}`}
      className="flex items-center gap-1.5 rounded-sm font-sans text-sm tracking-wide text-ink transition-colors hover:text-gold-deep focus-visible:text-gold-deep focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-cream-soft"
    >
      <User className="size-4 text-gold-deep" aria-hidden />
      {customerName}
    </Link>
  );
}

function Header({
  customerName,
  cartCount,
}: {
  customerName: string | null;
  cartCount: number;
}) {
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

          {/* Account control sits after the surfaces, set off by a hairline. */}
          <span aria-hidden className="h-4 w-px bg-line" />
          <AccountControl customerName={customerName} />
        </nav>

        <MobileNav items={NAV} cartCount={cartCount} customerName={customerName} />
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
          Mock checkout · no payment taken
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
  customerName: string | null;
  cartCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header customerName={customerName} cartCount={cartCount} />
      <main className="mx-auto w-full max-w-content flex-1 px-7">{children}</main>
      <Footer />
    </div>
  );
}
