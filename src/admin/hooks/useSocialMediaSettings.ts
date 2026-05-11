import { useCallback, useEffect, useMemo, useState } from "react";
import { SOCIAL_MEDIA_DEFAULTS } from "../../constants/socialMediaDefaults";
import { getSocialMedia, patchSocialMedia } from "../../api";
import type { SocialMediaState, SocialPlatformId } from "../types/socialMedia";

const STORAGE_KEY = "dz_social_media_v1";

const INITIAL = SOCIAL_MEDIA_DEFAULTS;

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

  useEffect(() => {
    let cancelled = false;
    async function loadRemote() {
      try {
        const data = (await getSocialMedia()) as SocialMediaState | null;
        if (cancelled || !data || typeof data !== "object") return;
        const merged = { ...INITIAL, ...data };
        setDraft(merged);
        setSaved(merged);
        persist(merged);
      } catch {
        const local = load();
        if (!cancelled && local) {
          setDraft(local);
          setSaved(local);
        }
      }
    }
    loadRemote();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  const updatePlatform = useCallback((id: SocialPlatformId, patch: Partial<SocialMediaState[SocialPlatformId]>) => {
    setDraft((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch }
    }));
  }, []);

  const flushSave = useCallback(async (): Promise<void> => {
    await patchSocialMedia(draft);
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
