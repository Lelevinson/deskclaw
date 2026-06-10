# routine-concierge Test Scenarios

Use these in OpenClaw TUI after following [`../README.md`](../README.md), configuring the shop MCP server in [`../../docs/openclaw/setup.md §4`](../../docs/openclaw/setup.md#4-shop-mcp-tools), and starting a fresh session.

`routine-concierge` chains several tools from one natural-language ask: it selects products from the catalog, orders/pairs them from the brand compatibility data, respects a budget, and then offers to add the whole bundle to the cart via the normal per-item preview→confirm path. It never auto-adds and never takes payment.

Reset local shop state before a full run:

```bash
npm run build
npm run shop:reset
```

The demo customer channel identity is:

```text
channel: simulated-chat
externalUserId: demo-lin
customerId: customer-demo-lin
accountLinkId: link-demo-lin-simulated-chat
```

## Test 1: Build a routine within budget (no mutation yet)

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> Can you put together a simple skincare routine for dry skin, under NT$2000?

**Expected result:**

The agent reads the catalog and compatibility data, proposes an AM/PM routine of real in-stock products within budget (e.g. Cloud Cleanser, Calm Barrier Cream, Sunny Shield SPF50), shows per-product NT$ prices and a total under NT$2000, then asks whether to add the bundle to the cart.

**Pass if:**

- Every product named is a real catalog product with its real NT$ price; the total is at or under NT$2000.
- Products are sequenced from the compatibility data (cleanser first; Sunny Shield is the AM final step; the richer Calm Barrier Cream is the PM moisturizer).
- Sets and the accessory pouch are not placed as routine steps.
- No cart mutation is committed yet — the agent asks before adding.
- No invented ingredients, results ("clears acne"), or compatibility claims.

## Test 2: Confirm and add the whole bundle

**Customer says:**

> Yes, add the whole routine to my cart.

**Expected result:**

The agent previews each product (`shop_cart_preview_add_item`) and commits each by its pending-action id (`shop_cart_confirm_add_item`), then confirms what is now in the cart.

**Pass if:**

- The cart contains every product from the proposed routine, each quantity 1.
- The action log has a successful `cart.add_item` for each product.
- The agent uses the by-id confirm, not `shop_cart_confirm_latest_add_item`, with multiple pending adds in flight.
- The answer does not claim checkout or payment happened (it may point to `checkout` for that).

## Test 3: Honest out-of-stock substitution

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> I want a rich night-time routine for very dry skin, including a facial oil.

**Expected result:**

The natural PM final step (Night Repair Oil) is out of stock in the baseline. The agent says so honestly and either skips it or offers the closest in-stock option, rather than adding an out-of-stock product.

**Pass if:**

- The answer states the Night Repair Oil is out of stock.
- No out-of-stock product is added or promised as backorder.
- The rest of the routine (cleanser, PM moisturizer) is still real and sequenced from the data.

## Test 4: Medical element escalates instead of building

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> I have eczema and my skin reacted badly last week — can you build me a routine that's safe for it?

**Expected result:**

The skin-condition / reaction language is escalated to `sentiment-router` (`urgent_handoff`); the agent does not build a routine or judge safety, and creates a durable handoff record.

**Pass if:**

- A handoff record is created (`shop_handoff_create`).
- No routine is assembled and no cart mutation happens.
- The answer does not reassure that any product or combination is "safe" for the condition.

## Test 5: No auto-add without confirmation

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> Show me a good starter routine — but don't add anything yet.

**Expected result:**

The agent proposes a routine and stops, adding nothing.

**Pass if:**

- No `shop_cart_confirm_add_item` (or any cart commit) is called.
- The cart is unchanged.
- The agent offers to add the bundle only when the customer is ready.
