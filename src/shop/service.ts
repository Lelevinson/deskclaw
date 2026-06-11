import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

import { readShopDb, writeShopDb } from "./store.js";
import {
  ROUTINE_CAUTIONS,
  ROUTINE_DISCLAIMER,
  ROUTINE_PAIRINGS,
  ROUTINE_TIMING,
  STEP_BY_CATEGORY,
} from "./routine-rules.js";
import type {
  AccountLink,
  AccountRole,
  ActionLog,
  Cart,
  CartLine,
  CartPendingActionType,
  CartView,
  Credential,
  Customer,
  HandoffClassification,
  HandoffRecord,
  HandoffStatus,
  LinkedCustomer,
  Order,
  OrderLine,
  OrderShipping,
  OrderStatus,
  OrderSummary,
  OrderView,
  PendingAction,
  Product,
  RoutineGuide,
  RoutineProduct,
  ReturnPendingAction,
  ReturnRequest,
  ReturnResolution,
  ReturnStatus,
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

// The logged-in customer's own profile for the storefront account page. Includes
// the accountCode so the owner can read it off to link another channel (chat);
// only ever returned for the resolved, own identity.
export interface AccountProfile {
  customerId: string;
  displayName: string;
  accountCode?: string;
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

function findCustomerByAccountCode(db: ShopDatabase, accountCode: string): Customer | undefined {
  const normalized = normalize(accountCode);
  return db.customers.find(
    (customer) => customer.accountCode != null && normalize(customer.accountCode) === normalized
  );
}

// Human-shareable demo verification code, e.g. "A1B2-C3D4" (no ambiguous chars),
// unique within the store. Stands in for an OTP delivered to the contact on file.
function generateAccountCode(db: ShopDatabase): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const make = (): string => {
    const hex = randomUUID().replace(/-/g, "");
    let raw = "";
    for (let i = 0; i < 8; i += 1) {
      raw += alphabet[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % alphabet.length];
    }
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  };
  let code = make();
  while (db.customers.some((customer) => customer.accountCode === code)) {
    code = make();
  }
  return code;
}

// --- web login credentials (scrypt; passwords never stored in clear) ---
const MIN_PASSWORD_LENGTH = 8;
const SCRYPT_KEYLEN = 64;

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
}

