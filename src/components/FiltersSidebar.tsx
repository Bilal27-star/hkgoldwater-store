import PriceRangeSlider from "./PriceRangeSlider";
import { useI18n } from "../i18n/I18nProvider";

export type FiltersSidebarProps = {
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  categories: Array<{ id: string; name: string }>;
  selectedCategoryId: string | null;
  selectedBrand: string | null;
  brands: Array<{ id: string; name: string }>;
  onCategoryChange: (categoryId: string | null) => void;
  onBrandChange: (brandId: string | null) => void;
  onClearAll?: () => void;
};

export default function FiltersSidebar({
  priceRange,
  onPriceRangeChange,
  categories,
  selectedCategoryId,
  selectedBrand,
  brands,
  onCategoryChange,
  onBrandChange,
  onClearAll
}: FiltersSidebarProps) {
  const { t } = useI18n();

  return (
    <aside className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">{t("filters.title")}</h2>
        <button
          type="button"
          className="text-sm font-medium text-gray-500 transition hover:text-[#1565C0]"
          onClick={onClearAll}
        >
          {t("filters.clearAll")}
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 id="filters-price-range-heading" className="mb-3 text-sm font-medium text-gray-900">
            {t("filters.priceRange")}
          </h3>
          <PriceRangeSlider
            ariaLabelledBy="filters-price-range-heading"
            value={priceRange}
            onValueChange={onPriceRangeChange}
          />
          <div className="mt-4 h-px bg-gray-200" aria-hidden />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-900">{t("filters.category")}</h3>
          <ul className="space-y-1">
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  className="w-full rounded-lg px-2 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 hover:text-[#0B3D91]"
                  onClick={() => {
                    console.log("SELECTED CATEGORY:", category);
                    onCategoryChange(selectedCategoryId === category.id ? null : category.id);
                  }}
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-900">{t("filters.brand")}</h3>
          {brands.length ? (
            <ul className="space-y-1">
              {brands.map((brand) => (
                <li key={brand.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg px-2 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 hover:text-[#0B3D91]"
                    onClick={() => onBrandChange(selectedBrand === brand.id ? null : brand.id)}
                  >
                    {brand.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No brands available for this category.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
