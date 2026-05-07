import { PackagePlus } from "lucide-react";

type Props = {
  onAddProduct: () => void;
};

export default function ProductsEmptyState({ onAddProduct }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-8 py-16 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-[#1565C0]/8 ring-1 ring-[#1565C0]/15">
        <svg
          viewBox="0 0 120 120"
          className="h-16 w-16 text-[#1565C0]/70"
          aria-hidden
        >
          <rect x="18" y="28" width="84" height="64" rx="10" fill="currentColor" opacity="0.12" />
          <rect x="28" y="42" width="28" height="22" rx="4" fill="currentColor" opacity="0.35" />
          <rect x="64" y="42" width="28" height="22" rx="4" fill="currentColor" opacity="0.2" />
          <rect x="28" y="70" width="64" height="10" rx="3" fill="currentColor" opacity="0.18" />
          <circle cx="92" cy="34" r="10" fill="currentColor" opacity="0.45" />
          <path
            d="M88 34l3 3 7-8"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900">No products yet</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Start by adding your first product. You can organize them with categories anytime.
      </p>
      <button
        type="button"
        onClick={onAddProduct}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#1565C0] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1565C0]/25 transition hover:bg-[#0B3D91]"
      >
        <PackagePlus className="h-4 w-4" aria-hidden />
        Add your first product
      </button>
    </div>
  );
}
