import { randomUUID } from "node:crypto";

import { readShopDb, writeShopDb } from "./store.js";
import type {
  AccountLink,
  ActionLog,
  Cart,
  CartLine,
  CartView,
  Customer,
  LinkedCustomer,
  Order,
  OrderLine,
  OrderSummary,
  OrderView,
  PendingAction,
  Product,
  ShopDatabase
} from "./types.js";

const PENDING_ACTION_TTL_MS = 60 * 60 * 1000;

export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ProductSearchResult {
  product: Product;
  score: number;
  reason: string;
}

interface LinkedCustomerRecord {
  customer: Customer;
  accountLink: AccountLink;
  publicView: LinkedCustomer;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

function addLog(db: ShopDatabase, log: Omit<ActionLog, "id" | "createdAt">): void {
  db.actionLogs.unshift({
    id: `log_${randomUUID()}`,
    createdAt: nowIso(),
    ...log
  });
  db.actionLogs = db.actionLogs.slice(0, 200);
}

function findCustomer(db: ShopDatabase, customerId: string): Customer | undefined {
  return db.customers.find((customer) => customer.id === customerId);
}

function buildLinkedCustomer(customer: Customer, accountLink: AccountLink): LinkedCustomer {
  return {
    customerId: customer.id,
    displayName: customer.displayName,
    accountLinkId: accountLink.id,
    channel: accountLink.channel,
    externalUserId: accountLink.externalUserId
  };
}

function resolveLinkedCustomer(
  db: ShopDatabase,
  channel: string,
  externalUserId: string
): ServiceResult<LinkedCustomerRecord> {
  const normalizedChannel = normalize(channel);
  const normalizedExternalId = normalize(externalUserId);
  const accountLink = (db.accountLinks ?? []).find(
    (entry) =>
      normalize(entry.channel) === normalizedChannel &&
      normalize(entry.externalUserId) === normalizedExternalId
  );

  if (!accountLink || accountLink.status !== "linked") {
    return { ok: false, error: "No linked customer account was found for that channel identity." };
  }

  const customer = findCustomer(db, accountLink.customerId);
  if (!customer) {
    return { ok: false, error: "Linked customer account is missing." };
  }

  return {
    ok: true,
    data: {
      customer,
      accountLink,
      publicView: buildLinkedCustomer(customer, accountLink)
    }
  };
}

function findProduct(db: ShopDatabase, productId: string): Product | undefined {
  return db.products.find((product) => product.id === productId);
}

function supersedePendingActions(
  db: ShopDatabase,
  customerId: string,
  type: PendingAction["type"],
  productId: string
): void {
  for (const pending of db.pendingActions) {
    if (
      pending.status === "pending" &&
      pending.type === type &&
      pending.customerId === customerId &&
      pending.productId === productId
    ) {
      pending.status = "expired";
    }
  }
}

function findOrCreateCart(db: ShopDatabase, customerId: string): Cart {
  let cart = db.carts.find((entry) => entry.customerId === customerId);
  if (!cart) {
    cart = { customerId, items: [] };
    db.carts.push(cart);
  }
  return cart;
}

function buildCartView(db: ShopDatabase, cart: Cart): CartView {
  const items: CartLine[] = cart.items
    .map((item) => {
      const product = findProduct(db, item.productId);
      if (!product) {
        return undefined;
      }

      return {
        productId: product.id,
        name: product.name,
        priceNtd: product.priceNtd,
        quantity: item.quantity,
        subtotalNtd: product.priceNtd * item.quantity,
        stockStatus: product.stockStatus
      };
    })
    .filter((line): line is CartLine => Boolean(line));

  return {
    customerId: cart.customerId,
    items,
    totalNtd: items.reduce((sum, item) => sum + item.subtotalNtd, 0)
  };
}

function buildOrderLine(db: ShopDatabase, item: Order["items"][number]): OrderLine {
  const product = findProduct(db, item.productId);
  return {
    productId: item.productId,
    // Names live in the catalog; fall back to the id if the product was retired.
    name: product?.name ?? item.productId,
    quantity: item.quantity,
    unitPriceNtd: item.unitPriceNtd,
    subtotalNtd: item.unitPriceNtd * item.quantity
  };
}

function buildOrderSummary(order: Order): OrderSummary {
  return {
    id: order.id,
    status: order.status,
    placedAt: order.placedAt,
    updatedAt: order.updatedAt,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    totalNtd: order.totalNtd
  };
}

function buildOrderView(db: ShopDatabase, order: Order): OrderView {
  return {
    id: order.id,
    status: order.status,
    placedAt: order.placedAt,
    updatedAt: order.updatedAt,
    items: order.items.map((item) => buildOrderLine(db, item)),
    totalNtd: order.totalNtd,
    shipping: order.shipping
  };
}

function validateQuantity(quantity: number): string | undefined {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return "Quantity must be a positive whole number.";
  }
  if (quantity > 10) {
    return "Quantity must be 10 or less for assisted cart actions.";
  }
  return undefined;
}

