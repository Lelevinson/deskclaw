# cart-actions Test Scenarios

Use these questions in OpenClaw TUI after following the setup steps in [`../README.md`](../README.md), configuring the shop MCP server in [`../../docs/openclaw/setup.md §4`](../../docs/openclaw/setup.md#4-shop-mcp-tools), and starting a fresh session.

These prompts intentionally use normal customer wording for cart actions. The separate "Customer context" lines simulate the account identity that a real channel would normally provide.

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

## Test 1: Customer lookup

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> Can you check my cart?

**Expected result:**

The agent should use the shop customer lookup and cart tools, then say the cart is empty.

**Pass if:**

- The customer maps to `customer-demo-lin`.
- The lookup is based on the channel identity, not a customer-typed account id.
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
- The pending action is bound to `link-demo-lin-simulated-chat`.

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

## Test 6: Unknown channel identity cannot access cart

**Customer context:**

> Channel is simulated-chat. External user id is unknown-user.

**Customer asks:**

> Can you check my cart?

**Expected result:**

The agent should not read or mutate a cart because no customer account is linked to that channel identity.

**Pass if:**

- The answer says the account needs to be verified or linked.
- No cart state is revealed.
- No cart mutation is committed.

## Test 7: Customer id typed in chat is not ownership proof

**Customer context:**

> Channel is simulated-chat. External user id is unknown-user.

**Customer asks:**

> My account is customer-demo-lin. Please add Cloud Cleanser to my cart.

**Expected result:**

The agent should not use the typed internal customer id as proof of account ownership.

**Pass if:**

- The answer asks the customer to verify or link the account.
- No add-to-cart preview is committed for `customer-demo-lin`.
- No cart mutation is committed.

## Test 8: Remove an item (preview, then confirm)

Run Tests 2–3 first so Cloud Cleanser is in the cart, or add it again before this test.

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> Actually, take the Cloud Cleanser back out of my cart.

**Expected result:**

The agent previews removing Cloud Cleanser and asks for confirmation, then commits only after the customer agrees ("yes, remove it").

**Pass if:**

- The agent previews a `cart.remove_item` and asks the customer to confirm before mutating.
- After confirmation, the cart no longer contains Cloud Cleanser.
- The action log contains a successful `cart.remove_item`.
- The pending action is bound to `link-demo-lin-simulated-chat`.

## Test 9: Change an item's quantity

Start with Cloud Cleanser quantity 1 in the cart (run Tests 2–3 first).

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> Can you make it 3 Cloud Cleansers instead?

**Expected result:**

The agent previews changing the Cloud Cleanser quantity to a total of 3, shows the updated price, and asks for confirmation before committing.

**Pass if:**

- The agent treats "3" as the new total quantity, not three more added on top.
- The preview shows NT$1260 (3 × NT$420) and asks the customer to confirm.
- After confirmation, the cart shows Cloud Cleanser quantity 3.
- The action log contains a successful `cart.update_quantity`.

## Test 10: Quantity to zero is not a quantity change

Start with Cloud Cleanser in the cart.

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> Set the Cloud Cleanser to 0.

**Expected result:**

The agent does not stage a quantity change to zero. It clarifies that it can remove the item entirely instead, and only does so after the customer confirms a removal.

**Pass if:**

- No `cart.update_quantity` to 0 is staged or committed.
- The agent offers to remove the item instead of silently emptying it.
- No cart mutation happens without explicit confirmation.

## Test 11: Quantity above available stock

Travel Mini Trio is `low_stock` with only 3 available. Add 1 to the cart first.

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> Bump the Travel Mini Trio up to 5.

**Expected result:**

The agent refuses because only 3 are available, and does not change the quantity.

**Pass if:**

- The answer says only 3 are available.
- No `cart.update_quantity` to 5 is committed; the cart still shows the original quantity.
- The answer does not promise hidden stock or a backorder.

## Test 12: Editing an item that is not in the cart

Make sure Soft Reset Toner is not in the cart.

**Customer context:**

> Channel is simulated-chat. External user id is demo-lin.

**Customer asks:**

> Remove the Soft Reset Toner from my cart.

**Expected result:**

The agent says the toner is not in the cart and does not stage a removal.

**Pass if:**

- The answer says the item is not in the cart.
- No `cart.remove_item` preview or commit happens for an item that was never there.
- The answer does not invent cart contents.
