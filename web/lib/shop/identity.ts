// The storefront has no login (auth is deferred — ARCHITECTURE §5, roadmap §4).
// It shops as the single pre-linked demo customer, treating the web session as a
// fixed channel identity. We reuse the EXISTING seeded account-link
// (data/customers/account-links.json) rather than minting a new channel, so no
// data changes are needed and the same identity → ownership → audit path the
// chat skills use applies verbatim.
//
// channel + externalUserId → accountLink → customerId (= customer-demo-lin)
export const DEMO_IDENTITY = {
  channel: "simulated-chat",
  externalUserId: "demo-lin",
} as const;
