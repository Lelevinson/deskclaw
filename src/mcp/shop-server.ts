import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

import {
  confirmAddItemForChannel,
  confirmLatestAddItemForChannel,
  confirmLatestRemoveItemForChannel,
  confirmLatestUpdateQuantityForChannel,
  confirmRemoveItemForChannel,
  confirmUpdateQuantityForChannel,
  getCartForChannel,
  listActionLogs,
  lookupCustomerByChannel,
  previewAddItemForChannel,
  previewRemoveItemForChannel,
  previewUpdateQuantityForChannel,
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
