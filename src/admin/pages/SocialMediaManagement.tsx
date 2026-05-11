import { useState } from "react";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../api";
import SocialCard from "../components/social-media/SocialCard";
import SocialLivePreview from "../components/social-media/SocialLivePreview";
import SocialQuickGuide from "../components/social-media/SocialQuickGuide";
import SocialSaveBar from "../components/social-media/SocialSaveBar";
import { useSocialMediaSettings } from "../hooks/useSocialMediaSettings";
import type { SocialPlatformId } from "../types/socialMedia";

const PLATFORMS: SocialPlatformId[] = ["facebook", "instagram", "whatsapp", "tiktok"];

export default function SocialMediaManagement() {
  const { draft, isDirty, updatePlatform, flushSave } = useSocialMediaSettings();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await flushSave();
      toast.success("Social settings saved");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not save social settings"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#0B3D91]">Social Media Management</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your social media links and online presence.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {PLATFORMS.map((id) => (
          <SocialCard
            key={id}
            platformId={id}
            enabled={draft[id].enabled}
            value={draft[id].value}
            onToggle={(next) => updatePlatform(id, { enabled: next })}
            onValueChange={(v) => updatePlatform(id, { value: v })}
          />
        ))}
      </div>

      <SocialSaveBar isDirty={isDirty} saving={saving} onSave={handleSave} />

      <SocialLivePreview state={draft} />

      <SocialQuickGuide />
    </div>
  );
}
