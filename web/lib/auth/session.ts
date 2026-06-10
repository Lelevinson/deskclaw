import "server-only";

// The storefront session: an HMAC-signed, httpOnly cookie holding the logged-in
// username. The username is the externalUserId of the customer's "web"
// account-link, so a session resolves through the SAME resolveLinkedCustomer path
// every channel uses — no parallel identity logic. The HMAC stops a client from
// forging another user's session; we still re-resolve the customer server-side on
// every request, so a cookie alone never grants access to missing/revoked accounts.
import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getWebAccountRole, lookupCustomerByChannel } from "@shop/service.js";
import type { AccountRole } from "@shop/types.js";

const COOKIE_NAME = "deskclaw_session";
const CHANNEL = "web" as const;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface WebIdentity {
  channel: typeof CHANNEL;
  externalUserId: string;
}

function sessionSecret(): string {
  const secret = process.env.DESKCLAW_SESSION_SECRET;
  if (secret && secret.length > 0) return secret;
  console.warn(
    "[deskclaw] DESKCLAW_SESSION_SECRET is not set — using an insecure dev fallback. Set it in web/.env.",
  );
  return "deskclaw-dev-insecure-secret";
}

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

// Cookie value is "<username>.<hmac>"; decode returns the username only if the
// signature verifies (constant-time), else null.
function encode(username: string): string {
  return `${username}.${sign(username)}`;
}

function decode(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const username = token.slice(0, idx);
  const mac = Buffer.from(token.slice(idx + 1));
  const expected = Buffer.from(sign(username));
  if (mac.length !== expected.length || !timingSafeEqual(mac, expected)) return null;
  return username;
}

// Nullable read — safe in render (layout, public pages). Never redirects.
export async function getIdentity(): Promise<WebIdentity | null> {
  const store = await cookies();
  const username = decode(store.get(COOKIE_NAME)?.value);
  return username ? { channel: CHANNEL, externalUserId: username } : null;
}

// Gate a route: redirects to /login when there is no valid session.
export async function requireIdentity(): Promise<WebIdentity> {
  const id = await getIdentity();
  if (!id) redirect("/login");
  // A validly-signed cookie can still point at a customer that no longer exists
  // (a runtime account cleared by `shop:reset`, an expired/revoked link). Treat an
  // unresolvable session as logged out, so the header ("Sign in") and the gates
  // (bounce to /login) stay consistent instead of rendering empty pages.
  const resolved = await lookupCustomerByChannel(id.channel, id.externalUserId);
  if (!resolved.ok) redirect("/login");
  return id;
}

// Nullable role read — safe in render (e.g. the header deciding whether to show the
// Admin link). Returns null when logged out or unresolvable; never redirects.
export async function getSessionRole(): Promise<AccountRole | null> {
  const id = await getIdentity();
  if (!id) return null;
  const result = await getWebAccountRole(id.externalUserId);
  return result.ok && result.data ? result.data.role : null;
}

// Gate the /admin area: requires a valid session AND the admin role. A logged-out or
// unresolvable session bounces to /login (via requireIdentity); a logged-in NON-admin
// is sent to the storefront home (no admin surface for ordinary shoppers). Call once
// in the admin layout so the whole subtree is protected server-side.
export async function requireAdmin(): Promise<WebIdentity> {
  const id = await requireIdentity();
  const result = await getWebAccountRole(id.externalUserId);
  if (!result.ok || result.data?.role !== "admin") redirect("/");
  return id;
}

// Write/clear the cookie. Callable only from Server Actions / Route Handlers.
export async function setSession(username: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, encode(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