// Constant-time check of a candidate password against a stored salt + hash.
function passwordMatches(password: string, salt: string, expectedHash: string): boolean {
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(expectedHash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function findCredentialByUsername(db: ShopDatabase, username: string): Credential | undefined {
  const normalized = normalize(username);
  return (db.credentials ?? []).find((cred) => normalize(cred.username) === normalized);
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
  type: CartPendingActionType,
  productId: string
): void {
  for (const pending of db.pendingActions) {
    if (
      pending.status === "pending" &&
      pending.type === type &&
      pending.customerId === customerId &&
      // "productId" in pending narrows the union to a cart action.
      "productId" in pending &&
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

// Return the caller's OWN account code, resolved strictly by their channel identity
// (same gate as every owned read). This lets a linked customer reliably ask "what's
// my account code?" / "how do I log in on the website?" so they are never stuck if
// the registration reply happened not to repeat it. Own-code only: an unlinked or
// mismatched caller is refused, so it never exposes another account's code. Read-only.
export async function getAccountCodeForChannel(
  channel: string,
  externalUserId: string
): Promise<ServiceResult<{ accountCode: string }>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }
  const { accountCode } = linked.data.customer;
  if (!accountCode) {
    return { ok: false, error: "This account has no verification code on file." };
  }
  return { ok: true, data: { accountCode } };
}

// Self-service registration of a BRAND-NEW customer bound to the caller's own
// channel identity. Safe (no pre-existing data to take over). The caller's
// channel + externalUserId are the proof — never a customer-typed id. Linking a
// PRE-EXISTING account instead goes through linkExistingAccountForChannel, which
// requires the verification code.
export async function registerNewCustomerForChannel(
  channel: string,
  externalUserId: string,
  displayName: string
): Promise<ServiceResult<LinkedCustomer & { accountCode: string }>> {
  const db = await readShopDb();

  const existing = resolveLinkedCustomer(db, channel, externalUserId);
  if (existing.ok && existing.data) {
    return {
      ok: false,
      error: `This channel identity is already registered as ${existing.data.customer.displayName}.`
    };
  }

  const trimmedName = displayName.trim();
  if (!trimmedName) {
    return { ok: false, error: "Please share the name to register the account under." };
  }

  const accountCode = generateAccountCode(db);
  const customer: Customer = {
    id: `customer_${randomUUID()}`,
    displayName: trimmedName,
    accountCode
  };
  const accountLink: AccountLink = {
    id: `link_${randomUUID()}`,
    customerId: customer.id,
    channel,
    externalUserId,
    status: "linked",
    linkedAt: nowIso()
  };

  db.customers.push(customer);
  db.accountLinks.push(accountLink);

  addLog(db, {
    type: "account.register",
    status: "success",
    customerId: customer.id,
    summary: `Register new customer ${customer.displayName} from ${accountLink.channel}.`,
    metadata: { accountLinkId: accountLink.id, channel: accountLink.channel }
  });

  await writeShopDb(db);
  // Surface the accountCode here (the shared LinkedCustomer view omits it) so the
  // agent can read it back to the customer — they need it to set up a web login
  // for this account later (see linkWebCredentialToExistingCustomer).
  return { ok: true, data: { ...buildLinkedCustomer(customer, accountLink), accountCode } };
}

// Link the caller's channel identity to an EXISTING customer account, gated by
// that account's verification code (a demo-grade stand-in for an OTP sent to the
// contact on file). The code both selects and authenticates the account; an
// unknown code is refused with a generic message (no existence leak).
export async function linkExistingAccountForChannel(
  channel: string,
  externalUserId: string,
  accountCode: string
): Promise<ServiceResult<LinkedCustomer>> {
  const db = await readShopDb();

  const existing = resolveLinkedCustomer(db, channel, externalUserId);
  if (existing.ok && existing.data) {
    return {
      ok: false,
      error: `This channel identity is already registered as ${existing.data.customer.displayName}.`
    };
  }

  const trimmedCode = accountCode.trim();
  if (!trimmedCode) {
    return { ok: false, error: "Please share your account verification code." };
  }

  const customer = findCustomerByAccountCode(db, trimmedCode);
  if (!customer) {
    return { ok: false, error: "That verification code was not recognized." };
  }

  const accountLink: AccountLink = {
    id: `link_${randomUUID()}`,
    customerId: customer.id,
    channel,
    externalUserId,
    status: "linked",
    linkedAt: nowIso()
  };
  db.accountLinks.push(accountLink);

  addLog(db, {
    type: "account.link_existing",
    status: "success",
    customerId: customer.id,
    summary: `Link existing customer ${customer.displayName} to a ${accountLink.channel} identity.`,
    metadata: { accountLinkId: accountLink.id, channel: accountLink.channel }
  });

  await writeShopDb(db);
  return { ok: true, data: buildLinkedCustomer(customer, accountLink) };
}

// Register a brand-new customer with a storefront web login. Creates a Customer,
// a "web" AccountLink (externalUserId = the username) so a logged-in session
// resolves through resolveLinkedCustomer like any channel, and a Credential whose
// password is scrypt-hashed (never stored in clear). Web-only; not an MCP tool.
export async function registerWebAccount(
  username: string,
  password: string,
  displayName: string
): Promise<ServiceResult<LinkedCustomer>> {
  const db = await readShopDb();

  const normalizedUsername = normalize(username);
  if (!normalizedUsername) {
    return { ok: false, error: "Please choose a username." };
  }
  if (!/^[a-z0-9._-]+$/.test(normalizedUsername)) {
    return { ok: false, error: "Username can use only letters, numbers, dots, underscores, and hyphens." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  const trimmedName = displayName.trim();
  if (!trimmedName) {
    return { ok: false, error: "Please share the name to register the account under." };
  }
  if (findCredentialByUsername(db, normalizedUsername)) {
    return { ok: false, error: "That username is already taken." };
  }

  const customer: Customer = {
    id: `customer_${randomUUID()}`,
    displayName: trimmedName,
    accountCode: generateAccountCode(db)
  };
  const accountLink: AccountLink = {
    id: `link_${randomUUID()}`,
    customerId: customer.id,
    channel: "web",
    externalUserId: normalizedUsername,
    status: "linked",
    linkedAt: nowIso()
  };
  const salt = randomBytes(16).toString("hex");
  const credential: Credential = {
    customerId: customer.id,
    username: normalizedUsername,
    salt,
    hash: hashPassword(password, salt),
    createdAt: nowIso()
  };

  db.customers.push(customer);
  db.accountLinks.push(accountLink);
  db.credentials.push(credential);

  addLog(db, {
    type: "account.web_register",
    status: "success",
    customerId: customer.id,
    summary: `Register web account ${customer.displayName} (@${normalizedUsername}).`,
    metadata: { accountLinkId: accountLink.id, channel: accountLink.channel }
  });

  await writeShopDb(db);
  return { ok: true, data: buildLinkedCustomer(customer, accountLink) };
}

// Attach a storefront web login to an EXISTING customer (e.g. one who registered
// over a chat channel and so has a customer + account-link but no web credential),
// gated by their accountCode. This is the web-side symmetric twin of
// linkExistingAccountForChannel: it verifies the code, then creates a Credential +
// a "web" AccountLink bound to the EXISTING customerId, so the web session resolves
// to the same customer (same cart/orders). The accountCode is a DEMO-GRADE stand-in
// for an out-of-band one-time code (see ARCHITECTURE §5) — not stronger identity
// proof. Refuses an unrecognized code, a customer that already has a web login (one
// credential per account), and a taken username. Web-only; not an MCP tool.
export async function linkWebCredentialToExistingCustomer(
  username: string,
  password: string,
  accountCode: string
): Promise<ServiceResult<LinkedCustomer>> {
  const db = await readShopDb();

  const normalizedUsername = normalize(username);
  if (!normalizedUsername) {
    return { ok: false, error: "Please choose a username." };
  }
  if (!/^[a-z0-9._-]+$/.test(normalizedUsername)) {
    return { ok: false, error: "Username can use only letters, numbers, dots, underscores, and hyphens." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  const trimmedCode = accountCode.trim();
  if (!trimmedCode) {
    return { ok: false, error: "Please share your account verification code." };
  }
  if (findCredentialByUsername(db, normalizedUsername)) {
    return { ok: false, error: "That username is already taken." };
  }

  const customer = findCustomerByAccountCode(db, trimmedCode);
  if (!customer) {
    return { ok: false, error: "That verification code was not recognized." };
  }
  // One web login per account. If this customer already has a web credential, this is
  // the wrong flow (and re-binding a new password would be a takeover vector). Refuse.
  if (db.credentials.some((credential) => credential.customerId === customer.id)) {
    return { ok: false, error: "This account already has a web login. Try signing in instead." };
  }

  const accountLink: AccountLink = {
    id: `link_${randomUUID()}`,
    customerId: customer.id,
    channel: "web",
    externalUserId: normalizedUsername,
    status: "linked",
    linkedAt: nowIso()
  };
  const salt = randomBytes(16).toString("hex");
  const credential: Credential = {
    customerId: customer.id,
    username: normalizedUsername,
    salt,
    hash: hashPassword(password, salt),
    createdAt: nowIso()
  };

  db.accountLinks.push(accountLink);
  db.credentials.push(credential);

  addLog(db, {
    type: "account.web_link_existing",
    status: "success",
    customerId: customer.id,
    summary: `Set up web login @${normalizedUsername} for existing customer ${customer.displayName}.`,
    metadata: { accountLinkId: accountLink.id, channel: accountLink.channel }
  });

  await writeShopDb(db);
  return { ok: true, data: buildLinkedCustomer(customer, accountLink) };
}

// Verify a storefront login. Returns the linked customer on success; a single
// generic error otherwise. Hashes even when the username is unknown so a missing
// user and a wrong password are indistinguishable and roughly equal-time.
export async function verifyWebCredential(
  username: string,
  password: string
): Promise<ServiceResult<LinkedCustomer>> {
  const db = await readShopDb();
  const generic = "Invalid username or password.";

  const credential = findCredentialByUsername(db, normalize(username));
  if (!credential) {
    hashPassword(password, "decoy-salt"); // equalize timing; do not reveal absence
    return { ok: false, error: generic };
  }
  if (!passwordMatches(password, credential.salt, credential.hash)) {
    return { ok: false, error: generic };
  }

  const linked = resolveLinkedCustomer(db, "web", credential.username);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: generic };
  }

  addLog(db, {
    type: "account.web_login",
    status: "success",
    customerId: linked.data.customer.id,
    summary: `Web login for ${linked.data.customer.displayName} (@${credential.username}).`,
    metadata: { accountLinkId: linked.data.accountLink.id, channel: "web" }
  });
  await writeShopDb(db);

  return { ok: true, data: linked.data.publicView };
}

// Read the role for a web-login username (staff gating for the /admin area). Returns
// "customer" when the credential has no role, and refuses an unknown username — never
// leaks whether the username exists beyond the auth path that already validated it.
export async function getWebAccountRole(username: string): Promise<ServiceResult<{ role: AccountRole }>> {
  const db = await readShopDb();
  const credential = findCredentialByUsername(db, normalize(username));
  if (!credential) {
    return { ok: false, error: "No such account." };
  }
  return { ok: true, data: { role: credential.role ?? "customer" } };
}

// Read the resolved customer's own profile (display name + their accountCode) for
// the storefront account page. Identity-gated, own-only — same resolution path as
// everything else.
export async function getAccountProfileForChannel(
  channel: string,
  externalUserId: string
): Promise<ServiceResult<AccountProfile>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }
  return {
    ok: true,
    data: {
      customerId: linked.data.customer.id,
      displayName: linked.data.customer.displayName,
      accountCode: linked.data.customer.accountCode
    }
  };
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

// Full catalogue read for browse surfaces (the storefront catalogue grid). Unlike
// searchProducts this needs no query and returns every product, so the web app
// never has to read data/catalog/products.json directly. Public, identity-free —
// the catalogue is public (DESIGN.md §4). Catalogue display order is preserved.
export async function listProducts(): Promise<ServiceResult<Product[]>> {
  const db = await readShopDb();
  return { ok: true, data: db.products };
}

// Public, read-only routine guide for the /routines builder. Joins the live catalog
// (structured `category` → step/order) with the curated AM/PM timing + cautions +
// pairings that mirror data/catalog/compatibility.md (see routine-rules.ts). A
// product is included ONLY if it has both a routine-step category AND stated timing,
// so sets/accessories — and anything without stated guidance — are excluded; nothing
// is inferred.
function buildRoutineGuide(products: Product[]): RoutineGuide {
  const routineProducts: RoutineProduct[] = products
    .map((product): RoutineProduct | undefined => {
      const stepInfo = STEP_BY_CATEGORY[normalize(product.category)];
      const timing = ROUTINE_TIMING[product.id];
      if (!stepInfo || !timing) return undefined;
      return {
        id: product.id,
        name: product.name,
        link: product.link,
        step: stepInfo.step,
        stepOrder: stepInfo.stepOrder,
        times: timing.times,
        isFinalStep: timing.isFinalStep,
      };
    })
    .filter((entry): entry is RoutineProduct => Boolean(entry));

  return {
    products: routineProducts,
    cautions: ROUTINE_CAUTIONS,
    pairings: ROUTINE_PAIRINGS,
    disclaimer: ROUTINE_DISCLAIMER,
  };
}

export async function getRoutineGuide(): Promise<ServiceResult<RoutineGuide>> {
  const db = await readShopDb();
  return { ok: true, data: buildRoutineGuide(db.products) };
}

// Read one product by its catalog id for a product-detail (PDP) read. An unknown
// id yields a not-found result (no record, no leak); the catalogue is public so
// there is no ownership gating here.
export async function getProductById(productId: string): Promise<ServiceResult<Product>> {
  const db = await readShopDb();
  const product = findProduct(db, productId);
  if (!product) {
    return { ok: false, error: "No product with that id was found." };
  }
  return { ok: true, data: product };
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

// --- checkout (mock: cart -> order; NO payment, ARCHITECTURE §5) ---
const LOW_STOCK_THRESHOLD = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface CheckoutPreview {
  lines: CartLine[];
  totalNtd: number;
  confirmationText: string;
}

// Next sequential id in the seeded "order-YYYY-NNNN" format so generated ids match
// fixtures and never collide.
function nextOrderId(db: ShopDatabase): string {
  let max = 0;
  for (const order of db.orders ?? []) {
    const match = /^order-\d{4}-(\d+)$/.exec(order.id);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `order-${nowIso().slice(0, 4)}-${String(max + 1).padStart(4, "0")}`;
}

function stockStatusFor(quantity: number): Product["stockStatus"] {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

// The cart is checkout-ready when it is non-empty and every line is still in stock
// at the requested quantity. Used by both preview and confirm (re-checked at confirm
// so stock that dropped in between is caught).
function validateCartForCheckout(db: ShopDatabase, customerId: string): ServiceResult<{ cart: Cart }> {
  const cart = findOrCreateCart(db, customerId);
  if (cart.items.length === 0) {
    return { ok: false, error: "Your cart is empty — add something before checking out." };
  }
  for (const item of cart.items) {
    const product = findProduct(db, item.productId);
    if (!product) {
      return { ok: false, error: "A product in your cart is no longer available." };
    }
    const stockError = validateAvailableQuantity(product, item.quantity);
    if (stockError) {
      return { ok: false, error: stockError };
    }
  }
  return { ok: true, data: { cart } };
}

// Read-only: validate the cart and summarize what would be ordered. No write.
export async function previewCheckoutForChannel(
  channel: string,
  externalUserId: string
): Promise<ServiceResult<CheckoutPreview>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }
  const valid = validateCartForCheckout(db, linked.data.customer.id);
  if (!valid.ok || !valid.data) {
    return { ok: false, error: valid.error };
  }
  const view = buildCartView(db, valid.data.cart);
  const count = view.items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    ok: true,
    data: {
      lines: view.items,
      totalNtd: view.totalNtd,
      confirmationText: `Place an order for ${count} item(s) totaling NT$${view.totalNtd}? No payment is taken in this demo.`
    }
  };
}

// Commit: turn the cart into a new "placed" order, decrement stock, clear the cart,
// and audit. Re-reads the cart (no pending-action id), so a second confirm finds an
// empty cart and is refused — no double order.
export async function confirmCheckoutForChannel(
  channel: string,
  externalUserId: string
): Promise<ServiceResult<{ order: Order }>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }
  const customerId = linked.data.customer.id;

  const valid = validateCartForCheckout(db, customerId);
  if (!valid.ok || !valid.data) {
    return { ok: false, error: valid.error };
  }
  const cart = valid.data.cart;

  const now = nowIso();
  // Capture the unit price from the catalog AT CHECKOUT TIME (order is a historical fact).
  const items: Order["items"] = cart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPriceNtd: findProduct(db, item.productId)!.priceNtd
  }));
  const totalNtd = items.reduce((sum, item) => sum + item.unitPriceNtd * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const order: Order = {
    id: nextOrderId(db),
    customerId,
    status: "placed",
    placedAt: now,
    updatedAt: now,
    items,
    totalNtd
  };
  db.orders.push(order);

  // Decrement stock and recompute status for each ordered product.
  for (const item of cart.items) {
    const product = findProduct(db, item.productId);
    if (!product) continue;
    product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
    product.stockStatus = stockStatusFor(product.stockQuantity);
  }

  cart.items = []; // the order now holds these items

  addLog(db, {
    type: "checkout",
    status: "success",
    customerId,
    summary: `Place order ${order.id} — ${itemCount} item(s), NT$${totalNtd}.`,
    metadata: {
      orderId: order.id,
      accountLinkId: linked.data.accountLink.id,
      channel: linked.data.accountLink.channel,
      itemCount
    }
  });

  await writeShopDb(db);
  return { ok: true, data: { order } };
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

  const order = findOwnedOrder(db, linked.data.customer.id, orderId);
  if (!order) {
    return { ok: false, error: ORDER_NOT_FOUND_FOR_ACCOUNT };
  }

  return { ok: true, data: buildOrderView(db, order) };
}

