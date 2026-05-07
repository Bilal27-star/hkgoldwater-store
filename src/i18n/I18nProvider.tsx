import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import ar from "../locales/ar.json";
import en from "../locales/en.json";
import fr from "../locales/fr.json";

export type LanguageCode = "en" | "fr" | "ar";

type Dict = Record<string, unknown>;

type I18nContextValue = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isRTL: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  list: <T = string>(key: string) => T[];
};

const I18N_STORAGE_KEY = "goldwater_lang";

const dictionaries: Record<LanguageCode, Dict> = {
  en: en as Dict,
  fr: fr as Dict,
  ar: ar as Dict
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getByPath(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === "object" && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, root);
}

function formatTemplate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ""));
}

function resolveInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(I18N_STORAGE_KEY);
  if (saved === "en" || saved === "fr" || saved === "ar") return saved;
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => resolveInitialLanguage());

  const isRTL = language === "ar";

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  useEffect(() => {
    window.localStorage.setItem(I18N_STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.body.classList.toggle("font-ar", isRTL);
  }, [language, isRTL]);

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[language];
    const fallbackDict = dictionaries.en;

    const t = (key: string, params?: Record<string, string | number>) => {
      const value = getByPath(dict, key) ?? getByPath(fallbackDict, key);
      if (typeof value === "string") return formatTemplate(value, params);
      return key;
    };

    const list = <T = string,>(key: string): T[] => {
      const value = getByPath(dict, key) ?? getByPath(fallbackDict, key);
      return Array.isArray(value) ? (value as T[]) : [];
    };

    return { language, setLanguage, isRTL, t, list };
  }, [language, isRTL]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
