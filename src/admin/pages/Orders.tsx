import { useEffect, useMemo, useState } from "react";
import { DollarSign, Loader2, Package, Search, TrendingUp } from "lucide-react";
import { API_URL, getToken } from "../../api";
import OrderDetailsModal from "../components/orders/OrderDetailsModal";
import StatsCard from "../components/orders/StatsCard";
import OrdersTable from "../components/orders/OrdersTable";
import type {
  DisplayOrderStatus,
  OrderCustomerRow,
  OrderShippingAddress
} from "../types/ordersCustomers";

type ApiOrder = {
  id: string;
  user_id?: string;
  total_amount?: number | null;
  status?: string | null;
  created_at?: string | null;
  shipping_address?: unknown;
  order_items?: Array<{
    product_id?: string;
    quantity?: number | null;
    price?: number | null;
    products?: { name?: string | null } | null;
    product?: { name?: string | null } | null;
  }> | null;
};

function parseShippingAddressJson(raw: unknown): OrderShippingAddress | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as OrderShippingAddress;
      }
    } catch {
      return null;
    }
    return null;
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as OrderShippingAddress;
  }
  return null;
}

function dashIfEmpty(v: string | undefined | null): string {
  const s = v !== undefined && v !== null ? String(v).trim() : "";
  return s ? s : "—";
}

function toDisplayStatus(raw: string | undefined | null): DisplayOrderStatus {
  const v = String(raw ?? "").toLowerCase();
  if (v === "delivered" || v === "shipped" || v === "processing" || v === "pending") {
    return v;
  }
  return "pending";
}

function formatOrderTableId(id: string): string {
  const s = String(id);
  const compact = s.replace(/-/g, "");
  if (compact.length >= 6) return `ORD-${compact.slice(0, 6).toUpperCase()}`;
  return `ORD-${s.slice(0, 8)}`;
}

function mapApiOrderToRow(o: ApiOrder): OrderCustomerRow {
  const shippingAddress = parseShippingAddressJson(o.shipping_address);

  const customerName = shippingAddress?.fullName?.trim() || "—";
  const phone = dashIfEmpty(shippingAddress?.phone);
  const wilaya = dashIfEmpty(shippingAddress?.wilaya);
  const commune = dashIfEmpty(shippingAddress?.commune);
  const streetAddress = dashIfEmpty(shippingAddress?.address);

  const locationDisplay =
    `${shippingAddress?.wilaya ?? ""} ${shippingAddress?.commune ?? ""}`.trim() || "—";

  const items = Array.isArray(o.order_items) ? o.order_items : [];
  const lineItems = items.map((li, i) => {
    const name =
      li.products?.name ??
      li.product?.name ??
      (typeof (li as { product_name?: string }).product_name === "string"
        ? (li as { product_name: string }).product_name
        : null);
    return {
      id: `${String(li.product_id ?? "item")}-${i}`,
      name: String(name ?? "Product"),
      qty: Number(li.quantity ?? 0) || 0,
      thumbnailUrl: undefined
    };
  });

  const totalRaw = o.total_amount;
  const totalDa =
    totalRaw !== undefined && totalRaw !== null && Number.isFinite(Number(totalRaw))
      ? Number(totalRaw)
      : 0;

  return {
    id: formatOrderTableId(o.id),
    shippingAddress,
    customerName,
    phone,
    email: "",
    wilaya,
    commune,
    streetAddress,
    locationDisplay,
    date: o.created_at ? String(o.created_at) : new Date().toISOString(),
    itemCount: items.length,
    totalDa,
    status: toDisplayStatus(o.status),
    lineItems: lineItems.length ? lineItems : undefined
  };
}

function filterRows(rows: OrderCustomerRow[], query: string): OrderCustomerRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const hay =
      `${row.id} ${row.customerName} ${row.phone} ${row.email} ${row.locationDisplay} ${row.wilaya} ${row.commune} ${row.streetAddress}`.toLowerCase();
    return hay.includes(q);
  });
}

export default function Orders() {
  const [orders, setOrders] = useState<OrderCustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderCustomerRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const token = getToken();
      try {
        const res = await fetch(`${API_URL}/orders`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        const text = await res.text();
        let data: unknown = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = null;
        }
        if (!res.ok) {
          const msg =
            data && typeof data === "object" && data !== null && "error" in data
              ? String((data as { error?: string }).error ?? res.statusText)
              : res.statusText;
          throw new Error(msg || "Failed to load orders");
        }
        const list = Array.isArray(data) ? data : [];
        if (!cancelled) {
          setOrders(list.map((row) => mapApiOrderToRow(row as ApiOrder)));
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => filterRows(orders, search), [orders, search]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalDa, 0);
    const pending = orders.filter((o) => o.status === "pending").length;
    const processing = orders.filter((o) => o.status === "processing").length;
    return { totalOrders, totalRevenue, pending, processing };
  }, [orders]);

  function handleView(order: OrderCustomerRow) {
    console.log("[Orders & Customers] view order", order);
    setSelectedOrder(order);
    setDetailOpen(true);
  }

  function handleCloseDetail() {
    setDetailOpen(false);
    setSelectedOrder(null);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B3D91]">Orders & Customers</h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage customer orders and information.
          </p>
        </div>
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, customers, wilaya…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-[#1565C0] placeholder:text-slate-400 focus:border-[#1565C0] focus:ring-2"
            aria-label="Search orders"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Total orders"
          value={String(stats.totalOrders)}
          icon={Package}
          iconWrapClass="bg-blue-100 text-blue-600"
        />
        <StatsCard
          label="Total revenue"
          value={`${stats.totalRevenue.toLocaleString("en-US")} DA`}
          icon={DollarSign}
          iconWrapClass="bg-emerald-100 text-emerald-600"
        />
        <StatsCard
          label="Pending"
          value={String(stats.pending)}
          icon={TrendingUp}
          iconWrapClass="bg-violet-100 text-violet-600"
        />
        <StatsCard
          label="Processing"
          value={String(stats.processing)}
          icon={Loader2}
          iconWrapClass="bg-orange-100 text-orange-600"
        />
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <p className="p-8 text-center text-sm text-slate-500">Loading orders…</p>
        </div>
      ) : (
        <OrdersTable rows={filtered} onView={handleView} totalBeforeFilter={orders.length} />
      )}

      <OrderDetailsModal open={detailOpen} onClose={handleCloseDetail} order={selectedOrder} />
    </div>
  );
}
