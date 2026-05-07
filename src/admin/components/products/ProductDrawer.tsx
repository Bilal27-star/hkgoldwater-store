import { useEffect } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import type { AdminProduct } from "../../types";
import { useAdminData } from "../../context/AdminDataContext";
import ProductEditor, { type ProductEditorPayload } from "./ProductEditor";

type Mode = "create" | "edit" | "view";

type Props = {
  open: boolean;
  mode: Mode;
  product: AdminProduct | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function ProductDrawer({ open, mode, product, onClose, onSaved }: Props) {
  const { categories, addProduct, updateProduct } = useAdminData();
  const readOnly = mode === "view";

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!open) return null;

  const title =
    mode === "create" ? "Add product" : mode === "view" ? "Product details" : "Edit product";

  async function handleSubmit(payload: ProductEditorPayload) {
    if (readOnly) return;
    try {
      if (mode === "create") {
        await addProduct(payload);
        toast.success("Product created");
      } else if (mode === "edit" && product) {
        updateProduct(product.id, payload);
        toast.success("Product updated");
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error("[admin.productDrawer] save failed", error);
      toast.error("Failed to save product");
    }
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        className="absolute inset-0 animate-drawerOverlayIn bg-slate-900/50 backdrop-blur-[1px]"
        aria-label="Close panel"
        onClick={onClose}
      />
      <div
        className="absolute right-0 top-0 flex h-full w-full max-w-lg animate-drawerSlideIn flex-col bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id="product-drawer-title" className="text-lg font-bold text-[#0B3D91]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <ProductEditor
            categories={categories}
            initialProduct={mode === "create" ? null : product}
            readOnly={readOnly}
            submitLabel={mode === "create" ? "Create product" : "Save changes"}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
