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
  link: string;
}

export interface ProductCatalog {
  version: number;
  catalogName: string;
  currency: string;
  products: Product[];
}

export interface ChannelIdentity {
  channel: string;
  externalUserId: string;
}

export interface Customer {
  id: string;
  displayName: string;
}

export interface AccountLink extends ChannelIdentity {
  id: string;
  customerId: string;
  status: "linked" | "revoked";
  linkedAt: string;
}

export interface LinkedCustomer {
  customerId: string;
  displayName: string;
  accountLinkId: string;
  channel: string;
  externalUserId: string;
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

export type PendingActionType = "cart.add_item" | "cart.remove_item" | "cart.update_quantity";

export interface PendingAction {
  id: string;
  type: PendingActionType;
  status: "pending" | "completed" | "cancelled" | "expired";
  customerId: string;
  accountLinkId: string;
  productId: string;
  // For cart.add_item: quantity to add. For cart.update_quantity: the target quantity.
  // For cart.remove_item: the line quantity being removed (recorded for the audit summary).
  quantity: number;
  summary: string;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
}

export type OrderStatus =
  | "placed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  quantity: number;
  // Price paid per unit at order time. A historical order fact, not the live
  // catalog price — kept on the order so it stays accurate if the catalog changes.
  unitPriceNtd: number;
}

export interface OrderShipping {
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  placedAt: string;
  updatedAt: string;
  items: OrderItem[];
  totalNtd: number;
  shipping?: OrderShipping;
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

export interface ShopDatabase {
  version: number;
  products: Product[];
  customers: Customer[];
  accountLinks: AccountLink[];
  carts: Cart[];
  orders: Order[];
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

export interface OrderLine {
  productId: string;
  // Resolved from the catalog at read time; falls back to the productId if the
  // product is no longer in the catalog.
  name: string;
  quantity: number;
  unitPriceNtd: number;
  subtotalNtd: number;
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  placedAt: string;
  updatedAt: string;
  itemCount: number;
  totalNtd: number;
}

export interface OrderView {
  id: string;
  status: OrderStatus;
  placedAt: string;
  updatedAt: string;
  items: OrderLine[];
  totalNtd: number;
  shipping?: OrderShipping;
}
