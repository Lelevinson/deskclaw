import "server-only";

// The storefront's single data-access seam onto the existing shop backend.
//
// NON-NEGOTIABLE (roadmap §3, DESIGN.md §7): the browser never touches data/ or
// the JSON store. Only server components / route handlers / server actions import
// this module, and it calls the SAME typed src/shop service functions the MCP
// tools wrap — so identity gating, ownership checks, and audit logging are the
// one real code path, not a parallel reimplementation. New customer-visible
// domains add one typed function here + one route, never a rewrite.
import { cache } from "react";

import {
  getCartForChannel,
  getOrderForChannel,
  getProductById,
  listOrdersForChannel,
  listProducts,
  lookupCustomerByChannel,
} from "@shop/service.js";
import type { CartView, OrderSummary, OrderView, Product } from "@shop/types.js";

import { DEMO_IDENTITY } from "./identity";

export type { CartView, OrderSummary, OrderView, Product };

// An empty cart for the demo customer — used when the service can't resolve one
// (it never should, but reads must degrade quietly rather than throw in render).
const EMPTY_CART: CartView = { customerId: "", items: [], totalNtd: 0 };

// Resolve the pre-linked demo customer's display name for the "Shopping as …"
// indicator (DESIGN.md §5.1). Falls back gracefully if the link is ever missing.
export async function getDemoCustomerName(): Promise<string> {
  const result = await lookupCustomerByChannel(
    DEMO_IDENTITY.channel,
    DEMO_IDENTITY.externalUserId,
  );
  return result.ok && result.data ? result.data.displayName : "Guest";
}

// Full catalogue for the catalogue grid (surface 2) — public, browse-only.
export async function getCatalogue(): Promise<Product[]> {
  const result = await listProducts();
  return result.ok && result.data ? result.data : [];
}

// One product for the PDP (surface 3). Returns null for an unknown id so the
// route can render a neutral 404 — no id echo, no existence leak.
export async function getProduct(id: string): Promise<Product | null> {
  const result = await getProductById(id);
  return result.ok && result.data ? result.data : null;
}

// The demo customer's own cart (surface 4) — identity-gated, own-cart-only via
// the same channel binding the chat skills use. Degrades to an empty cart rather
// than throwing in render. Cart MUTATIONS live in ./cart-actions (server actions).
//
// Wrapped in React cache() so the per-request reads dedupe: a cart-page render
// otherwise reads the shop DB once for the header badge (getCartCount, in the
// layout) and again for the page body — cache() collapses them to one read.
export const getCart = cache(async (): Promise<CartView> => {
  const result = await getCartForChannel(
    DEMO_IDENTITY.channel,
    DEMO_IDENTITY.externalUserId,
  );
  return result.ok && result.data ? result.data : EMPTY_CART;
});

// Total item count (sum of quantities) — the single source of the "N items"
// rule, shared by the header "Cart(n)" badge and the cart page heading so they
// can never disagree.
export function countCartItems(cart: CartView): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

// Item count for the header "Cart(n)" badge.
export async function getCartCount(): Promise<number> {
  return countCartItems(await getCart());
}

// The demo customer's own order history (surface 5, DESIGN.md §5.5) —
// identity-gated, own-orders-only via the same channel binding the chat skills
// use (listOrdersForChannel resolves the link then filters to the customer's own
// orders). Degrades to an empty list rather than throwing in render. Wrapped in
// cache() so a single render's reads dedupe (same reasoning as getCart).
export const getOrders = cache(async (): Promise<OrderSummary[]> => {
  const result = await listOrdersForChannel(
    DEMO_IDENTITY.channel,
    DEMO_IDENTITY.externalUserId,
  );
  return result.ok && result.data ? result.data : [];
});

// One order for the order-detail / tracking view (surface 5). Returns null for an
// unknown OR non-owned id so the route renders the neutral 404 — the service's
// findOwnedOrder makes the two indistinguishable, so the id never leaks existence
// or acts as proof of ownership (DESIGN.md §5.5/§5.7, roadmap §3).
export async function getOrder(orderId: string): Promise<OrderView | null> {
  const result = await getOrderForChannel(
    DEMO_IDENTITY.channel,
    DEMO_IDENTITY.externalUserId,
    orderId,
  );
  return result.ok && result.data ? result.data : null;
}