function validateAvailableQuantity(product: Product, requestedQuantity: number): string | undefined {
  if (product.stockStatus === "out_of_stock" || product.stockQuantity <= 0) {
    return `${product.name} is out of stock.`;
  }
  if (requestedQuantity > product.stockQuantity) {
    return `Only ${product.stockQuantity} ${product.name} item(s) are available.`;
  }
  return undefined;
}

export async function lookupCustomerByChannel(
  channel: string,
  externalUserId: string
): Promise<ServiceResult<LinkedCustomer>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }

  return { ok: true, data: linked.data.publicView };
}

export async function searchProducts(
  query: string,
  maxResults = 5
): Promise<ServiceResult<ProductSearchResult[]>> {
  const db = await readShopDb();
  const tokens = tokenize(query);

  if (tokens.length === 0) {
    return { ok: false, error: "Search query is required." };
  }

  const scored = db.products
    .map((product) => {
      const searchable = [
        product.id,
        product.name,
        product.category,
        product.shortDescription,
        ...product.tags,
        ...product.bestFor
      ]
        .join(" ")
        .toLowerCase();

      const matchedTokens = tokens.filter((token) => searchable.includes(token));
      const score = matchedTokens.length;
      return {
        product,
        score,
        reason:
          score > 0
            ? `Matched ${matchedTokens.join(", ")}.`
            : "No direct text match."
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.product.priceNtd - b.product.priceNtd)
    .slice(0, Math.max(1, Math.min(maxResults, 10)));

  return { ok: true, data: scored };
}

export async function getCartForChannel(
  channel: string,
  externalUserId: string
): Promise<ServiceResult<CartView>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }

  return { ok: true, data: buildCartView(db, findOrCreateCart(db, linked.data.customer.id)) };
}

function previewAddItemForLink(
  db: ShopDatabase,
  linked: LinkedCustomerRecord,
  productId: string,
  quantity: number
): ServiceResult<{
  pendingAction: PendingAction;
  confirmationText: string;
  cartAfterAdd: CartView;
}> {
  const quantityError = validateQuantity(quantity);
  if (quantityError) {
    return { ok: false, error: quantityError };
  }

  const product = findProduct(db, productId);
  if (!product) {
    return { ok: false, error: "Product not found." };
  }

  const customerId = linked.customer.id;
  const cart = findOrCreateCart(db, customerId);
  const existingQuantity = cart.items.find((item) => item.productId === productId)?.quantity ?? 0;
  const availabilityError = validateAvailableQuantity(product, existingQuantity + quantity);
  if (availabilityError) {
    return { ok: false, error: availabilityError };
  }

  const action: PendingAction = {
    id: `pending_${randomUUID()}`,
    type: "cart.add_item",
    status: "pending",
    customerId,
    accountLinkId: linked.accountLink.id,
    productId,
    quantity,
    summary: `Add ${quantity} x ${product.name} to ${linked.customer.displayName}'s cart.`,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + PENDING_ACTION_TTL_MS).toISOString()
  };

  for (const pending of db.pendingActions) {
    if (
      pending.status === "pending" &&
      pending.type === "cart.add_item" &&
      pending.customerId === customerId &&
      pending.productId === productId
    ) {
      pending.status = "expired";
    }
  }

  const previewCart: Cart = {
    customerId,
    items: cart.items.map((item) => ({ ...item }))
  };
  const previewLine = previewCart.items.find((item) => item.productId === productId);
  if (previewLine) {
    previewLine.quantity += quantity;
  } else {
    previewCart.items.push({ productId, quantity, addedAt: nowIso() });
  }

  db.pendingActions.push(action);
  addLog(db, {
    type: "cart.add_item.preview",
    status: "preview",
    customerId,
    summary: action.summary,
    metadata: {
      pendingActionId: action.id,
      accountLinkId: linked.accountLink.id,
      channel: linked.accountLink.channel,
      productId,
      quantity
    }
  });

  return {
    ok: true,
    data: {
      pendingAction: action,
      confirmationText: `I can add ${quantity} x ${product.name} for NT$${product.priceNtd * quantity} to your cart. Should I add it?`,
      cartAfterAdd: buildCartView(db, previewCart)
    }
  };
}