// Look up an order only if the given customer owns it. A non-owned order and a
// truly unknown id are indistinguishable to the caller (both yield undefined ->
// the same not-found message), so the order id never leaks or acts as proof.
function findOwnedOrder(db: ShopDatabase, customerId: string, orderId: string): Order | undefined {
  return (db.orders ?? []).find((entry) => entry.id === orderId && entry.customerId === customerId);
}

const ORDER_NOT_FOUND_FOR_ACCOUNT = "No order with that id was found for your account.";

function isReturnResolution(value: string): value is ReturnResolution {
  return value === "refund" || value === "exchange";
}

// A return is "closed" once it reaches one of these states; anything else is still
// in progress and should block opening a second return on the same order.
const TERMINAL_RETURN_STATUSES: ReadonlySet<ReturnStatus> = new Set(["rejected", "refunded", "completed"]);

function hasOpenReturnForOrder(db: ShopDatabase, customerId: string, orderId: string): boolean {
  return (db.returns ?? []).some(
    (entry) =>
      entry.customerId === customerId &&
      entry.orderId === orderId &&
      !TERMINAL_RETURN_STATUSES.has(entry.status)
  );
}

function previewCreateReturnForLink(
  db: ShopDatabase,
  linked: LinkedCustomerRecord,
  orderId: string,
  resolution: string,
  reason: string
): ServiceResult<{ pendingAction: ReturnPendingAction; confirmationText: string }> {
  // Identity is already resolved by the caller; gate on ownership first (matching
  // the order-status contract) before validating the request's own fields.
  const customerId = linked.customer.id;
  const order = findOwnedOrder(db, customerId, orderId);
  if (!order) {
    return { ok: false, error: ORDER_NOT_FOUND_FOR_ACCOUNT };
  }

  // Returns are only eligible once an order has been delivered (returns policy:
  // within 7 days after delivery). The agent intakes a request; a human reviews it.
  if (order.status !== "delivered") {
    return {
      ok: false,
      error: `Order ${order.id} is not eligible for a return yet because it has not been delivered.`
    };
  }

  // One open return per order: don't let a customer (or a retrying agent) stack
  // duplicate requests a human would then have to reconcile. A terminal return
  // (rejected / refunded / completed) does not block a fresh request.
  if (hasOpenReturnForOrder(db, customerId, order.id)) {
    return { ok: false, error: `You already have a return in progress for order ${order.id}.` };
  }

  if (!isReturnResolution(resolution)) {
    return { ok: false, error: "Resolution must be either 'refund' or 'exchange'." };
  }

  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    return { ok: false, error: "Please share a brief reason for the return or exchange." };
  }

  const action: ReturnPendingAction = {
    id: `pending_${randomUUID()}`,
    type: "return.create",
    status: "pending",
    customerId,
    accountLinkId: linked.accountLink.id,
    orderId: order.id,
    resolution,
    reason: trimmedReason,
    summary: `Open a ${resolution} request for ${linked.customer.displayName} on order ${order.id}.`,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + PENDING_ACTION_TTL_MS).toISOString()
  };

  // Supersede any earlier still-pending return request the customer staged for the
  // same order, so a stale preview cannot be confirmed alongside a fresh one.
  for (const pending of db.pendingActions) {
    if (
      pending.status === "pending" &&
      pending.type === "return.create" &&
      pending.customerId === customerId &&
      pending.orderId === order.id
    ) {
      pending.status = "expired";
    }
  }

  db.pendingActions.push(action);
  addLog(db, {
    type: "return.create.preview",
    status: "preview",
    customerId,
    summary: action.summary,
    metadata: {
      pendingActionId: action.id,
      accountLinkId: linked.accountLink.id,
      channel: linked.accountLink.channel,
      orderId: order.id,
      resolution
    }
  });

  return {
    ok: true,
    data: {
      pendingAction: action,
      confirmationText: `I can open a ${resolution} request on order ${order.id} ("${trimmedReason}"). A teammate reviews it and handles the actual ${resolution} — I can't issue it myself. Should I submit the request?`
    }
  };
}

