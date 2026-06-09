import "server-only";

// The storefront's single data-access seam onto the existing shop backend.
//
// NON-NEGOTIABLE (roadmap §3, DESIGN.md §7): the browser never touches data/ or
// the JSON store. Only server components / route handlers / server actions import
// this module, and it calls the SAME typed src/shop service functions the MCP
// tools wrap — so identity gating, ownership checks, and audit logging are the
// one real code path, not a parallel reimplementation. New customer-visible
// domains add one typed function here + one route, never a rewrite.
//
// IDENTITY: comes from the logged-in session (getIdentity → a "web"-channel
// username). These getters degrade quietly to empty when there is NO session, so
// they are safe to call during the layout render (header) on public pages; the
// gated routes (cart/orders/returns) call requireIdentity() at the top to redirect
// a logged-out visitor to /login.
import { cache } from "react";

import {
  getAccountProfileForChannel,
  getCartForChannel,
  getOrderForChannel,
  getProductById,
  getReturnForChannel,
  listOrdersForChannel,
  listProducts,
  listReturnsForChannel,
  lookupCustomerByChannel,
} from "@shop/service.js";
import type {
  CartView,
  OrderSummary,
  OrderView,
  Product,
  ReturnRequest,
} from "@shop/types.js";

import { getIdentity } from "./identity";

export type { CartView, OrderSummary, OrderView, Product, ReturnRequest };

// An empty cart used when there is no session (the cart page redirects logged-out
// visitors, but the header badge reads via the layout on public pages too).
const EMPTY_CART: CartView = { customerId: "", items: [], totalNtd: 0 };

// The logged-in customer's display name for the "Shopping as …" indicator
// (DESIGN.md §5.1). Null when logged out, so the header shows a "Sign in" link.
export async function getCurrentCustomerName(): Promise<string | null> {
  const id = await getIdentity();
  if (!id) return null;
  const result = await lookupCustomerByChannel(id.channel, id.externalUserId);
  return result.ok && result.data ? result.data.displayName : null;
}

// The logged-in customer's own account profile (surface: /account). Null when
// logged out (the page itself gates via requireIdentity). `accountCode` is the
// code the owner reads off to link this account on another channel (chat).
export interface AccountProfile {
  displayName: string;
  username: string;
  accountCode: string | null;
}

export async function getAccountProfile(): Promise<AccountProfile | null> {
  const id = await getIdentity();
  if (!id) return null;
  const result = await getAccountProfileForChannel(id.channel, id.externalUserId);
  if (!result.ok || !result.data) return null;
  return {
    displayName: result.data.displayName,
    username: id.externalUserId,
    accountCode: result.data.accountCode ?? null,
  };
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

// The logged-in customer's own cart (surface 4) — identity-gated, own-cart-only
// via the same channel binding the chat skills use. Degrades to an empty cart
// when logged out rather than throwing in render. Cart MUTATIONS live in
// ./cart-actions (server actions). Wrapped in React cache() so a render's reads
// dedupe (the header badge + the page body collapse to one shop-DB read).
export const getCart = cache(async (): Promise<CartView> => {
  const id = await getIdentity();
  if (!id) return EMPTY_CART;
  const result = await getCartForChannel(id.channel, id.externalUserId);
  return result.ok && result.data ? result.data : EMPTY_CART;
});

// Total item count (sum of quantities) — the single source of the "N items"
// rule, shared by the header "Cart(n)" badge and the cart page heading so they
// can never disagree.
export function countCartItems(cart: CartView): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

// Item count for the header "Cart(n)" badge (0 when logged out).
export async function getCartCount(): Promise<number> {
  return countCartItems(await getCart());
}

// The logged-in customer's own order history (surface 5, DESIGN.md §5.5) —
// identity-gated, own-orders-only. Empty when logged out. cache()-deduped.
export const getOrders = cache(async (): Promise<OrderSummary[]> => {
  const id = await getIdentity();
  if (!id) return [];
  const result = await listOrdersForChannel(id.channel, id.externalUserId);
  return result.ok && result.data ? result.data : [];
});

// One order for the order-detail / tracking view (surface 5). Returns null for an
// unknown OR non-owned id (or when logged out) so the route renders the neutral
// 404 — findOwnedOrder makes unknown/non-owned indistinguishable, so the id never
// leaks existence or acts as proof of ownership (DESIGN.md §5.5/§5.7, roadmap §3).
export async function getOrder(orderId: string): Promise<OrderView | null> {
  const id = await getIdentity();
  if (!id) return null;
  const result = await getOrderForChannel(id.channel, id.externalUserId, orderId);
  return result.ok && result.data ? result.data : null;
}

// The logged-in customer's own returns (surface 6, DESIGN.md §5.6) —
// identity-gated, own-returns-only, newest first. Read-only: a return is a
// *request* the chat returns-actions skill creates; the storefront never opens or
// refunds one (ARCHITECTURE §5; DESIGN §5.6). Empty when logged out. cache()-deduped.
export const getReturns = cache(async (): Promise<ReturnRequest[]> => {
  const id = await getIdentity();
  if (!id) return [];
  const result = await listReturnsForChannel(id.channel, id.externalUserId);
  return result.ok && result.data ? result.data : [];
});

// One return for the return-detail view (surface 6). Returns null for an unknown
// OR non-owned id (or when logged out) so the route renders the neutral 404 —
// identical refusal to getOrder (DESIGN.md §5.6/§5.7, roadmap §3).
export async function getReturn(returnId: string): Promise<ReturnRequest | null> {
  const id = await getIdentity();
  if (!id) return null;
  const result = await getReturnForChannel(id.channel, id.externalUserId, returnId);
  return result.ok && result.data ? result.data : null;
}