export async function previewAddItemForChannel(
  channel: string,
  externalUserId: string,
  productId: string,
  quantity: number
): Promise<
  ServiceResult<{
    pendingAction: PendingAction;
    confirmationText: string;
    cartAfterAdd: CartView;
  }>
> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }

  const result = previewAddItemForLink(db, linked.data, productId, quantity);
  if (result.ok) {
    await writeShopDb(db);
  }
  return result;
}

function confirmAddItemForLink(
  db: ShopDatabase,
  accountLink: AccountLink,
  pendingActionId: string
): ServiceResult<{ cart: CartView; action: PendingAction }> {
  const action = db.pendingActions.find((entry) => entry.id === pendingActionId);

  if (!action) {
    return { ok: false, error: "Pending action not found." };
  }
  if (action.type !== "cart.add_item") {
    return { ok: false, error: "Pending action is not a cart add action." };
  }
  if (action.customerId !== accountLink.customerId || action.accountLinkId !== accountLink.id) {
    return { ok: false, error: "Pending action does not belong to this linked channel identity." };
  }
  if (action.status !== "pending") {
    return { ok: false, error: `Pending action is already ${action.status}.` };
  }
  if (Date.parse(action.expiresAt) < Date.now()) {
    action.status = "expired";
    return { ok: false, error: "Pending action expired. Preview the action again before confirming." };
  }

  const product = findProduct(db, action.productId);
  if (!product) {
    return { ok: false, error: "Product not found." };
  }

  const customerId = accountLink.customerId;
  const cart = findOrCreateCart(db, customerId);
  const existing = cart.items.find((item) => item.productId === action.productId);
  const existingQuantity = existing?.quantity ?? 0;
  const availabilityError = validateAvailableQuantity(product, existingQuantity + action.quantity);
  if (availabilityError) {
    addLog(db, {
      type: "cart.add_item",
      status: "failed",
      customerId,
      summary: availabilityError,
      metadata: {
        pendingActionId: action.id,
        accountLinkId: accountLink.id,
        channel: accountLink.channel,
        productId: action.productId,
        quantity: action.quantity
      }
    });
    return { ok: false, error: availabilityError };
  }

  if (existing) {
    existing.quantity += action.quantity;
  } else {
    cart.items.push({ productId: action.productId, quantity: action.quantity, addedAt: nowIso() });
  }

  action.status = "completed";
  action.completedAt = nowIso();
  addLog(db, {
    type: "cart.add_item",
    status: "success",
    customerId,
    summary: action.summary,
    metadata: {
      pendingActionId: action.id,
      accountLinkId: accountLink.id,
      channel: accountLink.channel,
      productId: action.productId,
      quantity: action.quantity
    }
  });

  return { ok: true, data: { cart: buildCartView(db, cart), action } };
}

export async function confirmAddItemForChannel(
  channel: string,
  externalUserId: string,
  pendingActionId: string
): Promise<ServiceResult<{ cart: CartView; action: PendingAction }>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }

  const result = confirmAddItemForLink(db, linked.data.accountLink, pendingActionId);
  await writeShopDb(db);
  return result;
}

export async function confirmLatestAddItemForChannel(
  channel: string,
  externalUserId: string,
  productId?: string,
  quantity?: number
): Promise<ServiceResult<{ cart: CartView; action: PendingAction }>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }
  const linkedData = linked.data;

  const pending = db.pendingActions
    .filter(
      (entry) =>
        entry.type === "cart.add_item" &&
        entry.status === "pending" &&
        entry.customerId === linkedData.customer.id &&
        entry.accountLinkId === linkedData.accountLink.id &&
        (!productId || entry.productId === productId) &&
        (!quantity || entry.quantity === quantity)
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];

  if (!pending) {
    return { ok: false, error: "No matching pending add-to-cart confirmation was found." };
  }

  const result = confirmAddItemForLink(db, linkedData.accountLink, pending.id);
  await writeShopDb(db);
  return result;
}

