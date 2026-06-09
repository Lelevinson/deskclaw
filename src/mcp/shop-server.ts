import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

import {
  confirmAddItemForChannel,
  confirmCheckoutForChannel,
  confirmCreateReturnForChannel,
  confirmLatestAddItemForChannel,
  confirmLatestRemoveItemForChannel,
  confirmLatestUpdateQuantityForChannel,
  confirmRemoveItemForChannel,
  confirmUpdateQuantityForChannel,
  createHandoff,
  getCartForChannel,
  getOrderForChannel,
  getReturnForChannel,
  listActionLogs,
  listHandoffs,
  listOrdersForChannel,
  linkExistingAccountForChannel,
  listReturnsForChannel,
  lookupCustomerByChannel,
  previewAddItemForChannel,
  previewCheckoutForChannel,
  previewCreateReturnForChannel,
  previewRemoveItemForChannel,
  previewUpdateQuantityForChannel,
  registerNewCustomerForChannel,
  searchProducts
} from "../shop/service.js";

function jsonText(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2)
      }
    ]
  };
}

const server = new McpServer({
  name: "deskclaw-shop",
  version: "0.1.0"
});

server.server.onerror = (error) => {
  console.error("DeskClaw shop MCP protocol error:", error);
};

server.registerTool(
  "shop_customer_lookup",
  {
    title: "Look Up Customer",
    description: "Find a linked DeskClaw customer account from a channel identity such as WhatsApp sender id.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel, for example a phone number.")
    })
  },
  async ({ channel, externalUserId }) => jsonText(await lookupCustomerByChannel(channel, externalUserId))
);

server.registerTool(
  "shop_account_register",
  {
    title: "Register New Customer",
    description:
      "Register a brand-new DeskClaw customer account bound to the sender's own channel identity. Use only for an UNLINKED sender who wants to create a new account. The channel + externalUserId are the proof of ownership — never accept a customer-typed phone number or internal id.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel context (e.g. phone number). Use the channel-supplied value, not one the customer typed."),
      displayName: z.string().min(1).describe("The name the customer wants their account under.")
    })
  },
  async ({ channel, externalUserId, displayName }) =>
    jsonText(await registerNewCustomerForChannel(channel, externalUserId, displayName))
);

server.registerTool(
  "shop_account_link_existing",
  {
    title: "Link Existing Account",
    description:
      "Link the sender's channel identity to an EXISTING customer account, gated by that account's verification code (a demo stand-in for an OTP sent to the contact on file). Use only for an UNLINKED sender who says they already have an account. The channel + externalUserId are the proof of which device is linking; the code proves account ownership. Never reveal or guess the code.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel context. Use the channel-supplied value, not one the customer typed."),
      accountCode: z.string().min(1).describe("The verification code the customer provides to prove they own the existing account.")
    })
  },
  async ({ channel, externalUserId, accountCode }) =>
    jsonText(await linkExistingAccountForChannel(channel, externalUserId, accountCode))
);

server.registerTool(
  "shop_catalog_search",
  {
    title: "Search Catalog",
    description: "Search the DeskClaw product catalog using customer language.",
    inputSchema: z.object({
      query: z.string().min(1),
      maxResults: z.number().int().min(1).max(10).default(5)
    })
  },
  async ({ query, maxResults }) => jsonText(await searchProducts(query, maxResults))
);

server.registerTool(
  "shop_cart_get",
  {
    title: "Get Cart",
    description: "Read the current cart for a customer account linked to the channel identity.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel.")
    })
  },
  async ({ channel, externalUserId }) => jsonText(await getCartForChannel(channel, externalUserId))
);

server.registerTool(
  "shop_cart_preview_add_item",
  {
    title: "Preview Add Item To Cart",
    description: "Validate and stage an add-to-cart action for a linked channel identity. Use this before asking the customer to confirm.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel."),
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(10)
    })
  },
  async ({ channel, externalUserId, productId, quantity }) =>
    jsonText(await previewAddItemForChannel(channel, externalUserId, productId, quantity))
);

server.registerTool(
  "shop_cart_confirm_add_item",
  {
    title: "Confirm Add Item To Cart",
    description: "Commit a staged add-to-cart action for the same linked channel identity after explicit customer confirmation.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel."),
      pendingActionId: z.string().min(1)
    })
  },
  async ({ channel, externalUserId, pendingActionId }) =>
    jsonText(await confirmAddItemForChannel(channel, externalUserId, pendingActionId))
);

server.registerTool(
  "shop_cart_confirm_latest_add_item",
  {
    title: "Confirm Latest Add Item To Cart",
    description: "Commit the latest matching staged add-to-cart action for the same linked channel identity after explicit customer confirmation.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel."),
      productId: z.string().min(1).optional(),
      quantity: z.number().int().min(1).max(10).optional()
    })
  },
  async ({ channel, externalUserId, productId, quantity }) =>
    jsonText(await confirmLatestAddItemForChannel(channel, externalUserId, productId, quantity))
);

