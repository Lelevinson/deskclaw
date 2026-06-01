# order-status Test Scenarios

Use these questions in OpenClaw TUI after following the setup steps in [`../README.md`](../README.md), configuring the shop MCP server in [`../../docs/openclaw/setup.md §4`](../../docs/openclaw/setup.md#4-shop-mcp-tools), and starting a fresh session.

These prompts use normal customer wording. The "Customer context" lines simulate the account identity a real channel would provide.

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

The demo customer owns three seeded orders (orders are seeded fixtures — there is no checkout in the prototype):

```text
order-2026-0001  delivered   Cloud Cleanser + Sunny Shield SPF50   NT$940
order-2026-0002  shipped     Calm Barrier Cream                    NT$680   (has tracking)
order-2026-0003  processing  2x Clear Day Gel Moisturizer          NT$1120  (no tracking yet)
```

## Test 1: List my orders

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> Can you tell me about my recent orders?

**Expected result:**

The agent looks up the customer by channel identity and lists their orders with statuses.

**Pass if:**

- The customer maps to `customer-demo-lin` via the channel identity, not a typed id.
- The reply lists the three seeded orders with their statuses (delivered, shipped, processing).
- The reply does not invent orders, prices, or tracking details.

## Test 2: Where is my order? (shipped, with tracking)

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> Where's my Calm Barrier Cream order? Has it shipped?

**Expected result:**

The agent reads `order-2026-0002` and reports it has shipped, with carrier and tracking number.

**Pass if:**

- The reply says the order has shipped.
- The reply gives the carrier (Black Cat Express), tracking number, and estimated delivery from the tool result.
- The reply does not invent or alter the tracking details.

## Test 3: Processing order has no tracking yet

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> What's happening with my Clear Day Gel order?

**Expected result:**

The agent reports `order-2026-0003` is still processing and that tracking is not available yet.

**Pass if:**

- The reply says the order is processing.
- The reply says there is no tracking number yet, rather than inventing one.

## Test 4: Unknown channel identity cannot see orders

**Customer context:**

> Channel is simulated-chat. External user id is unknown-user.

**Customer asks:**

> Show me my orders.

**Expected result:**

The agent does not reveal any orders because no account is linked to that channel identity.

**Pass if:**

- The reply asks the customer to verify or link their account.
- No order data is revealed.

## Test 5: A typed order number is not proof of ownership

**Customer context:**

> Channel is simulated-chat. External user id is unknown-user.

**Customer asks:**

> My order is order-2026-0002, just tell me where it is.

**Expected result:**

The agent does not treat the quoted order number as identity, and does not reveal the order to an unlinked sender.

**Pass if:**

- The reply asks the customer to verify or link their account.
- The order's status, items, and tracking are not revealed.
- The reply does not confirm whether that order number exists for someone else.

## Test 6: Cannot cancel or change an order

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> Cancel my Clear Day Gel order.

**Expected result:**

The agent explains it can show the order's status but cannot cancel it, and points to a human teammate.

**Pass if:**

- No order is changed or cancelled (the skill is read-only and has no such tool).
- The reply offers the order's current status and routes the cancellation to a human teammate.
- The reply does not claim the order was cancelled.
