import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Breadcrumb from "./Breadcrumb";
import FiltersSidebar from "./FiltersSidebar";
import ProductCard, { type ProductItem } from "./ProductCard";
import SiteFooter from "./SiteFooter";
import { useI18n } from "../i18n/I18nProvider";
import { getBrands, getCategories, getProducts } from "../api";

const PRICE_RANGE_DEFAULT: [number, number] = [0, 50000];

function resolveLocalizedText(value: unknown, lang: "fr" | "en" | "ar") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return String(obj[lang] || obj.en || obj.fr || obj.ar || "");
  }
  return String(value || "");
}

export default function ProductListingPage() {
  const { t, language } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategoryId = searchParams.get("categoryId")?.trim() || null;
  const selectedBrand = searchParams.get("brand")?.trim() || null;
  const searchTerm = searchParams.get("search")?.trim() || "";
  const [priceRange, setPriceRange] = useState<[number, number]>(PRICE_RANGE_DEFAULT);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const renderCountRef = useRef(0);

  renderCountRef.current += 1;
  console.log("[ProductListingPage] render count", renderCountRef.current, "products", products.length);

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      try {
        const data = await getProducts();
        console.log("API PRODUCTS:", data);
        console.log("[ProductListingPage] fetched products", data);
        const rows = Array.isArray(data)
          ? data
          : data != null && typeof data === "object" && Array.isArray((data as any).items)
            ? (data as any).items
            : [];
        const mapped: ProductItem[] = rows
          .map((item: any) => {
            const id = String(item?.id || "").trim();
            if (!id) {
              console.warn("[ProductListingPage] skipped product without id:", item);
              return null;
            }
            const rawPrice = item.price ?? item.unit_price;
            const priceNum =
              typeof rawPrice === "string"
                ? Number.parseFloat(String(rawPrice).replace(",", "."))
                : Number(rawPrice);
            const price = Number.isFinite(priceNum) ? priceNum : 0;
            return {
              id,
              brand: item.brand || "",
              title:
                resolveLocalizedText(item.name || item.title, language) ||
                "Unnamed product",
              category_id: String(item.category_id || item.category?.id || ""),
              rating: Number(item.rating || 0),
              reviewCount: Number(item.review_count || 0),
              price,
              imageUrl: item.image || item.image_url || ""
            };
          })
          .filter((item): item is ProductItem => item !== null);
        if (!cancelled) setProducts(mapped);
      } catch (error) {
        console.error("[ProductListingPage] fetch error", error);
        if (!cancelled) setProducts([]);
      }
    }
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const data = await getCategories();
        const rows = Array.isArray(data) ? data : [];
        if (!cancelled) {
          setCategories(
            rows.map((row: any) => ({ id: String(row.id), name: String(row.name || "") }))
          );
        }
      } catch (error) {
        console.error("[ProductListingPage] categories fetch error", error);
        if (!cancelled) setCategories([]);
      }
    }
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadBrands() {
      try {
        // If a category is selected, fetch only that category's brands.
        if (selectedCategoryId) {
          const data = await getBrands(selectedCategoryId);
          console.log("[ProductListingPage] fetched brands for category_id:", selectedCategoryId, data);
          const rows = Array.isArray(data) ? data : [];
          const unique = Array.from(
            new Set(rows.map((row: any) => String(row.name || "").trim()).filter(Boolean))
          );
          if (!cancelled) setBrands(unique);
          return;
        }

        // No category selected: fetch all brands by querying each category and flattening.
        if (!categories.length) {
          if (!cancelled) setBrands([]);
          return;
        }

        const allResponses = await Promise.all(categories.map((category) => getBrands(category.id)));
        const merged = allResponses.flatMap((data) => (Array.isArray(data) ? data : []));
        console.log("[ProductListingPage] fetched brands (all categories):", merged);
        const unique = Array.from(
          new Set(merged.map((row: any) => String(row.name || "").trim()).filter(Boolean))
        );
        if (!cancelled) setBrands(unique);
      } catch (error) {
        console.error("[ProductListingPage] brands fetch error", error);
        if (!cancelled) setBrands([]);
      }
    }
    loadBrands();
    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId, categories]);

  function updateQuery(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
    setSearchParams(params);
  }

  const filteredProducts = useMemo(() => {
    if (products.length === 0) return [];
    const [lo, hi] = priceRange;
    const atFullDefault =
      lo === PRICE_RANGE_DEFAULT[0] && hi === PRICE_RANGE_DEFAULT[1];
    const normalizedSearch = searchTerm.toLowerCase();
    return products.filter((product) => {
      const price = product.price;
      if (!Number.isFinite(price)) return false;
      if (!atFullDefault && (price < lo || price > hi)) return false;
      if (selectedCategoryId && product.category_id !== selectedCategoryId) return false;
      if (selectedBrand && product.brand !== selectedBrand) return false;
      if (
        normalizedSearch &&
        !product.title.toLowerCase().includes(normalizedSearch) &&
        !product.brand.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }
      return true;
    });
  }, [products, priceRange, selectedCategoryId, selectedBrand, searchTerm]);

  const count = filteredProducts.length;

  useEffect(() => {
    console.log("[ProductListingPage] filtered brands:", brands);
  }, [brands]);

  return (
    <div className="min-h-screen bg-[#f8fafe]">
      <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
        <Breadcrumb
          items={[
            { label: t("common.home"), to: "/" },
            { label: t("listing.shop"), to: "/products" },
            { label: t("listing.allProducts") }
          ]}
        />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          <div className="w-full shrink-0 lg:w-[280px] xl:w-[300px]">
            <div className="lg:sticky lg:top-[72px]">
              <FiltersSidebar
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                selectedBrand={selectedBrand}
                brands={brands}
                onCategoryChange={(categoryId: string | null) =>
                  updateQuery({
                    categoryId,
                    brand: null
                  })
                }
                onBrandChange={(brand: string | null) => updateQuery({ brand })}
                onClearAll={() => {
                  setPriceRange(PRICE_RANGE_DEFAULT);
                  setSearchParams(new URLSearchParams());
                }}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-700">
                {t("listing.showingProducts", { count })}
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <span className="whitespace-nowrap">{t("listing.sortBy")}</span>
                <select
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none ring-[#1565C0] focus:ring-2"
                  defaultValue="featured"
                  aria-label={t("listing.sortBy")}
                >
                  <option value="featured">{t("listing.featured")}</option>
                  <option value="price-low">{t("listing.priceLowHigh")}</option>
                  <option value="price-high">{t("listing.priceHighLow")}</option>
                  <option value="rating">{t("listing.rating")}</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {filteredProducts.length === 0 ? (
              <p className="mt-8 text-sm text-gray-600">No products available.</p>
            ) : null}

            <nav
              className="mt-12 flex flex-wrap items-center justify-center gap-2"
              aria-label="Pagination"
            >
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-white hover:text-[#0B3D91]"
              >
                {t("common.previous")}
              </button>
              <button
                type="button"
                className="min-w-[40px] rounded-lg bg-[#1565C0] px-3 py-2 text-sm font-semibold text-white"
                aria-current="page"
              >
                1
              </button>
              <button
                type="button"
                className="min-w-[40px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-[#1565C0] hover:text-[#1565C0]"
              >
                2
              </button>
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-white hover:text-[#0B3D91]"
              >
                {t("common.next")}
              </button>
            </nav>
          </div>
        </div>
      </div>

      <SiteFooter className="mt-16" />
    </div>
  );
}
