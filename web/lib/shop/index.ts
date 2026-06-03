import "server-only";

// The storefront's single data-access seam onto the existing shop backend.
//
// NON-NEGOTIABLE (roadmap §3, DESIGN.md §7): the browser never touches data/ or
// the JSON store. Only server components / route handlers / server actions import
// this module, and it calls the SAME typed src/shop service functions the MCP
// tools wrap — so identity gating, ownership checks, and audit logging are the
// one real code path, not a parallel reimplementation. New customer-visible
// domains add one typed function here + one route, never a rewrite.
import {
  getProductById,
  listProducts,
  lookupCustomerByChannel,
} from "@shop/service.js";
import type { Product } from "@shop/types.js";

import { DEMO_IDENTITY } from "./identity";

export type { Product };

// Resolve the pre-linked demo customer's display name for the "Shopping as …"
// indicator (DESIGN.md §5.1). Falls back gracefully if the link is ever missing.
export async function getDemoCustomerName(): Promise<string> {
  const result = await lookupCustomerByChannel(
    DEMO_IDENTITY.channel,
    DEMO_IDENTITY.externalUserId,
  );
  return result.ok && result.data ? result.data.displayName : "Guest";
}

// Full catalogue for the catalogue grid (surface 2) — public, browse-only.
export async function getCatalogue(): Promise<Product[]> {
  const result = await listProducts();
  return result.ok && result.data ? result.data : [];
}

// One product for the PDP (surface 3). Returns null for an unknown id so the
// route can render a neutral 404 — no id echo, no existence leak.
export async function getProduct(id: string): Promise<Product | null> {
  const result = await getProductById(id);
  return result.ok && result.data ? result.data : null;
}
