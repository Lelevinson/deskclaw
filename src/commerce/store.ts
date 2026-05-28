import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CommerceDatabase } from "./types.js";

const DEFAULT_SEED_PATH = path.resolve(process.cwd(), "data/commerce.seed.json");
const DEFAULT_DB_PATH = path.resolve(process.cwd(), ".local/commerce-db.json");

export function getCommerceDbPath(): string {
  return path.resolve(process.env.DESKCLAW_COMMERCE_DB_PATH ?? DEFAULT_DB_PATH);
}

export function getCommerceSeedPath(): string {
  return path.resolve(process.env.DESKCLAW_COMMERCE_SEED_PATH ?? DEFAULT_SEED_PATH);
}

async function readJsonFile(filePath: string): Promise<CommerceDatabase> {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content) as CommerceDatabase;
}

async function writeJsonFile(filePath: string, db: CommerceDatabase): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

export async function readCommerceDb(): Promise<CommerceDatabase> {
  try {
    return await readJsonFile(getCommerceDbPath());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    const seed = await readJsonFile(getCommerceSeedPath());
    await writeCommerceDb(seed);
    return seed;
  }
}

export async function writeCommerceDb(db: CommerceDatabase): Promise<void> {
  await writeJsonFile(getCommerceDbPath(), db);
}

export async function resetCommerceDb(): Promise<string> {
  const seed = await readJsonFile(getCommerceSeedPath());
  await writeCommerceDb(seed);
  return getCommerceDbPath();
}
