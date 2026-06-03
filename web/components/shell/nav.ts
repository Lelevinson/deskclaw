// Storefront IA (DESIGN.md §5.1), shared by the desktop nav (AppShell) and the
// MobileNav collapse. "Shop", "Orders", "Returns", and "Cart" are live surfaces;
// any later-phase surface with no href stays muted + inert so the nav reads
// complete and honest without dead links/404s. The Cart label carries a live count.
export type NavItem = { label: string; href?: string };

export const NAV: NavItem[] = [
  { label: "Shop", href: "/" },
  { label: "Routines" },
  { label: "Orders", href: "/orders" },
  { label: "Returns", href: "/returns" },
  { label: "Cart", href: "/cart" },
];
