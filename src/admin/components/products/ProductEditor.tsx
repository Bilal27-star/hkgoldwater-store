import { useEffect, useState } from "react";
import { getBrands, getToken } from "../../../api";
import ImageUploader from "./ImageUploader";
import type { AdminCategory, AdminProduct } from "../../types";

export type ProductEditorPayload = {
  name: string;
  price: number;
  image: string;
  categoryId: string;
  brandId: string;
  stock: number;
  description: string;
  /** When set, submit uses multipart FormData with these files as field `images`. */
  imageFiles?: File[];
};

type Props = {
  categories: AdminCategory[];
  initialProduct?: AdminProduct | null;
  readOnly?: boolean;
  submitLabel?: string;
  onSubmit: (payload: ProductEditorPayload) => void;
  onCancel: () => void;
};

export default function ProductEditor({
  categories,
  initialProduct,
  readOnly = false,
  submitLabel = "Save product",
  onSubmit,
  onCancel
}: Props) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);

  function handleCategoryChange(nextCategoryId: string) {
    console.log("[admin.productEditor] selected category_id:", nextCategoryId || "(empty)");
    setCategoryId(nextCategoryId);
    setBrandId("");
    setBrands([]);
  }

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setPrice(String(initialProduct.price));
      setCategoryId(initialProduct.categoryId);
      setBrandId(initialProduct.brandId || "");
      setStock(String(initialProduct.stock));
      setDescription(initialProduct.description);
    } else {
      setName("");
      setPrice("");
      setStock("");
      setDescription("");
      setBrandId("");
      setCategoryId("");
    }
  }, [initialProduct]);


  useEffect(() => {
    if (!initialProduct && categories.length > 0) {
      setCategoryId((prev) => prev || categories[0]?.id || "");
    }
  }, [categories, initialProduct]);

  useEffect(() => {
    let cancelled = false;
    async function loadBrands() {
      setBrandsLoading(true);
      setBrandsError(null);
      if (!categoryId) {
        if (!cancelled) {
          setBrands([]);
          setBrandsLoading(false);
        }
        return;
      }
      try {
        const data = await getBrands(categoryId);
        console.log("[admin.productEditor] fetched brands:", data);
        const rows = Array.isArray(data) ? data : [];
        if (!cancelled) {
          setBrands(rows.map((b: any) => ({ id: String(b.id), name: String(b.name || "") })));
        }
      } catch (error) {
        console.error("[admin.productEditor] failed to load brands", error);
        if (!cancelled) {
          setBrands([]);
          setBrandsError("Failed to load brands.");
        }
      } finally {
        if (!cancelled) setBrandsLoading(false);
      }
    }
    loadBrands();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  useEffect(() => {
    if (!brandId) return;
    if (!brands.some((b) => b.id === brandId)) {
      setBrandId("");
    }
  }, [brands, brandId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    const priceNum = Number(price);
    const stockNum = Number(stock);
    const existingUrl = String(initialProduct?.image || "").trim();
    const hasImage =
      images.length > 0 ||
      Boolean(existingUrl && !existingUrl.startsWith("blob:") && !existingUrl.startsWith("data:"));
    console.log("[ProductEditor] submit attempt", {
      hasJwt: !!getToken(),
      imageFilesCount: images.length,
      hasImageGate: hasImage,
      categoryId,
      nameLen: name.trim().length
    });
    if (!name.trim()) {
      console.warn("[ProductEditor] blocked: missing name");
      return;
    }
    if (!hasImage) {
      console.warn("[ProductEditor] blocked: no image / existing URL");
      return;
    }
    if (!categoryId) {
      console.warn("[ProductEditor] blocked: no category");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0 || Number.isNaN(stockNum) || stockNum < 0) {
      console.warn("[ProductEditor] blocked: invalid price/stock", { priceNum, stockNum });
      return;
    }
    console.log(
      "FINAL IMAGES",
      images.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );
    onSubmit({
      name: name.trim(),
      price: priceNum,
      image: images.length ? "" : existingUrl,
      categoryId,
      brandId,
      stock: stockNum,
      description: description.trim(),
      imageFiles: images.length ? images : undefined
    });
  }

  const ro = readOnly;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="pe-name" className="block text-sm font-medium text-slate-700">
          Product name *
        </label>
        <input
          id="pe-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          readOnly={ro}
          disabled={ro}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-[#1565C0] focus:ring-2 disabled:bg-slate-50"
        />
      </div>

      <div>
        <label htmlFor="pe-cat" className="block text-sm font-medium text-slate-700">
          Category *
        </label>
        <select
          id="pe-cat"
          value={categoryId}
          onChange={(e) => handleCategoryChange(e.target.value)}
          required
          disabled={ro}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-[#1565C0] focus:ring-2 disabled:bg-slate-50"
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {brandsLoading ? <p className="mt-1 text-xs text-slate-500">Loading brands...</p> : null}
        {brandsError ? <p className="mt-1 text-xs text-red-600">{brandsError}</p> : null}
      </div>

      <div>
        <label htmlFor="pe-brand" className="block text-sm font-medium text-slate-700">
          Brand
        </label>
        <select
          id="pe-brand"
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
          disabled={ro || !categoryId}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-[#1565C0] focus:ring-2 disabled:bg-slate-50"
        >
          <option value="">Other</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="pe-price" className="block text-sm font-medium text-slate-700">
          Price (DA) *
        </label>
        <input
          id="pe-price"
          type="number"
          min={0}
          step={1}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          readOnly={ro}
          disabled={ro}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-[#1565C0] focus:ring-2 disabled:bg-slate-50"
        />
      </div>

      <div>
        <label htmlFor="pe-desc" className="block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          id="pe-desc"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          readOnly={ro}
          disabled={ro}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-[#1565C0] focus:ring-2 disabled:bg-slate-50"
        />
      </div>

      <div>
        <label htmlFor="pe-stock" className="block text-sm font-medium text-slate-700">
          Stock quantity *
        </label>
        <input
          id="pe-stock"
          type="number"
          min={0}
          step={1}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
          readOnly={ro}
          disabled={ro}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-[#1565C0] focus:ring-2 disabled:bg-slate-50"
        />
      </div>

      {!ro && (
        <ImageUploader
          onChange={(files) => {
            console.log(
              "RECEIVED FILES",
              files.length,
              files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
            );
            setImages(files);
          }}
          existingImageUrl={initialProduct?.image?.trim() || ""}
          maxFiles={4}
          disabled={false}
          maxSizeMb={2}
        />
      )}
      {ro && initialProduct?.image && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-medium uppercase text-slate-500">Image</p>
          <img
            src={initialProduct.image}
            alt=""
            className="max-h-48 w-auto max-w-full rounded-lg object-contain"
          />
        </div>
      )}

      {!readOnly && (
        <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white pt-4">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-[#1565C0] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B3D91]"
          >
            {submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      )}
      {readOnly && (
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-200"
        >
          Close
        </button>
      )}
    </form>
  );
}
