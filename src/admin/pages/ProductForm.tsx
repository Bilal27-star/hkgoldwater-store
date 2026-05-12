import { useEffect, useMemo, useState } from "react";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import ProductEditor, { type ProductEditorPayload } from "../components/products/ProductEditor";
import { useAdminData } from "../context/AdminDataContext";

export default function ProductForm() {
  const matchNew = useMatch("/admin/products/new");
  const { id } = useParams<{ id: string }>();
  const isNew = !!matchNew;
  const navigate = useNavigate();
  const { products, categories, addProduct, updateProduct } = useAdminData();

  const existing = useMemo(
    () => (!isNew && id ? products.find((p) => p.id === id) : undefined),
    [products, id, isNew]
  );

  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    if (!existing) {
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [existing, isNew]);

  if (!isNew && !loading && !existing) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">Product not found.</p>
        <Link to="/admin/products" className="mt-4 inline-block text-[#1565C0] hover:underline">
          Back to products
        </Link>
      </div>
    );
  }

  async function handleSubmit(payload: ProductEditorPayload) {
    try {
      if (isNew) {
        await addProduct(payload);
        toast.success("Product created");
      } else if (id) {
        await updateProduct(id, payload);
        toast.success("Product updated");
      }
      navigate("/admin/products");
    } catch (error) {
      console.error("[admin.productForm] save failed", error);
      toast.error("Failed to save product");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#1565C0] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Products
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          {isNew ? "Add product" : "Edit product"}
        </h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100/80">
        <ProductEditor
          categories={categories}
          initialProduct={isNew ? null : existing ?? null}
          readOnly={false}
          submitLabel={isNew ? "Create product" : "Save changes"}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/admin/products")}
        />
      </div>
    </div>
  );
}
