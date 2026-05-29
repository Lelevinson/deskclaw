import {
  confirmLatestAddItemForChannel,
  confirmLatestRemoveItemForChannel,
  confirmLatestUpdateQuantityForChannel,
  getCartForChannel,
  listActionLogs,
  lookupCustomerByChannel,
  previewAddItemForChannel,
  previewRemoveItemForChannel,
  previewUpdateQuantityForChannel,
  searchProducts
} from "../shop/service.js";
import { resetShopDb } from "../shop/store.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const dbPath = await resetShopDb();
  console.log(`Reset shop database at ${dbPath}`);

  const customer = await lookupCustomerByChannel("simulated-chat", "demo-lin");
  assert(customer.ok && customer.data?.customerId === "customer-demo-lin", "demo-lin should map to customer-demo-lin");
  assert(customer.data?.accountLinkId === "link-demo-lin-simulated-chat", "demo-lin should use the simulated account link");
  console.log("ok customer lookup");

  const unknownCustomer = await lookupCustomerByChannel("simulated-chat", "unknown-user");
  assert(!unknownCustomer.ok, "unknown channel identity should not map to a customer");
  console.log("ok unknown identity refusal");

  const typedCustomerId = await getCartForChannel("simulated-chat", "customer-demo-lin");
  assert(!typedCustomerId.ok, "typing a customer id as the external channel id should not grant cart access");
  console.log("ok customer-id-only refusal");

  const emptyCart = await getCartForChannel("simulated-chat", "demo-lin");
  assert(emptyCart.ok && emptyCart.data?.items.length === 0, "cart should start empty");
  console.log("ok empty cart");

  const search = await searchProducts("cloud cleanser", 3);
  assert(search.ok && search.data?.[0]?.product.id === "cloud-cleanser", "cloud cleanser search should resolve");
  console.log("ok product search");

  const preview = await previewAddItemForChannel("simulated-chat", "demo-lin", "cloud-cleanser", 1);
  assert(preview.ok && preview.data?.pendingAction.status === "pending", "add-to-cart preview should be pending");
  assert(
    preview.data?.pendingAction.accountLinkId === "link-demo-lin-simulated-chat",
    "pending action should bind to the linked channel identity"
  );

  const cartAfterPreview = await getCartForChannel("simulated-chat", "demo-lin");
  assert(cartAfterPreview.ok && cartAfterPreview.data?.items.length === 0, "preview must not mutate cart");
  console.log("ok preview without mutation");

  const confirm = await confirmLatestAddItemForChannel("simulated-chat", "demo-lin", "cloud-cleanser", 1);
  assert(confirm.ok, confirm.error ?? "confirm latest add should succeed");
  assert(confirm.data?.cart.items[0]?.productId === "cloud-cleanser", "cart should contain Cloud Cleanser");
  assert(confirm.data.cart.items[0]?.quantity === 1, "cart should contain quantity 1");
  console.log("ok confirm add to cart");

  const logs = await listActionLogs("customer-demo-lin", 10);
  assert(logs.ok && logs.data?.some((log) => log.type === "cart.add_item" && log.status === "success"), "success log should exist");
  console.log("ok action log");

  await resetShopDb();
  const outOfStock = await previewAddItemForChannel("simulated-chat", "demo-lin", "night-repair-oil", 1);
  assert(!outOfStock.ok && outOfStock.error?.includes("out of stock"), "out-of-stock preview should fail");
  const cartAfterOutOfStock = await getCartForChannel("simulated-chat", "demo-lin");
  assert(cartAfterOutOfStock.ok && cartAfterOutOfStock.data?.items.length === 0, "out-of-stock attempt must not mutate cart");
  console.log("ok out-of-stock refusal");

  await resetShopDb();
  const firstPreview = await previewAddItemForChannel("simulated-chat", "demo-lin", "cloud-cleanser", 1);
  const secondPreview = await previewAddItemForChannel("simulated-chat", "demo-lin", "cloud-cleanser", 1);
  assert(firstPreview.ok && secondPreview.ok, "duplicate previews should both return successfully");
  const latestConfirm = await confirmLatestAddItemForChannel("simulated-chat", "demo-lin", "cloud-cleanser", 1);
  assert(latestConfirm.ok, latestConfirm.error ?? "latest duplicate preview should confirm");
  const cartAfterDuplicate = await getCartForChannel("simulated-chat", "demo-lin");
  assert(cartAfterDuplicate.data?.items[0]?.quantity === 1, "only latest duplicate preview should commit once");
  console.log("ok duplicate preview handling");

  // --- cart-edit: remove item ---
  await resetShopDb();
  await previewAddItemForChannel("simulated-chat", "demo-lin", "cloud-cleanser", 2);
  await confirmLatestAddItemForChannel("simulated-chat", "demo-lin", "cloud-cleanser", 2);
  const removeMissing = await previewRemoveItemForChannel("simulated-chat", "demo-lin", "soft-reset-toner");
  assert(!removeMissing.ok && removeMissing.error?.includes("not in your cart"), "removing an item not in the cart should fail");
  const removePreview = await previewRemoveItemForChannel("simulated-chat", "demo-lin", "cloud-cleanser");
  assert(removePreview.ok && removePreview.data?.pendingAction.type === "cart.remove_item", "remove preview should stage a remove action");
  const cartAfterRemovePreview = await getCartForChannel("simulated-chat", "demo-lin");
  assert(cartAfterRemovePreview.data?.items[0]?.quantity === 2, "remove preview must not mutate cart");
  const removeConfirm = await confirmLatestRemoveItemForChannel("simulated-chat", "demo-lin", "cloud-cleanser");
  assert(removeConfirm.ok && removeConfirm.data?.cart.items.length === 0, "confirming remove should empty the cart");
  const removeLogs = await listActionLogs("customer-demo-lin", 10);
  assert(removeLogs.data?.some((log) => log.type === "cart.remove_item" && log.status === "success"), "remove success log should exist");
  console.log("ok remove item");

  // --- cart-edit: update quantity ---
  await resetShopDb();
  await previewAddItemForChannel("simulated-chat", "demo-lin", "cloud-cleanser", 1);
  await confirmLatestAddItemForChannel("simulated-chat", "demo-lin", "cloud-cleanser", 1);
  const updateMissing = await previewUpdateQuantityForChannel("simulated-chat", "demo-lin", "soft-reset-toner", 2);
  assert(!updateMissing.ok && updateMissing.error?.includes("not in your cart"), "updating an item not in the cart should fail");
  const updateZero = await previewUpdateQuantityForChannel("simulated-chat", "demo-lin", "cloud-cleanser", 0);
  assert(!updateZero.ok, "updating quantity to 0 should be rejected (use remove instead)");
  const updateSame = await previewUpdateQuantityForChannel("simulated-chat", "demo-lin", "cloud-cleanser", 1);
  assert(!updateSame.ok && updateSame.error?.includes("already at quantity"), "updating to the current quantity should be a no-op rejection");
  const updatePreview = await previewUpdateQuantityForChannel("simulated-chat", "demo-lin", "cloud-cleanser", 3);
  assert(updatePreview.ok && updatePreview.data?.pendingAction.quantity === 3, "update preview should stage the target quantity");
  const cartAfterUpdatePreview = await getCartForChannel("simulated-chat", "demo-lin");
  assert(cartAfterUpdatePreview.data?.items[0]?.quantity === 1, "update preview must not mutate cart");
  const updateConfirm = await confirmLatestUpdateQuantityForChannel("simulated-chat", "demo-lin", "cloud-cleanser", 3);
  assert(updateConfirm.ok && updateConfirm.data?.cart.items[0]?.quantity === 3, "confirming update should set the new quantity");
  console.log("ok update quantity");

  // --- cart-edit: update quantity above stock ---
  await resetShopDb();
  await previewAddItemForChannel("simulated-chat", "demo-lin", "travel-mini-trio", 1);
  await confirmLatestAddItemForChannel("simulated-chat", "demo-lin", "travel-mini-trio", 1);
  const aboveStock = await previewUpdateQuantityForChannel("simulated-chat", "demo-lin", "travel-mini-trio", 4);
  assert(!aboveStock.ok && aboveStock.error?.includes("available"), "updating above available stock should fail");
  const cartAfterAboveStock = await getCartForChannel("simulated-chat", "demo-lin");
  assert(cartAfterAboveStock.data?.items[0]?.quantity === 1, "failed update must not mutate cart");
  console.log("ok update above stock refusal");

  await resetShopDb();
  console.log("Shop smoke tests passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
