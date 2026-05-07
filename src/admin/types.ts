export type AdminRole = "admin" | "superadmin";

export type AdminUser = {
  email: string;
  name: string;
  role: AdminRole;
};

export type AdminProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  categoryId: string;
  brandId?: string;
  brand?: string;
  stock: number;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
};

export type OrderStatus = "pending" | "shipped" | "delivered";

export type AdminOrderItem = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
};

export type AdminOrder = {
  id: string;
  customerName: string;
  email: string;
  total: number;
  status: OrderStatus;
  items: AdminOrderItem[];
  createdAt: string;
};

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  ordersCount: number;
  totalSpent: number;
};

export type SiteSettings = {
  websiteName: string;
  contactEmail: string;
  contactPhone: string;
  logoDataUrl: string | null;
};

export type AdminActivity = {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
};