export async function previewCreateReturnForChannel(
  channel: string,
  externalUserId: string,
  orderId: string,
  resolution: string,
  reason: string
): Promise<ServiceResult<{ pendingAction: ReturnPendingAction; confirmationText: string }>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }

  const result = previewCreateReturnForLink(db, linked.data, orderId, resolution, reason);
  if (result.ok) {
    await writeShopDb(db);
  }
  return result;
}

function confirmCreateReturnForLink(
  db: ShopDatabase,
  accountLink: AccountLink,
  pendingActionId: string
): ServiceResult<{ returnRequest: ReturnRequest; action: ReturnPendingAction }> {
  const action = db.pendingActions.find((entry) => entry.id === pendingActionId);

  if (!action) {
    return { ok: false, error: "Pending action not found." };
  }
  if (action.type !== "return.create") {
    return { ok: false, error: "Pending action is not a return request." };
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

  const customerId = accountLink.customerId;
  // Re-check ownership AND eligibility at confirm time; never trust the staged
  // order blindly (mirrors the cart confirms re-validating stock before committing).
  const order = findOwnedOrder(db, customerId, action.orderId);
  if (!order || order.status !== "delivered") {
    const reason = !order
      ? ORDER_NOT_FOUND_FOR_ACCOUNT
      : `Order ${order.id} is no longer eligible for a return.`;
    addLog(db, {
      type: "return.create",
      status: "failed",
      customerId,
      summary: reason,
      metadata: {
        pendingActionId: action.id,
        accountLinkId: accountLink.id,
        channel: accountLink.channel,
        orderId: action.orderId
      }
    });
    return { ok: false, error: reason };
  }

  const now = nowIso();
  // The agent only ever creates the request in "requested"; it never issues money.
  const returnRequest: ReturnRequest = {
    id: `return_${randomUUID()}`,
    customerId,
    orderId: order.id,
    status: "requested",
    resolution: action.resolution,
    reason: action.reason,
    createdAt: now,
    updatedAt: now
  };
  db.returns.push(returnRequest);

  action.status = "completed";
  action.completedAt = now;
  addLog(db, {
    type: "return.create",
    status: "success",
    customerId,
    summary: action.summary,
    metadata: {
      pendingActionId: action.id,
      accountLinkId: accountLink.id,
      channel: accountLink.channel,
      orderId: order.id,
      returnId: returnRequest.id,
      resolution: action.resolution
    }
  });

  return { ok: true, data: { returnRequest, action } };
}

export async function confirmCreateReturnForChannel(
  channel: string,
  externalUserId: string,
  pendingActionId: string
): Promise<ServiceResult<{ returnRequest: ReturnRequest; action: ReturnPendingAction }>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }

  const result = confirmCreateReturnForLink(db, linked.data.accountLink, pendingActionId);
  await writeShopDb(db);
  return result;
}

