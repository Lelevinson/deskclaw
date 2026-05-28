import {
  confirmLatestAddItem,
  getCart,
  listActionLogs,
  lookupCustomerByChannel,
  previewAddItem,
  searchProducts
} from "../commerce/service.js";
import { resetCommerceDb } from "../commerce/store.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const dbPath = await resetCommerceDb();
  console.log(`Reset commerce database at ${dbPath}`);

  const customer = await lookupCustomerByChannel("simulated-chat", "demo-lin");
  assert(customer.ok && customer.data?.id === "customer-demo-lin", "demo-lin should map to customer-demo-lin");
  console.log("ok customer lookup");

  const emptyCart = await getCart("customer-demo-lin");
  assert(emptyCart.ok && emptyCart.data?.items.length === 0, "cart should start empty");
  console.log("ok empty cart");

  const search = await searchProducts("cloud cleanser", 3);
  assert(search.ok && search.data?.[0]?.product.id === "cloud-cleanser", "cloud cleanser search should resolve");
  console.log("ok product search");

  const preview = await previewAddItem("customer-demo-lin", "cloud-cleanser", 1);
  assert(preview.ok && preview.data?.pendingAction.status === "pending", "add-to-cart preview should be pending");

  const cartAfterPreview = await getCart("customer-demo-lin");
  assert(cartAfterPreview.ok && cartAfterPreview.data?.items.length === 0, "preview must not mutate cart");
  console.log("ok preview without mutation");

  const confirm = await confirmLatestAddItem("customer-demo-lin", "cloud-cleanser", 1);
  assert(confirm.ok, confirm.error ?? "confirm latest add should succeed");
  assert(confirm.data?.cart.items[0]?.productId === "cloud-cleanser", "cart should contain Cloud Cleanser");
  assert(confirm.data.cart.items[0]?.quantity === 1, "cart should contain quantity 1");
  console.log("ok confirm add to cart");

  const logs = await listActionLogs("customer-demo-lin", 10);
  assert(logs.ok && logs.data?.some((log) => log.type === "cart.add_item" && log.status === "success"), "success log should exist");
  console.log("ok action log");

  await resetCommerceDb();
  const outOfStock = await previewAddItem("customer-demo-lin", "night-repair-oil", 1);
  assert(!outOfStock.ok && outOfStock.error?.includes("out of stock"), "out-of-stock preview should fail");
  const cartAfterOutOfStock = await getCart("customer-demo-lin");
  assert(cartAfterOutOfStock.ok && cartAfterOutOfStock.data?.items.length === 0, "out-of-stock attempt must not mutate cart");
  console.log("ok out-of-stock refusal");

  await resetCommerceDb();
  const firstPreview = await previewAddItem("customer-demo-lin", "cloud-cleanser", 1);
  const secondPreview = await previewAddItem("customer-demo-lin", "cloud-cleanser", 1);
  assert(firstPreview.ok && secondPreview.ok, "duplicate previews should both return successfully");
  const latestConfirm = await confirmLatestAddItem("customer-demo-lin", "cloud-cleanser", 1);
  assert(latestConfirm.ok, latestConfirm.error ?? "latest duplicate preview should confirm");
  const cartAfterDuplicate = await getCart("customer-demo-lin");
  assert(cartAfterDuplicate.data?.items[0]?.quantity === 1, "only latest duplicate preview should commit once");
  console.log("ok duplicate preview handling");

  await resetCommerceDb();
  console.log("Commerce smoke tests passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
