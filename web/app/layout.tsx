import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Jost } from "next/font/google";

import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { getCartCount, getCurrentCustomerName } from "@/lib/shop";
import { getSessionRole } from "@/lib/auth/session";

// DESIGN.md §3.2 — Cinzel (display/logo), Cormorant (editorial), Jost (UI).
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cinzel",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});
const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Amelya's — Skincare, simply.",
  description:
    "A companion view to the Amelya's assistant — browse the skincare catalogue, build a cart, and place a mock order (no payment).",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [customerName, cartCount, role] = await Promise.all([
    getCurrentCustomerName(),
    getCartCount(),
    getSessionRole(),
  ]);
  return (
    <html lang="en" className={`${cinzel.variable} ${cormorant.variable} ${jost.variable}`}>
      <body>
        <AppShell customerName={customerName} cartCount={cartCount} isAdmin={role === "admin"}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
