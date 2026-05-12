import { Eye, Pencil, Trash2 } from "lucide-react";
import { onProductImageError, productImageSrcWithFallback } from "../../../lib/productImageUrl";
import type { AdminProduct } from "../../types";
import StockBadge from "./StockBadge";

type Props = {
  product: AdminProduct;
  categoryName: string;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
};

export default function ProductTableRow({
  product,
  categoryName,
  onEdit,
  onDelete,
  onView
}: Props) {
  return (
    <tr className="group transition-colors duration-150 hover:bg-slate-50/90">
      <td className="px-4 py-4 align-middle">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/80 transition group-hover:ring-slate-300">
            <img
              src={productImageSrcWithFallback(product.image)}
              alt=""
              className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
              onError={onProductImageError}
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{product.name}</p>
            <p className="line-clamp-1 max-w-[220px] text-xs text-slate-500 sm:max-w-xs">
              {product.description || "—"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 align-middle">
        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80">
          {categoryName || "—"}
        </span>
      </td>
      <td className="px-4 py-4 align-middle tabular-nums text-slate-900">
        {product.price.toLocaleString("en-US")} DA
      </td>
      <td className="px-4 py-4 align-middle">
        <StockBadge stock={product.stock} />
      </td>
      <td className="px-4 py-4 align-middle">
        <div className="flex justify-end gap-0.5">
          <button
            type="button"
            onClick={onView}
            className="rounded-lg p-2 text-slate-500 opacity-90 transition hover:bg-slate-100 hover:text-[#1565C0] group-hover:opacity-100"
            aria-label={`View ${product.name}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#1565C0]"
            aria-label={`Edit ${product.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${product.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
