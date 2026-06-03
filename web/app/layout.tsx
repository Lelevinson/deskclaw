import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Jost } from "next/font/google";

import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { getDemoCustomerName } from "@/lib/shop";

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
    "A companion view to the Amelya's assistant — browse the skincare catalogue. No checkout in this demo.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customerName = await getDemoCustomerName();
  return (
    <html lang="en" className={`${cinzel.variable} ${cormorant.variable} ${jost.variable}`}>
      <body>
        <AppShell customerName={customerName}>{children}</AppShell>
      </body>
    </html>
  );
}
