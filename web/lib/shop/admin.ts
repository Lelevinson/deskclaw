import "server-only";

// Admin/staff reads for the /admin panel — the OPS-WIDE counterparts of the
// customer reads in ./index.ts. These are NOT per-customer own-only: an admin works
// every customer's handoffs/orders and all stock. Access is gated by requireAdmin()
// in web/app/admin/layout.tsx (and again in the server actions in ./admin-actions),
// so these reads assume the caller is already an authenticated admin. They call the
// SAME typed src/shop ops functions the ops-digest agent uses — one real code path.
import {
  getHandoffOps,
  getOrderOps,
  listHandoffs,
  listLowStockProducts,
  listOrdersOps,
  listProducts,
} from "@shop/service.js";
import type { HandoffRecord, OrderStatus, OrderSummary, OrderView, Product } from "@shop/types.js";

export type { HandoffRecord, OrderStatus, OrderSummary, OrderView, Product };

// A handoff is "unresolved" (needs a human) until it is resolved or closed. Mirrors
// the ops-digest's "open handoffs" line.
export function isUnresolved(handoff: HandoffRecord): boolean {
  return handoff.status !== "resolved" && handoff.status !== "closed";
}

// How long an order may sit in `processing` before the digest/admin flag it as stuck.
export const STUCK_ORDER_DAYS = 2;

export async function getAdminHandoffs(): Promise<HandoffRecord[]> {
  const result = await listHandoffs(undefined, 100);
  return result.ok && result.data ? result.data : [];
}

export async function getAdminHandoff(id: string): Promise<HandoffRecord | null> {
  const result = await getHandoffOps(id);
  return result.ok && result.data ? result.data : null;
}

// Orders across all customers, optionally filtered by status and/or aging. With no
// options it returns every order, newest-updated first.
export async function getAdminOrders(options?: {
  status?: OrderStatus;
  stalerThanDays?: number;
}): Promise<OrderSummary[]> {
  const result = await listOrdersOps(options);
  return result.ok && result.data ? result.data : [];
}

// Orders stuck in processing (the digest's "stuck orders" line).
export async function getStuckOrders(): Promise<OrderSummary[]> {
  return getAdminOrders({ status: "processing", stalerThanDays: STUCK_ORDER_DAYS });
}

export async function getAdminOrder(id: string): Promise<OrderView | null> {
  const result = await getOrderOps(id);
  return result.ok && result.data ? result.data : null;
}

// Every product, scarcest first, so the stock page leads with what needs restocking.
export async function getAdminProducts(): Promise<Product[]> {
  const result = await listProducts();
  const products = result.ok && result.data ? result.data : [];
  return [...products].sort((a, b) => a.stockQuantity - b.stockQuantity);
}

// Just the at/under-threshold products (the digest's "low stock" line).
export async function getLowStockProducts(): Promise<Product[]> {
  const result = await listLowStockProducts();
  return result.ok && result.data ? result.data : [];
}
