"use server";

// Cart MUTATIONS — the storefront's only writes (DESIGN.md §7, roadmap §3/§8).
//
// THE UI CONFIRM-vs-AUDIT RESOLUTION (the open question handed to this phase):
// the chat pipeline is identity → preview → explicit confirm → execute → audit,
// where "confirm" exists to stop the *model* from acting without the customer's
// consent. In the storefront there is no untrusted model intermediary — the
// customer's own deliberate click IS the consent (DESIGN.md §5.4). So each action
// reuses the SAME src/shop path the chat tools use, calling preview then confirm
// back-to-back. That is deliberately NOT a parallel write path: identity gating,
// ownership checks, stock re-validation, AND BOTH audit-log writes (the `*.preview`
// entry and the success entry) fire exactly as in chat. The audit log is never
// dropped. The destructive `remove` additionally gets an explicit "Remove?" confirm
// affordance in the UI (CartLineItem) standing in for the chat confirm beat —
// without a heavy modal for the lighter qty steps.
//
// We confirm by the EXACT pending-action id the preview returned (not "confirm the
// latest pending"), so a concurrent action on the same shared store — another tab,
// or the chat agent for the same demo customer — can't make this confirm commit a
// different staged action.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  confirmAddItemForChannel,
  confirmCheckoutForChannel,
  confirmRemoveItemForChannel,
  confirmUpdateQuantityForChannel,
  previewAddItemForChannel,
  previewCheckoutForChannel,
  previewRemoveItemForChannel,
  previewUpdateQuantityForChannel,
} from "@shop/service.js";
import type { ServiceResult } from "@shop/service.js";
import type { PendingAction } from "@shop/types.js";

import { requireIdentity } from "./identity";

export interface CartActionResult {
  ok: boolean;
  error?: string;
}

// Refresh both the cart page and the layout (header "Cart(n)" badge) after any
// successful mutation so server-rendered counts/lines stay in sync.
function revalidateCart(): void {
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

// Shared preview→confirm→audit dance for all three cart mutations. The preview
// stages a pending action (and writes its `*.preview` audit row); we then confirm
// THAT action by id (writing the success/failed audit row). A preview failure
// (validation / stock / ownership) is surfaced without ever confirming; a confirm
// failure (e.g. stock dropped between the two reads) wins over the preview's ok.
async function runAuditedMutation(
  preview: () => Promise<ServiceResult<{ pendingAction: PendingAction }>>,
  confirmById: (pendingActionId: string) => Promise<ServiceResult<unknown>>,
): Promise<CartActionResult> {
  const previewed = await preview();
  if (!previewed.ok || !previewed.data) {
    return { ok: false, error: previewed.error ?? "Could not stage the cart update." };
  }

  const confirmed = await confirmById(previewed.data.pendingAction.id);
  if (!confirmed.ok) return { ok: false, error: confirmed.error };

  revalidateCart();
  return { ok: true };
}

export async function addToCart(
  productId: string,
  quantity: number,
): Promise<CartActionResult> {
  const { channel, externalUserId } = await requireIdentity();
  return runAuditedMutation(
    () => previewAddItemForChannel(channel, externalUserId, productId, quantity),
    (id) => confirmAddItemForChannel(channel, externalUserId, id),
  );
}

export async function updateCartQuantity(
  productId: string,
  quantity: number,
): Promise<CartActionResult> {
  const { channel, externalUserId } = await requireIdentity();
  return runAuditedMutation(
    () => previewUpdateQuantityForChannel(channel, externalUserId, productId, quantity),
    (id) => confirmUpdateQuantityForChannel(channel, externalUserId, id),
  );
}

export async function removeFromCart(productId: string): Promise<CartActionResult> {
  const { channel, externalUserId } = await requireIdentity();
  return runAuditedMutation(
    () => previewRemoveItemForChannel(channel, externalUserId, productId),
    (id) => confirmRemoveItemForChannel(channel, externalUserId, id),
  );
}

// Mock checkout: turn the cart into an order (no payment). Like the cart actions,
// the deliberate click is the consent, and it reuses the same preview→confirm
// audited path. On success it redirects to the new order; on failure (empty cart /
// stock) it returns the error to show inline.
export async function checkout(): Promise<CartActionResult> {
  const { channel, externalUserId } = await requireIdentity();

  const previewed = await previewCheckoutForChannel(channel, externalUserId);
  if (!previewed.ok) return { ok: false, error: previewed.error };

  const placed = await confirmCheckoutForChannel(channel, externalUserId);
  if (!placed.ok || !placed.data) {
    return { ok: false, error: placed.error ?? "Could not place your order." };
  }

  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/", "layout");
  redirect(`/orders/${placed.data.order.id}`);
}
