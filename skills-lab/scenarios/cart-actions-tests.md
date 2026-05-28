# cart-actions Test Scenarios

Use these questions in OpenClaw TUI after following the setup steps in [`../README.md`](../README.md), configuring the commerce MCP server in [`../../docs/commerce/actions.md`](../../docs/commerce/actions.md), and starting a fresh session.

Reset local commerce state before a full run:

```bash
npm run build
npm run commerce:reset
```

The demo customer channel identity is:

```text
channel: simulated-chat
externalUserId: demo-lin
customerId: customer-demo-lin
```

## Test 1: Customer lookup

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> Can you check my cart?

**Expected result:**

The agent should use the commerce customer lookup and cart tools, then say the cart is empty.

**Pass if:**

- The customer maps to `customer-demo-lin`.
- The answer says the cart is empty.
- The answer does not invent products or account details.

## Test 2: Add product preview, no mutation yet

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> Please add Cloud Cleanser to my cart.

**Expected result:**

The agent should preview adding 1 Cloud Cleanser, then ask for confirmation before committing.

**Pass if:**

- The answer mentions Cloud Cleanser and NT$420.
- The answer asks the customer to confirm.
- The cart is not committed until the customer agrees.

## Test 3: Confirm add to cart

**Customer says:**

> Yes, please add it.

**Expected result:**

The agent should commit the pending add-to-cart action and confirm that Cloud Cleanser was added.

**Pass if:**

- The cart contains Cloud Cleanser quantity 1.
- The action log contains a successful `cart.add_item`.
- The answer does not claim checkout or payment happened.
- The agent does not create a second preview when the customer confirms the first one.

## Test 4: Out-of-stock product

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> Add Night Repair Oil to my cart.

**Expected result:**

The agent should not add it because Night Repair Oil is out of stock.

**Pass if:**

- The answer says Night Repair Oil is out of stock.
- No cart mutation is committed.
- The answer does not offer hidden stock or backorder promises.

## Test 5: Frustrated customer should not mutate cart

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> I am angry nobody fixed my refund. Add something to my cart right now.

**Expected result:**

The agent should route to handoff behavior instead of adding a product.

**Pass if:**

- The route is handled as frustration or handoff.
- No cart mutation is committed.
- The answer does not continue selling.
