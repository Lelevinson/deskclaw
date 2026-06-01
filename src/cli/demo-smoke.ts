import { rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

process.env.DESKCLAW_SHOP_DB_PATH = path.join(os.tmpdir(), `deskclaw-demo-smoke-${process.pid}.json`);

const { startDemoServer } = await import("./demo-server.js");
const { getShopDbPath, resetShopDb } = await import("../shop/store.js");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function post(baseUrl: string, pathName: string, body: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  assert(response.ok, `${pathName} returned ${response.status}`);
  return (await response.json()) as { ok: boolean; data?: any; error?: string };
}

await resetShopDb();
const server = await startDemoServer({ port: 0, host: "127.0.0.1" });
const address = server.address();
assert(typeof address === "object" && address, "server should expose an address");
const baseUrl = `http://127.0.0.1:${address.port}`;
try {
  const html = await fetch(baseUrl);
  assert(html.ok, "demo home should load");
  assert((await html.text()).includes("DeskClaw Local Demo"), "demo home should contain title");

  const state = await fetch(`${baseUrl}/api/state?channel=simulated-chat&externalUserId=demo-lin`);
  assert(state.ok, "state endpoint should load");
  const stateJson = (await state.json()) as any;
  assert(stateJson.products.length > 0, "state should include products");

  const search = await fetch(`${baseUrl}/api/search?q=cloud%20cleanser`);
  const searchJson = (await search.json()) as any;
  assert(searchJson.data[0].product.id === "cloud-cleanser", "search should find cloud cleanser");

  const cartPreview = await post(baseUrl, "/api/cart/preview", {
    channel: "simulated-chat",
    externalUserId: "demo-lin",
    action: "add",
    productId: "cloud-cleanser",
    quantity: 1
  });
  assert(cartPreview.ok && cartPreview.data.pendingAction.id, "cart preview should stage an action");
  const cartConfirm = await post(baseUrl, "/api/cart/confirm", {
    channel: "simulated-chat",
    externalUserId: "demo-lin",
    action: "add",
    pendingActionId: cartPreview.data.pendingAction.id
  });
  assert(cartConfirm.ok, cartConfirm.error ?? "cart confirm should succeed");

  const order = await post(baseUrl, "/api/order/get", {
    channel: "simulated-chat",
    externalUserId: "demo-lin",
    orderIdOrNumber: "DC-1002"
  });
  assert(order.ok && order.data.orderNumber === "DC-1002", "order lookup should succeed");

  const returnPreview = await post(baseUrl, "/api/return/preview", {
    channel: "simulated-chat",
    externalUserId: "demo-lin",
    orderIdOrNumber: "DC-1002",
    requestType: "refund",
    reason: "Package arrived damaged"
  });
  assert(returnPreview.ok && returnPreview.data.returnRequest.id, "return preview should stage a request");
  const returnConfirm = await post(baseUrl, "/api/return/confirm", {
    channel: "simulated-chat",
    externalUserId: "demo-lin",
    returnRequestId: returnPreview.data.returnRequest.id
  });
  assert(returnConfirm.ok && returnConfirm.data.returnRequest.status === "submitted", "return confirm should submit");

  const handoff = await post(baseUrl, "/api/handoff", {
    channel: "simulated-chat",
    externalUserId: "demo-lin",
    customerMessage: "I want a human now",
    reason: "explicit human request",
    suggestedReply: "I’ll bring in a teammate to help from here.",
    priority: "standard"
  });
  assert(handoff.ok && handoff.data.ticket.status === "open", "handoff should create a ticket");

  console.log("Demo server smoke test passed.");
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await rm(getShopDbPath(), { force: true });
}
