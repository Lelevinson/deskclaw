import { randomUUID } from "node:crypto";

import { readCommerceDb, writeCommerceDb } from "./store.js";
import type {
  ActionLog,
  Cart,
  CartLine,
  CartView,
  CommerceDatabase,
  Customer,
  PendingAction,
  Product
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

function addLog(db: CommerceDatabase, log: Omit<ActionLog, "id" | "createdAt">): void {
  db.actionLogs.unshift({
    id: `log_${randomUUID()}`,
    createdAt: nowIso(),
    ...log
  });
  db.actionLogs = db.actionLogs.slice(0, 200);
}

function findCustomer(db: CommerceDatabase, customerId: string): Customer | undefined {
  return db.customers.find((customer) => customer.id === customerId);
}

function findProduct(db: CommerceDatabase, productId: string): Product | undefined {
  return db.products.find((product) => product.id === productId);
}

function findOrCreateCart(db: CommerceDatabase, customerId: string): Cart {
  let cart = db.carts.find((entry) => entry.customerId === customerId);
  if (!cart) {
    cart = { customerId, items: [] };
    db.carts.push(cart);
  }
  return cart;
}

function buildCartView(db: CommerceDatabase, cart: Cart): CartView {
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
): Promise<ServiceResult<Customer>> {
  const db = await readCommerceDb();
  const normalizedChannel = normalize(channel);
  const normalizedExternalId = normalize(externalUserId);
  const customer = db.customers.find((entry) =>
    entry.channelIdentities.some(
      (identity) =>
        normalize(identity.channel) === normalizedChannel &&
        normalize(identity.externalUserId) === normalizedExternalId
    )
  );

  if (!customer) {
    return { ok: false, error: "No customer account is mapped to that channel identity." };
  }

  return { ok: true, data: customer };
}

export async function searchProducts(
  query: string,
  maxResults = 5
): Promise<ServiceResult<ProductSearchResult[]>> {
  const db = await readCommerceDb();
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

export async function getCart(customerId: string): Promise<ServiceResult<CartView>> {
  const db = await readCommerceDb();
  const customer = findCustomer(db, customerId);
  if (!customer) {
    return { ok: false, error: "Customer not found." };
  }

  return { ok: true, data: buildCartView(db, findOrCreateCart(db, customerId)) };
}

export async function previewAddItem(
  customerId: string,
  productId: string,
  quantity: number
): Promise<
  ServiceResult<{
    pendingAction: PendingAction;
    confirmationText: string;
    cartAfterAdd: CartView;
  }>
> {
  const quantityError = validateQuantity(quantity);
  if (quantityError) {
    return { ok: false, error: quantityError };
  }

  const db = await readCommerceDb();
  const customer = findCustomer(db, customerId);
  const product = findProduct(db, productId);

  if (!customer) {
    return { ok: false, error: "Customer not found." };
  }
  if (!product) {
    return { ok: false, error: "Product not found." };
  }

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
    productId,
    quantity,
    summary: `Add ${quantity} x ${product.name} to ${customer.displayName}'s cart.`,
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
    metadata: { pendingActionId: action.id, productId, quantity }
  });
  await writeCommerceDb(db);

  return {
    ok: true,
    data: {
      pendingAction: action,
      confirmationText: `I can add ${quantity} x ${product.name} for NT$${product.priceNtd * quantity} to your cart. Should I add it?`,
      cartAfterAdd: buildCartView(db, previewCart)
    }
  };
}

export async function confirmAddItem(
  customerId: string,
  pendingActionId: string
): Promise<ServiceResult<{ cart: CartView; action: PendingAction }>> {
  const db = await readCommerceDb();
  const action = db.pendingActions.find((entry) => entry.id === pendingActionId);

  if (!action) {
    return { ok: false, error: "Pending action not found." };
  }
  if (action.type !== "cart.add_item") {
    return { ok: false, error: "Pending action is not a cart add action." };
  }
  if (action.customerId !== customerId) {
    return { ok: false, error: "Pending action belongs to a different customer." };
  }
  if (action.status !== "pending") {
    return { ok: false, error: `Pending action is already ${action.status}.` };
  }
  if (Date.parse(action.expiresAt) < Date.now()) {
    action.status = "expired";
    await writeCommerceDb(db);
    return { ok: false, error: "Pending action expired. Preview the action again before confirming." };
  }

  const product = findProduct(db, action.productId);
  if (!product) {
    return { ok: false, error: "Product not found." };
  }

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
      metadata: { pendingActionId: action.id, productId: action.productId, quantity: action.quantity }
    });
    await writeCommerceDb(db);
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
    metadata: { pendingActionId: action.id, productId: action.productId, quantity: action.quantity }
  });

  await writeCommerceDb(db);
  return { ok: true, data: { cart: buildCartView(db, cart), action } };
}

export async function confirmLatestAddItem(
  customerId: string,
  productId?: string,
  quantity?: number
): Promise<ServiceResult<{ cart: CartView; action: PendingAction }>> {
  const db = await readCommerceDb();
  const pending = db.pendingActions
    .filter(
      (entry) =>
        entry.type === "cart.add_item" &&
        entry.status === "pending" &&
        entry.customerId === customerId &&
        (!productId || entry.productId === productId) &&
        (!quantity || entry.quantity === quantity)
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];

  if (!pending) {
    return { ok: false, error: "No matching pending add-to-cart confirmation was found." };
  }

  return confirmAddItem(customerId, pending.id);
}

export async function listActionLogs(
  customerId?: string,
  limit = 20
): Promise<ServiceResult<ActionLog[]>> {
  const db = await readCommerceDb();
  const logs = db.actionLogs
    .filter((log) => !customerId || log.customerId === customerId)
    .slice(0, Math.max(1, Math.min(limit, 100)));
  return { ok: true, data: logs };
}
