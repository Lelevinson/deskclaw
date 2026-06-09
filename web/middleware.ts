import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// A cheap first-pass gate on the protected routes: no session cookie → 307 to
// /login before render (clean, no page flash for logged-out visitors). It is a
// PRESENCE check only — the edge can't read the server-only HMAC/store — so the
// authoritative check is requireIdentity() in the page (which also rejects a
// validly-signed-but-unresolvable cookie, e.g. an account cleared by shop:reset).
// The /login and /register pages are intentionally NOT gated here; their own
// resolution-based guards send a genuinely-logged-in user to "/".
const COOKIE_NAME = "deskclaw_session";

export function middleware(request: NextRequest) {
  if (request.cookies.get(COOKIE_NAME)?.value) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/cart/:path*", "/orders/:path*", "/returns/:path*", "/account/:path*"],
};