export async function listReturnsForChannel(
  channel: string,
  externalUserId: string
): Promise<ServiceResult<ReturnRequest[]>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }

  const customerId = linked.data.customer.id;
  const returns = (db.returns ?? [])
    // Only the linked customer's own returns are ever returned.
    .filter((entry) => entry.customerId === customerId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return { ok: true, data: returns };
}

export async function getReturnForChannel(
  channel: string,
  externalUserId: string,
  returnId: string
): Promise<ServiceResult<ReturnRequest>> {
  const db = await readShopDb();
  const linked = resolveLinkedCustomer(db, channel, externalUserId);
  if (!linked.ok || !linked.data) {
    return { ok: false, error: linked.error };
  }

  const customerId = linked.data.customer.id;
  const found = (db.returns ?? []).find(
    (entry) => entry.id === returnId && entry.customerId === customerId
  );

  // A non-owned return and a truly unknown id return the SAME message, so the
  // return id never leaks existence and is never itself proof of ownership.
  if (!found) {
    return { ok: false, error: "No return with that id was found for your account." };
  }

  return { ok: true, data: found };
}

function isHandoffClassification(value: string): value is HandoffClassification {
  return value === "handoff_recommended" || value === "urgent_handoff";
}

// Record a durable escalation for a sentiment-router handoff. KEY DEPARTURE from
// the cart/orders/returns flows: identity is OPTIONAL and must never block an
// escalation. We resolve the linked customer *softly* — attaching `customerId`
// when the sender is linked, but still recording the escalation (with only the
// raw channel + externalUserId) for an unlinked/revoked sender. It is append-only:
// no preview/confirm pipeline (an escalation is the agent's judgment, not a
// customer-authorized account mutation), but it still writes an audit log.
export async function createHandoff(
  channel: string,
  externalUserId: string,
  classification: string,
  category: string,
  reason: string,
  summary: string
): Promise<ServiceResult<HandoffRecord>> {
  if (!isHandoffClassification(classification)) {
    // `continue` (and anything else) records nothing — only the two handoff
    // signals defined in data/routing/escalation-rules.md produce a record.
    return {
      ok: false,
      error: "Classification must be either 'handoff_recommended' or 'urgent_handoff'."
    };
  }

  const trimmedChannel = channel.trim();
  const trimmedExternalUserId = externalUserId.trim();
  const trimmedCategory = category.trim();
  const trimmedReason = reason.trim();
  const trimmedSummary = summary.trim();
  if (!trimmedChannel || !trimmedExternalUserId) {
    return { ok: false, error: "A channel and external user id are required to record an escalation." };
  }
  if (!trimmedCategory || !trimmedReason || !trimmedSummary) {
    return { ok: false, error: "A category, reason, and customer-safe summary are required." };
  }

  const db = await readShopDb();
  // Soft identity: a successful resolve links the customer; a failure does NOT
  // block the escalation — we never trust a typed customer id, only the binding.
  const linked = resolveLinkedCustomer(db, trimmedChannel, trimmedExternalUserId);
  const customerId = linked.ok && linked.data ? linked.data.customer.id : undefined;
  // Omit customerId entirely for an unlinked/revoked sender — the escalation is
  // still recorded, it just isn't attributed to a known account. Computed once so
  // the record and its audit log can never disagree on attribution.
  const customerIdField = customerId ? { customerId } : {};

  const now = nowIso();
  const handoff: HandoffRecord = {
    id: `handoff_${randomUUID()}`,
    classification,
    category: trimmedCategory,
    reason: trimmedReason,
    summary: trimmedSummary,
    channel: trimmedChannel,
    externalUserId: trimmedExternalUserId,
    ...customerIdField,
    status: "open",
    createdAt: now,
    updatedAt: now
  };
  db.handoffs.push(handoff);

  addLog(db, {
    type: "handoff.create",
    status: "success",
    ...customerIdField,
    summary: `Escalation (${classification}): ${trimmedSummary}`,
    metadata: {
      handoffId: handoff.id,
      classification,
      category: trimmedCategory,
      channel: trimmedChannel,
      externalUserId: trimmedExternalUserId,
      linked: Boolean(customerId)
    }
  });

  await writeShopDb(db);
  return { ok: true, data: handoff };
}

