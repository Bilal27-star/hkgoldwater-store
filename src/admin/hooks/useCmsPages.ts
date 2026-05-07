import { useCallback, useEffect, useMemo, useState } from "react";
import { getPages, patchPages } from "../../api";
import type { CmsPageData, CmsPageKey } from "../types/cmsPages";

const INITIAL_PAGES: Record<CmsPageKey, CmsPageData> = {
  about: {
    title: "",
    contentHtml: "",
    updatedAt: ""
  },
  shipping: {
    title: "",
    contentHtml: "",
    updatedAt: ""
  },
  terms: {
    title: "",
    contentHtml: "",
    updatedAt: ""
  },
  privacy: {
    title: "",
    contentHtml: "",
    updatedAt: ""
  }
};

export function htmlPlainTextLength(html: string): number {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, "").length;
  }
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent || "").length;
}

/**
 * Draft vs saved pages — replace `flushSave` with `await api.put(/pages/${key}, payload)` later.
 */
export function useCmsPages() {
  const [pages, setPages] = useState<Record<CmsPageKey, CmsPageData>>(() => INITIAL_PAGES);
  const [savedPages, setSavedPages] = useState<Record<CmsPageKey, CmsPageData>>(() => INITIAL_PAGES);

  const mergeFromApi = useCallback((rows: any[]) => {
    const next = { ...INITIAL_PAGES };
    for (const row of rows) {
      const key = String(row.key || "") as CmsPageKey;
      if (!(key in next)) continue;
      next[key] = {
        title: typeof row.title === "string" ? row.title : next[key].title,
        contentHtml: typeof row.contentHtml === "string" ? row.contentHtml : next[key].contentHtml,
        updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : next[key].updatedAt
      };
    }
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getPages();
        console.log("Pages loaded:", data);
        const rows = Array.isArray(data) ? data : [];
        const merged = mergeFromApi(rows);
        if (!cancelled) {
          setPages(merged);
          setSavedPages(merged);
        }
      } catch (error) {
        console.error("[CMS] load pages failed", error);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [mergeFromApi]);

  const isDirty = useMemo(() => JSON.stringify(pages) !== JSON.stringify(savedPages), [pages, savedPages]);

  const updatePage = useCallback((key: CmsPageKey, patch: Partial<CmsPageData>) => {
    setPages((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch }
    }));
  }, []);

  const setTitle = useCallback(
    (key: CmsPageKey, title: string) => {
      updatePage(key, { title });
    },
    [updatePage]
  );

  const setContentHtml = useCallback(
    (key: CmsPageKey, contentHtml: string) => {
      updatePage(key, { contentHtml });
    },
    [updatePage]
  );

  const flushSave = useCallback(async (activeKey: CmsPageKey): Promise<void> => {
    const payload = (Object.keys(pages) as CmsPageKey[]).map((key) => ({
      key,
      title: pages[key].title,
      contentHtml: pages[key].contentHtml
    }));
    console.log("[CMS] save page", activeKey, pages[activeKey]);
    const data = await patchPages({ pages: payload });
    const rows = Array.isArray(data) ? data : [];
    const merged = mergeFromApi(rows);
    setPages(merged);
    setSavedPages(merged);
  }, [mergeFromApi, pages]);

  return {
    pages,
    savedPages,
    isDirty,
    updatePage,
    setTitle,
    setContentHtml,
    flushSave
  };
}
