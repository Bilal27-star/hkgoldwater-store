import { Plus, Search } from "lucide-react";
import type { AdminCategory } from "../../types";

export type ProductFiltersState = {
  search: string;
  categoryId: string;
  priceMin: string;
  priceMax: string;
};

type Props = {
  categories: AdminCategory[];
  filters: ProductFiltersState;
  onChange: (next: ProductFiltersState) => void;
  onAddProduct: () => void;
  onNewCategory: () => void;
};

export default function FiltersBar({
  categories,
  filters,
  onChange,
  onAddProduct,
  onNewCategory
}: Props) {
  function patch(partial: Partial<ProductFiltersState>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end lg:gap-3">
          <div className="min-w-0 flex-1 sm:min-w-[200px]">
            <label htmlFor="pf-search" className="sr-only">
              Search products
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="pf-search"
                type="search"
                value={filters.search}
                onChange={(e) => patch({ search: e.target.value })}
                placeholder="Search products…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1565C0]/40 focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20"
              />
            </div>
          </div>
          <div className="w-full sm:w-44">
            <label htmlFor="pf-category" className="mb-1 block text-xs font-medium text-slate-500">
              Category
            </label>
            <select
              id="pf-category"
              value={filters.categoryId}
              onChange={(e) => patch({ categoryId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[#1565C0]/25"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
            <div>
              <label htmlFor="pf-min" className="mb-1 block text-xs font-medium text-slate-500">
                Min price (DA)
              </label>
              <input
                id="pf-min"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={filters.priceMin}
                onChange={(e) => patch({ priceMin: e.target.value })}
                placeholder="Min"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm tabular-nums outline-none transition focus:ring-2 focus:ring-[#1565C0]/25 sm:w-28"
              />
            </div>
            <span className="hidden pb-2.5 text-slate-400 sm:inline">—</span>
            <div>
              <label htmlFor="pf-max" className="mb-1 block text-xs font-medium text-slate-500">
                Max price (DA)
              </label>
              <input
                id="pf-max"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={filters.priceMax}
                onChange={(e) => patch({ priceMax: e.target.value })}
                placeholder="Max"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm tabular-nums outline-none transition focus:ring-2 focus:ring-[#1565C0]/25 sm:w-28"
              />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onNewCategory}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New Category
          </button>
          <button
            type="button"
            onClick={onAddProduct}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1565C0] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1565C0]/25 transition hover:bg-[#0B3D91]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Product
          </button>
        </div>
      </div>
    </div>
  );
}
