import { Award, Headphones, ShieldCheck, ShoppingCart, Truck, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../api";
import Categories from "./Categories";
import Hero from "./Hero";
import SiteFooter from "./SiteFooter";
import { useI18n } from "../i18n/I18nProvider";

import Logo from "../assets/logo.png";
/** Order matches `homePage.trustItems` in locale files: delivery, payment, quality, support */
const TRUST_ICONS: LucideIcon[] = [Truck, ShieldCheck, Award, Headphones];

type FeaturedProduct = {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  imageUrl: string;
};

function resolveLocalizedText(
  value: unknown,
  lang: "fr" | "en" | "ar"
) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return String(obj[lang] || obj.en || obj.fr || obj.ar || "");
  }
  return String(value || "");
}

export default function HomePage() {
  const { t, list, language } = useI18n();
  const navigate = useNavigate();
  const trustItems = list<{ title: string; desc: string }>("homePage.trustItems");
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const renderCountRef = useRef(0);

  renderCountRef.current += 1;
  console.log("[HomePage] render count", renderCountRef.current, "products", products.length);

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      try {
        const data = await getProducts();
        console.log("API PRODUCTS:", data);
        const rows = Array.isArray(data)
          ? data
          : data != null && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)
            ? (data as { items: any[] }).items
            : [];
        console.log("[HomePage] fetched products", rows);
        const mapped: FeaturedProduct[] = rows.slice(0, 8).map((item: any) => {
          const rawPrice = item.price ?? item.unit_price;
          const priceNum =
            typeof rawPrice === "string"
              ? Number.parseFloat(String(rawPrice).replace(",", "."))
              : Number(rawPrice);
          const price = Number.isFinite(priceNum) ? priceNum : 0;
          const ratingNum = Number(item.rating ?? 0);
          const rating = Number.isFinite(ratingNum) ? ratingNum : 0;
          const reviewCountNum = Number(item.review_count ?? 0);
          const reviewCount = Number.isFinite(reviewCountNum) ? reviewCountNum : 0;
          return {
            id: String(item.id),
            name: resolveLocalizedText(item.name || item.title, language) || "Product",
            rating,
            reviewCount,
            price,
            imageUrl: String(item.image || item.image_url || "").trim()
          };
        });
        if (!cancelled) {
          setProducts(mapped);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
        }
      }
    }
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [language]);

  function formatDa(value: number) {
    return `${value.toLocaleString("fr-DZ")} DA`;
  }

  function formatRating(rating: number, reviewCount: number) {
    return `${rating.toFixed(1)} (${reviewCount})`;
  }

  return (
    <>
      <Hero />

      <Categories />

      <section className="featured" id="products">
        <div className="container">
          <h2 className="section-title">{t("homePage.featuredTitle")}</h2>
          <p className="section-sub">{t("homePage.featuredSubtitle")}</p>

          <div className="product-grid">
            {products.length > 0 ? (
              products.map((product, i) => (
                <article
                  className="product-card cursor-pointer"
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/product/${product.id}`);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                >
                  <div
                    className={
                      product.imageUrl ? "product-image overflow-hidden bg-[#eef2f7]" : `product-image img-${i + 1}`
                    }
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="block h-full min-h-[292px] w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                  </div>
                  <div className="product-body">
                    <h3>{product.name}</h3>
                    <p className="rating">⭐ {formatRating(product.rating, product.reviewCount)}</p>
                    <div className="price-row">
                      <span>{formatDa(product.price)}</span>
                      <button type="button" aria-label={t("productCard.add")}>
                        <ShoppingCart size={18} strokeWidth={2} aria-hidden />
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="section-sub">No products available.</p>
            )}
          </div>
        </div>
      </section>

      <section className="promo">
        <div className="container promo-inner">
          {/* <Logo variant="light" alt="" className="mx-auto mb-4 block sm:mb-5" /> */}
          <img src={Logo} alt={"sasa"} className="h-12 w-auto mx-auto mb-4 block sm:h-14 sm:mb-5" />
          <span className="pill">{t("homePage.promoPill")}</span>
          <h3>{t("homePage.promoTitle")}</h3>
          <p>{t("homePage.promoText")}</p>
          <button type="button" className="primary light" onClick={() => navigate("/products")}>
            {t("homePage.promoCta")}
          </button>
        </div>
      </section>

      <section className="trust">
        <div className="container trust-grid">
          {trustItems.map((item, idx) => {
            const TrustIcon = TRUST_ICONS[idx] ?? Truck;
            return (
            <article key={`${item.title}-${idx}`} className="trust-card">
              <div className="trust-icon" aria-hidden>
                <TrustIcon size={28} strokeWidth={2} color="#ffffff" />
              </div>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </article>
            );
          })}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
