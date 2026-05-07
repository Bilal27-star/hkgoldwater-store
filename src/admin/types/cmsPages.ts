export type CmsPageKey = "about" | "shipping" | "terms" | "privacy";

export type CmsPageData = {
  title: string;
  /** Stored as HTML from TipTap — matches future API body */
  contentHtml: string;
  updatedAt: string;
};

export const CMS_PAGE_ORDER: { key: CmsPageKey; label: string }[] = [
  { key: "about", label: "About Us" },
  { key: "shipping", label: "Shipping Information" },
  { key: "terms", label: "Terms & Conditions" },
  { key: "privacy", label: "Privacy Policy" }
];
