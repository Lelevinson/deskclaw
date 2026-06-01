import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { readShopDb } from "../shop/store.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function money(value: number): string {
  return `NT$${value}`;
}

async function main(): Promise<void> {
  const db = await readShopDb();
  const customer = db.customers[0];
  const cart = customer ? db.carts.find((entry) => entry.customerId === customer.id) : undefined;
  const orders = customer ? db.orders.filter((entry) => entry.customerId === customer.id) : [];
  const returns = customer ? db.returns.filter((entry) => entry.customerId === customer.id) : [];
  const handoffs = customer ? db.handoffTickets.filter((entry) => entry.customerId === customer.id) : db.handoffTickets;
  const logs = db.actionLogs.slice(0, 10);

  const productsHtml = db.products
    .map(
      (product) => `<article class="card">
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.shortDescription)}</p>
        <p><strong>${money(product.priceNtd)}</strong> · ${escapeHtml(product.stockStatus)}</p>
      </article>`
    )
    .join("\n");

  const cartHtml = (cart?.items ?? [])
    .map((item) => {
      const product = db.products.find((entry) => entry.id === item.productId);
      return `<li>${escapeHtml(product?.name ?? item.productId)} × ${item.quantity}</li>`;
    })
    .join("\n") || "<li>Cart is empty.</li>";

  const ordersHtml = orders
    .map(
      (order) => `<li><strong>${escapeHtml(order.orderNumber)}</strong> — ${escapeHtml(order.status)} — ${money(order.totalNtd)}</li>`
    )
    .join("\n") || "<li>No orders.</li>";

  const returnsHtml = returns
    .map(
      (request) => `<li><strong>${escapeHtml(request.orderNumber)}</strong> — ${escapeHtml(request.requestType)} — ${escapeHtml(request.status)} — ${escapeHtml(request.reason)}</li>`
    )
    .join("\n") || "<li>No return requests.</li>";

  const handoffsHtml = handoffs
    .map(
      (ticket) => `<li><strong>${escapeHtml(ticket.priority)}</strong> — ${escapeHtml(ticket.status)} — ${escapeHtml(ticket.reason)}</li>`
    )
    .join("\n") || "<li>No handoff tickets.</li>";

  const logsHtml = logs
    .map((log) => `<li>${escapeHtml(log.createdAt)} — ${escapeHtml(log.type)} — ${escapeHtml(log.summary)}</li>`)
    .join("\n") || "<li>No action logs yet.</li>";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>DeskClaw Mock Storefront</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; color: #1f2937; background: #f8fafc; }
    main { display: grid; gap: 1.5rem; }
    section { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem; }
    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 1rem; }
  </style>
</head>
<body>
  <main>
    <h1>DeskClaw Mock Storefront</h1>
    <section><h2>Catalog</h2><div class="grid">${productsHtml}</div></section>
    <section><h2>${customer ? escapeHtml(customer.displayName) : "Demo Customer"} Cart</h2><ul>${cartHtml}</ul></section>
    <section><h2>Orders</h2><ul>${ordersHtml}</ul></section>
    <section><h2>Return Requests</h2><ul>${returnsHtml}</ul></section>
    <section><h2>Handoff Tickets</h2><ul>${handoffsHtml}</ul></section>
    <section><h2>Recent Action Logs</h2><ul>${logsHtml}</ul></section>
  </main>
</body>
</html>
`;

  const outputPath = path.resolve(process.cwd(), ".local/storefront.html");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
  console.log(outputPath);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
