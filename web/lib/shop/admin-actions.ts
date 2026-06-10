"use server";

// Admin/staff MUTATIONS for the /admin panel. Unlike the customer cart actions
// (preview→confirm, where the click stands in for consent), these are DIRECT staff
// writes: the admin is the human authority working the queue, so there is no
// pending-action dance. Each underlying src/shop fn still writes an audit log, so
// every staff action is recorded. NONE of these move money (no refund/charge/cancel).
//
// Every action re-checks requireAdmin() itself — a "use server" action is a callable
// endpoint, so it must not trust that the page layout gated the caller.
import { revalidatePath } from "next/cache";

import {
  adjustProductStock,
  advanceOrderStatus,
  resolveHandoffStatus,
} from "@shop/service.js";
import type { HandoffStatus, OrderStatus } from "@shop/types.js";

import { requireAdmin } from "../auth/session";

export interface AdminActionResult {
  ok: boolean;
  error?: string;
}

export async function resolveHandoff(
  handoffId: string,
  status: HandoffStatus,
  note?: string,
): Promise<AdminActionResult> {
  await requireAdmin();
  const result = await resolveHandoffStatus(handoffId, status, note);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/admin/handoffs");
  revalidatePath(`/admin/handoffs/${handoffId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function advanceOrder(
  orderId: string,
  status: OrderStatus,
  shipping?: { carrier?: string; trackingNumber?: string },
): Promise<AdminActionResult> {
  await requireAdmin();
  const result = await advanceOrderStatus(orderId, status, shipping);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function restockProduct(
  productId: string,
  quantity: number,
  reason?: string,
): Promise<AdminActionResult> {
  await requireAdmin();
  const result = await adjustProductStock(productId, quantity, reason);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/admin/stock");
  revalidatePath("/admin");
  return { ok: true };
}
