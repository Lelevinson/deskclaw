import Link from "next/link";

import { getAdminHandoffs, getLowStockProducts, getStuckOrders, isUnresolved } from "@/lib/shop/admin";

// Admin dashboard — the three queues the agent surfaces but never acts on, mirroring
// the proactive ops-digest email (open handoffs · stuck orders · low stock). Live,
// shared state: never statically cache it.
export const dynamic = "force-dynamic";

function StatCard({
  label,
  count,
  href,
  hint,
}: {
  label: string;
  count: number;
  href: string;
  hint: string;
}) {
  const needsAttention = count > 0;
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-lg border border-line bg-panel p-6 shadow-elev-sm transition-colors hover:bg-cream-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <span className="font-sans text-xs uppercase tracking-caps text-ink-muted">{label}</span>
      <span
        className={`font-display text-4xl tabular-nums ${needsAttention ? "text-gold-deep" : "text-ink-muted"}`}
      >
        {count}
      </span>
      <span className="font-serif text-sm text-ink-muted">{hint}</span>
      <span className="mt-2 font-sans text-sm tracking-wide text-gold-deep">View →</span>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const [handoffs, stuckOrders, lowStock] = await Promise.all([
    getAdminHandoffs(),
    getStuckOrders(),
    getLowStockProducts(),
  ]);
  const openHandoffs = handoffs.filter(isUnresolved).length;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Open handoffs"
        count={openHandoffs}
        href="/admin/handoffs"
        hint="Escalations awaiting a human."
      />
      <StatCard
        label="Stuck orders"
        count={stuckOrders.length}
        href="/admin/orders"
        hint="In processing for 2+ days."
      />
      <StatCard
        label="Low stock"
        count={lowStock.length}
        href="/admin/stock"
        hint="At or under the restock threshold."
      />
    </div>
  );
}