server.registerTool(
  "shop_cart_preview_remove_item",
  {
    title: "Preview Remove Item From Cart",
    description: "Validate and stage a remove-from-cart action for a linked channel identity. Use this before asking the customer to confirm.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel."),
      productId: z.string().min(1)
    })
  },
  async ({ channel, externalUserId, productId }) =>
    jsonText(await previewRemoveItemForChannel(channel, externalUserId, productId))
);

server.registerTool(
  "shop_cart_confirm_remove_item",
  {
    title: "Confirm Remove Item From Cart",
    description: "Commit a staged remove-from-cart action for the same linked channel identity after explicit customer confirmation.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel."),
      pendingActionId: z.string().min(1)
    })
  },
  async ({ channel, externalUserId, pendingActionId }) =>
    jsonText(await confirmRemoveItemForChannel(channel, externalUserId, pendingActionId))
);

server.registerTool(
  "shop_cart_confirm_latest_remove_item",
  {
    title: "Confirm Latest Remove Item From Cart",
    description: "Commit the latest matching staged remove-from-cart action for the same linked channel identity after explicit customer confirmation.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel."),
      productId: z.string().min(1).optional()
    })
  },
  async ({ channel, externalUserId, productId }) =>
    jsonText(await confirmLatestRemoveItemForChannel(channel, externalUserId, productId))
);

server.registerTool(
  "shop_cart_preview_update_quantity",
  {
    title: "Preview Update Cart Item Quantity",
    description: "Validate and stage a change to an existing cart item's quantity for a linked channel identity. The quantity is the new target amount. Use this before asking the customer to confirm.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel."),
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(10).describe("The new target quantity for the cart line.")
    })
  },
  async ({ channel, externalUserId, productId, quantity }) =>
    jsonText(await previewUpdateQuantityForChannel(channel, externalUserId, productId, quantity))
);

server.registerTool(
  "shop_cart_confirm_update_quantity",
  {
    title: "Confirm Update Cart Item Quantity",
    description: "Commit a staged update-quantity action for the same linked channel identity after explicit customer confirmation.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel."),
      pendingActionId: z.string().min(1)
    })
  },
  async ({ channel, externalUserId, pendingActionId }) =>
    jsonText(await confirmUpdateQuantityForChannel(channel, externalUserId, pendingActionId))
);

server.registerTool(
  "shop_cart_confirm_latest_update_quantity",
  {
    title: "Confirm Latest Update Cart Item Quantity",
    description: "Commit the latest matching staged update-quantity action for the same linked channel identity after explicit customer confirmation.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel."),
      productId: z.string().min(1).optional(),
      quantity: z.number().int().min(1).max(10).optional().describe("The new target quantity, used to disambiguate which staged update to commit.")
    })
  },
  async ({ channel, externalUserId, productId, quantity }) =>
    jsonText(await confirmLatestUpdateQuantityForChannel(channel, externalUserId, productId, quantity))
);

server.registerTool(
  "shop_checkout_preview",
  {
    title: "Preview Checkout",
    description:
      "Validate the linked customer's cart for a mock checkout (non-empty, all items in stock) and summarize the order (items + total). Read-only — use before asking the customer to confirm placing the order. No payment is taken.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel.")
    })
  },
  async ({ channel, externalUserId }) => jsonText(await previewCheckoutForChannel(channel, externalUserId)),
);

server.registerTool(
  "shop_checkout_confirm",
  {
    title: "Confirm Checkout",
    description:
      "Place the order from the linked customer's cart after explicit confirmation: creates a new order (status 'placed'), decrements stock, and clears the cart. NO payment is taken (mock). Call only after the customer confirms the previewed items and total.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel.")
    })
  },
  async ({ channel, externalUserId }) => jsonText(await confirmCheckoutForChannel(channel, externalUserId)),
);

server.registerTool(
  "shop_orders_list_for_channel",
  {
    title: "List Orders For Channel",
    description:
      "List order summaries for the customer account linked to the channel identity. Read-only; returns only the linked customer's own orders. Never accept a customer-typed order number or customer id as proof of identity.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel.")
    })
  },
  async ({ channel, externalUserId }) => jsonText(await listOrdersForChannel(channel, externalUserId))
);

server.registerTool(
  "shop_order_get",
  {
    title: "Get Order Detail",
    description:
      "Read full detail (status, items, tracking) for one order, but only if it belongs to the customer account linked to the channel identity. An unknown or non-owned order id returns the same not-found result; the order id is never itself proof of ownership.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel."),
      orderId: z.string().min(1).describe("The order id to look up, scoped to the linked customer.")
    })
  },
  async ({ channel, externalUserId, orderId }) => jsonText(await getOrderForChannel(channel, externalUserId, orderId))
);

