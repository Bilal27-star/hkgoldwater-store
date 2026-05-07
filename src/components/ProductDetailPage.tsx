import {
  ArrowLeft,
  Check,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShoppingCart,
  Star,
  Truck
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getProducts } from "../api";
import { useCart } from "../context/CartContext";
import { useI18n } from "../i18n/I18nProvider";
import Breadcrumb from "./Breadcrumb";
import ProductCard from "./ProductCard";
import SiteFooter from "./SiteFooter";

function formatDa(value: number) {
  return `${value.toLocaleString("fr-DZ")} DA`;
}

function StarRow({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.45 && rating < 5;
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < full || (i === full && hasHalf);
        return (
          <Star
            key={i}
            className={`h-5 w-5 ${
              filled ? "fill-[#D4AF37] text-[#D4AF37]" : "fill-gray-200 text-gray-200"
            }`}
            strokeWidth={0}
          />
        );
      })}
    </div>
  );
}

type TabId = "description" | "specifications" | "reviews";

function resolveLocalizedText(value: unknown, lang: "fr" | "en" | "ar") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return String(obj[lang] || obj.en || obj.fr || obj.ar || "");
  }
  return String(value || "");
}

function ProductImageGallery({
  images,
  alt,
  activeIndex,
  onSelect
}: {
  images: string[];
  alt: string;
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  const main = images[activeIndex] ?? images[0];

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl bg-gray-100 shadow-lg ring-1 ring-gray-100">
        <img
          src={main}
          alt={alt}
          className="aspect-square w-full object-cover"
        />
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md ring-1 ring-gray-200 transition hover:bg-white"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md ring-1 ring-gray-200 transition hover:bg-white"
            aria-label="Add to wishlist"
          >
            <Heart className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => onSelect(i)}
            className={`overflow-hidden rounded-lg ring-2 transition ${
              i === activeIndex
                ? "ring-[#1565C0] ring-offset-2"
                : "ring-transparent hover:ring-gray-300"
            }`}
          >
            <img src={src} alt="" className="aspect-square w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

export type ProductDetailPageProps = {
  /**
   * Optional override for the catalog product id.
   * When omitted, the id comes from the route: `/products/:productId`.
   */
  productId?: string;
};

export default function ProductDetailPage({ productId: productIdProp }: ProductDetailPageProps) {
  const { productId: routeProductId } = useParams<{ productId: string }>();
  const resolvedProductId = (productIdProp ?? routeProductId)?.trim() ?? "";

  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { language } = useI18n();

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<TabId>("description");
  const [product, setProduct] = useState<any | null>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const renderCountRef = useRef(0);

  renderCountRef.current += 1;
  console.log("[ProductDetailPage] render count", renderCountRef.current, "catalog size", catalog.length);

  useEffect(() => {
    let cancelled = false;
    async function loadProduct() {
      if (!resolvedProductId) return;
      try {
        const data = await getProducts();
        console.log("[ProductDetailPage] fetched products", data);
        const rows = Array.isArray(data) ? data : [];
        if (cancelled) return;
        setCatalog(rows);
        const row = rows.find((item: any) => String(item.id) === resolvedProductId);
        if (!row) {
          setProduct(null);
          return;
        }
        setProduct({
          id: String(row.id),
          title: resolveLocalizedText(row.name || row.title, language) || "Product",
          brand: row.brand || "HK Goldwater",
          category: row.category || "Plumbing",
          rating: Number(row.rating || 0),
          reviewCount: Number(row.review_count || 0),
          price: Number(row.price || 0),
          images: [row.image || row.image_url || ""],
          stock: Number(row.stock || 0) > 0,
          description: [resolveLocalizedText(row.description, language)].filter(Boolean),
          features: [],
          specifications: [
            { label: "Brand", value: row.brand || "" },
            { label: "Category", value: row.category || "Plumbing" }
          ]
        });
      } catch {
        if (!cancelled) setProduct(null);
      }
    }
    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [resolvedProductId]);

  useEffect(() => {
    setActiveImage(0);
    setQty(1);
    setActiveTab("description");
  }, [resolvedProductId]);

  const related = useMemo(() => {
    if (!product?.id) return [];
    return catalog
      .filter((p) => String(p.id) !== String(product.id))
      .slice(0, 4)
      .map((p) => ({
        id: String(p.id),
        brand: p.brand || "",
        title: resolveLocalizedText(p.name || p.title, language) || "Unnamed product",
        rating: Number(p.rating || 0),
        reviewCount: Number(p.review_count || 0),
        price: Number(p.price || 0),
        imageUrl: p.image || p.image_url || ""
      }));
  }, [catalog, language, product?.id]);

  if (!resolvedProductId || !product) {
    return <Navigate to="/products" replace />;
  }

  const detail = product;

  function handleAddToCart() {
    addToCart({
      id: detail.id,
      name: detail.title,
      price: detail.price,
      image: detail.images[0],
      quantity: qty
    });
  }

  function handleBuyNow() {
    addToCart({
      id: detail.id,
      name: detail.title,
      price: detail.price,
      image: detail.images[0],
      quantity: qty
    });
    navigate("/checkout");
  }

  return (
    <div className="bg-[#F9FAFB] pb-16">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Products", to: "/products" },
            { label: product.category, to: "/products" },
            { label: product.title }
          ]}
        />

        <Link
          to="/products"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#1565C0] transition hover:text-[#0B3D91]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
          <ProductImageGallery
            images={product.images}
            alt={product.title}
            activeIndex={activeImage}
            onSelect={setActiveImage}
          />

          <div className="flex flex-col">
            {product.stock ? (
              <span className="mb-3 inline-flex w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                In Stock
              </span>
            ) : (
              <span className="mb-3 inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                Out of Stock
              </span>
            )}

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              {product.title}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {product.brand} <span className="text-gray-400">|</span> {product.category}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StarRow rating={product.rating} />
              <span className="text-sm text-gray-600">
                {product.rating}{" "}
                <span className="text-gray-400">({product.reviewCount} reviews)</span>
              </span>
            </div>

            <p className="mt-6 text-3xl font-bold text-[#0B3D91] md:text-4xl">
              {formatDa(product.price)}
            </p>

            <div className="mt-8">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Key Features</h2>
              <ul className="space-y-2">
                {product.features.map((f: string) => (
                  <li key={f} className="flex gap-2 text-sm text-gray-600">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <span className="mb-2 block text-sm font-medium text-gray-800">Quantity</span>
              <div className="inline-flex items-center gap-0 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center text-gray-700 transition hover:bg-gray-50"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" strokeWidth={2} />
                </button>
                <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums text-gray-900">
                  {qty}
                </span>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center text-gray-700 transition hover:bg-gray-50"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => q + 1)}
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.stock}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B3D91] to-[#1565C0] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="h-5 w-5" strokeWidth={2} aria-hidden />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!product.stock}
                className="w-full rounded-xl border-2 border-[#1565C0] bg-white px-6 py-3.5 text-base font-semibold text-[#0B3D91] transition hover:bg-[#1565C0]/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>

            <div className="mt-8 rounded-xl border border-[#1565C0]/20 bg-[#1565C0]/5 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:divide-x sm:divide-[#1565C0]/15">
                <div className="flex items-start gap-3 sm:px-2">
                  <Truck className="h-5 w-5 shrink-0 text-[#1565C0]" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-semibold text-[#0B3D91]">Free Shipping</p>
                    <p className="text-xs text-gray-600">On qualifying orders</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:px-2">
                  <Shield className="h-5 w-5 shrink-0 text-[#1565C0]" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-semibold text-[#0B3D91]">5-Year Warranty</p>
                    <p className="text-xs text-gray-600">Manufacturer coverage</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:px-2">
                  <RotateCcw className="h-5 w-5 shrink-0 text-[#1565C0]" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-semibold text-[#0B3D91]">30-Day Returns</p>
                    <p className="text-xs text-gray-600">Hassle-free policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-14 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8">
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            {(
              [
                ["description", "Description"],
                ["specifications", "Specifications"],
                ["reviews", `Reviews (${product.reviewCount})`]
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`relative px-4 py-3 text-sm font-semibold transition ${
                  activeTab === id
                    ? "text-[#0B3D91]"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {label}
                {activeTab === id ? (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#1565C0]" />
                ) : null}
              </button>
            ))}
          </div>

          <div className="prose prose-sm mt-6 max-w-none text-gray-600">
            {activeTab === "description" ? (
              <div className="space-y-4">
                {product.description.map((para: string, i: number) => (
                  <p key={i}>{para}</p>
                ))}
                <h3 className="text-base font-semibold text-gray-900">Features</h3>
                <ul className="list-disc space-y-1 pl-5">
                  {product.features.map((f: string) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {activeTab === "specifications" ? (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {product.specifications.map((row: { label: string; value: string }) => (
                  <div
                    key={row.label}
                    className="flex justify-between gap-4 border-b border-gray-100 py-2 text-sm"
                  >
                    <dt className="font-medium text-gray-700">{row.label}</dt>
                    <dd className="text-right text-gray-600">{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {activeTab === "reviews" ? (
              <div className="space-y-4">
                <p>
                  Customers rate this product <strong>{product.rating} / 5</strong> across{" "}
                  <strong>{product.reviewCount}</strong> verified reviews. Detailed reviews
                  will appear here when connected to your review provider.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Related */}
        <section className="mt-14">
          <h2 className="mb-8 text-xl font-bold text-[#0B3D91] md:text-2xl">
            You May Also Like
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </div>

      <SiteFooter className="mt-16" />
    </div>
  );
}
