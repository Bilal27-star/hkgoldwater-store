/** Threshold for low-stock warning — tune with inventory rules later */
const LOW_STOCK_THRESHOLD = 10;

type Props = {
  stock: number;
};

export default function StockBadge({ stock }: Props) {
  if (stock <= 0) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-red-200/70">
        Out of Stock
      </span>
    );
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/80">
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/70">
      In Stock
    </span>
  );
}