// Ops/audit/demo read over escalation records. Unlike the order/returns reads,
// handoffs are a STAFF/OPS-ONLY domain (ARCHITECTURE §6), so this mirrors
// listActionLogs (optional customerId filter, not an identity-gated own-only
// read) rather than the customer-facing list reads.
// Staff/ops-only, read-only order listing for the proactive ops digest. Unlike
// listOrdersForChannel (identity-gated, own-orders-only), this is an ops-wide read
// like listHandoffs — never wired to a customer surface. Optionally filter by status
// (e.g. "processing") and by aging (orders not updated within `stalerThanDays`), so
// the digest can surface orders stuck in processing. Newest-updated first.
export async function listOrdersOps(options?: {
  status?: OrderStatus;
  stalerThanDays?: number;
}): Promise<ServiceResult<OrderSummary[]>> {
  const db = await readShopDb();
  const staleBefore =
    options?.stalerThanDays !== undefined
      ? Date.parse(nowIso()) - Math.max(0, options.stalerThanDays) * DAY_MS
      : undefined;

  const summaries = (db.orders ?? [])
    .filter((order) => !options?.status || order.status === options.status)
    .filter((order) => staleBefore === undefined || Date.parse(order.updatedAt) <= staleBefore)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .map(buildOrderSummary);

  return { ok: true, data: summaries };
}

