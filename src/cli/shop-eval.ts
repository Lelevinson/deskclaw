/**
 * Tool-level eval harness for the DeskClaw shop service.
 *
 * Deterministic, no model in the loop: it drives the `src/shop` service
 * functions directly and asserts the safety-critical guarantees the roadmap
 * names (identity gating, ownership proof, preview->confirm, expiry, refusals,
 * audit logging) across all three PendingAction types.
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
  confirmLatestAddItemForChannel,
  confirmLatestRemoveItemForChannel,
  confirmLatestUpdateQuantityForChannel,
  confirmRemoveItemForChannel,
  confirmUpdateQuantityForChannel,
  getCartForChannel,
  getOrderForChannel,
  listActionLogs,
  listOrdersForChannel,
  lookupCustomerByChannel,
  previewAddItemForChannel,
  previewRemoveItemForChannel,
  previewUpdateQuantityForChannel,
  searchProducts
} from "../shop/service.js";
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

// --- a second customer injected into the runtime DB (never into data/) ---
const MALLORY_EXTERNAL = "eval-mallory";
const MALLORY_CUSTOMER = "customer-eval-mallory";
const MALLORY_LINK = "link-eval-mallory-simulated-chat";
const MALLORY_ORDER = "order-eval-mallory-0001";

// --- a seeded order owned by the demo customer (from the data/ baseline) ---
const LIN_SHIPPED_ORDER = "order-2026-0002"; // shipped, carries tracking fields

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