function previewRemoveItemForLink(
  db: ShopDatabase,
  linked: LinkedCustomerRecord,
  productId: string
): ServiceResult<{
  pendingAction: PendingAction;
  confirmationText: string;
  cartAfterRemove: CartView;
}> {
  const product = findProduct(db, productId);
  if (!product) {
    return { ok: false, error: "Product not found." };
  }

  const customerId = linked.customer.id;
  const cart = findOrCreateCart(db, customerId);
  const existing = cart.items.find((item) => item.productId === productId);
  if (!existing) {
    return { ok: false, error: `${product.name} is not in your cart.` };
  }

  const action: PendingAction = {
    id: `pending_${randomUUID()}`,
    type: "cart.remove_item",
    status: "pending",
    customerId,
    accountLinkId: linked.accountLink.id,
    productId,
    quantity: existing.quantity,
    summary: `Remove ${product.name} (qty ${existing.quantity}) from ${linked.customer.displayName}'s cart.`,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + PENDING_ACTION_TTL_MS).toISOString()
  };

  supersedePendingActions(db, customerId, "cart.remove_item", productId);

  const previewCart: Cart = {
    customerId,
    items: cart.items.filter((item) => item.productId !== productId).map((item) => ({ ...item }))
  };

  db.pendingActions.push(action);
  addLog(db, {
    type: "cart.remove_item.preview",
    status: "preview",
    customerId,
    summary: action.summary,
    metadata: {
      pendingActionId: action.id,
      accountLinkId: linked.accountLink.id,
      channel: linked.accountLink.channel,
      productId,
      quantity: existing.quantity
    }
  });

  return {
    ok: true,
    data: {
      pendingAction: action,
      confirmationText: `I can remove ${product.name} from your cart. Should I remove it?`,
      cartAfterRemove: buildCartView(db, previewCart)
    }
  };
}

export async function previewRemoveItemForChannel(
  channel: string,
  externalUserId: string,
  productId: string
): Promise<
  ServiceResult<{
    pendingAction: PendingAction;
    confirmationText: string;
    cartAfterRemove: CartView;
  }>
> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }

  const result = previewRemoveItemForLink(db, linked.data, productId);
  if (result.ok) {
    await writeShopDb(db);
  }
  return result;
}

function confirmRemoveItemForLink(
  db: ShopDatabase,
  accountLink: AccountLink,
  pendingActionId: string
): ServiceResult<{ cart: CartView; action: PendingAction }> {
  const action = db.pendingActions.find((entry) => entry.id === pendingActionId);

  if (!action) {
    return { ok: false, error: "Pending action not found." };
  }
  if (action.type !== "cart.remove_item") {
    return { ok: false, error: "Pending action is not a cart remove action." };
  }
  if (action.customerId !== accountLink.customerId || action.accountLinkId !== accountLink.id) {
    return { ok: false, error: "Pending action does not belong to this linked channel identity." };
  }
  if (action.status !== "pending") {
    return { ok: false, error: `Pending action is already ${action.status}.` };
  }
  if (Date.parse(action.expiresAt) < Date.now()) {
    action.status = "expired";
    return { ok: false, error: "Pending action expired. Preview the action again before confirming." };
  }

  const product = findProduct(db, action.productId);
  if (!product) {
    return { ok: false, error: "Product not found." };
  }

  const customerId = accountLink.customerId;
  const cart = findOrCreateCart(db, customerId);
  const index = cart.items.findIndex((item) => item.productId === action.productId);
  if (index === -1) {
    addLog(db, {
      type: "cart.remove_item",
      status: "failed",
      customerId,
      summary: `${product.name} is no longer in the cart.`,
      metadata: {
        pendingActionId: action.id,
        accountLinkId: accountLink.id,
        channel: accountLink.channel,
        productId: action.productId
      }
    });
    return { ok: false, error: `${product.name} is no longer in your cart.` };
  }

  cart.items.splice(index, 1);

  action.status = "completed";
  action.completedAt = nowIso();
  addLog(db, {
    type: "cart.remove_item",
    status: "success",
    customerId,
    summary: action.summary,
    metadata: {
      pendingActionId: action.id,
      accountLinkId: accountLink.id,
      channel: accountLink.channel,
      productId: action.productId,
      quantity: action.quantity
    }
  });

  return { ok: true, data: { cart: buildCartView(db, cart), action } };
}

export async function confirmRemoveItemForChannel(
  channel: string,
  externalUserId: string,
  pendingActionId: string
): Promise<ServiceResult<{ cart: CartView; action: PendingAction }>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }

  const result = confirmRemoveItemForLink(db, linked.data.accountLink, pendingActionId);
  await writeShopDb(db);
  return result;
}

