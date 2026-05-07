import { useEffect } from "react";
import { MapPin, Phone, X } from "lucide-react";
import type { OrderCustomerRow } from "../../types/ordersCustomers";
import StatusBadge from "./StatusBadge";

type Props = {
  open: boolean;
  onClose: () => void;
  order: OrderCustomerRow | null;
};

function formatOrderDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function OrderDetailsModal({ open, onClose, order }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !order) return null;

  const sectionClass =
    "rounded-xl bg-slate-50/90 p-4 ring-1 ring-slate-100 md:p-5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 animate-modalOverlayIn bg-slate-900/50 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        className="animate-modalPanelIn relative z-10 w-full max-w-[min(100%,680px)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-5 pb-4 pt-5 md:px-6 md:pt-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id="order-details-title" className="text-lg font-bold text-[#0B3D91]">
              Order Details
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-base font-bold text-[#1565C0]">{order.id}</p>
            <StatusBadge status={order.status} />
          </div>
        </div>

        <div className="max-h-[min(70vh,calc(100vh-8rem))] space-y-4 overflow-y-auto px-5 py-5 md:px-6">
          <section className={sectionClass}>
            <h3 className="text-sm font-semibold text-slate-700">Customer information</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-500">Name</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {order.shippingAddress?.fullName?.trim() || "—"}
                </dd>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <div>
                  <dt className="text-xs font-medium text-slate-500">Phone</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {order.shippingAddress?.phone?.trim() || "—"}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          <section className={sectionClass}>
            <h3 className="text-sm font-semibold text-slate-700">Shipping address</h3>
            <div className="mt-3 flex gap-3 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <dl className="min-w-0 flex-1 space-y-2">
                <div>
                  <dt className="text-xs font-medium text-slate-500">Address</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">
                    {order.shippingAddress?.address?.trim() || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">Wilaya</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {order.shippingAddress?.wilaya?.trim() || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">Commune</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {order.shippingAddress?.commune?.trim() || "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {order.lineItems && order.lineItems.length > 0 && (
            <section className={sectionClass}>
              <h3 className="text-sm font-semibold text-slate-700">Products</h3>
              <ul className="mt-3 space-y-3">
                {order.lineItems.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-2 pr-3"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
                      {line.thumbnailUrl ? (
                        <img
                          src={line.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                          —
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{line.name}</p>
                      <p className="text-xs text-slate-500">Qty {line.qty}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={sectionClass}>
            <h3 className="text-sm font-semibold text-slate-700">Order summary</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Order date</dt>
                <dd className="font-medium text-slate-900">{formatOrderDate(order.date)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Total items</dt>
                <dd className="font-medium tabular-nums text-slate-900">{order.itemCount}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-sm font-semibold text-slate-900">Total amount</span>
              <span className="text-xl font-bold tabular-nums text-[#1565C0]">
                {order.totalDa.toLocaleString("en-US")} DA
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
