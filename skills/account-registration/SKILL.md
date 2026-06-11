---
name: account-registration
description: Help an unlinked DeskClaw sender create a new customer account, or link their channel identity to an existing account with a verification code, so identity-gated skills (cart, orders, returns) can serve them.
---

# account-registration

Use this skill when a sender who is **not yet linked to a customer account** wants to sign up, create an account, or connect an account they already have — or when another identity-gated skill (`cart-actions`, `order-status`, `returns-actions`) finds the sender unlinked and they want to proceed.

Customers speak naturally: "sign me up", "I want to make an account", "register me", "I already have an account", "this is my number, link me", or simply asking for their cart/orders while unlinked. Do not expect them to mention this skill, tools, MCP, customer ids, or command names.

## Required safety order

1. Check whether the message should be handled by `sentiment-router` first (anger, request for a human, harm, legal/chargeback threats). If so, escalate instead of registering.
2. Confirm the sender is actually unlinked with `shop_customer_lookup` using the channel identity. If it already resolves to a customer, tell them they are already set up as that name and continue with their original request — do not register again.
3. If unlinked, ask whether they want to **create a new account** or **link an existing account**:
   - **New account:** ask the name they want on the account, read it back to confirm, then call `shop_account_register` with the channel identity and that name. On success, welcome them and continue with whatever they originally wanted. The result includes an **`accountCode`** — read it back to them once and let them know they can use it to set up a login on the website (the "Set up web login" option), so their web cart and orders match this account. Share the code only with the sender who just registered, and never invent or guess one.
   - **Existing account:** ask for their **account verification code**, then call `shop_account_link_existing` with the channel identity and the code. On success, welcome them back. If the code is not recognized, say so plainly and let them try again or offer a human teammate — never reveal, guess, or invent a code.
4. Use `shop_action_log_list` only if you need to verify what was recorded.

## Rules

- The **channel identity** (`channel` + `externalUserId` from the message context) is the proof of which device is registering. Always pass the channel-supplied value — never a phone number or internal id the customer typed into the chat.
- A sender can only register or link **their own** channel identity. You cannot register on behalf of someone else, and you cannot link to an existing account without its verification code.
- Linking to an existing account requires the code. Without it, do not link — offer to create a new account or hand off to a human instead.
- Never use raw database access. Never invent tool results, names, codes, or account state.
- Keep replies short and warm. Do not reveal internal tool names unless the user is asking as a developer.

## What this skill does not do

It does not change an address, repair a broken/revoked link from chat, or deliver a verification code to the customer (the code is a stand-in for an out-of-band one-time code; real code delivery and deep-link/QR onboarding are out of scope — ARCHITECTURE §5). It only creates a new account, or links an existing one when the customer already has the code.
