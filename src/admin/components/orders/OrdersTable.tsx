import { Calendar, Eye, MapPin } from "lucide-react";
import type { OrderCustomerRow } from "../../types/ordersCustomers";
import StatusBadge from "./StatusBadge";

type Props = {
  rows: OrderCustomerRow[];
  onView: (order: OrderCustomerRow) => void;
  /** Orders loaded before client-side search filter; refines empty message */
  totalBeforeFilter?: number;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function OrdersTable({ rows, onView, totalBeforeFilter }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3.5">Order ID</th>
              <th className="px-4 py-3.5">Customer</th>
              <th className="px-4 py-3.5">Location</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Items</th>
              <th className="px-4 py-3.5">Total</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const customerName =
                row.shippingAddress?.fullName?.trim() || row.customerName || "—";
              const location =
                `${row.shippingAddress?.wilaya ?? ""} ${row.shippingAddress?.commune ?? ""}`.trim() ||
                row.locationDisplay ||
                "—";
              const phoneLine =
                row.shippingAddress?.phone?.trim() || row.phone || "—";
              return (
              <tr key={row.id} className="transition-colors hover:bg-slate-50/90">
                <td className="px-4 py-3.5 font-mono text-xs font-medium text-[#1565C0]">{row.id}</td>
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-slate-900">{customerName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{phoneLine}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <span className="font-semibold text-slate-900">{location}</span>
                  </span>
                </td>
                <td className="px-4 py-3.5 tabular-nums text-slate-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    {formatDate(row.date)}
                  </span>
                </td>
                <td className="px-4 py-3.5 tabular-nums text-slate-700">
                  {row.itemCount} {row.itemCount === 1 ? "item" : "items"}
                </td>
                <td className="px-4 py-3.5 font-semibold tabular-nums text-slate-900">
                  {row.totalDa.toLocaleString("en-US")} DA
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => onView(row)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[#1565C0] transition hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                    View
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="p-8 text-center text-sm text-slate-500">
          {totalBeforeFilter === 0
            ? "No orders yet."
            : "No orders match your search."}
        </p>
      )}
    </div>
  );
}