export async function confirmLatestRemoveItemForChannel(
  channel: string,
  externalUserId: string,
  productId?: string
): Promise<ServiceResult<{ cart: CartView; action: PendingAction }>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }
  const linkedData = linked.data;

  const pending = db.pendingActions
    .filter(
      (entry) =>
        entry.type === "cart.remove_item" &&
        entry.status === "pending" &&
        entry.customerId === linkedData.customer.id &&
        entry.accountLinkId === linkedData.accountLink.id &&
        (!productId || entry.productId === productId)
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];

  if (!pending) {
    return { ok: false, error: "No matching pending remove-from-cart confirmation was found." };
  }

  const result = confirmRemoveItemForLink(db, linkedData.accountLink, pending.id);
  await writeShopDb(db);
  return result;
}

function previewUpdateQuantityForLink(
  db: ShopDatabase,
  linked: LinkedCustomerRecord,
  productId: string,
  quantity: number
): ServiceResult<{
  pendingAction: PendingAction;
  confirmationText: string;
  cartAfterUpdate: CartView;
}> {
  const quantityError = validateQuantity(quantity);
  if (quantityError) {
    return { ok: false, error: quantityError };
  }

  const product = findProduct(db, productId);
  if (!product) {
    return { ok: false, error: "Product not found." };
  }

  const customerId = linked.customer.id;
  const cart = findOrCreateCart(db, customerId);
  const existing = cart.items.find((item) => item.productId === productId);
  if (!existing) {
    return { ok: false, error: `${product.name} is not in your cart.` };
  }
  if (existing.quantity === quantity) {
    return { ok: false, error: `${product.name} is already at quantity ${quantity}.` };
  }

  // The target quantity is absolute, so check it directly against available stock.
  const availabilityError = validateAvailableQuantity(product, quantity);
  if (availabilityError) {
    return { ok: false, error: availabilityError };
  }

  const action: PendingAction = {
    id: `pending_${randomUUID()}`,
    type: "cart.update_quantity",
    status: "pending",
    customerId,
    accountLinkId: linked.accountLink.id,
    productId,
    quantity,
    summary: `Change ${product.name} quantity to ${quantity} in ${linked.customer.displayName}'s cart.`,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + PENDING_ACTION_TTL_MS).toISOString()
  };

  supersedePendingActions(db, customerId, "cart.update_quantity", productId);

  const previewCart: Cart = {
    customerId,
    items: cart.items.map((item) =>
      item.productId === productId ? { ...item, quantity } : { ...item }
    )
  };

  db.pendingActions.push(action);
  addLog(db, {
    type: "cart.update_quantity.preview",
    status: "preview",
    customerId,
    summary: action.summary,
    metadata: {
      pendingActionId: action.id,
      accountLinkId: linked.accountLink.id,
      channel: linked.accountLink.channel,
      productId,
      quantity
    }
  });

  return {
    ok: true,
    data: {
      pendingAction: action,
      confirmationText: `I can change ${product.name} to ${quantity} (NT$${product.priceNtd * quantity}) in your cart. Should I update it?`,
      cartAfterUpdate: buildCartView(db, previewCart)
    }
  };
}

export async function previewUpdateQuantityForChannel(
  channel: string,
  externalUserId: string,
  productId: string,
  quantity: number
): Promise<
  ServiceResult<{
    pendingAction: PendingAction;
    confirmationText: string;
    cartAfterUpdate: CartView;
  }>
> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }

  const result = previewUpdateQuantityForLink(db, linked.data, productId, quantity);
  if (result.ok) {
    await writeShopDb(db);
  }
  return result;
}

