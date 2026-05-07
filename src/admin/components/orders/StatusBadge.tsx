import type { DisplayOrderStatus } from "../../types/ordersCustomers";

const STYLE: Record<
  DisplayOrderStatus,
  { label: string; className: string }
> = {
  delivered: {
    label: "Delivered",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200/60"
  },
  shipped: {
    label: "Shipped",
    className: "bg-violet-100 text-violet-800 ring-violet-200/60"
  },
  processing: {
    label: "Processing",
    className: "bg-blue-100 text-blue-800 ring-blue-200/60"
  },
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-900 ring-amber-200/70"
  }
};

type Props = {
  status: DisplayOrderStatus;
};

export default function StatusBadge({ status }: Props) {
  const { label, className } = STYLE[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}
    >
      {label}
    </span>
  );
}
