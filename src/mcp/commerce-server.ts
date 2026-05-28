import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

import {
  confirmAddItem,
  confirmLatestAddItem,
  getCart,
  listActionLogs,
  lookupCustomerByChannel,
  previewAddItem,
  searchProducts
} from "../commerce/service.js";

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
  name: "deskclaw-commerce",
  version: "0.1.0"
});

server.server.onerror = (error) => {
  console.error("DeskClaw commerce MCP protocol error:", error);
};

server.registerTool(
  "commerce_customer_lookup",
  {
    title: "Look Up Customer",
    description: "Find a DeskClaw customer account from a channel identity such as WhatsApp sender id.",
    inputSchema: z.object({
      channel: z.string().min(1).describe("Channel name, for example whatsapp or simulated-chat."),
      externalUserId: z.string().min(1).describe("External user id from the channel, for example a phone number.")
    })
  },
  async ({ channel, externalUserId }) => jsonText(await lookupCustomerByChannel(channel, externalUserId))
);

server.registerTool(
  "commerce_catalog_search",
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
  "commerce_cart_get",
  {
    title: "Get Cart",
    description: "Read a customer's current cart.",
    inputSchema: z.object({
      customerId: z.string().min(1)
    })
  },
  async ({ customerId }) => jsonText(await getCart(customerId))
);

server.registerTool(
  "commerce_cart_preview_add_item",
  {
    title: "Preview Add Item To Cart",
    description: "Validate and stage an add-to-cart action. Use this before asking the customer to confirm.",
    inputSchema: z.object({
      customerId: z.string().min(1),
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(10)
    })
  },
  async ({ customerId, productId, quantity }) => jsonText(await previewAddItem(customerId, productId, quantity))
);

server.registerTool(
  "commerce_cart_confirm_add_item",
  {
    title: "Confirm Add Item To Cart",
    description: "Commit a staged add-to-cart action after explicit customer confirmation.",
    inputSchema: z.object({
      customerId: z.string().min(1),
      pendingActionId: z.string().min(1)
    })
  },
  async ({ customerId, pendingActionId }) => jsonText(await confirmAddItem(customerId, pendingActionId))
);

server.registerTool(
  "commerce_cart_confirm_latest_add_item",
  {
    title: "Confirm Latest Add Item To Cart",
    description: "Commit the latest matching staged add-to-cart action after explicit customer confirmation.",
    inputSchema: z.object({
      customerId: z.string().min(1),
      productId: z.string().min(1).optional(),
      quantity: z.number().int().min(1).max(10).optional()
    })
  },
  async ({ customerId, productId, quantity }) =>
    jsonText(await confirmLatestAddItem(customerId, productId, quantity))
);

server.registerTool(
  "commerce_action_log_list",
  {
    title: "List Commerce Action Logs",
    description: "Read recent commerce action logs for audit and demo verification.",
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

  console.error("DeskClaw commerce MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in DeskClaw commerce MCP server:", error);
  process.exit(1);
});