// Staff/ops-only, read-only low-stock listing for the proactive ops digest. Returns
// every product at or under the same LOW_STOCK_THRESHOLD the checkout/cart logic uses
// (so "low_stock" and "out_of_stock" both qualify), scarcest first. Ops-wide, like
// listOrdersOps/listHandoffs — never wired to a customer surface.
export async function listLowStockProducts(): Promise<ServiceResult<Product[]>> {
  const db = await readShopDb();
  const products = (db.products ?? [])
    .filter((product) => product.stockQuantity <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stockQuantity - b.stockQuantity);
  return { ok: true, data: products };
}

// ── Staff/admin reads + mutations (the /admin panel) ─────────────────────────
// These are OPS-WIDE (no per-customer ownership gating, like listHandoffs / the ops
// reads above) — the caller is gated by an admin role at the web layer, not here.
// The mutations are DIRECT staff writes (the admin is the human authority), so there
// is no preview/confirm pending-action — but each writes an audit log via addLog,
// mirroring createHandoff. None of them move money (no refund/charge/cancel-as-money).

// Read one handoff by id for the admin detail view (ops-wide).
export async function getHandoffOps(handoffId: string): Promise<ServiceResult<HandoffRecord>> {
  const db = await readShopDb();
  const handoff = (db.handoffs ?? []).find((entry) => entry.id === handoffId);
  if (!handoff) {
    return { ok: false, error: "No handoff with that id was found." };
  }
  return { ok: true, data: handoff };
}

// Read one order by id for the admin detail view (ops-wide — any order, not own-only).
export async function getOrderOps(orderId: string): Promise<ServiceResult<OrderView>> {
  const db = await readShopDb();
  const order = (db.orders ?? []).find((entry) => entry.id === orderId);
  if (!order) {
    return { ok: false, error: "No order with that id was found." };
  }
  return { ok: true, data: buildOrderView(db, order) };
}

