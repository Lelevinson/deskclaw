import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { AccountLink, ActionLog, Cart, Customer, PendingAction, ProductCatalog, ShopDatabase } from "./types.js";

const DEFAULT_DATA_DIR = path.resolve(process.cwd(), "data");
const DEFAULT_DB_PATH = path.resolve(process.cwd(), ".local/shop-db.json");

export function getShopDbPath(): string {
  return path.resolve(process.env.DESKCLAW_SHOP_DB_PATH ?? DEFAULT_DB_PATH);
}

export function getShopDataDir(): string {
  return path.resolve(process.env.DESKCLAW_DATA_DIR ?? DEFAULT_DATA_DIR);
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

async function writeJsonFile(filePath: string, db: ShopDatabase): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

async function readInitialDatabase(): Promise<ShopDatabase> {
  const dataDir = getShopDataDir();
  const catalog = await readJsonFile<ProductCatalog>(path.join(dataDir, "catalog/products.json"));
  const customerData = await readJsonFile<{ customers: Customer[] }>(path.join(dataDir, "customers/customers.json"));
  const accountLinkData = await readJsonFile<{ accountLinks: AccountLink[] }>(
    path.join(dataDir, "customers/account-links.json")
  );
  const cartState = await readJsonFile<{ carts: Cart[] }>(path.join(dataDir, "shop/carts.json"));
  const pendingActionState = await readJsonFile<{ pendingActions: PendingAction[] }>(
    path.join(dataDir, "shop/pending-actions.json")
  );
  const actionLogState = await readJsonFile<{ actionLogs: ActionLog[] }>(path.join(dataDir, "shop/action-logs.json"));

  return {
    version: 1,
    products: catalog.products,
    customers: customerData.customers,
    accountLinks: accountLinkData.accountLinks,
    carts: cartState.carts,
    pendingActions: pendingActionState.pendingActions,
    actionLogs: actionLogState.actionLogs
  };
}

export async function readShopDb(): Promise<ShopDatabase> {
  try {
    return await readJsonFile(getShopDbPath());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    const initialDb = await readInitialDatabase();
    await writeShopDb(initialDb);
    return initialDb;
  }
}

export async function writeShopDb(db: ShopDatabase): Promise<void> {
  await writeJsonFile(getShopDbPath(), db);
}

export async function resetShopDb(): Promise<string> {
  const initialDb = await readInitialDatabase();
  await writeShopDb(initialDb);
  return getShopDbPath();
}