server.registerTool(
  "shop_return_preview",
  {
    title: "Preview Return / Exchange Request",
    description:
      "Validate and stage a return or exchange REQUEST for a linked channel identity. The request can only be opened against a delivered order the linked customer owns; an unknown or non-owned order id is refused identically (the order number is never proof). This never issues a refund or exchange — it stages a request a human reviews. Use before asking the customer to confirm.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel."),
      orderId: z.string().min(1).describe("The order to return, scoped to the linked customer."),
      resolution: z.enum(["refund", "exchange"]).describe("What the customer wants: a refund or an exchange."),
      reason: z.string().min(1).describe("A brief customer-stated reason for the return or exchange.")
    })
  },
  async ({ channel, externalUserId, orderId, resolution, reason }) =>
    jsonText(await previewCreateReturnForChannel(channel, externalUserId, orderId, resolution, reason))
);

server.registerTool(
  "shop_return_confirm",
  {
    title: "Confirm Return / Exchange Request",
    description:
      "Commit a staged return/exchange request for the same linked channel identity after explicit customer confirmation. This creates a return REQUEST record in the 'requested' state for human review only — it never issues a refund or exchange. The actual money movement is handed off to a teammate.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel."),
      pendingActionId: z.string().min(1)
    })
  },
  async ({ channel, externalUserId, pendingActionId }) =>
    jsonText(await confirmCreateReturnForChannel(channel, externalUserId, pendingActionId))
);

server.registerTool(
  "shop_returns_list_for_channel",
  {
    title: "List Returns For Channel",
    description:
      "List return/exchange requests for the customer account linked to the channel identity. Read-only; returns only the linked customer's own returns, with each return's current status. Never accept a customer-typed return number or customer id as proof of identity.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel.")
    })
  },
  async ({ channel, externalUserId }) => jsonText(await listReturnsForChannel(channel, externalUserId))
);

server.registerTool(
  "shop_return_get",
  {
    title: "Get Return Status",
    description:
      "Read one return/exchange request's status (e.g. 'is my refund approved or processed yet?'), but only if it belongs to the customer account linked to the channel identity. An unknown or non-owned return id returns the same not-found result; the return id is never itself proof of ownership.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel."),
      returnId: z.string().min(1).describe("The return id to look up, scoped to the linked customer.")
    })
  },
  async ({ channel, externalUserId, returnId }) => jsonText(await getReturnForChannel(channel, externalUserId, returnId))
);

server.registerTool(
  "shop_handoff_create",
  {
    title: "Create Handoff / Escalation Record",
    description:
      "Append a durable escalation record when sentiment-router routes to handoff_recommended or urgent_handoff (NEVER for continue). Append-only: there is no preview/confirm and it makes no money/account mutation — it records the agent's escalation judgment and writes an audit log. Identity is OPTIONAL and must never block an escalation: pass the channel + externalUserId and a customerId is linked automatically when the sender is linked, otherwise the escalation is still recorded against the raw channel identity. Never pass or trust a typed customer id as proof.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel."),
      classification: z
        .enum(["handoff_recommended", "urgent_handoff"])
        .describe("The sentiment-router classification; must be one of the two handoff signals (continue records nothing)."),
      category: z
        .string()
        .min(1)
        .describe("Short triage label, for example refund_dispute, safety_reaction, or human_requested."),
      reason: z.string().min(1).describe("One short internal reason for the escalation."),
      summary: z.string().min(1).describe("A short customer-safe summary of the situation for the human picking it up.")
    })
  },
  async ({ channel, externalUserId, classification, category, reason, summary }) =>
    jsonText(await createHandoff(channel, externalUserId, classification, category, reason, summary))
);

server.registerTool(
  "shop_handoff_list",
  {
    title: "List Handoff / Escalation Records",
    description:
      "Read recent escalation/handoff records for staff triage, audit, and demo verification. Optionally filter by customerId. Staff/ops-only; not a customer-facing read.",
    inputSchema: z.object({
      customerId: z.string().min(1).optional(),
      limit: z.number().int().min(1).max(100).default(20)
    })
  },
  async ({ customerId, limit }) => jsonText(await listHandoffs(customerId, limit))
);

server.registerTool(
  "shop_action_log_list",
  {
    title: "List Shop Action Logs",
    description: "Read recent shop action logs for audit and demo verification.",
    inputSchema: z.object({
      customerId: z.string().min(1).optional(),
      limit: z.number().int().min(1).max(100).default(20)
    })
  },
  async ({ customerId, limit }) => jsonText(await listActionLogs(customerId, limit))
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  const keepAlive = setInterval(() => undefined, 60_000);
  const stopKeepAlive = () => clearInterval(keepAlive);
  process.stdin.on("end", stopKeepAlive);
  process.stdin.on("close", stopKeepAlive);
  process.stdin.resume();

  console.error("DeskClaw shop MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in DeskClaw shop MCP server:", error);
  process.exit(1);
});
