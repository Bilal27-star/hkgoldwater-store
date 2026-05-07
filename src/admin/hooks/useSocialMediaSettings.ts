import { useCallback, useMemo, useState } from "react";
import type { SocialMediaState, SocialPlatformId } from "../types/socialMedia";

const STORAGE_KEY = "dz_social_media_v1";

const INITIAL: SocialMediaState = {
  facebook: {
    enabled: true,
    value: "https://www.facebook.com/HKGoldWater"
  },
  instagram: {
    enabled: true,
    value: "https://www.instagram.com/HKGoldWater"
  },
  tiktok: {
    enabled: false,
    value: ""
  },
  whatsapp: {
    enabled: true,
    value: "+213 555 123 456"
  }
};

function load(): SocialMediaState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as SocialMediaState;
    if (!p || typeof p !== "object") return null;
    return { ...INITIAL, ...p };
  } catch {
    return null;
  }
}

function persist(state: SocialMediaState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/**
 * Client-side social links — replace `flushSave` with `await api.put('/settings/social', state)` later.
 */
export function useSocialMediaSettings() {
  const seeded = load();
  const [draft, setDraft] = useState<SocialMediaState>(() => seeded ?? INITIAL);
  const [saved, setSaved] = useState<SocialMediaState>(() => seeded ?? INITIAL);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  const updatePlatform = useCallback((id: SocialPlatformId, patch: Partial<SocialMediaState[SocialPlatformId]>) => {
    setDraft((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch }
    }));
  }, []);

  const flushSave = useCallback(async (): Promise<void> => {
    // Future: await api.put("/settings/social-media", draft)
    console.log("[SocialMedia] save", draft);
    setSaved(draft);
    persist(draft);
  }, [draft]);

  return {
    draft,
    saved,
    isDirty,
    updatePlatform,
    flushSave
  };
}
