/**
 * Tool-level eval harness for the DeskClaw shop service.
 *
 * Deterministic, no model in the loop: it drives the `src/shop` service
 * functions directly and asserts the safety-critical guarantees the roadmap
 * names (identity gating, ownership proof, preview->confirm, expiry, refusals,
 * audit logging) across all three cart PendingAction types, the read-only
 * order-status and returns-intake flows, and the append-only handoff records
 * (which deliberately depart: optional identity, no preview/confirm).
 *
 * Each test resets the DB from the `data/` baseline first, so tests are
 * order-independent. The harness runs against a temp sandbox DB (see below), so
 * it never touches `.local/shop-db.json` and is safe to run during a live
 * OpenClaw session. It is a tiny custom runner (no framework, no new deps):
 * every assertion is named, failures do not stop the run, and the process exits
 * non-zero if any test fails.
 */
import { rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  confirmAddItemForChannel,
  confirmCheckoutForChannel,
  confirmCreateReturnForChannel,
  confirmLatestAddItemForChannel,
  confirmLatestRemoveItemForChannel,
  confirmLatestUpdateQuantityForChannel,
  confirmRemoveItemForChannel,
  confirmUpdateQuantityForChannel,
  createHandoff,
  getCartForChannel,
  getOrderForChannel,
  getReturnForChannel,
  getRoutineGuide,
  listActionLogs,
  listHandoffs,
  listLowStockProducts,
  listOrdersForChannel,
  listOrdersOps,
  linkExistingAccountForChannel,
  listReturnsForChannel,
  lookupCustomerByChannel,
  previewAddItemForChannel,
  previewCheckoutForChannel,
  previewCreateReturnForChannel,
  previewRemoveItemForChannel,
  previewUpdateQuantityForChannel,
  registerNewCustomerForChannel,
  registerWebAccount,
  searchProducts,
  verifyWebCredential
} from "../shop/service.js";
import { notifyOwner } from "../shop/notify.js";
import type { EmailMessage, EmailTransport } from "../shop/notify.js";
import { getShopDbPath, readShopDb, resetShopDb, writeShopDb } from "../shop/store.js";
import type { ShopDatabase } from "../shop/types.js";

// Sandbox the harness onto a temp DB so a run never clobbers a developer's live
// OpenClaw session state in .local/shop-db.json. The store reads this env var on
// every call, so setting it before any service function runs is sufficient.
process.env.DESKCLAW_SHOP_DB_PATH = path.join(os.tmpdir(), `deskclaw-shop-eval-${process.pid}.json`);

// --- the linked demo customer (from the data/ baseline) ---
const CH = "simulated-chat";
const LIN = "demo-lin"; // -> customer-demo-lin via link-demo-lin-simulated-chat
const LIN_CUSTOMER = "customer-demo-lin";
const LIN_WHATSAPP_LINK = "link-demo-lin-whatsapp";
const LIN_WHATSAPP_EXTERNAL = "+886900000001";
const LIN_ACCOUNT_CODE = "LIN-7421"; // demo verification code seeded on the demo customer

// --- a second customer injected into the runtime DB (never into data/) ---
const MALLORY_EXTERNAL = "eval-mallory";
const MALLORY_CUSTOMER = "customer-eval-mallory";
const MALLORY_LINK = "link-eval-mallory-simulated-chat";
const MALLORY_ORDER = "order-eval-mallory-0001";
const MALLORY_RETURN = "return-eval-mallory-0001";

// --- seeded fixtures owned by the demo customer (from the data/ baseline) ---
const LIN_SHIPPED_ORDER = "order-2026-0002"; // shipped, carries tracking fields
const LIN_DELIVERED_ORDER = "order-2026-0001"; // delivered -> eligible for a return
const LIN_SEEDED_RETURN = "return-2026-0001"; // refunded, against the delivered order
const LIN_SEEDED_HANDOFF = "handoff-2026-0001"; // resolved, owned by the demo customer

// --- tiny runner ---------------------------------------------------------
interface TestResult {
  name: string;
  ok: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/** Reset to the data/ baseline, then run one named test. Failures are recorded, not thrown. */
async function test(name: string, fn: () => Promise<void>): Promise<void> {
  await resetShopDb();
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  PASS  ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, ok: false, error: message });
    console.error(`  FAIL  ${name}\n          ${message}`);
  }
}

function group(title: string): void {
  console.log(`\n${title}`);
}

// --- fixture helpers (operate on the runtime DB, not data/) --------------
async function patchDb(mutate: (db: ShopDatabase) => void): Promise<void> {
  const db = await readShopDb();
  mutate(db);
  await writeShopDb(db);
}

/** Inject a second linked customer so we can test "confirm someone else's action". */
async function injectSecondCustomer(): Promise<void> {
  await patchDb((db) => {
    db.customers.push({ id: MALLORY_CUSTOMER, displayName: "Mallory Eval" });
    db.accountLinks.push({
      id: MALLORY_LINK,
      customerId: MALLORY_CUSTOMER,
      channel: CH,
      externalUserId: MALLORY_EXTERNAL,
      status: "linked",
      linkedAt: "2026-05-28T00:00:00.000Z"
    });
  });
}

/** Inject a second linked customer who owns one order, to test cross-customer order reads. */
async function injectSecondCustomerWithOrder(): Promise<void> {
  await injectSecondCustomer();
  await patchDb((db) => {
    db.orders.push({
      id: MALLORY_ORDER,
      customerId: MALLORY_CUSTOMER,
      status: "shipped",
      placedAt: "2026-05-25T00:00:00.000Z",
      updatedAt: "2026-05-26T00:00:00.000Z",
      items: [{ productId: "cloud-cleanser", quantity: 1, unitPriceNtd: 420 }],
      totalNtd: 420,
      shipping: { carrier: "Black Cat Express", trackingNumber: "TW000000000001" }
    });
  });
}

/** Inject a second linked customer who owns one delivered order and one return,
 *  to test cross-customer return reads and "open a return on someone else's order". */
async function injectSecondCustomerWithReturn(): Promise<void> {
  await injectSecondCustomer();
  await patchDb((db) => {
    db.orders.push({
      id: MALLORY_ORDER,
      customerId: MALLORY_CUSTOMER,
      status: "delivered",
      placedAt: "2026-05-20T00:00:00.000Z",
      updatedAt: "2026-05-23T00:00:00.000Z",
      items: [{ productId: "cloud-cleanser", quantity: 1, unitPriceNtd: 420 }],
      totalNtd: 420,
      shipping: { carrier: "Black Cat Express", trackingNumber: "TW000000000002" }
    });
    db.returns.push({
      // Terminal status on purpose: this fixture exists to test return-ownership
      // isolation, and a terminal return leaves Mallory's order free to open a new
      // one (so the "owner can open a return on her own order" check still holds).
      id: MALLORY_RETURN,
      customerId: MALLORY_CUSTOMER,
      orderId: MALLORY_ORDER,
      status: "refunded",
      resolution: "refund",
      reason: "Changed my mind.",
      createdAt: "2026-05-24T00:00:00.000Z",
      updatedAt: "2026-05-25T00:00:00.000Z"
    });
  });
}

/** Count the returns currently owned by the demo customer. */
async function returnCount(): Promise<number> {
  const list = await listReturnsForChannel(CH, LIN);
  assert(list.ok && list.data, "return list read should succeed");
  return list.data.length;
}

/** Count the escalation records currently in the DB (optionally for one customer). */
async function handoffCount(customerId?: string): Promise<number> {
  const list = await listHandoffs(customerId, 100);
  assert(list.ok && list.data, "handoff list read should succeed");
  return list.data.length;
}

/** Count the owner-notification records currently in the DB. */
async function notificationCount(): Promise<number> {
  const db = await readShopDb();
  return db.notifications.length;
}

/** A network-free email transport that records what it was asked to send, so the
 *  notify tests can assert the recipient + content without hitting Resend. */
function captureTransport(): { sent: EmailMessage[]; transport: EmailTransport } {
  const sent: EmailMessage[] = [];
  const transport: EmailTransport = async (msg) => {
    sent.push(msg);
    return { ok: true, providerId: "test_provider_id" };
  };
  return { sent, transport };
}

/** Add + confirm an item so a later remove/update has something to act on. */
async function seedCartItem(productId: string, quantity: number): Promise<void> {
  const preview = await previewAddItemForChannel(CH, LIN, productId, quantity);
  assert(preview.ok, preview.error ?? "seed preview should succeed");
  const confirm = await confirmLatestAddItemForChannel(CH, LIN, productId, quantity);
  assert(confirm.ok, confirm.error ?? "seed confirm should succeed");
}

async function cartItemCount(): Promise<number> {
  const cart = await getCartForChannel(CH, LIN);
  assert(cart.ok && cart.data, "cart read should succeed");
  return cart.data.items.length;
}

