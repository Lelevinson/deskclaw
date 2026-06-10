"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import type { NavItem } from "./nav";

// Mobile nav (DESIGN §5.1). Below `md` the inline nav collides with the AMELYA'S
// wordmark, so the links collapse behind a hamburger toggle. A live `cartCount`
// rides the Cart row; the muted "coming soon" items (no href) render disabled,
// matching the honest desktop treatment. Closes on route change, on Escape, and
// on any link tap; the toggle carries aria-expanded/-controls for assistive tech.
export function MobileNav({
  items,
  cartCount,
  customerName,
  isAdmin = false,
}: {
  items: NavItem[];
  cartCount: number;
  customerName: string | null;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Collapse whenever the route changes (covers taps that navigate to a NEW
  // route). Taps on the current-route link don't change `pathname`, so the links
  // also close `open` directly via onClick below — together they honor "closes on
  // any link tap" even when the destination is the page we're already on.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes the menu while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Reconcile state when the viewport crosses into the desktop layout: the menu
  // is only `md:hidden` via CSS, so a left-open `open` would silently re-expand
  // on the way back down. Reset it the moment we reach >=md.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const reset = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setOpen(false);
    };
    reset(mq);
    mq.addEventListener("change", reset);
    return () => mq.removeEventListener("change", reset);
  }, []);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:text-gold-deep focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream-soft"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <nav
          id="mobile-nav-menu"
          aria-label="Main"
          className="absolute inset-x-0 top-full border-b border-line bg-cream-soft shadow-elev-md"
        >
          <ul className="mx-auto flex max-w-content flex-col px-7 py-2">
            {items.map((item) =>
              item.href ? (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between border-b border-line/60 py-3.5 font-sans text-sm tracking-wide text-ink transition-colors last:border-b-0 hover:text-gold-deep focus-visible:text-gold-deep focus-visible:outline-none"
                  >
                    {item.label}
                    {item.label === "Cart" && cartCount > 0 && (
                      <span className="tabular-nums text-gold-deep">({cartCount})</span>
                    )}
                  </Link>
                </li>
              ) : (
                <li key={item.label}>
                  <span
                    aria-disabled
                    className="flex items-center justify-between border-b border-line/60 py-3.5 font-sans text-sm tracking-wide text-ink-muted/60 last:border-b-0"
                  >
                    {item.label}
                    <span className="font-sans text-xs tracking-wide text-ink-muted/50">
                      Coming soon
                    </span>
                  </span>
                </li>
              ),
            )}

            {/* Staff-only admin entry, mirroring the desktop header (admin sessions
                only; the routes are guarded by requireAdmin regardless). */}
            {isAdmin && (
              <li>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center border-b border-line/60 py-3.5 font-sans text-sm tracking-wide text-gold-deep transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none"
                >
                  Admin
                </Link>
              </li>
            )}

            {/* Account control mirrors the desktop header: the profile link when
                signed in, sign in / register when not. */}
            {customerName ? (
              <li>
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between border-b border-line/60 py-3.5 font-sans text-sm tracking-wide text-ink transition-colors last:border-b-0 hover:text-gold-deep focus-visible:text-gold-deep focus-visible:outline-none"
                >
                  Account
                  <span className="font-sans text-xs tracking-wide text-ink-muted">{customerName}</span>
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center border-b border-line/60 py-3.5 font-sans text-sm tracking-wide text-ink transition-colors hover:text-gold-deep focus-visible:text-gold-deep focus-visible:outline-none"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="flex items-center border-b border-line/60 py-3.5 font-sans text-sm tracking-wide text-ink transition-colors last:border-b-0 hover:text-gold-deep focus-visible:text-gold-deep focus-visible:outline-none"
                  >
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}
    </div>
  );
}
