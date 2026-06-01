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

export type OrderStatus = "processing" | "packed" | "shipped" | "delivered";

export interface OrderItem {
  productId: string;
  quantity: number;
  priceNtd: number;
}

export interface OrderTracking {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  status: string;
  shippedAt?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
}

export type ReturnRequestType = "refund" | "exchange";
export type ReturnStatus = "pending_confirmation" | "submitted" | "approved" | "rejected" | "processed";

export interface ReturnRequest {
  id: string;
  customerId: string;
  accountLinkId: string;
  orderId: string;
  orderNumber: string;
  requestType: ReturnRequestType;
  reason: string;
  status: ReturnStatus;
  summary: string;
  requestedAt: string;
  confirmedAt?: string;
}

export interface HandoffTicket {
  id: string;
  status: "open" | "closed";
  priority: "standard" | "urgent";
  reason: string;
  customerMessage: string;
  suggestedReply: string;
  createdAt: string;
  customerId?: string;
  accountLinkId?: string;
  channel?: string;
  externalUserId?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  placedAt: string;
  status: OrderStatus;
  paymentStatus: "paid";
  fulfillmentStatus: "processing" | "packed" | "fulfilled";
  currency: "NTD";
  items: OrderItem[];
  subtotalNtd: number;
  shippingNtd: number;
  totalNtd: number;
  tracking?: OrderTracking;
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
  orders: Order[];
  returns: ReturnRequest[];
  handoffTickets: HandoffTicket[];
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

export interface OrderLine {
  productId: string;
  name: string;
  priceNtd: number;
  quantity: number;
  subtotalNtd: number;
}

export interface OrderView {
  id: string;
  orderNumber: string;
  customerId: string;
  placedAt: string;
  status: OrderStatus;
  paymentStatus: "paid";
  fulfillmentStatus: "processing" | "packed" | "fulfilled";
  currency: "NTD";
  items: OrderLine[];
  subtotalNtd: number;
  shippingNtd: number;
  totalNtd: number;
  tracking?: OrderTracking;
}

export interface ReturnRequestView {
  id: string;
  customerId: string;
  orderId: string;
  orderNumber: string;
  requestType: ReturnRequestType;
  reason: string;
  status: ReturnStatus;
  summary: string;
  requestedAt: string;
  confirmedAt?: string;
}

export interface HandoffTicketView {
  id: string;
  status: "open" | "closed";
  priority: "standard" | "urgent";
  reason: string;
  suggestedReply: string;
  createdAt: string;
  customerId?: string;
}
