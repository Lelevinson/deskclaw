export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface Product {
  id: string;
  name: string;
  category: string;
  priceNtd: number;
  stockStatus: StockStatus;
  stockQuantity: number;
  tags: string[];
  bestFor: string[];
  avoidIf: string[];
  shortDescription: string;
}

export interface ChannelIdentity {
  channel: string;
  externalUserId: string;
}

export interface Customer {
  id: string;
  displayName: string;
  channelIdentities: ChannelIdentity[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

export interface Cart {
  customerId: string;
  items: CartItem[];
}

export interface PendingAction {
  id: string;
  type: "cart.add_item";
  status: "pending" | "completed" | "cancelled" | "expired";
  customerId: string;
  productId: string;
  quantity: number;
  summary: string;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
}

export interface ActionLog {
  id: string;
  type: string;
  status: "success" | "failed" | "preview";
  customerId?: string;
  summary: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface CommerceDatabase {
  version: number;
  products: Product[];
  customers: Customer[];
  carts: Cart[];
  pendingActions: PendingAction[];
  actionLogs: ActionLog[];
}

export interface CartLine {
  productId: string;
  name: string;
  priceNtd: number;
  quantity: number;
  subtotalNtd: number;
  stockStatus: StockStatus;
}

export interface CartView {
  customerId: string;
  items: CartLine[];
  totalNtd: number;
}
