import type { AdminProduct } from "../../types";
import ProductTableRow from "./ProductTableRow";

type Props = {
  products: AdminProduct[];
  categoryNames: Record<string, string>;
  onEdit: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onView: (product: AdminProduct) => void;
};

export default function ProductsTable({
  products,
  categoryNames,
  onEdit,
  onDelete,
  onView
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/40 ring-1 ring-slate-100/80">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3.5">Product</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Price</th>
              <th className="px-4 py-3.5">Stock</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <ProductTableRow
                key={p.id}
                product={p}
                categoryName={categoryNames[p.categoryId] ?? ""}
                onEdit={() => onEdit(p)}
                onDelete={() => onDelete(p)}
                onView={() => onView(p)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
