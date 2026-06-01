import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  confirmAddItemForChannel,
  confirmRemoveItemForChannel,
  confirmReturnForChannel,
  confirmUpdateQuantityForChannel,
  createHandoffTicket,
  getCartForChannel,
  getOrderForChannel,
  getReturnStatusForChannel,
  listActionLogs,
  listOrdersForChannel,
  lookupCustomerByChannel,
  previewAddItemForChannel,
  previewRemoveItemForChannel,
  previewReturnForChannel,
  previewUpdateQuantityForChannel,
  searchProducts
} from "../shop/service.js";
import { getShopDataDir, readShopDb, resetShopDb } from "../shop/store.js";
import type { ReturnRequestType } from "../shop/types.js";

const DEFAULT_CHANNEL = "simulated-chat";
const DEFAULT_EXTERNAL_USER_ID = "demo-lin";

interface DemoServerOptions {
  port?: number;
  host?: string;
}

type JsonRecord = Record<string, unknown>;

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function sendHtml(res: ServerResponse, html: string): void {
  res.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(html);
}

function notFound(res: ServerResponse): void {
  sendJson(res, 404, { ok: false, error: "Not found." });
}

function methodNotAllowed(res: ServerResponse): void {
  sendJson(res, 405, { ok: false, error: "Method not allowed." });
}

async function readBody(req: IncomingMessage): Promise<JsonRecord> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as JsonRecord;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function int(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
}

function returnRequestType(value: unknown): ReturnRequestType {
  return value === "exchange" ? "exchange" : "refund";
}

function htmlPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DeskClaw Local Demo</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; background: #f8fafc; color: #172033; }
    header { background: #111827; color: white; padding: 1rem 1.5rem; }
    main { display: grid; gap: 1rem; padding: 1rem; max-width: 1200px; margin: 0 auto; }
    section { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
    label { display: block; margin: .5rem 0 .25rem; font-weight: 600; }
    input, select, textarea, button { font: inherit; width: 100%; box-sizing: border-box; padding: .5rem; border: 1px solid #cbd5e1; border-radius: 8px; }
    button { cursor: pointer; background: #2563eb; color: white; border: 0; margin-top: .75rem; }
    button.secondary { background: #475569; }
    pre { white-space: pre-wrap; background: #0f172a; color: #e2e8f0; padding: .75rem; border-radius: 8px; overflow: auto; max-height: 320px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: .75rem; }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: .75rem; }
    .muted { color: #64748b; }
  </style>
</head>
<body>
  <header>
    <h1>DeskClaw Local Demo</h1>
    <p>Local-only UI for testing catalog, cart, orders, returns, handoffs, and compatibility data.</p>
  </header>
  <main>
    <section>
      <h2>Demo identity</h2>
      <div class="grid">
        <label>Channel <input id="channel" value="${DEFAULT_CHANNEL}"></label>
        <label>External user id <input id="externalUserId" value="${DEFAULT_EXTERNAL_USER_ID}"></label>
      </div>
      <button onclick="loadState()">Refresh state</button>
      <button class="secondary" onclick="resetDb()">Reset local shop DB</button>
      <p class="muted">Use an unknown external user id to verify identity-gated failures.</p>
    </section>

    <section>
      <h2>Catalog and compatibility</h2>
      <div class="grid">
        <label>Search products <input id="searchQuery" value="gentle cleanser"></label>
        <button onclick="searchCatalog()">Search</button>
      </div>
      <div id="products" class="cards"></div>
      <details><summary>Compatibility / policy reference</summary><pre id="reference"></pre></details>
    </section>

    <section>
      <h2>Cart actions</h2>
      <div class="grid">
        <label>Action <select id="cartAction"><option value="add">add</option><option value="remove">remove</option><option value="update">update quantity</option></select></label>
        <label>Product id <input id="cartProduct" value="cloud-cleanser"></label>
        <label>Quantity <input id="cartQuantity" type="number" value="1"></label>
      </div>
      <button onclick="previewCart()">Preview cart action</button>
      <button onclick="confirmCart()">Confirm staged cart action</button>
      <pre id="cartResult"></pre>
    </section>

    <section>
      <h2>Order status</h2>
      <label>Order id or number <input id="orderId" value="DC-1002"></label>
      <button onclick="lookupOrder()">Lookup order</button>
      <pre id="orderResult"></pre>
    </section>

    <section>
      <h2>Return / exchange intake</h2>
      <div class="grid">
        <label>Order id or number <input id="returnOrder" value="DC-1002"></label>
        <label>Type <select id="returnType"><option value="refund">refund</option><option value="exchange">exchange</option></select></label>
      </div>
      <label>Reason <textarea id="returnReason">Package arrived damaged</textarea></label>
      <button onclick="previewReturnRequest()">Preview return request</button>
      <button onclick="confirmReturnRequest()">Confirm return request</button>
      <button class="secondary" onclick="returnStatus()">Read return status</button>
      <pre id="returnResult"></pre>
    </section>

    <section>
      <h2>Human handoff ticket</h2>
      <label>Customer message <textarea id="handoffMessage">I want a human now.</textarea></label>
      <label>Reason <input id="handoffReason" value="explicit human request"></label>
      <label>Suggested reply <input id="handoffReply" value="I’ll bring in a teammate to help from here."></label>
      <label>Priority <select id="handoffPriority"><option value="standard">standard</option><option value="urgent">urgent</option></select></label>
      <button onclick="createHandoff()">Create handoff ticket</button>
      <pre id="handoffResult"></pre>
    </section>

    <section>
      <h2>Current state</h2>
      <pre id="state"></pre>
    </section>
  </main>
<script>
let stagedCart = null;
let stagedReturn = null;
const $ = (id) => document.getElementById(id);
const identity = () => ({ channel: $('channel').value, externalUserId: $('externalUserId').value });
async function api(path, options = {}) {
  const response = await fetch(path, { headers: { 'content-type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data, null, 2));
  return data;
}
function show(id, data) { $(id).textContent = JSON.stringify(data, null, 2); }
async function loadState() { show('state', await api('/api/state?' + new URLSearchParams(identity()))); }
async function resetDb() { show('state', await api('/api/reset', { method: 'POST', body: '{}' })); await loadState(); }
async function searchCatalog() {
  const data = await api('/api/search?q=' + encodeURIComponent($('searchQuery').value));
  $('products').innerHTML = (data.data || []).map((item) => '<div class="card"><strong>' + item.product.name + '</strong><br>' + item.product.id + '<br>NT$' + item.product.priceNtd + '<br>' + item.product.shortDescription + '</div>').join('');
}
async function loadReference() { const data = await api('/api/reference'); $('reference').textContent = data.compatibility; }
async function previewCart() {
  const body = { ...identity(), action: $('cartAction').value, productId: $('cartProduct').value, quantity: Number($('cartQuantity').value) };
  const data = await api('/api/cart/preview', { method: 'POST', body: JSON.stringify(body) });
  stagedCart = { action: body.action, pendingActionId: data.data?.pendingAction?.id };
  show('cartResult', data);
  await loadState();
}
async function confirmCart() {
  const body = { ...identity(), ...stagedCart, productId: $('cartProduct').value, quantity: Number($('cartQuantity').value) };
  const data = await api('/api/cart/confirm', { method: 'POST', body: JSON.stringify(body) });
  show('cartResult', data);
  await loadState();
}
async function lookupOrder() { show('orderResult', await api('/api/order/get', { method: 'POST', body: JSON.stringify({ ...identity(), orderIdOrNumber: $('orderId').value }) })); }
async function previewReturnRequest() {
  const data = await api('/api/return/preview', { method: 'POST', body: JSON.stringify({ ...identity(), orderIdOrNumber: $('returnOrder').value, requestType: $('returnType').value, reason: $('returnReason').value }) });
  stagedReturn = data.data?.returnRequest?.id;
  show('returnResult', data);
  await loadState();
}
async function confirmReturnRequest() {
  const data = await api('/api/return/confirm', { method: 'POST', body: JSON.stringify({ ...identity(), returnRequestId: stagedReturn }) });
  show('returnResult', data);
  await loadState();
}
async function returnStatus() { show('returnResult', await api('/api/return/status?' + new URLSearchParams({ ...identity(), filter: $('returnOrder').value }))); }
async function createHandoff() {
  const data = await api('/api/handoff', { method: 'POST', body: JSON.stringify({ ...identity(), customerMessage: $('handoffMessage').value, reason: $('handoffReason').value, suggestedReply: $('handoffReply').value, priority: $('handoffPriority').value }) });
  show('handoffResult', data);
  await loadState();
}
loadState(); searchCatalog(); loadReference();
</script>
</body>
</html>`;
}

async function statePayload(url: URL): Promise<unknown> {
  const channel = url.searchParams.get("channel") || DEFAULT_CHANNEL;
  const externalUserId = url.searchParams.get("externalUserId") || DEFAULT_EXTERNAL_USER_ID;
  const [customer, cart, orders, returns, logs, db] = await Promise.all([
    lookupCustomerByChannel(channel, externalUserId),
    getCartForChannel(channel, externalUserId),
    listOrdersForChannel(channel, externalUserId, 10),
    getReturnStatusForChannel(channel, externalUserId),
    listActionLogs(undefined, 20),
    readShopDb()
  ]);
  return {
    ok: true,
    identity: { channel, externalUserId },
    customer,
    cart,
    orders,
    returns,
    handoffTickets: db.handoffTickets.slice(0, 10),
    actionLogs: logs,
    products: db.products
  };
}

async function handleApi(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/reset") {
    const dbPath = await resetShopDb();
    sendJson(res, 200, { ok: true, dbPath });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/state") {
    sendJson(res, 200, await statePayload(url));
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/search") {
    sendJson(res, 200, await searchProducts(url.searchParams.get("q") || "", 10));
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/reference") {
    const compatibility = await readFile(path.join(getShopDataDir(), "catalog/compatibility.md"), "utf8");
    sendJson(res, 200, { ok: true, compatibility });
    return;
  }
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }
  const body = await readBody(req);
  const channel = text(body.channel, DEFAULT_CHANNEL);
  const externalUserId = text(body.externalUserId, DEFAULT_EXTERNAL_USER_ID);

  if (url.pathname === "/api/cart/preview") {
    const action = text(body.action, "add");
    const productId = text(body.productId);
    const quantity = int(body.quantity, 1);
    if (action === "remove") sendJson(res, 200, await previewRemoveItemForChannel(channel, externalUserId, productId));
    else if (action === "update") sendJson(res, 200, await previewUpdateQuantityForChannel(channel, externalUserId, productId, quantity));
    else sendJson(res, 200, await previewAddItemForChannel(channel, externalUserId, productId, quantity));
    return;
  }
  if (url.pathname === "/api/cart/confirm") {
    const action = text(body.action, "add");
    const pendingActionId = text(body.pendingActionId);
    if (action === "remove") sendJson(res, 200, await confirmRemoveItemForChannel(channel, externalUserId, pendingActionId));
    else if (action === "update") sendJson(res, 200, await confirmUpdateQuantityForChannel(channel, externalUserId, pendingActionId));
    else sendJson(res, 200, await confirmAddItemForChannel(channel, externalUserId, pendingActionId));
    return;
  }
  if (url.pathname === "/api/order/get") {
    sendJson(res, 200, await getOrderForChannel(channel, externalUserId, text(body.orderIdOrNumber)));
    return;
  }
  if (url.pathname === "/api/return/preview") {
    sendJson(res, 200, await previewReturnForChannel(channel, externalUserId, text(body.orderIdOrNumber), returnRequestType(body.requestType), text(body.reason)));
    return;
  }
  if (url.pathname === "/api/return/confirm") {
    sendJson(res, 200, await confirmReturnForChannel(channel, externalUserId, text(body.returnRequestId)));
    return;
  }
  if (url.pathname === "/api/handoff") {
    sendJson(res, 200, await createHandoffTicket(text(body.customerMessage), text(body.reason), text(body.suggestedReply), body.priority === "urgent" ? "urgent" : "standard", channel, externalUserId));
    return;
  }
  notFound(res);
}

export function createDemoServer(): Server {
  return createServer((req, res) => {
    const url = new URL(req.url || "/", "http://localhost");
    (async () => {
      if (req.method === "GET" && url.pathname === "/") {
        sendHtml(res, htmlPage());
        return;
      }
      if (req.method === "GET" && url.pathname === "/api/return/status") {
        const channel = url.searchParams.get("channel") || DEFAULT_CHANNEL;
        const externalUserId = url.searchParams.get("externalUserId") || DEFAULT_EXTERNAL_USER_ID;
        const filter = url.searchParams.get("filter") || undefined;
        sendJson(res, 200, await getReturnStatusForChannel(channel, externalUserId, filter));
        return;
      }
      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url);
        return;
      }
      notFound(res);
    })().catch((error: unknown) => {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
    });
  });
}

export async function startDemoServer(options: DemoServerOptions = {}): Promise<Server> {
  const port = options.port ?? Number(process.env.PORT || 8787);
  const host = options.host ?? process.env.HOST ?? "127.0.0.1";
  const server = createDemoServer();
  await new Promise<void>((resolve) => server.listen(port, host, resolve));
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  console.log(`DeskClaw demo running at http://${host}:${actualPort}`);
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startDemoServer().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
