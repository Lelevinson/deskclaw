---
name: cart-actions
description: Use MCP-backed DeskClaw commerce tools to look up customers, inspect carts, preview add-to-cart actions, and commit cart additions only after explicit customer confirmation.
---

# cart-actions

Use this skill when a customer asks DeskClaw to add a product to their cart, inspect their cart, or perform another cart/account commerce action.

Customers will usually speak naturally. Treat ordinary wording such as "add Cloud Cleanser to my cart", "can you put this in my bag", "what is in my cart?", or "do I already have this?" as cart/account intent. Do not expect the customer to mention this skill, MCP, tools, product ids, customer ids, or internal command names.

## Required safety order

1. Check whether the message should be handled by `sentiment-router` first. If the customer is angry, asks for a human, reports harm, threatens chargeback/legal action, or is otherwise sensitive, do not perform commerce actions.
2. Identify the customer with `commerce_customer_lookup` when the channel identity is available.
3. Resolve the product with `commerce_catalog_search` if the customer did not provide an exact product id.
4. Use `commerce_cart_preview_add_item` before any cart mutation.
5. Ask the customer to confirm the exact product, quantity, and price from the preview result.
6. Use `commerce_cart_confirm_latest_add_item` after the customer clearly confirms. Use `commerce_cart_confirm_add_item` only when you have the exact pending action id available.
7. Use `commerce_action_log_list` when you need to verify what happened.

## Rules

- Never use raw database access.
- Never mutate a cart without explicit customer confirmation.
- After the customer confirms a preview, commit the existing pending action. Do not create another preview unless the previous confirmation expired or the customer changed product or quantity.
- Never invent tool results, customer ids, product ids, prices, stock, or cart state.
- If channel identity or account context is missing, ask for the missing account context instead of guessing.
- If a commerce tool is unavailable or returns an error, explain briefly and suggest a human teammate.
- Keep replies short and customer-facing. Do not reveal internal tool names unless the user is asking as a developer.

## First supported action

The first supported mutation is adding an item to a cart. Other actions, such as removing items, applying discounts, changing addresses, or creating returns, are future extensions unless their tools exist.
