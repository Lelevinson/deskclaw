import Link from "next/link";

import { requireAdmin } from "@/lib/auth/session";

// The /admin subtree gate. requireAdmin() runs once here for every admin route:
// a logged-out / unresolvable session bounces to /login, a logged-in NON-admin is
// sent to the storefront home. The middleware /admin matcher is only a cookie-
// presence prepass; THIS is the authoritative role check (server-side).
const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Handoffs", href: "/admin/handoffs" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Stock", href: "/admin/stock" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="py-10">
      <div className="flex flex-col gap-1 border-b border-line pb-5">
        <span className="font-sans text-xs uppercase tracking-caps text-gold-deep">
          Staff · operations
        </span>
        <h1 className="font-display text-3xl text-ink">Admin</h1>
      </div>

      <nav aria-label="Admin" className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-sm font-sans text-sm tracking-wide text-ink-muted transition-colors hover:text-gold-deep focus-visible:text-gold-deep focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
