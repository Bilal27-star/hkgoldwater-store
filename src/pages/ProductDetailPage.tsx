import { Check, Minus, Plus, ShoppingCart, Star, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProductByIdApi } from "../api";
import { useCart } from "../context/CartContext";
import {
  onProductImageError,
  productImageSrcWithFallback,
  PRODUCT_IMAGE_FALLBACK_SRC
} from "../lib/productImageUrl";

function resolveLocalizedText(value: unknown, lang: "fr" | "en" | "ar") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return String(obj[lang] || obj.en || obj.fr || obj.ar || "");
  }
  return String(value || "");
}

function formatDa(value: number) {
  return `${value.toLocaleString("en-US")} DA`;
}

type ProductDetail = {
  id: string;
  images: string[];
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string | null;
  stock: number;
  rating: number;
  reviewCount: number;
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "reviews">("description");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProduct() {
      const productId = String(id || "").trim();
      if (!productId) {
        setError("Product not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const row = await getProductByIdApi(productId);
        if (cancelled) return;
        if (!row || typeof row !== "object") {
          setError("Product not found.");
          setProduct(null);
          return;
        }

        const priceNum = Number((row as any).price ?? 0);
        const stockNum = Number((row as any).stock ?? 0);
        const hasRating = (row as any).rating !== undefined && (row as any).rating !== null;
        const hasReviewCount = (row as any).review_count !== undefined && (row as any).review_count !== null;
        const ratingNum = Number((row as any).rating);
        const reviewCountNum = Number((row as any).review_count);
        const mainImage = String((row as any).image_url || (row as any).image || "");
        const rowImages = Array.isArray((row as any).images) ? (row as any).images : [];
        const normalizedImages = rowImages
          .map((img: unknown) => String(img || "").trim())
          .filter(Boolean);
        const toDisplay = (ref: string) => productImageSrcWithFallback(ref);
        const images = normalizedImages.length
          ? normalizedImages.map(toDisplay)
          : mainImage
            ? [toDisplay(mainImage)]
            : [PRODUCT_IMAGE_FALLBACK_SRC];
        const galleryImages = images;
        setProduct({
          id: String((row as any).id),
          images: galleryImages,
          name: resolveLocalizedText((row as any).name, "en") || "Product",
          description: resolveLocalizedText((row as any).description, "en") || "No description available.",
          price: Number.isFinite(priceNum) ? priceNum : 0,
          category: String((row as any).category?.name || ""),
          brand: (row as any).brand?.name ? String((row as any).brand.name) : null,
          stock: Number.isFinite(stockNum) ? Math.max(0, stockNum) : 0,
          rating: hasRating && Number.isFinite(ratingNum) ? ratingNum : 4.5,
          reviewCount: hasReviewCount && Number.isFinite(reviewCountNum) ? reviewCountNum : 12
        });
      } catch (e) {
        if (cancelled) return;
        setProduct(null);
        setError(e instanceof Error ? e.message : "Failed to load product.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const stockLabel = useMemo(() => {
    if (!product) return "";
    return product.stock > 0 ? "In Stock" : "Out of Stock";
  }, [product]);

  const featureList = useMemo(() => {
    if (!product) return [];
    const descriptionFeatures = product.description
      .split(/[.!?]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .slice(0, 3);
    if (descriptionFeatures.length >= 2) {
      return descriptionFeatures;
    }
    return [
      `${product.category || "Product"} quality build`,
      product.brand ? `${product.brand} trusted branding` : "Verified store quality",
      product.stock > 0 ? "Ready for immediate shipping" : "Available on backorder"
    ];
  }, [product]);

  const specifications = useMemo(() => {
    if (!product) return [];
    return [
      { label: "Category", value: product.category || "N/A" },
      { label: "Brand", value: product.brand || "Other" },
      { label: "Stock", value: String(product.stock) },
      { label: "Price", value: formatDa(product.price) }
    ];
  }, [product]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm text-slate-600">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm text-red-600">{error || "Product not found."}</p>
        <Link to="/products" className="mt-3 inline-block text-sm font-medium text-[#1565C0] hover:underline">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafe] py-8 md:py-10">
      <div className="mx-auto max-w-7xl px-6">
        <Link to="/products" className="mb-5 inline-block text-sm font-medium text-[#1565C0] hover:underline">
          Back to products
        </Link>

        <div className="grid grid-cols-1 gap-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:grid-cols-12 md:gap-10 md:p-8">
          <section className="md:col-span-5">
            <div className="group overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.name}
                className="aspect-square h-full w-full object-cover transition duration-300 group-hover:scale-105"
                onError={onProductImageError}
              />
            </div>
            <div className="mt-4 flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`overflow-hidden rounded-xl border-2 shadow-sm transition hover:-translate-y-0.5 ${
                    activeImageIndex === idx
                      ? "border-[#1565C0]"
                      : "border-transparent hover:border-slate-300"
                  }`}
                >
                  <img src={img} alt="" className="h-16 w-16 object-cover" onError={onProductImageError} />
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-5 md:col-span-7">
            <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">{product.name}</h1>
            <div className="space-y-1 text-sm text-slate-600">
              {product.brand && product.brand !== "Other" ? (
                <p>
                  <span className="font-medium text-slate-800">Brand:</span> {product.brand}
                </p>
              ) : null}
              <p>
                <span className="font-medium text-slate-800">Category:</span> {product.category || "N/A"}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Star className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" aria-hidden />
              <span className="font-medium">{product.rating.toFixed(1)}</span>
              <span>({product.reviewCount} reviews)</span>
            </div>

            <p className="text-3xl font-bold text-[#0B3D91] md:text-4xl">{formatDa(product.price)}</p>

            <ul className="space-y-2 rounded-xl bg-slate-50 p-4">
              {featureList.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Quantity</span>
              <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-300">
                <button
                  type="button"
                  onClick={() => setQty((v) => Math.max(1, v - 1))}
                  className="p-2 text-slate-600 hover:bg-slate-100"
                >
                  <Minus className="h-4 w-4" aria-hidden />
                </button>
                <span className="min-w-10 text-center text-sm font-semibold text-slate-900">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((v) => v + 1)}
                  className="p-2 text-slate-600 hover:bg-slate-100"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() =>
                  addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0],
                    quantity: qty
                  })
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1565C0] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0B3D91] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" aria-hidden />
                Add to Cart
              </button>
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() =>
                  addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0],
                    quantity: qty
                  })
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Zap className="h-4 w-4" aria-hidden />
                Buy Now
              </button>
            </div>

            <p className={`text-sm font-medium ${product.stock > 0 ? "text-emerald-600" : "text-red-600"}`}>
              {stockLabel}
            </p>
          </section>
        </div>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
            {[
              { id: "description", label: "Description" },
              { id: "specifications", label: "Specifications" },
              { id: "reviews", label: "Reviews" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as "description" | "specifications" | "reviews")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "bg-[#1565C0] text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="pt-5">
            {activeTab === "description" ? (
              <p className="text-sm leading-7 text-slate-700">{product.description}</p>
            ) : null}

            {activeTab === "specifications" ? (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {specifications.map((spec) => (
                  <div key={spec.label} className="rounded-lg bg-slate-50 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{spec.label}</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-800">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {activeTab === "reviews" ? (
              <p className="text-sm leading-7 text-slate-700">
                Rated <span className="font-semibold">{product.rating.toFixed(1)}</span> by{" "}
                <span className="font-semibold">{product.reviewCount}</span> buyers.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
