import { useEffect, useState } from "react";
import { getPages, getSettings } from "../api";

export type SiteSettingsData = {
  storeName: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  footerText: string;
};

export type SitePageData = {
  key: string;
  title: string;
  contentHtml: string;
  updatedAt: string;
};

const DEFAULT_SETTINGS: SiteSettingsData = {
  storeName: "",
  email: "",
  phone: "",
  address: "",
  logo: "",
  footerText: ""
};

export function useSiteContent() {
  const [settings, setSettings] = useState<SiteSettingsData>(DEFAULT_SETTINGS);
  const [pages, setPages] = useState<SitePageData[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [settingsData, pagesData] = await Promise.all([getSettings(), getPages()]);
        console.log("Settings loaded:", settingsData);
        console.log("Pages loaded:", pagesData);
        if (!cancelled) {
          setSettings({ ...DEFAULT_SETTINGS, ...(settingsData as Partial<SiteSettingsData>) });
          setPages(Array.isArray(pagesData) ? (pagesData as SitePageData[]) : []);
        }
      } catch (error) {
        console.error("[site-content] load failed", error);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, pages };
}
