import { useCallback, useEffect, useMemo, useState } from "react";
import { getSettings, patchSettings } from "../../api";
import { WEBSITE_SETTINGS_INITIAL, type WebsiteSettings } from "../types/websiteSettings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type WebsiteSettingsValidation = {
  ok: boolean;
  errors: Partial<Record<keyof WebsiteSettings, string>>;
};

function validateWebsiteSettings(draft: WebsiteSettings): WebsiteSettingsValidation {
  const errors: Partial<Record<keyof WebsiteSettings, string>> = {};

  if (!draft.storeName.trim()) {
    errors.storeName = "Store name is required.";
  }
  if (!draft.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(draft.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Draft vs saved snapshot — swap `saveSettings` body for `await api.put('/settings', payload)` later.
 */
export function useWebsiteSettings() {
  const [draft, setDraft] = useState<WebsiteSettings>(WEBSITE_SETTINGS_INITIAL);
  const [saved, setSaved] = useState<WebsiteSettings>(WEBSITE_SETTINGS_INITIAL);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getSettings();
        console.log("Settings loaded:", data);
        const next = { ...WEBSITE_SETTINGS_INITIAL, ...(data as Partial<WebsiteSettings>) };
        if (!cancelled) {
          setDraft(next);
          setSaved(next);
        }
      } catch (error) {
        console.error("[WebsiteSettings] load failed", error);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  const updateDraft = useCallback((patch: Partial<WebsiteSettings>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const saveSettings = useCallback(async (): Promise<{ ok: true } | { ok: false; validation: WebsiteSettingsValidation }> => {
    const validation = validateWebsiteSettings(draft);
    if (!validation.ok) {
      return { ok: false, validation };
    }

    const updated = await patchSettings(draft);
    const snapshot = { ...WEBSITE_SETTINGS_INITIAL, ...(updated as Partial<WebsiteSettings>) };
    setDraft(snapshot);
    setSaved(snapshot);
    return { ok: true };
  }, [draft]);

  const discardChanges = useCallback(() => {
    setDraft(saved);
  }, [saved]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  return {
    draft,
    saved,
    updateDraft,
    saveSettings,
    discardChanges,
    isDirty
  };
}
