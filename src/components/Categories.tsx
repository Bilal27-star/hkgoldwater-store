import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Droplet, Move, Wrench } from "lucide-react";
import { getCategories } from "../api";
import { useI18n } from "../i18n/I18nProvider";

const CATEGORY_ICONS = [Droplet, Wrench, Move, Box];

type CategoriesProps = {
  categories?: Array<{ id: string; name: string }>;
};

function pickLocalizedName(value: unknown, lang: "fr" | "en" | "ar"): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    return String(o[lang] || o.en || o.fr || o.ar || "");
  }
  return String(value || "");
}

export default function Categories({ categories: externalCategories }: CategoriesProps) {
  const { t, language } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryItems, setCategoryItems] = useState<
    Array<{ id: string; name: string; subtitle: string; Icon: typeof Droplet }>
  >([]);

  useEffect(() => {
    if (externalCategories && externalCategories.length > 0) {
      const mapped = externalCategories.map((category, idx) => ({
        id: String(category.id),
        name: pickLocalizedName(category.name, language),
        subtitle: t("categories.subtitle"),
        Icon: CATEGORY_ICONS[idx % CATEGORY_ICONS.length]
      }));
      setCategoryItems(mapped);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    async function loadCategories() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCategories();
        console.log("CATEGORIES:", data);
        const rows = Array.isArray(data) ? data : [];
        const mapped = rows.map((category: any, idx: number) => ({
          id: String(category.id),
          name: pickLocalizedName(category.name, language),
          subtitle: t("categories.subtitle"),
          Icon: CATEGORY_ICONS[idx % CATEGORY_ICONS.length]
        }));
        if (!cancelled) setCategoryItems(mapped);
      } catch (error) {
        console.error("[Categories] failed to fetch categories", error);
        if (!cancelled) {
          setCategoryItems([]);
          setError("Failed to load categories.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, [t, language, externalCategories]);

  return (
    <section id="categories" className="bg-[#f8fafe] py-16">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-12">
        <h2 className="text-center text-[30px] font-semibold leading-tight text-[#0B3D91]">
          {t("categories.title")}
        </h2>
        {loading ? <p className="mt-4 text-center text-sm text-gray-600">Loading categories...</p> : null}
        {error ? <p className="mt-4 text-center text-sm text-red-600">{error}</p> : null}
        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 justify-items-center gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categoryItems.map(({ id, name, subtitle, Icon }, idx) => {
            return (
            <Link
              key={id}
              to={`/products?categoryId=${encodeURIComponent(id)}`}
              className={`group block w-full max-w-[390px] rounded-2xl border border-[#edf1f6] bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_-18px_rgba(11,61,145,0.35)] hover:ring-1 hover:ring-[#1565C0]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1565C0] ${
                idx === 2 ? "md:col-span-2 md:justify-self-center xl:col-span-1 xl:justify-self-auto" : ""
              }`}
            >
              <article>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1565C0] to-[#0B3D91] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                  <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="text-xl font-semibold text-[#0B3D91]">{name || "—"}</h3>
                <p className="mt-1.5 text-sm leading-snug text-[#697b92] break-words">
                  {subtitle}
                </p>
              </article>
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
