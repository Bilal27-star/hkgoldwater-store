export type CategorySlug =
  | "accessoire-sanitaire"
  | "plomberie-chauffage"
  | "accessoire-piscine";

export type CategoryConfig = {
  slug: CategorySlug;
  labelKey: string;
  homeSubtitleKey: string;
};

export const STORE_CATEGORIES: CategoryConfig[] = [
  {
    slug: "accessoire-sanitaire",
    labelKey: "catalog.categories.accessoireSanitaire",
    homeSubtitleKey: "catalog.subtitles.accessoireSanitaire"
  },
  {
    slug: "plomberie-chauffage",
    labelKey: "catalog.categories.plomberieChauffage",
    homeSubtitleKey: "catalog.subtitles.plomberieChauffage"
  },
  {
    slug: "accessoire-piscine",
    labelKey: "catalog.categories.accessoirePiscine",
    homeSubtitleKey: "catalog.subtitles.accessoirePiscine"
  }
];

export const CATEGORY_BRANDS: Record<CategorySlug, string[]> = {
  "accessoire-sanitaire": [
    "MC Polo",
    "FLR",
    "Spain",
    "Lixura",
    "Vidas",
    "Lune",
    "Sanwater",
    "SanDecor",
    "TH"
  ],
  "plomberie-chauffage": [
    "Made in Italy",
    "Made in China",
    "Local",
    "Temme",
    "TDM",
    "CLS",
    "FLR",
    "Shemge",
    "Leo",
    "Sanidival",
    "Janker",
    "Confort",
    "Warm"
  ],
  "accessoire-piscine": ["GimasTurk", "DAB Italy", "IMO LaChin", "Chiali Local"]
};

export function normalizeCategorySlug(value: string | null | undefined): CategorySlug | null {
  if (!value) return null;
  const candidate = value.trim().toLowerCase();
  const known = STORE_CATEGORIES.find((cat) => cat.slug === candidate);
  return known ? known.slug : null;
}

export function mapCategoryValueToSlug(value: string | null | undefined): CategorySlug | null {
  const normalized = normalizeCategorySlug(value);
  if (normalized) return normalized;
  if (!value) return null;
  const v = value.trim().toLowerCase();

  if (v.includes("sanitaire") || v.includes("صحية") || v.includes("sanitary")) {
    return "accessoire-sanitaire";
  }
  if (v.includes("chauffage") || v.includes("تدفئة") || v.includes("heating") || v.includes("plomb")) {
    return "plomberie-chauffage";
  }
  if (v.includes("piscine") || v.includes("مسابح") || v.includes("pool")) {
    return "accessoire-piscine";
  }

  return null;
}
