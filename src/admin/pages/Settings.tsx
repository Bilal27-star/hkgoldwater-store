import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import FooterCopyrightField from "../components/website-settings/FooterCopyrightField";
import LogoUploadZone from "../components/website-settings/LogoUploadZone";
import StoreInformationCard from "../components/website-settings/StoreInformationCard";
import WebsiteLivePreview from "../components/website-settings/WebsiteLivePreview";
import WebsiteSettingsSaveBar from "../components/website-settings/WebsiteSettingsSaveBar";
import { useWebsiteSettings } from "../hooks/useWebsiteSettings";
import type { WebsiteSettings } from "../types/websiteSettings";

export default function Settings() {
  const { draft, updateDraft: patchDraft, saveSettings, isDirty } = useWebsiteSettings();
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof WebsiteSettings, string>>>({});
  const [saving, setSaving] = useState(false);

  const updateDraft = useCallback(
    (patch: Partial<WebsiteSettings>) => {
      setFieldErrors({});
      patchDraft(patch);
    },
    [patchDraft]
  );

  async function handleSave() {
    setSaving(true);
    const result = await saveSettings();
    setSaving(false);

    if (!result.ok) {
      setFieldErrors(result.validation.errors);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setFieldErrors({});
    toast.success("Changes saved");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-28">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B3D91]">Website Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage store details, branding, and footer — preview updates live before you save.
        </p>
      </div>

      <StoreInformationCard values={draft} errors={fieldErrors} onChange={updateDraft} />

      <LogoUploadZone logo={draft.logo} onLogoChange={(logo) => updateDraft({ logo })} />

      <FooterCopyrightField value={draft.footerText} onChange={(footerText) => updateDraft({ footerText })} />

      <WebsiteLivePreview settings={draft} />

      <WebsiteSettingsSaveBar
        isDirty={isDirty}
        disabled={!isDirty}
        saving={saving}
        onSave={handleSave}
      />
    </div>
  );
}
