/** Display statuses for the Orders & Customers table — map API enums later */
export type DisplayOrderStatus = "delivered" | "shipped" | "processing" | "pending";

/** Optional line items for detail modal — aligns with future order lines API */
export type OrderLineItem = {
  id: string;
  name: string;
  qty: number;
  thumbnailUrl?: string;
};

/** Supabase `orders.shipping_address` JSON (camelCase from checkout) */
export type OrderShippingAddress = {
  fullName?: string | null;
  phone?: string | null;
  wilaya?: string | null;
  commune?: string | null;
  address?: string | null;
};

/** Row shape aligned with GET /api/orders */
export type OrderCustomerRow = {
  id: string;
  /** Parsed JSON; null when missing */
  shippingAddress: OrderShippingAddress | null;
  customerName: string;
  phone: string;
  email: string;
  wilaya: string;
  commune: string;
  streetAddress: string;
  /** Table Location column */
  locationDisplay: string;
  /** ISO date string */
  date: string;
  itemCount: number;
  totalDa: number;
  status: DisplayOrderStatus;
  lineItems?: OrderLineItem[];
};