/** Count the orders the demo customer owns. */
async function orderCount(): Promise<number> {
  const list = await listOrdersForChannel(CH, LIN);
  assert(list.ok && list.data, "order list read should succeed");
  return list.data.length;
}

/** A product's current stock quantity, read straight from the runtime DB. */
async function productStock(productId: string): Promise<number> {
  const db = await readShopDb();
  const product = db.products.find((entry) => entry.id === productId);
  assert(product, `product ${productId} should exist`);
  return product.stockQuantity;
}

// --- tests ---------------------------------------------------------------
async function main(): Promise<void> {
  console.log("DeskClaw shop eval harness (tool layer)");

  group("Catalog search");

  await test("product search resolves customer wording to a product id", async () => {
    const search = await searchProducts("cloud cleanser", 3);
    assert(
      search.ok && search.data?.[0]?.product.id === "cloud-cleanser",
      "'cloud cleanser' should resolve to the cloud-cleanser product"
    );
    const noMatch = await searchProducts("qwerty", 3);
    assert(noMatch.ok && noMatch.data?.length === 0, "a non-matching query should return no products");
    const empty = await searchProducts("   ", 3);
    assert(!empty.ok, "an empty query should be refused");
  });

  group("Identity & ownership");

  await test("unlinked channel identity is refused", async () => {
    const lookup = await lookupCustomerByChannel(CH, "unknown-user");
    assert(!lookup.ok, "unknown channel identity must not resolve to a customer");
    const cart = await getCartForChannel(CH, "unknown-user");
    assert(!cart.ok, "unknown channel identity must not get cart access");
    const preview = await previewAddItemForChannel(CH, "unknown-user", "cloud-cleanser", 1);
    assert(!preview.ok, "unknown channel identity must not stage a mutation");
  });

  await test("revoked account link is refused", async () => {
    await patchDb((db) => {
      const link = db.accountLinks.find((entry) => entry.id === LIN_WHATSAPP_LINK);
      assert(link, "baseline must contain the whatsapp link to revoke");
      link.status = "revoked";
    });
    const lookup = await lookupCustomerByChannel("whatsapp", LIN_WHATSAPP_EXTERNAL);
    assert(!lookup.ok, "a revoked link must not resolve to a customer");
    const preview = await previewAddItemForChannel("whatsapp", LIN_WHATSAPP_EXTERNAL, "cloud-cleanser", 1);
    assert(!preview.ok, "a revoked link must not stage a mutation");
    // The same customer's still-linked channel must keep working.
    const stillLinked = await lookupCustomerByChannel(CH, LIN);
    assert(stillLinked.ok, "a different, still-linked channel for the same customer must still resolve");
  });

  await test("a typed customer id is not accepted as ownership proof", async () => {
    // Passing the internal customer id as the external channel id must NOT grant access.
    const cart = await getCartForChannel(CH, LIN_CUSTOMER);
    assert(!cart.ok, "typing a customer id as the external channel id must not grant cart access");
    const preview = await previewAddItemForChannel(CH, LIN_CUSTOMER, "cloud-cleanser", 1);
    assert(!preview.ok, "typing a customer id as the external channel id must not stage a mutation");
  });

  await test("confirming another customer's pending action is rejected", async () => {
    await injectSecondCustomer();
    const preview = await previewAddItemForChannel(CH, LIN, "cloud-cleanser", 1);
    assert(preview.ok && preview.data, preview.error ?? "owner preview should succeed");
    const pendingId = preview.data.pendingAction.id;

    // Mallory (a different, legitimately-linked customer) tries to confirm Lin's action.
    const hijack = await confirmAddItemForChannel(CH, MALLORY_EXTERNAL, pendingId);
    assert(!hijack.ok, "a different customer must not confirm someone else's pending action");

    // The action must remain pending and uncommitted for the rightful owner.
    const owner = await confirmAddItemForChannel(CH, LIN, pendingId);
    assert(owner.ok, owner.error ?? "the rightful owner should still be able to confirm");
  });

  await test("confirming via a different account link of the same customer is rejected", async () => {
    // Ownership is bound to the account link, not just the customer id.
    const preview = await previewAddItemForChannel(CH, LIN, "cloud-cleanser", 1);
    assert(preview.ok && preview.data, preview.error ?? "preview should succeed");
    const pendingId = preview.data.pendingAction.id;
    // Same customer (Lin), different link (whatsapp) than the one that staged the action.
    const crossLink = await confirmAddItemForChannel("whatsapp", LIN_WHATSAPP_EXTERNAL, pendingId);
    assert(!crossLink.ok, "a different account link must not confirm an action staged on another link");
  });

  group("Preview -> confirm contract");

  await test("add preview never mutates the cart", async () => {
    const preview = await previewAddItemForChannel(CH, LIN, "cloud-cleanser", 2);
    assert(preview.ok, preview.error ?? "add preview should succeed");
    assert((await cartItemCount()) === 0, "add preview must not mutate the cart");
  });

  await test("remove preview never mutates the cart", async () => {
    await seedCartItem("cloud-cleanser", 2);
    const preview = await previewRemoveItemForChannel(CH, LIN, "cloud-cleanser");
    assert(preview.ok, preview.error ?? "remove preview should succeed");
    const cart = await getCartForChannel(CH, LIN);
    assert(cart.data?.items[0]?.quantity === 2, "remove preview must not mutate the cart");
  });

  await test("update preview never mutates the cart", async () => {
    await seedCartItem("cloud-cleanser", 1);
    const preview = await previewUpdateQuantityForChannel(CH, LIN, "cloud-cleanser", 3);
    assert(preview.ok, preview.error ?? "update preview should succeed");
    const cart = await getCartForChannel(CH, LIN);
    assert(cart.data?.items[0]?.quantity === 1, "update preview must not mutate the cart");
  });

  await test("confirm is required: an unknown pending id mutates nothing", async () => {
    const confirm = await confirmAddItemForChannel(CH, LIN, "pending_does-not-exist");
    assert(!confirm.ok, "confirming an unknown pending action must fail");
    assert((await cartItemCount()) === 0, "a failed confirm must not mutate the cart");
  });

  await test("a pending action cannot be confirmed twice", async () => {
    const preview = await previewAddItemForChannel(CH, LIN, "cloud-cleanser", 1);
    assert(preview.ok && preview.data, preview.error ?? "preview should succeed");
    const pendingId = preview.data.pendingAction.id;
    const first = await confirmAddItemForChannel(CH, LIN, pendingId);
    assert(first.ok, first.error ?? "first confirm should succeed");
    const second = await confirmAddItemForChannel(CH, LIN, pendingId);
    assert(!second.ok, "a completed action must not be confirmable a second time");
    const cart = await getCartForChannel(CH, LIN);
    assert(cart.data?.items[0]?.quantity === 1, "double confirm must not double-apply the action");
  });

  await test("remove and update can also be confirmed by explicit pending id", async () => {
    // The by-id confirm tools (shop_cart_confirm_remove_item / _update_quantity)
    // are the alternative to confirm-latest; exercise that path too.
    await seedCartItem("cloud-cleanser", 2);
    const updatePreview = await previewUpdateQuantityForChannel(CH, LIN, "cloud-cleanser", 4);
    assert(updatePreview.ok && updatePreview.data, updatePreview.error ?? "update preview should succeed");
    const updateConfirm = await confirmUpdateQuantityForChannel(CH, LIN, updatePreview.data.pendingAction.id);
    assert(
      updateConfirm.ok && updateConfirm.data?.cart.items[0]?.quantity === 4,
      updateConfirm.error ?? "by-id update confirm should set quantity 4"
    );
    const removePreview = await previewRemoveItemForChannel(CH, LIN, "cloud-cleanser");
    assert(removePreview.ok && removePreview.data, removePreview.error ?? "remove preview should succeed");
    const removeConfirm = await confirmRemoveItemForChannel(CH, LIN, removePreview.data.pendingAction.id);
    assert(
      removeConfirm.ok && removeConfirm.data?.cart.items.length === 0,
      removeConfirm.error ?? "by-id remove confirm should empty the cart"
    );
  });

  await test("stacked duplicate add previews commit only once via confirm-latest", async () => {
    const first = await previewAddItemForChannel(CH, LIN, "cloud-cleanser", 1);
    const second = await previewAddItemForChannel(CH, LIN, "cloud-cleanser", 1);
    assert(first.ok && second.ok, "both duplicate previews should succeed");
    const confirm = await confirmLatestAddItemForChannel(CH, LIN, "cloud-cleanser", 1);
    assert(confirm.ok, confirm.error ?? "confirm-latest should succeed");
    const cart = await getCartForChannel(CH, LIN);
    assert(cart.data?.items[0]?.quantity === 1, "only the latest of two identical previews should commit, and only once");
  });

  group("Expiry");

  await test("an expired pending action is refused at confirm", async () => {
    const preview = await previewAddItemForChannel(CH, LIN, "cloud-cleanser", 1);
    assert(preview.ok && preview.data, preview.error ?? "preview should succeed");
    const pendingId = preview.data.pendingAction.id;
    // Force expiry without waiting on / mocking the clock.
    await patchDb((db) => {
      for (const pending of db.pendingActions) {
        if (pending.status === "pending") {
          pending.expiresAt = "2000-01-01T00:00:00.000Z";
        }
      }
    });
    const confirm = await confirmAddItemForChannel(CH, LIN, pendingId);
    assert(!confirm.ok && confirm.error?.includes("expired"), "an expired pending action must be refused");
    assert((await cartItemCount()) === 0, "an expired confirm must not mutate the cart");
  });

  group("Validation & refusals");

  await test("add: out-of-stock product is refused", async () => {
    const preview = await previewAddItemForChannel(CH, LIN, "night-repair-oil", 1);
    assert(!preview.ok && preview.error?.includes("out of stock"), "out-of-stock add must be refused");
    assert((await cartItemCount()) === 0, "refused add must not mutate the cart");
  });

  await test("add: quantity above available stock is refused", async () => {
    const preview = await previewAddItemForChannel(CH, LIN, "travel-mini-trio", 4); // only 3 in stock
    assert(!preview.ok && preview.error?.includes("available"), "over-stock add must be refused");
    assert((await cartItemCount()) === 0, "refused add must not mutate the cart");
  });

  await test("remove: an item not in the cart is refused", async () => {
    const preview = await previewRemoveItemForChannel(CH, LIN, "soft-reset-toner");
    assert(!preview.ok && preview.error?.includes("not in your cart"), "removing a missing item must be refused");
  });

  await test("update: an item not in the cart is refused", async () => {
    const preview = await previewUpdateQuantityForChannel(CH, LIN, "soft-reset-toner", 2);
    assert(!preview.ok && preview.error?.includes("not in your cart"), "updating a missing item must be refused");
  });

  await test("update: quantity to 0 is refused as an invalid quantity", async () => {
    await seedCartItem("cloud-cleanser", 1);
    const preview = await previewUpdateQuantityForChannel(CH, LIN, "cloud-cleanser", 0);
    assert(
      !preview.ok && preview.error?.includes("positive whole number"),
      "updating quantity to 0 must be refused as an invalid quantity"
    );
    const cart = await getCartForChannel(CH, LIN);
    assert(cart.data?.items[0]?.quantity === 1, "refused update must not mutate the cart");
  });

  await test("update: setting the current quantity is refused as a no-op", async () => {
    await seedCartItem("cloud-cleanser", 2);
    const preview = await previewUpdateQuantityForChannel(CH, LIN, "cloud-cleanser", 2);
    assert(
      !preview.ok && preview.error?.includes("already at quantity"),
      "updating to the quantity already in the cart must be refused"
    );
    const cart = await getCartForChannel(CH, LIN);
    assert(cart.data?.items[0]?.quantity === 2, "refused no-op update must not mutate the cart");
  });

  await test("update: quantity above available stock is refused", async () => {
    await seedCartItem("travel-mini-trio", 1); // only 3 in stock
    const preview = await previewUpdateQuantityForChannel(CH, LIN, "travel-mini-trio", 4);
    assert(!preview.ok && preview.error?.includes("available"), "over-stock update must be refused");
    const cart = await getCartForChannel(CH, LIN);
    assert(cart.data?.items[0]?.quantity === 1, "refused update must not mutate the cart");
  });

  group("Audit logging");

  await test("a successful add writes a success audit log", async () => {
    await seedCartItem("cloud-cleanser", 1);
    const logs = await listActionLogs(LIN_CUSTOMER, 20);
    assert(
      logs.data?.some((log) => log.type === "cart.add_item" && log.status === "success"),
      "a successful add must write a success audit log"
    );
  });

  await test("a successful remove (via confirm-latest) writes a success audit log", async () => {
    // confirm-latest is the path the cart-actions skill actually drives.
    await seedCartItem("cloud-cleanser", 1);
    const preview = await previewRemoveItemForChannel(CH, LIN, "cloud-cleanser");
    assert(preview.ok, preview.error ?? "remove preview should succeed");
    const confirm = await confirmLatestRemoveItemForChannel(CH, LIN, "cloud-cleanser");
    assert(confirm.ok && confirm.data?.cart.items.length === 0, confirm.error ?? "confirm-latest remove should empty the cart");
    const logs = await listActionLogs(LIN_CUSTOMER, 20);
    assert(
      logs.data?.some((log) => log.type === "cart.remove_item" && log.status === "success"),
      "a successful remove must write a success audit log"
    );
  });

  await test("a successful update (via confirm-latest) writes a success audit log", async () => {
    await seedCartItem("cloud-cleanser", 1);
    const preview = await previewUpdateQuantityForChannel(CH, LIN, "cloud-cleanser", 3);
    assert(preview.ok, preview.error ?? "update preview should succeed");
    const confirm = await confirmLatestUpdateQuantityForChannel(CH, LIN, "cloud-cleanser", 3);
    assert(confirm.ok && confirm.data?.cart.items[0]?.quantity === 3, confirm.error ?? "confirm-latest update should set the new quantity");
    const logs = await listActionLogs(LIN_CUSTOMER, 20);
    assert(
      logs.data?.some((log) => log.type === "cart.update_quantity" && log.status === "success"),
      "a successful update must write a success audit log"
    );
  });

  await test("preview writes a preview audit log; a failed confirm writes a failed log", async () => {
    const preview = await previewAddItemForChannel(CH, LIN, "cloud-cleanser", 1);
    assert(preview.ok, preview.error ?? "preview should succeed");
    const previewLogs = await listActionLogs(LIN_CUSTOMER, 20);
    assert(
      previewLogs.data?.some((log) => log.type === "cart.add_item.preview" && log.status === "preview"),
      "a preview must write a preview audit log"
    );

    // Drop the product's stock to 0 underneath the pending action, then confirm -> failed log.
    const pendingId = preview.data!.pendingAction.id;
    await patchDb((db) => {
      const product = db.products.find((entry) => entry.id === "cloud-cleanser");
      assert(product, "cloud-cleanser must exist");
      product.stockStatus = "out_of_stock";
      product.stockQuantity = 0;
    });
    const confirm = await confirmAddItemForChannel(CH, LIN, pendingId);
    assert(!confirm.ok, "confirm should fail once the product is out of stock");
    const failedLogs = await listActionLogs(LIN_CUSTOMER, 20);
    assert(
      failedLogs.data?.some((log) => log.type === "cart.add_item" && log.status === "failed"),
      "a failed confirm must write a failed audit log"
    );
  });

  group("Order status (read-only, identity-gated)");

  await test("unlinked channel identity cannot list or get orders", async () => {
    const list = await listOrdersForChannel(CH, "unknown-user");
    assert(!list.ok, "unknown channel identity must not list orders");
    const get = await getOrderForChannel(CH, "unknown-user", LIN_SHIPPED_ORDER);
    assert(!get.ok, "unknown channel identity must not read an order");
  });

  await test("revoked account link cannot read orders", async () => {
    await patchDb((db) => {
      const link = db.accountLinks.find((entry) => entry.id === LIN_WHATSAPP_LINK);
      assert(link, "baseline must contain the whatsapp link to revoke");
      link.status = "revoked";
    });
    const list = await listOrdersForChannel("whatsapp", LIN_WHATSAPP_EXTERNAL);
    assert(!list.ok, "a revoked link must not list orders");
    const get = await getOrderForChannel("whatsapp", LIN_WHATSAPP_EXTERNAL, LIN_SHIPPED_ORDER);
    assert(!get.ok, "a revoked link must not read an order");
    // The same customer's still-linked channel must keep working.
    const stillLinked = await listOrdersForChannel(CH, LIN);
    assert(stillLinked.ok, "a different, still-linked channel for the same customer must still read orders");
  });

  await test("a typed customer id is not accepted as ownership proof for order reads", async () => {
    const list = await listOrdersForChannel(CH, LIN_CUSTOMER);
    assert(!list.ok, "typing a customer id as the external channel id must not list orders");
    const get = await getOrderForChannel(CH, LIN_CUSTOMER, LIN_SHIPPED_ORDER);
    assert(!get.ok, "typing a customer id as the external channel id must not read an order");
  });

  await test("a linked customer sees only their own orders", async () => {
    await injectSecondCustomerWithOrder();
    const list = await listOrdersForChannel(CH, LIN);
    assert(list.ok && list.data, list.error ?? "owner order list should succeed");
    assert(
      list.data.every((order) => order.id !== MALLORY_ORDER),
      "a customer's order list must not include another customer's order"
    );
    assert(
      list.data.length === 3 && list.data[0].id === "order-2026-0003",
      "the demo customer should see their 3 seeded orders, newest first"
    );
  });

  await test("an unknown order id is refused", async () => {
    const get = await getOrderForChannel(CH, LIN, "order-does-not-exist");
    assert(!get.ok, "an unknown order id must be refused");
  });

  await test("a customer-typed order number is not proof: another customer's order id is refused", async () => {
    await injectSecondCustomerWithOrder();
    // Lin supplies Mallory's real, existing order id. Identity is the channel
    // binding, not the order number, so this must be refused...
    const hijack = await getOrderForChannel(CH, LIN, MALLORY_ORDER);
    assert(!hijack.ok, "a customer must not read another customer's order by quoting its id");
    // ...and refused IDENTICALLY to a truly unknown id, so existence never leaks.
    const unknown = await getOrderForChannel(CH, LIN, "order-does-not-exist");
    assert(
      hijack.error === unknown.error,
      "a non-owned order id must return the same message as an unknown id (no existence leak)"
    );
    // Mallory herself can still read her own order.
    const owner = await getOrderForChannel(CH, MALLORY_EXTERNAL, MALLORY_ORDER);
    assert(owner.ok, owner.error ?? "the rightful owner should be able to read her own order");
  });

  await test("a linked customer lists their orders and gets full detail including tracking", async () => {
    const list = await listOrdersForChannel(CH, LIN);
    assert(list.ok && list.data && list.data.length > 0, "the demo customer should have seeded orders");
    const get = await getOrderForChannel(CH, LIN, LIN_SHIPPED_ORDER);
    assert(get.ok && get.data, get.error ?? "the owner should read their shipped order");
    assert(get.data.status === "shipped", "the shipped order should report status 'shipped'");
    assert(
      Boolean(get.data.shipping?.trackingNumber) && Boolean(get.data.shipping?.carrier),
      "a shipped order should expose carrier and tracking number to its owner"
    );
    // Names are joined from the catalog, not stored on the order line.
    assert(
      get.data.items[0]?.name === "Calm Barrier Cream" && get.data.items[0]?.subtotalNtd === 680,
      "order lines should resolve the product name from the catalog and compute a subtotal"
    );
  });

  group("Returns intake (identity-gated; intake-and-handoff, never auto-refund)");

  await test("unlinked channel identity cannot preview, confirm, or read returns", async () => {
    const preview = await previewCreateReturnForChannel(CH, "unknown-user", LIN_DELIVERED_ORDER, "refund", "broken");
    assert(!preview.ok, "unknown channel identity must not stage a return");
    const confirm = await confirmCreateReturnForChannel(CH, "unknown-user", "pending_whatever");
    assert(!confirm.ok, "unknown channel identity must not confirm a return");
    const list = await listReturnsForChannel(CH, "unknown-user");
    assert(!list.ok, "unknown channel identity must not list returns");
    const get = await getReturnForChannel(CH, "unknown-user", LIN_SEEDED_RETURN);
    assert(!get.ok, "unknown channel identity must not read a return");
  });

  await test("revoked account link cannot preview or read returns", async () => {
    await patchDb((db) => {
      const link = db.accountLinks.find((entry) => entry.id === LIN_WHATSAPP_LINK);
      assert(link, "baseline must contain the whatsapp link to revoke");
      link.status = "revoked";
    });
    const preview = await previewCreateReturnForChannel("whatsapp", LIN_WHATSAPP_EXTERNAL, LIN_DELIVERED_ORDER, "refund", "broken");
    assert(!preview.ok, "a revoked link must not stage a return");
    const list = await listReturnsForChannel("whatsapp", LIN_WHATSAPP_EXTERNAL);
    assert(!list.ok, "a revoked link must not list returns");
    // The same customer's still-linked channel must keep working.
    const stillLinked = await listReturnsForChannel(CH, LIN);
    assert(stillLinked.ok, "a different, still-linked channel for the same customer must still read returns");
  });

  await test("a typed customer id is not accepted as ownership proof for returns", async () => {
    const preview = await previewCreateReturnForChannel(CH, LIN_CUSTOMER, LIN_DELIVERED_ORDER, "refund", "broken");
    assert(!preview.ok, "typing a customer id as the external channel id must not stage a return");
    const list = await listReturnsForChannel(CH, LIN_CUSTOMER);
    assert(!list.ok, "typing a customer id as the external channel id must not list returns");
  });

  await test("a return can only be opened on an order the customer owns", async () => {
    await injectSecondCustomerWithReturn();
    // Lin supplies Mallory's real, existing (delivered) order id. Identity is the
    // channel binding, not the order number, so this must be refused...
    const hijack = await previewCreateReturnForChannel(CH, LIN, MALLORY_ORDER, "refund", "want it back");
    assert(!hijack.ok, "a customer must not open a return on another customer's order");
    // ...and refused IDENTICALLY to a truly unknown order id, so existence never leaks.
    const unknown = await previewCreateReturnForChannel(CH, LIN, "order-does-not-exist", "refund", "want it back");
    assert(
      hijack.error === unknown.error,
      "a non-owned order id must return the same message as an unknown id (no existence leak)"
    );
    // Mallory can open a return against her own delivered order.
    const owner = await previewCreateReturnForChannel(CH, MALLORY_EXTERNAL, MALLORY_ORDER, "refund", "want it back");
    assert(owner.ok, owner.error ?? "the rightful owner should be able to open a return on her own order");
  });

  await test("a return on an order that has not been delivered is refused", async () => {
    // order-2026-0002 is shipped, not delivered.
    const preview = await previewCreateReturnForChannel(CH, LIN, LIN_SHIPPED_ORDER, "refund", "changed my mind");
    assert(
      !preview.ok && preview.error?.includes("not been delivered"),
      "a return on a non-delivered order must be refused"
    );
    assert((await returnCount()) === 1, "a refused return preview must not create a return record");
  });

  await test("an invalid resolution is refused", async () => {
    const preview = await previewCreateReturnForChannel(CH, LIN, LIN_DELIVERED_ORDER, "store-credit", "broken");
    assert(!preview.ok && preview.error?.includes("refund"), "a resolution other than refund/exchange must be refused");
  });

  await test("return preview never creates a return record and writes a preview log", async () => {
    const before = await returnCount();
    const preview = await previewCreateReturnForChannel(CH, LIN, LIN_DELIVERED_ORDER, "refund", "Pump still leaks.");
    assert(preview.ok, preview.error ?? "return preview should succeed on a delivered owned order");
    assert((await returnCount()) === before, "return preview must not create a return record");
    const logs = await listActionLogs(LIN_CUSTOMER, 20);
    assert(
      logs.data?.some((log) => log.type === "return.create.preview" && log.status === "preview"),
      "a return preview must write a preview audit log"
    );
  });

  await test("confirm creates a REQUEST in 'requested' state (not a refund) and writes a success log", async () => {
    const before = await returnCount();
    const preview = await previewCreateReturnForChannel(CH, LIN, LIN_DELIVERED_ORDER, "refund", "Pump still leaks.");
    assert(preview.ok && preview.data, preview.error ?? "return preview should succeed");
    const confirm = await confirmCreateReturnForChannel(CH, LIN, preview.data.pendingAction.id);
    assert(confirm.ok && confirm.data, confirm.error ?? "return confirm should succeed");
    // The agent creates a request for human review, never an issued refund.
    assert(
      confirm.data.returnRequest.status === "requested",
      "a confirmed return must be created in the 'requested' state, never refunded/approved"
    );
    assert(confirm.data.returnRequest.orderId === LIN_DELIVERED_ORDER, "the request must reference the owned order");
    assert((await returnCount()) === before + 1, "confirm must create exactly one new return record");
    const logs = await listActionLogs(LIN_CUSTOMER, 20);
    assert(
      logs.data?.some((log) => log.type === "return.create" && log.status === "success"),
      "a successful return confirm must write a success audit log"
    );
  });

  await test("confirm does not move money: order totals and the cart are untouched", async () => {
    const orderBefore = await getOrderForChannel(CH, LIN, LIN_DELIVERED_ORDER);
    assert(orderBefore.ok && orderBefore.data, "owner should read the delivered order");
    const totalBefore = orderBefore.data.totalNtd;

    const preview = await previewCreateReturnForChannel(CH, LIN, LIN_DELIVERED_ORDER, "refund", "Pump still leaks.");
    assert(preview.ok && preview.data, preview.error ?? "return preview should succeed");
    const confirm = await confirmCreateReturnForChannel(CH, LIN, preview.data.pendingAction.id);
    assert(confirm.ok, confirm.error ?? "return confirm should succeed");

    const orderAfter = await getOrderForChannel(CH, LIN, LIN_DELIVERED_ORDER);
    assert(
      orderAfter.ok && orderAfter.data?.totalNtd === totalBefore && orderAfter.data.status === "delivered",
      "opening a return must not change the order's total or status"
    );
    assert((await cartItemCount()) === 0, "opening a return must not touch the cart");
  });

  await test("a return request cannot be confirmed twice", async () => {
    const before = await returnCount();
    const preview = await previewCreateReturnForChannel(CH, LIN, LIN_DELIVERED_ORDER, "exchange", "Wrong shade.");
    assert(preview.ok && preview.data, preview.error ?? "return preview should succeed");
    const pendingId = preview.data.pendingAction.id;
    const first = await confirmCreateReturnForChannel(CH, LIN, pendingId);
    assert(first.ok, first.error ?? "first return confirm should succeed");
    const second = await confirmCreateReturnForChannel(CH, LIN, pendingId);
    assert(!second.ok, "a completed return request must not be confirmable a second time");
    assert((await returnCount()) === before + 1, "double confirm must not create a second return record");
  });

  await test("confirming another customer's pending return request is rejected", async () => {
    await injectSecondCustomerWithReturn();
    const preview = await previewCreateReturnForChannel(CH, LIN, LIN_DELIVERED_ORDER, "refund", "Pump still leaks.");
    assert(preview.ok && preview.data, preview.error ?? "owner preview should succeed");
    const pendingId = preview.data.pendingAction.id;
    // Mallory (a different, legitimately-linked customer) tries to confirm Lin's request.
    const hijack = await confirmCreateReturnForChannel(CH, MALLORY_EXTERNAL, pendingId);
    assert(!hijack.ok, "a different customer must not confirm someone else's pending return");
    // The rightful owner can still confirm.
    const owner = await confirmCreateReturnForChannel(CH, LIN, pendingId);
    assert(owner.ok, owner.error ?? "the rightful owner should still be able to confirm");
  });

  await test("return status reads are own-returns-only and do not leak existence", async () => {
    await injectSecondCustomerWithReturn();
    const list = await listReturnsForChannel(CH, LIN);
    assert(list.ok && list.data, list.error ?? "owner return list should succeed");
    assert(
      list.data.every((entry) => entry.id !== MALLORY_RETURN),
      "a customer's return list must not include another customer's return"
    );
    // Quoting Mallory's real return id as Lin is refused, identically to an unknown id.
    const hijack = await getReturnForChannel(CH, LIN, MALLORY_RETURN);
    assert(!hijack.ok, "a customer must not read another customer's return by quoting its id");
    const unknown = await getReturnForChannel(CH, LIN, "return-does-not-exist");
    assert(
      hijack.error === unknown.error,
      "a non-owned return id must return the same message as an unknown id (no existence leak)"
    );
    // Mallory can read her own return.
    const owner = await getReturnForChannel(CH, MALLORY_EXTERNAL, MALLORY_RETURN);
    assert(owner.ok, owner.error ?? "the rightful owner should read her own return");
  });

  await test("the owner reads a seeded refund's status ('is my refund processed yet?')", async () => {
    const get = await getReturnForChannel(CH, LIN, LIN_SEEDED_RETURN);
    assert(get.ok && get.data, get.error ?? "the owner should read their seeded return");
    assert(get.data.status === "refunded", "the seeded return should report status 'refunded'");
    assert(get.data.resolution === "refund" && get.data.orderId === LIN_DELIVERED_ORDER, "the seeded return links to the delivered order");
  });

  await test("a second return cannot be opened while one is already in progress for the order", async () => {
    const first = await previewCreateReturnForChannel(CH, LIN, LIN_DELIVERED_ORDER, "refund", "Pump leaks.");
    assert(first.ok && first.data, first.error ?? "first return preview should succeed");
    const confirm = await confirmCreateReturnForChannel(CH, LIN, first.data.pendingAction.id);
    assert(confirm.ok, confirm.error ?? "first return confirm should succeed");
    // The order now has an open (requested) return; a second one is refused.
    const second = await previewCreateReturnForChannel(CH, LIN, LIN_DELIVERED_ORDER, "exchange", "Also the lid.");
    assert(
      !second.ok && second.error?.includes("in progress"),
      "a second return on an order with one already in progress must be refused"
    );
    assert((await returnCount()) === 2, "the refused second preview must not create a return (baseline + 1)");
  });

  await test("confirm re-checks eligibility: an order no longer delivered is refused at confirm", async () => {
    const before = await returnCount();
    const preview = await previewCreateReturnForChannel(CH, LIN, LIN_DELIVERED_ORDER, "refund", "Pump leaks.");
    assert(preview.ok && preview.data, preview.error ?? "return preview should succeed");
    // The order's eligibility changes between preview and confirm (e.g. a human edit).
    await patchDb((db) => {
      const order = db.orders.find((entry) => entry.id === LIN_DELIVERED_ORDER);
      assert(order, "the delivered order must exist");
      order.status = "cancelled";
    });
    const confirm = await confirmCreateReturnForChannel(CH, LIN, preview.data.pendingAction.id);
    assert(!confirm.ok, "confirm must refuse once the order is no longer eligible");
    assert((await returnCount()) === before, "a refused confirm must not create a return record");
    const logs = await listActionLogs(LIN_CUSTOMER, 20);
    assert(
      logs.data?.some((log) => log.type === "return.create" && log.status === "failed"),
      "a refused confirm must write a failed audit log"
    );
  });

  await test("a persisted DB predating the returns field can still intake a return", async () => {
    // Simulate a .local/shop-db.json written before this feature: drop the
    // `returns` key entirely, then confirm a return still works (the store
    // backfills missing arrays on read, so the push path never throws).
    await patchDb((db) => {
      delete (db as Partial<ShopDatabase>).returns;
    });
    const list = await listReturnsForChannel(CH, LIN);
    assert(list.ok && list.data?.length === 0, "a DB without a returns key should read as zero returns, not throw");
    const preview = await previewCreateReturnForChannel(CH, LIN, LIN_DELIVERED_ORDER, "refund", "Pump still leaks.");
    assert(preview.ok && preview.data, preview.error ?? "preview should succeed on a backfilled DB");
    const confirm = await confirmCreateReturnForChannel(CH, LIN, preview.data.pendingAction.id);
    assert(
      confirm.ok && confirm.data?.returnRequest.status === "requested",
      confirm.error ?? "confirm must create a request even when the loaded DB lacked a returns array"
    );
  });

  group("Handoff escalation records (append-only; optional identity, never blocks)");

  await test("a handoff is recorded for a LINKED sender, with customerId and the classification captured", async () => {
    const before = await handoffCount();
    const created = await createHandoff(
      CH,
      LIN,
      "handoff_recommended",
      "refund_dispute",
      "Customer is upset a refund has not arrived.",
      "Lin is chasing a delayed refund and asked for a human."
    );
    assert(created.ok && created.data, created.error ?? "a linked-sender escalation should be recorded");
    assert(created.data.customerId === LIN_CUSTOMER, "a linked sender's handoff must link the resolved customerId");
    assert(created.data.classification === "handoff_recommended", "the classification must be captured");
    assert(
      created.data.category === "refund_dispute" &&
        created.data.reason.length > 0 &&
        created.data.summary.length > 0,
      "the category, reason, and customer-safe summary must be captured"
    );
    assert(created.data.status === "open", "the agent must only ever create a handoff in the 'open' state");
    assert((await handoffCount()) === before + 1, "exactly one new handoff record must be created");
  });

  await test("a handoff is recorded for an UNLINKED sender, with no customerId (identity never blocks)", async () => {
    const before = await handoffCount();
    const created = await createHandoff(
      CH,
      "unknown-user",
      "urgent_handoff",
      "safety_reaction",
      "Customer reports a skin reaction.",
      "An unlinked sender reports burning skin after use — needs urgent human review."
    );
    assert(created.ok && created.data, created.error ?? "an unlinked sender must still be escalatable");
    assert(created.data.customerId === undefined, "an unlinked sender's handoff must NOT carry a customerId");
    assert(
      created.data.channel === CH && created.data.externalUserId === "unknown-user",
      "the raw channel + externalUserId must be recorded so a human can reach the unlinked sender"
    );
    assert(created.data.classification === "urgent_handoff", "the classification must be captured");
    assert((await handoffCount()) === before + 1, "an unlinked escalation must still create a record");
  });

  await test("a REVOKED link still records an escalation, but with no customerId", async () => {
    await patchDb((db) => {
      const link = db.accountLinks.find((entry) => entry.id === LIN_WHATSAPP_LINK);
      assert(link, "baseline must contain the whatsapp link to revoke");
      link.status = "revoked";
    });
    const created = await createHandoff(
      "whatsapp",
      LIN_WHATSAPP_EXTERNAL,
      "handoff_recommended",
      "human_requested",
      "Customer explicitly asked for a person.",
      "A sender on a revoked link asked for a human."
    );
    assert(created.ok && created.data, created.error ?? "a revoked-link sender must still be escalatable");
    assert(
      created.data.customerId === undefined,
      "a revoked link must not attribute the escalation to a customer, but must not block it either"
    );
  });

  await test("a handoff records a success audit log", async () => {
    const created = await createHandoff(CH, LIN, "urgent_handoff", "chargeback_threat", "Threatened a chargeback.", "Lin threatened a chargeback if not resolved today.");
    assert(created.ok, created.error ?? "the escalation should be recorded");
    const logs = await listActionLogs(LIN_CUSTOMER, 20);
    assert(
      logs.data?.some((log) => log.type === "handoff.create" && log.status === "success"),
      "a recorded handoff must write a success audit log"
    );
  });

  await test("handoff_create is append-only: two creates make two records and touch nothing else", async () => {
    await seedCartItem("cloud-cleanser", 1);
    const before = await handoffCount();
    const first = await createHandoff(CH, LIN, "handoff_recommended", "complaint", "Angry about a wrong item.", "Lin received the wrong item and is upset.");
    const second = await createHandoff(CH, LIN, "handoff_recommended", "complaint", "Still upset.", "Lin is still upset about the wrong item.");
    assert(first.ok && second.ok, "both escalations should be recorded (no dedup, no preview/confirm)");
    assert(first.data?.id !== second.data?.id, "each create must produce a distinct record");
    assert((await handoffCount()) === before + 2, "two creates must produce two records (append-only, no preview)");
    // No money/account mutation: cart, orders, returns, and pending actions are untouched.
    assert((await cartItemCount()) === 1, "recording a handoff must not touch the cart");
    const orders = await listOrdersForChannel(CH, LIN);
    assert(orders.ok && orders.data?.length === 3, "recording a handoff must not change orders");
    assert((await returnCount()) === 1, "recording a handoff must not change returns");
  });

  await test("continue records nothing: an invalid classification is refused", async () => {
    const before = await handoffCount();
    const calm = await createHandoff(CH, LIN, "continue", "calm", "Just a question.", "Calm shipping question.");
    assert(!calm.ok, "'continue' must not be recordable as a handoff");
    const bogus = await createHandoff(CH, LIN, "escalate-now", "calm", "x", "y");
    assert(!bogus.ok, "an unknown classification must be refused");
    assert((await handoffCount()) === before, "a refused classification must not create any record");
  });

  await test("shop_handoff_list returns recorded handoffs and filters by customerId", async () => {
    // The baseline seeds one resolved handoff for the demo customer.
    const seeded = await listHandoffs(undefined, 100);
    assert(seeded.ok && seeded.data?.some((h) => h.id === LIN_SEEDED_HANDOFF), "the seeded handoff should be listed");

    await createHandoff(CH, LIN, "handoff_recommended", "human_requested", "Asked for a person.", "Lin asked for a human.");
    await createHandoff(CH, "unknown-user", "urgent_handoff", "safety_reaction", "Skin reaction.", "Unlinked sender reports a reaction.");

    const all = await listHandoffs(undefined, 100);
    assert(all.ok && all.data && all.data.length === 3, "all three records (1 seeded + 2 created) should be listed");

    const mineOnly = await listHandoffs(LIN_CUSTOMER, 100);
    assert(
      mineOnly.ok && mineOnly.data?.every((h) => h.customerId === LIN_CUSTOMER),
      "a customerId filter must return only that customer's handoffs"
    );
    assert(
      mineOnly.data?.length === 2,
      "the demo customer should have the seeded handoff plus the one created for the linked sender"
    );
    // The unlinked escalation has no customerId, so it is never attributed to a customer.
    assert(
      all.data.some((h) => h.customerId === undefined),
      "the unlinked escalation must remain unattributed (no customerId)"
    );
  });

  await test("a persisted DB predating the handoffs field can still record an escalation", async () => {
    // Simulate a .local/shop-db.json written before this feature: drop the
    // `handoffs` key entirely, then confirm an escalation still records (the
    // store backfills missing arrays on read, so the push path never throws).
    await patchDb((db) => {
      delete (db as Partial<ShopDatabase>).handoffs;
    });
    const list = await listHandoffs(undefined, 100);
    assert(list.ok && list.data?.length === 0, "a DB without a handoffs key should read as zero handoffs, not throw");
    const created = await createHandoff(CH, LIN, "handoff_recommended", "complaint", "Upset.", "Lin is upset.");
    assert(
      created.ok && created.data?.status === "open",
      created.error ?? "an escalation must record even when the loaded DB lacked a handoffs array"
    );
  });

  group("Self-service registration & linking");

  await test("an unlinked sender registers a NEW account and can then use it (own, empty)", async () => {
    const before = await lookupCustomerByChannel(CH, "eval-newbie");
    assert(!before.ok, "the new sender must start unlinked");
    const reg = await registerNewCustomerForChannel(CH, "eval-newbie", "Newbie Demo");
    assert(reg.ok && reg.data, reg.error ?? "registering a new account should succeed");
    assert(reg.data.displayName === "Newbie Demo", "the new account should carry the requested display name");
    // Now resolvable, and gets its OWN (empty) cart — not anyone else's.
    const lookup = await lookupCustomerByChannel(CH, "eval-newbie");
    assert(lookup.ok && lookup.data?.customerId === reg.data.customerId, "the sender must now resolve to the new customer");
    const cart = await getCartForChannel(CH, "eval-newbie");
    assert(cart.ok && cart.data?.items.length === 0, "a freshly-registered customer must start with an empty cart");
    // Audit trail recorded.
    const logs = await listActionLogs(reg.data.customerId, 20);
    assert(
      logs.data?.some((log) => log.type === "account.register" && log.status === "success"),
      "registration must write a success audit log"
    );
  });

  await test("registering an already-linked channel identity is refused", async () => {
    const reg = await registerNewCustomerForChannel(CH, LIN, "Impostor");
    assert(!reg.ok, "an already-linked identity must not be re-registered");
    // The existing customer is untouched (name not overwritten).
    const lookup = await lookupCustomerByChannel(CH, LIN);
    assert(lookup.ok && lookup.data?.customerId === LIN_CUSTOMER, "the existing link must be unchanged");
  });

  await test("a freshly-registered customer cannot read another customer's data", async () => {
    const reg = await registerNewCustomerForChannel(CH, "eval-newbie", "Newbie Demo");
    assert(reg.ok, reg.error ?? "registration should succeed");
    const orders = await listOrdersForChannel(CH, "eval-newbie");
    assert(orders.ok && orders.data?.length === 0, "a new customer has no orders of their own");
    // Quoting Lin's real order id must be refused (gating intact, no existence leak).
    const hijack = await getOrderForChannel(CH, "eval-newbie", LIN_SHIPPED_ORDER);
    assert(!hijack.ok, "a new customer must not read another customer's order by quoting its id");
  });

  await test("link-existing with the correct code links the channel to that account", async () => {
    const before = await lookupCustomerByChannel(CH, "eval-linker");
    assert(!before.ok, "the linking sender must start unlinked");
    const link = await linkExistingAccountForChannel(CH, "eval-linker", LIN_ACCOUNT_CODE);
    assert(link.ok && link.data?.customerId === LIN_CUSTOMER, link.error ?? "the correct code must link to the demo customer");
    // The newly-linked channel now reads the existing customer's own orders.
    const orders = await listOrdersForChannel(CH, "eval-linker");
    assert(orders.ok && orders.data?.length === 3, "the linked channel should now see the existing customer's 3 orders");
    const logs = await listActionLogs(LIN_CUSTOMER, 20);
    assert(
      logs.data?.some((log) => log.type === "account.link_existing" && log.status === "success"),
      "linking an existing account must write a success audit log"
    );
  });

  await test("link-existing with a wrong code is refused and links nothing", async () => {
    const link = await linkExistingAccountForChannel(CH, "eval-linker", "NOPE-0000");
    assert(!link.ok && link.error?.includes("not recognized"), "an unrecognized code must be refused generically");
    const lookup = await lookupCustomerByChannel(CH, "eval-linker");
    assert(!lookup.ok, "a refused link must not create any account link");
  });

  await test("link-existing is refused for an already-linked identity", async () => {
    const link = await linkExistingAccountForChannel(CH, LIN, LIN_ACCOUNT_CODE);
    assert(!link.ok, "an already-linked identity must not link again");
  });

  group("Web login credentials");

  const DEMO_LIN_PASSWORD = "amelya-demo"; // matches data/customers/credentials.json seed

  await test("the seeded demo login (lin) verifies and resolves to the demo customer", async () => {
    const ok = await verifyWebCredential("lin", DEMO_LIN_PASSWORD);
    assert(ok.ok && ok.data?.customerId === LIN_CUSTOMER, ok.error ?? "seeded login should verify to Lin");
    // The web login resolves the SAME customer her chat channels do — so she sees her real orders.
    const orders = await listOrdersForChannel("web", "lin");
    assert(orders.ok && orders.data?.length === 3, "logging in as lin must surface her 3 seeded orders");
  });

  await test("a wrong password and an unknown username are both refused with the same generic error", async () => {
    const wrong = await verifyWebCredential("lin", "not-the-password");
    assert(!wrong.ok && wrong.error === "Invalid username or password.", "a wrong password must be refused generically");
    const missing = await verifyWebCredential("ghost", "whatever123");
    assert(!missing.ok && missing.error === wrong.error, "an unknown username must return the SAME message (no existence leak)");
  });

  await test("web signup creates a customer + web link + a hashed credential, then logs in", async () => {
    const reg = await registerWebAccount("newshopper", "s3cretpw!", "New Shopper");
    assert(reg.ok && reg.data, reg.error ?? "web signup should succeed");
    assert(reg.data.channel === "web" && reg.data.externalUserId === "newshopper", "signup must create a web account-link");
    // The stored credential must be hashed, never the plaintext password.
    const db = await readShopDb();
    const cred = db.credentials.find((c) => c.username === "newshopper");
    assert(cred && cred.hash.length > 0 && cred.salt.length > 0, "a credential row with salt+hash must exist");
    assert(!JSON.stringify(db.credentials).includes("s3cretpw!"), "the plaintext password must NEVER be stored");
    // The new account can log in...
    const login = await verifyWebCredential("newshopper", "s3cretpw!");
    assert(login.ok && login.data?.customerId === reg.data.customerId, "the new account should log in");
    // ...and starts empty / cannot read another customer's orders.
    const ownOrders = await listOrdersForChannel("web", "newshopper");
    assert(ownOrders.ok && ownOrders.data?.length === 0, "a fresh web account has no orders of its own");
    const hijack = await getOrderForChannel("web", "newshopper", LIN_SHIPPED_ORDER);
    assert(!hijack.ok, "a fresh web account must not read another customer's order");
  });

  await test("a duplicate username is refused", async () => {
    const dup = await registerWebAccount("lin", "anotherpw1", "Impostor");
    assert(!dup.ok && dup.error?.includes("already taken"), "registering an existing username must be refused");
  });

  await test("signup validation: short password and bad username are refused", async () => {
    const shortPw = await registerWebAccount("okname", "short", "Some One");
    assert(!shortPw.ok && shortPw.error?.includes("at least"), "a too-short password must be refused");
    const badName = await registerWebAccount("bad name!", "longenough1", "Some One");
    assert(!badName.ok, "a username with spaces/symbols must be refused");
  });

  group("Checkout (mock — cart → order, no payment)");

  await test("an empty cart cannot be checked out", async () => {
    const preview = await previewCheckoutForChannel(CH, LIN);
    assert(!preview.ok && preview.error?.includes("empty"), "checkout preview on an empty cart must be refused");
    const confirm = await confirmCheckoutForChannel(CH, LIN);
    assert(!confirm.ok, "checkout confirm on an empty cart must be refused");
    assert((await orderCount()) === 3, "no order may be created from an empty cart");
  });

  await test("unlinked identity cannot checkout", async () => {
    const preview = await previewCheckoutForChannel(CH, "unknown-user");
    assert(!preview.ok, "unlinked identity must not preview checkout");
    const confirm = await confirmCheckoutForChannel(CH, "unknown-user");
    assert(!confirm.ok, "unlinked identity must not place an order");
  });

  await test("checkout places a 'placed' order, decrements stock, clears the cart, and audits", async () => {
    await seedCartItem("cloud-cleanser", 2);
    const stockBefore = await productStock("cloud-cleanser");

    const preview = await previewCheckoutForChannel(CH, LIN);
    assert(preview.ok && preview.data?.totalNtd === 840, preview.error ?? "preview should total 2 x 420 = 840");

    const placed = await confirmCheckoutForChannel(CH, LIN);
    assert(placed.ok && placed.data, placed.error ?? "checkout should place an order");
    assert(placed.data.order.status === "placed", "a fresh order must be in 'placed' status");
    assert(
      placed.data.order.totalNtd === 840 && placed.data.order.items[0]?.unitPriceNtd === 420,
      "the order must capture items + the unit price at checkout time"
    );
    // It is the customer's own order and shows in their history.
    const list = await listOrdersForChannel(CH, LIN);
    assert(list.ok && list.data?.some((o) => o.id === placed.data!.order.id), "the placed order must appear in the customer's orders");
    // Cart cleared and stock decremented by the ordered quantity.
    assert((await cartItemCount()) === 0, "checkout must clear the cart");
    assert((await productStock("cloud-cleanser")) === stockBefore - 2, "checkout must decrement stock by the ordered quantity");
    // Audit.
    const logs = await listActionLogs(LIN_CUSTOMER, 20);
    assert(
      logs.data?.some((log) => log.type === "checkout" && log.status === "success"),
      "checkout must write a success audit log"
    );
  });

  await test("checkout is refused if a cart line goes out of stock, leaving cart + orders untouched", async () => {
    await seedCartItem("cloud-cleanser", 1);
    await patchDb((db) => {
      const product = db.products.find((entry) => entry.id === "cloud-cleanser");
      assert(product, "cloud-cleanser must exist");
      product.stockQuantity = 0;
      product.stockStatus = "out_of_stock";
    });
    const confirm = await confirmCheckoutForChannel(CH, LIN);
    assert(!confirm.ok && confirm.error?.includes("out of stock"), "checkout must refuse an out-of-stock line");
    assert((await orderCount()) === 3, "a refused checkout must not create an order");
    assert((await cartItemCount()) === 1, "a refused checkout must not clear the cart");
  });

  group("Routine guide (faithful to compatibility.md)");

  await test("returns exactly the 6 routine-step products, excluding sets + accessory", async () => {
    const guide = await getRoutineGuide();
    assert(guide.ok && guide.data, guide.error ?? "routine guide should load");
    const ids = guide.data.products.map((p) => p.id);
    assert(ids.length === 6, `expected 6 routine products, got ${ids.length}`);
    assert(
      !ids.includes("glow-starter-kit") && !ids.includes("travel-mini-trio") && !ids.includes("cotton-carry-pouch"),
      "sets and accessories must NOT be offered as routine steps"
    );
    assert(
      ids.includes("cloud-cleanser") && ids.includes("soft-reset-toner") && ids.includes("night-repair-oil"),
      "the stated routine products must be present"
    );
  });

  await test("AM/PM placements match the brand's stated facts", async () => {
    const guide = await getRoutineGuide();
    assert(guide.ok && guide.data, "routine guide should load");
    const find = (id: string) => guide.data!.products.find((p) => p.id === id);
    const toner = find("soft-reset-toner");
    assert(toner && toner.times.length === 1 && toner.times[0] === "pm", "the exfoliating toner must be PM-only");
    const spf = find("sunny-shield-spf50");
    assert(spf && spf.times.join() === "am" && spf.isFinalStep, "SPF must be AM-only and the final step");
    const cleanser = find("cloud-cleanser");
    assert(
      cleanser && cleanser.times.includes("am") && cleanser.times.includes("pm") && cleanser.stepOrder === 1,
      "the cleanser must be the first step in both AM and PM"
    );
    const oil = find("night-repair-oil");
    assert(oil && oil.times.join() === "pm" && oil.isFinalStep, "the facial oil must be the PM final step");
  });

  await test("the toner+oil 'alternate nights' caution is present and conditioned on both products", async () => {
    const guide = await getRoutineGuide();
    assert(guide.ok && guide.data, "routine guide should load");
    const caution = guide.data.cautions.find(
      (c) => c.whenAll.includes("soft-reset-toner") && c.whenAll.includes("night-repair-oil")
    );
    assert(caution && /alternate/i.test(caution.text), "the toner+oil alternate-nights caution must exist");
    assert(caution!.whenAll.length === 2, "the alternate-nights caution must require BOTH products to be selected");
  });

  group("Ops digest reads (ops-wide, read-only)");

  await test("listOrdersOps with status+aging surfaces only orders stuck in that status", async () => {
    // Seed a FRESH processing order (updated just now) alongside the baseline's
    // stale processing order (order-2026-0003, updated weeks ago).
    await patchDb((db) => {
      db.orders.push({
        id: "order-eval-fresh-0001",
        customerId: LIN_CUSTOMER,
        status: "processing",
        placedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [{ productId: "cloud-cleanser", quantity: 1, unitPriceNtd: 420 }],
        totalNtd: 420
      });
    });
    const stuck = await listOrdersOps({ status: "processing", stalerThanDays: 2 });
    assert(stuck.ok && stuck.data, stuck.error ?? "ops order read should succeed");
    const ids = stuck.data!.map((o) => o.id);
    assert(ids.includes("order-2026-0003"), "the long-stuck processing order must be surfaced");
    assert(!ids.includes("order-eval-fresh-0001"), "a freshly-updated processing order must NOT be flagged as stuck");
    assert(
      stuck.data!.every((o) => o.status === "processing"),
      "a status filter must return only orders in that status"
    );
    // Without the aging filter, the fresh processing order IS included (proving the
    // filter, not a missing order, excluded it above).
    const allProcessing = await listOrdersOps({ status: "processing" });
    assert(
      allProcessing.ok && allProcessing.data!.some((o) => o.id === "order-eval-fresh-0001"),
      "without an aging filter the fresh processing order is returned"
    );
  });

  await test("listLowStockProducts returns only at/under-threshold products, scarcest first", async () => {
    await patchDb((db) => {
      const find = (id: string) => db.products.find((p) => p.id === id)!;
      find("cloud-cleanser").stockQuantity = 3; // low
      find("cloud-cleanser").stockStatus = "low_stock";
      find("clear-day-gel").stockQuantity = 0; // out of stock
      find("clear-day-gel").stockStatus = "out_of_stock";
      find("calm-barrier-cream").stockQuantity = 50; // healthy -> must be excluded
      find("calm-barrier-cream").stockStatus = "in_stock";
    });
    const low = await listLowStockProducts();
    assert(low.ok && low.data, low.error ?? "low-stock read should succeed");
    const ids = low.data!.map((p) => p.id);
    assert(ids.includes("cloud-cleanser") && ids.includes("clear-day-gel"), "both low/out-of-stock products must be listed");
    assert(!ids.includes("calm-barrier-cream"), "a healthy-stock product must NOT be listed");
    assert(
      low.data!.every((p) => p.stockQuantity <= 5),
      "every listed product must be at or under the low-stock threshold"
    );
    const gel = ids.indexOf("clear-day-gel");
    const cleanser = ids.indexOf("cloud-cleanser");
    assert(gel < cleanser, "results must be scarcest-first (0 before 3)");
  });

  group("Owner notifications (outbound email — OWNER-ONLY)");

  // The notify config is read from the environment on every call. Set it here so
  // these tests are deterministic regardless of the developer's / CI's real .env,
  // and drive a captured transport so nothing ever hits the network.
  const NOTIFY_OWNER = "owner@example.com";
  process.env.OWNER_EMAIL = NOTIFY_OWNER;
  process.env.NOTIFY_FROM = "DeskClaw <onboarding@resend.dev>";
  // A dummy key so live-mode sends reach the (captured, network-free) transport;
  // it is never used to make a real request in these tests.
  process.env.RESEND_API_KEY = "re_test_dummy_key";

  await test("a handoff notification emails the OWNER (never the customer) and records the composed body", async () => {
    process.env.DESKCLAW_NOTIFY_MODE = "live";
    const { sent, transport } = captureTransport();
    // The skill files the handoff first, then composes + sends from its fields.
    const handoff = await createHandoff(CH, LIN, "urgent_handoff", "safety_reaction", "Reports a skin reaction.", "Lin reports a burning reaction after using the toner and wants help urgently.");
    assert(handoff.ok && handoff.data, handoff.error ?? "the handoff must record first");
    const subject = "Urgent: Lin reports a skin reaction";
    const body = "Classification: urgent_handoff. Lin says the toner caused burning and wants help fast. Reach her on simulated-chat (demo-lin).";
    const result = await notifyOwner({ kind: "handoff", subject, body, dedupeKey: handoff.data.id }, transport);
    assert(result.ok && result.data, result.error ?? "the owner notification should send");
    assert(result.data.status === "sent", "in live mode an accepted send is recorded as 'sent'");
    // OWNER-ONLY: the recipient is the configured owner, and that is the ONLY
    // address the transport was ever asked to send to. There is no customer path.
    assert(result.data.to === NOTIFY_OWNER, "the notification must be addressed to the owner");
    assert(sent.length === 1 && sent[0]?.to === NOTIFY_OWNER, "the transport must be asked to send to the owner and no one else");
    // The model-composed subject + body are persisted verbatim (the demo proof).
    assert(result.data.subject === subject && result.data.body === body, "the composed subject + body must be stored verbatim");
    assert((await notificationCount()) === 1, "exactly one notification must be recorded");
    // Audit trail.
    const logs = await listActionLogs(undefined, 20);
    assert(
      logs.data?.some((log) => log.type === "notify.owner" && log.status === "success"),
      "a sent owner notification must write a success audit log"
    );
  });

  await test("no email is sent for a 'continue' sentiment (nothing to notify on)", async () => {
    process.env.DESKCLAW_NOTIFY_MODE = "live";
    // 'continue' records no handoff, so the skill never reaches the notify step —
    // there is no handoff id to notify on. Assert the guard at the service seam.
    const calm = await createHandoff(CH, LIN, "continue", "calm", "Just a shipping question.", "Lin asked when her order ships.");
    assert(!calm.ok, "'continue' must not produce a handoff record");
    assert((await notificationCount()) === 0, "a calm conversation must send/record no owner notification");
  });

  await test("the same handoff is emailed only ONCE (dedupe rate-limit)", async () => {
    process.env.DESKCLAW_NOTIFY_MODE = "live";
    const { sent, transport } = captureTransport();
    const handoff = await createHandoff(CH, LIN, "handoff_recommended", "refund_dispute", "Chasing a refund.", "Lin is chasing a delayed refund and asked for a human.");
    assert(handoff.ok && handoff.data, "the handoff must record");
    const args = { kind: "handoff" as const, subject: "Handoff: refund chase", body: "Lin is chasing a refund; please follow up.", dedupeKey: handoff.data.id };
    const first = await notifyOwner(args, transport);
    const second = await notifyOwner(args, transport);
    assert(first.ok && second.ok, "both calls should succeed");
    assert(first.data?.id === second.data?.id, "a repeat for the same handoff must return the SAME record, not a new one");
    assert(sent.length === 1, "the email must be sent to the owner only once for one handoff");
    assert((await notificationCount()) === 1, "a deduped repeat must not create a second notification row");
  });

  await test("dry mode records + audits the composed email but sends nothing", async () => {
    process.env.DESKCLAW_NOTIFY_MODE = "dry";
    const { sent, transport } = captureTransport();
    const result = await notifyOwner(
      { kind: "order_placed", subject: "New order placed", body: "Order order_123 placed by Lin: 2 x Cloud Cleanser, NT$840.", dedupeKey: "order_123" },
      transport
    );
    assert(result.ok && result.data?.status === "recorded", "dry mode must record (not send) the notification");
    assert(sent.length === 0, "dry mode must NOT call the transport — no network, no real email");
    assert(result.data?.to === NOTIFY_OWNER, "a dry-recorded notification is still addressed to the owner only");
    assert((await notificationCount()) === 1, "the composed email is still persisted for audit/demo");
    process.env.DESKCLAW_NOTIFY_MODE = "live";
  });

  await test("an order_placed notification also goes to the owner", async () => {
    process.env.DESKCLAW_NOTIFY_MODE = "live";
    const { sent, transport } = captureTransport();
    const result = await notifyOwner(
      { kind: "order_placed", subject: "Order placed: NT$840", body: "Lin placed order order_456 — 2 x Cloud Cleanser, NT$840.", dedupeKey: "order_456" },
      transport
    );
    assert(result.ok && result.data?.kind === "order_placed", result.error ?? "an order notification should send");
    assert(sent.length === 1 && sent[0]?.to === NOTIFY_OWNER, "the order notification must reach the owner only");
  });

  await test("an ops_digest notification goes to the owner and is deduped to one per day", async () => {
    process.env.DESKCLAW_NOTIFY_MODE = "live";
    const { sent, transport } = captureTransport();
    const today = "2026-06-10"; // the digest's once-per-day dedupeKey is the date
    const before = await notificationCount();
    const args = {
      kind: "ops_digest" as const,
      subject: "Morning ops digest — 1 handoff, 1 stuck order, 2 low on stock",
      body: "Good morning. One open handoff to work, order-2026-0003 stuck in processing 11 days, and Clear Day Gel (0) + Cloud Cleanser (3) are low.",
      dedupeKey: today
    };
    const first = await notifyOwner(args, transport);
    const second = await notifyOwner(args, transport);
    assert(first.ok && first.data?.kind === "ops_digest", first.error ?? "an ops_digest notification should send");
    assert(first.data?.to === NOTIFY_OWNER, "the digest must be addressed to the owner only");
    assert(second.ok && second.data?.id === first.data?.id, "a second digest the same day must return the SAME record (deduped)");
    assert(sent.length === 1, "the digest must be emailed to the owner only once per day");
    assert((await notificationCount()) === before + 1, "a same-day re-run must not create a second digest row");
  });

  await test("a subject or body that is empty is refused (no blank emails)", async () => {
    process.env.DESKCLAW_NOTIFY_MODE = "live";
    const { sent, transport } = captureTransport();
    const blank = await notifyOwner({ kind: "handoff", subject: "   ", body: "", dedupeKey: "x" }, transport);
    assert(!blank.ok, "an empty subject/body must be refused");
    assert(sent.length === 0 && (await notificationCount()) === 0, "a refused notification sends and records nothing");
  });

  // Remove the temp sandbox DB; the real .local/shop-db.json was never touched.
  await rm(getShopDbPath(), { force: true });

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length} passed, ${failed.length} failed (${results.length} total)`);
  if (failed.length > 0) {
    console.error("\nFailed assertions:");
    for (const result of failed) {
      console.error(`  - ${result.name}: ${result.error}`);
    }
    process.exit(1);
  }
  console.log("All shop eval assertions passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
