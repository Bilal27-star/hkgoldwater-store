import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Package } from "lucide-react";
import OrderDetailModal from "./OrderDetailModal";
import type { OrderDetailOrder } from "./OrderDetailModal";
import { formatDa, orderStatusStyles } from "./profileUtils";

export type OrderRow = OrderDetailOrder;

type Props = {
  orders: OrderRow[];
  loading: boolean;
  error: string;
};

export default function OrdersSection({ orders, loading, error }: Props) {
  const [detail, setDetail] = useState<OrderRow | null>(null);

  return (
    <>
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_4px_24px_-8px_rgba(11,61,145,0.12)] ring-1 ring-gray-100 transition hover:shadow-[0_8px_32px_-8px_rgba(11,61,145,0.14)] md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4f7fc] text-[#0B3D91] ring-1 ring-[#0B3D91]/10">
              <Package className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[#0B3D91] md:text-xl">Order history</h2>
              <p className="mt-0.5 text-sm text-gray-500">Track and review your purchases.</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : error ? (
            <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gradient-to-b from-[#f8fbff] to-white px-6 py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-[#0B3D91]/30" strokeWidth={1.5} aria-hidden />
              <p className="mt-4 text-base font-medium text-gray-800">No orders yet</p>
              <p className="mt-2 text-sm text-gray-500">
                When you place an order, it will appear here with full details.
              </p>
              <Link
                to="/products"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#0B3D91] to-[#1565C0] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-[1.03]"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {orders.map((order) => {
                const total = Number(order.total_amount ?? 0);
                const date =
                  order.created_at != null
                    ? new Date(order.created_at).toLocaleDateString("fr-DZ", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })
                    : "—";
                const lines = order.order_items ?? [];
                const lineCount = lines.reduce((n, li) => n + Number(li.quantity ?? 0), 0);
                const statusClass = orderStatusStyles(order.status);

                return (
                  <li
                    key={String(order.id)}
                    className="group rounded-xl border border-gray-100 bg-gradient-to-br from-white to-[#f8fbff] p-5 shadow-sm ring-1 ring-gray-100/80 transition duration-300 hover:border-[#0B3D91]/15 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#0B3D91]">Order #{order.id}</span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${statusClass}`}
                          >
                            {order.status ?? "pending"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">{date}</p>
                        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                          <span className="text-lg font-bold text-gray-900">{formatDa(total)}</span>
                          <span className="text-sm text-gray-500">
                            {lineCount} item{lineCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetail(order)}
                        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl border border-[#e4ebf4] bg-white px-4 py-2.5 text-sm font-semibold text-[#0B3D91] shadow-sm transition group-hover:border-[#0B3D91]/25 group-hover:bg-[#f8fbff]"
                      >
                        View details
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={2} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <OrderDetailModal order={detail} onClose={() => setDetail(null)} />
    </>
  );
}
