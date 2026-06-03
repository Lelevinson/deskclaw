// Amelya's display formatting (DESIGN.md §3.4). Pure, framework-free.

// Currency: NT$ prefix, comma thousands, NO decimals → NT$420, NT$1,000.
export function formatNtd(amount: number): string {
  return `NT$${Math.round(amount).toLocaleString("en-US")}`;
}

// Title-case a catalog category for display ("facial oil" → "Facial Oil").
export function formatCategory(category: string): string {
  return category.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Order id → a short display number. Stored ids look like "order-2026-0001";
// show the part after the "order-" prefix ("#2026-0001"). Falls back to the raw
// id so a differently-shaped id still renders.
export function formatOrderId(id: string): string {
  return `#${id.replace(/^order-/, "")}`;
}

// Dates: day month year → "3 Jun 2026".
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
