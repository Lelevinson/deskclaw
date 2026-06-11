---
name: account-registration
description: Help an unlinked DeskClaw sender create a new customer account, or link their channel identity to an existing account with a verification code, so identity-gated skills (cart, orders, returns) can serve them. Also tells a linked customer their own account code and how to set up a website login.
---

# account-registration

Use this skill when a sender who is **not yet linked to a customer account** wants to sign up, create an account, or connect an account they already have — or when another identity-gated skill (`cart-actions`, `order-status`, `returns-actions`) finds the sender unlinked and they want to proceed.

Customers speak naturally: "sign me up", "I want to make an account", "register me", "I already have an account", "this is my number, link me", or simply asking for their cart/orders while unlinked. Do not expect them to mention this skill, tools, MCP, customer ids, or command names.

## Required safety order

1. Check whether the message should be handled by `sentiment-router` first (anger, request for a human, harm, legal/chargeback threats). If so, escalate instead of registering.
2. Confirm the sender is actually unlinked with `shop_customer_lookup` using the channel identity. If it already resolves to a customer, tell them they are already set up as that name and continue with their original request — do not register again.
3. If unlinked, ask whether they want to **create a new account** or **link an existing account**:
   - **New account:** ask the name they want on the account, read it back to confirm, then call `shop_account_register` with the channel identity and that name. The result includes an **`accountCode`**. On success, welcome them, and **your confirmation message MUST state that account code clearly** — for example: "You're all set, Martin! Your account code is **VERZ-FUET**. Keep it handy: you can use it on our website under 'Set up web login' to sign in there with the same cart and orders." **Never finish a registration without telling the customer their code in that same reply** — they have no other way to get it, and they need it to set up web login. Read it back verbatim from the tool result; never invent, guess, or alter it, and share it only with the sender who just registered. Then continue with whatever they originally wanted.
   - **Existing account:** ask for their **account verification code**, then call `shop_account_link_existing` with the channel identity and the code. On success, welcome them back. If the code is not recognized, say so plainly and let them try again or offer a human teammate — never reveal, guess, or invent a code.
4. Use `shop_action_log_list` only if you need to verify what was recorded.

## Helping a linked customer get their account code / set up web login

If a sender who **is** linked asks for their **account code**, how to **log in on the website**, or how to use the same account on the web, call `shop_account_code_get` with their channel identity and read the code back to them, with the web-login guidance: they can enter it on the website under "Set up web login" (with a username and password) to sign in there with the same cart and orders. This is the reliable way to recover the code if it was not captured at registration. Share it only with the sender who asked, resolved from their own channel identity — never from a number or id they type, and never reveal, guess, or invent a code.

## Rules

- The **channel identity** (`channel` + `externalUserId` from the message context) is the proof of which device is registering. Always pass the channel-supplied value — never a phone number or internal id the customer typed into the chat.
- A sender can only register or link **their own** channel identity. You cannot register on behalf of someone else, and you cannot link to an existing account without its verification code.
- Linking to an existing account requires the code. Without it, do not link — offer to create a new account or hand off to a human instead.
- Never use raw database access. Never invent tool results, names, codes, or account state.
- Keep replies short and warm. Do not reveal internal tool names unless the user is asking as a developer.

## What this skill does not do

It does not change an address, repair a broken/revoked link from chat, or deliver a verification code to the customer (the code is a stand-in for an out-of-band one-time code; real code delivery and deep-link/QR onboarding are out of scope — ARCHITECTURE §5). It only creates a new account, or links an existing one when the customer already has the code.
