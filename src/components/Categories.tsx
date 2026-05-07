import { useEffect, useState } from "react";
import { Box, Droplet, Move, Wrench } from "lucide-react";
import { getCategories } from "../api";
import { useI18n } from "../i18n/I18nProvider";

const CATEGORY_ICONS = [Droplet, Wrench, Move, Box];

export default function Categories() {
  const { t } = useI18n();
  const [categoryItems, setCategoryItems] = useState<
    Array<{ id: string; name: string; subtitle: string; Icon: typeof Droplet }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const data = await getCategories();
        const rows = Array.isArray(data) ? data : [];
        const mapped = rows.map((category: any, idx: number) => ({
          id: String(category.id),
          name: String(category.name || ""),
          subtitle: t("categories.subtitle"),
          Icon: CATEGORY_ICONS[idx % CATEGORY_ICONS.length]
        }));
        if (!cancelled) setCategoryItems(mapped);
      } catch (error) {
        console.error("[Categories] failed to fetch categories", error);
        if (!cancelled) setCategoryItems([]);
      }
    }
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <section id="categories" className="bg-[#f8fafe] py-16">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-12">
        <h2 className="text-center text-[30px] font-semibold leading-tight text-[#0B3D91]">
          {t("categories.title")}
        </h2>
        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 justify-items-center gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categoryItems.map(({ id, name, subtitle, Icon }, idx) => {
            return (
            <article
              key={id}
              className={`group w-full max-w-[390px] rounded-2xl border border-[#edf1f6] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_-18px_rgba(11,61,145,0.35)] hover:ring-1 hover:ring-[#1565C0]/20 ${
                idx === 2 ? "md:col-span-2 md:justify-self-center xl:col-span-1 xl:justify-self-auto" : ""
              }`}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1565C0] to-[#0B3D91] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
              </div>
              <h3 className="text-xl font-semibold text-[#0B3D91]">{name}</h3>
              <p className="mt-1.5 text-sm leading-snug text-[#697b92] break-words">
                {subtitle}
              </p>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
