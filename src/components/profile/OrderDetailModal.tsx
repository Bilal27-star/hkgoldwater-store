import { X } from "lucide-react";
import { formatDa, orderStatusStyles } from "./profileUtils";

function formatShippingAddress(sa: Record<string, unknown>): string | null {
  const keys = ["fullName", "phone", "wilaya", "commune", "address", "city", "country"];
  const lines: string[] = [];
  for (const k of keys) {
    const v = sa[k];
    if (v != null && String(v).trim() !== "") lines.push(String(v));
  }
  return lines.length ? lines.join("\n") : null;
}

export type OrderDetailItem = {
  quantity?: number;
  price?: number;
  product_id?: string;
};

export type OrderDetailOrder = {
  id: string | number;
  total_amount?: number;
  status?: string | null;
  created_at?: string;
  order_items?: OrderDetailItem[] | null;
  /** Present when API returns full order payload */
  shipping_address?: Record<string, unknown> | null;
};

type Props = {
  order: OrderDetailOrder | null;
  onClose: () => void;
};

export default function OrderDetailModal({ order, onClose }: Props) {
  if (!order) return null;

  const total = Number(order.total_amount ?? 0);
  const date =
    order.created_at != null
      ? new Date(order.created_at).toLocaleString("fr-DZ", {
          dateStyle: "medium",
          timeStyle: "short"
        })
      : "—";
  const lines = order.order_items ?? [];
  const statusClass = orderStatusStyles(order.status);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#0B3D91]/40 backdrop-blur-[2px] transition-opacity"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl ring-1 ring-gray-200/80 transition duration-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="order-detail-title" className="text-lg font-bold text-[#0B3D91]">
              Order #{order.id}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{date}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${statusClass}`}>
            {order.status ?? "pending"}
          </span>
          <span className="text-lg font-bold text-gray-900">{formatDa(total)}</span>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900">Items</h3>
          <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-[#f8fbff]">
            {lines.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500">No line items returned.</li>
            ) : (
              lines.map((li, idx) => (
                <li key={`${order.id}-line-${idx}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="text-gray-700">
                    {Number(li.quantity ?? 0)} ×{" "}
                    <span className="font-medium">{formatDa(Number(li.price ?? 0))}</span>
                  </span>
                  <span className="font-semibold text-[#0B3D91]">
                    {formatDa(Number(li.quantity ?? 0) * Number(li.price ?? 0))}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        {order.shipping_address && typeof order.shipping_address === "object" ? (
          <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Shipping</p>
            <p className="mt-2 whitespace-pre-wrap">
              {formatShippingAddress(order.shipping_address as Record<string, unknown>) ??
                "Address on file"}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#0B3D91] to-[#1565C0] py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-[1.03]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