function confirmUpdateQuantityForLink(
  db: ShopDatabase,
  accountLink: AccountLink,
  pendingActionId: string
): ServiceResult<{ cart: CartView; action: PendingAction }> {
  const action = db.pendingActions.find((entry) => entry.id === pendingActionId);

  if (!action) {
    return { ok: false, error: "Pending action not found." };
  }
  if (action.type !== "cart.update_quantity") {
    return { ok: false, error: "Pending action is not a cart update-quantity action." };
  }
  if (action.customerId !== accountLink.customerId || action.accountLinkId !== accountLink.id) {
    return { ok: false, error: "Pending action does not belong to this linked channel identity." };
  }
  if (action.status !== "pending") {
    return { ok: false, error: `Pending action is already ${action.status}.` };
  }
  if (Date.parse(action.expiresAt) < Date.now()) {
    action.status = "expired";
    return { ok: false, error: "Pending action expired. Preview the action again before confirming." };
  }

  const product = findProduct(db, action.productId);
  if (!product) {
    return { ok: false, error: "Product not found." };
  }

  const customerId = accountLink.customerId;
  const cart = findOrCreateCart(db, customerId);
  const existing = cart.items.find((item) => item.productId === action.productId);
  if (!existing) {
    addLog(db, {
      type: "cart.update_quantity",
      status: "failed",
      customerId,
      summary: `${product.name} is no longer in the cart.`,
      metadata: {
        pendingActionId: action.id,
        accountLinkId: accountLink.id,
        channel: accountLink.channel,
        productId: action.productId,
        quantity: action.quantity
      }
    });
    return { ok: false, error: `${product.name} is no longer in your cart.` };
  }

  // Re-validate the target against current stock in case it dropped after preview.
  const availabilityError = validateAvailableQuantity(product, action.quantity);
  if (availabilityError) {
    addLog(db, {
      type: "cart.update_quantity",
      status: "failed",
      customerId,
      summary: availabilityError,
      metadata: {
        pendingActionId: action.id,
        accountLinkId: accountLink.id,
        channel: accountLink.channel,
        productId: action.productId,
        quantity: action.quantity
      }
    });
    return { ok: false, error: availabilityError };
  }

  existing.quantity = action.quantity;

  action.status = "completed";
  action.completedAt = nowIso();
  addLog(db, {
    type: "cart.update_quantity",
    status: "success",
    customerId,
    summary: action.summary,
    metadata: {
      pendingActionId: action.id,
      accountLinkId: accountLink.id,
      channel: accountLink.channel,
      productId: action.productId,
      quantity: action.quantity
    }
  });

  return { ok: true, data: { cart: buildCartView(db, cart), action } };
}

export async function confirmUpdateQuantityForChannel(
  channel: string,
  externalUserId: string,
  pendingActionId: string
): Promise<ServiceResult<{ cart: CartView; action: PendingAction }>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }

  const result = confirmUpdateQuantityForLink(db, linked.data.accountLink, pendingActionId);
  await writeShopDb(db);
  return result;
}

export async function confirmLatestUpdateQuantityForChannel(
  channel: string,
  externalUserId: string,
  productId?: string,
  quantity?: number
): Promise<ServiceResult<{ cart: CartView; action: PendingAction }>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }
  const linkedData = linked.data;

  const pending = db.pendingActions
    .filter(
      (entry) =>
        entry.type === "cart.update_quantity" &&
        entry.status === "pending" &&
        entry.customerId === linkedData.customer.id &&
        entry.accountLinkId === linkedData.accountLink.id &&
        (!productId || entry.productId === productId) &&
        (!quantity || entry.quantity === quantity)
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];

  if (!pending) {
    return { ok: false, error: "No matching pending update-quantity confirmation was found." };
  }

  const result = confirmUpdateQuantityForLink(db, linkedData.accountLink, pending.id);
  await writeShopDb(db);
  return result;
}

export async function listOrdersForChannel(
  channel: string,
  externalUserId: string
): Promise<ServiceResult<OrderSummary[]>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }

  const customerId = linked.data.customer.id;
  const summaries = (db.orders ?? [])
    // Identity is the channel binding -> customerId; only the linked customer's
    // own orders are ever returned.
    .filter((order) => order.customerId === customerId)
    .sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt))
    .map(buildOrderSummary);

  return { ok: true, data: summaries };
}

export async function getOrderForChannel(
  channel: string,
  externalUserId: string,
  orderId: string
): Promise<ServiceResult<OrderView>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }

  const customerId = linked.data.customer.id;
  const order = (db.orders ?? []).find(
    (entry) => entry.id === orderId && entry.customerId === customerId
  );

  // A non-owned order and a truly unknown id return the SAME message, so the
  // order id leaks nothing about other customers and is never itself proof.
  if (!order) {
    return { ok: false, error: "No order with that id was found for your account." };
  }

  return { ok: true, data: buildOrderView(db, order) };
}

export async function listActionLogs(
  customerId?: string,
  limit = 20
): Promise<ServiceResult<ActionLog[]>> {
  const db = await readShopDb();
  const logs = db.actionLogs
    .filter((log) => !customerId || log.customerId === customerId)
    .slice(0, Math.max(1, Math.min(limit, 100)));
  return { ok: true, data: logs };
}