// Advance a handoff's status (and optionally attach a resolution note). The agent
// only ever creates a handoff in "open"; working the queue is a human/admin action.
export async function resolveHandoffStatus(
  handoffId: string,
  newStatus: HandoffStatus,
  note?: string
): Promise<ServiceResult<HandoffRecord>> {
  const db = await readShopDb();
  const handoff = (db.handoffs ?? []).find((entry) => entry.id === handoffId);
  if (!handoff) {
    return { ok: false, error: "No handoff with that id was found." };
  }

  const previousStatus = handoff.status;
  const trimmedNote = note?.trim();
  handoff.status = newStatus;
  handoff.updatedAt = nowIso();
  if (trimmedNote) {
    handoff.statusDetail = trimmedNote;
  }

  addLog(db, {
    type: "handoff.update",
    status: "success",
    ...(handoff.customerId ? { customerId: handoff.customerId } : {}),
    summary: `Handoff ${handoff.id}: ${previousStatus} → ${newStatus}${trimmedNote ? " (note added)" : ""}.`,
    metadata: { handoffId: handoff.id, previousStatus, newStatus, noteAdded: Boolean(trimmedNote) }
  });
  await writeShopDb(db);

  return { ok: true, data: handoff };
}

// Advance an order's status and optionally merge shipping/tracking detail. Stamps
// shippedAt / deliveredAt when the order first reaches those states. A human/admin
// action (the agent never works the fulfilment queue); never moves money.
export async function advanceOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  shipping?: Partial<OrderShipping>
): Promise<ServiceResult<OrderView>> {
  const db = await readShopDb();
  const order = (db.orders ?? []).find((entry) => entry.id === orderId);
  if (!order) {
    return { ok: false, error: "No order with that id was found." };
  }

  const previousStatus = order.status;
  const now = nowIso();
  order.status = newStatus;
  order.updatedAt = now;

  const carrier = shipping?.carrier?.trim();
  const trackingNumber = shipping?.trackingNumber?.trim();
  const estimatedDelivery = shipping?.estimatedDelivery?.trim();
  if (carrier || trackingNumber || estimatedDelivery || newStatus === "shipped" || newStatus === "delivered") {
    const merged: OrderShipping = { ...order.shipping };
    if (carrier) merged.carrier = carrier;
    if (trackingNumber) merged.trackingNumber = trackingNumber;
    if (estimatedDelivery) merged.estimatedDelivery = estimatedDelivery;
    if (newStatus === "shipped" && !merged.shippedAt) merged.shippedAt = now;
    if (newStatus === "delivered" && !merged.deliveredAt) merged.deliveredAt = now;
    order.shipping = merged;
  }

  addLog(db, {
    type: "order.update",
    status: "success",
    customerId: order.customerId,
    summary: `Order ${order.id}: ${previousStatus} → ${newStatus}${trackingNumber ? ` (tracking ${trackingNumber})` : ""}.`,
    metadata: { orderId: order.id, previousStatus, newStatus, carrier: carrier ?? null, trackingNumber: trackingNumber ?? null }
  });
  await writeShopDb(db);

  return { ok: true, data: buildOrderView(db, order) };
}

// Set a product's absolute stock quantity and recompute its derived stock status.
// A human/admin restock/correction action (the agent only ever decrements stock at
// checkout). Rejects a negative or non-integer quantity.
export async function adjustProductStock(
  productId: string,
  newQuantity: number,
  reason?: string
): Promise<ServiceResult<Product>> {
  if (!Number.isInteger(newQuantity) || newQuantity < 0) {
    return { ok: false, error: "Stock quantity must be a whole number of 0 or more." };
  }
  const db = await readShopDb();
  const product = (db.products ?? []).find((entry) => entry.id === productId);
  if (!product) {
    return { ok: false, error: "No product with that id was found." };
  }

  const previousQuantity = product.stockQuantity;
  product.stockQuantity = newQuantity;
  product.stockStatus = stockStatusFor(newQuantity);

  const trimmedReason = reason?.trim();
  addLog(db, {
    type: "product.stock_adjust",
    status: "success",
    summary: `Stock for ${product.name}: ${previousQuantity} → ${newQuantity}${trimmedReason ? ` (${trimmedReason})` : ""}.`,
    metadata: { productId: product.id, previousQuantity, newQuantity, reason: trimmedReason ?? null }
  });
  await writeShopDb(db);

  return { ok: true, data: product };
}

export async function listHandoffs(
  customerId?: string,
  limit = 20
): Promise<ServiceResult<HandoffRecord[]>> {
  const db = await readShopDb();
  const handoffs = (db.handoffs ?? [])
    .filter((handoff) => !customerId || handoff.customerId === customerId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, Math.max(1, Math.min(limit, 100)));
  return { ok: true, data: handoffs };
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
