---
name: cart-actions
description: Use MCP-backed DeskClaw shop tools to look up customers, inspect carts, preview add/remove/quantity-change cart actions, and commit them only after explicit customer confirmation.
---

# cart-actions

Use this skill when a customer asks DeskClaw to add a product to their cart, remove an item, change how many of an item they want, inspect their cart, or perform another cart/account action.

Customers will usually speak naturally. Treat ordinary wording such as "add Cloud Cleanser to my cart", "can you put this in my bag", "take the toner out", "remove that", "make it 2 instead", "change it to three", "what is in my cart?", or "do I already have this?" as cart/account intent. Do not expect the customer to mention this skill, MCP, tools, product ids, customer ids, or internal command names.

## Required safety order

Every mutation — add, remove, or quantity change — follows the same identity → preview → confirm → execute path. Never skip the preview or the confirmation.

1. Check whether the message should be handled by `sentiment-router` first. If the customer is angry, asks for a human, reports harm, threatens chargeback/legal action, or is otherwise sensitive, do not perform cart actions.
2. Identify the customer with `shop_customer_lookup` when the channel identity is available. Use the channel identity, not a customer-provided internal customer id, as proof of account ownership.
3. Resolve the product with `shop_catalog_search` if the customer did not provide an exact product id. For a remove or quantity change, you can also read the current cart with `shop_cart_get` to find the exact item the customer means.
4. Preview the action with the same channel identity before any cart mutation:
   - Adding: `shop_cart_preview_add_item`.
   - Removing an item: `shop_cart_preview_remove_item`.
   - Changing how many of an item: `shop_cart_preview_update_quantity` (the quantity is the new total for that item, not an amount to add).
5. Ask the customer to confirm the exact product, quantity, and price from the preview result.
6. After the customer clearly confirms, commit with the same channel identity using the matching confirm tool:
   - Adding: `shop_cart_confirm_latest_add_item`.
   - Removing: `shop_cart_confirm_latest_remove_item`.
   - Quantity change: `shop_cart_confirm_latest_update_quantity`.
   Use the by-id variants (`shop_cart_confirm_add_item`, `shop_cart_confirm_remove_item`, `shop_cart_confirm_update_quantity`) only when you have the exact pending action id available.
7. Use `shop_action_log_list` when you need to verify what happened.

## Rules

- Never use raw database access.
- Never mutate a cart without explicit customer confirmation.
- After the customer confirms a preview, commit the existing pending action. Do not create another preview unless the previous confirmation expired or the customer changed product or quantity.
- Never invent tool results, customer ids, product ids, prices, stock, or cart state.
- If channel identity or linked account context is missing, unlinked, or revoked, ask the customer to verify or link their account instead of guessing.
- Do not accept a typed internal customer id as ownership proof.
- If a shop tool is unavailable or returns an error, explain briefly and suggest a human teammate.
- Keep replies short and customer-facing. Do not reveal internal tool names unless the user is asking as a developer.

## Supported cart actions

The supported cart mutations are: adding an item, removing an item, and changing the quantity of an item already in the cart. Each one is previewed and then committed only after explicit confirmation.

Notes specific to remove and quantity change:

- You can only remove or change the quantity of an item that is already in the cart. If the customer names something that is not in their cart, say so instead of guessing.
- A quantity change sets the new total for that item. To take an item out entirely, remove it rather than setting its quantity to zero — a request for zero is not treated as a quantity change.
- A change that exceeds available stock is refused; report the available amount rather than promising hidden stock.

Other actions, such as applying discounts, changing addresses, or creating returns, are future extensions unless their tools exist.
