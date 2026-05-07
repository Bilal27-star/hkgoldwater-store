import type { SocialPlatformId } from "../../types/socialMedia";
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";

const META: Record<
  SocialPlatformId,
  {
    label: string;
    inputLabel: string;
    placeholder: string;
    helper: string;
    inputMode: "url" | "tel";
    autoComplete: string;
    iconBg: string;
    Icon: typeof FaFacebook;
  }
> = {
  facebook: {
    label: "Facebook",
    inputLabel: "Facebook URL",
    placeholder: "https://www.facebook.com/your-page",
    helper: "Enter the full URL to your Facebook page.",
    inputMode: "url",
    autoComplete: "url",
    iconBg: "bg-[#1877F2]",
    Icon: FaFacebook
  },
  instagram: {
    label: "Instagram",
    inputLabel: "Instagram URL",
    placeholder: "https://www.instagram.com/your-profile",
    helper: "Enter the full URL to your Instagram profile.",
    inputMode: "url",
    autoComplete: "url",
    iconBg: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
    Icon: FaInstagram
  },
  tiktok: {
    label: "TikTok",
    inputLabel: "TikTok URL",
    placeholder: "https://www.tiktok.com/@your-account",
    helper: "Enter the full URL to your TikTok profile.",
    inputMode: "url",
    autoComplete: "url",
    iconBg: "bg-black",
    Icon: FaTiktok
  },
  whatsapp: {
    label: "WhatsApp",
    inputLabel: "WhatsApp number",
    placeholder: "+213 555 123 456",
    helper: "Use your business number with country code (e.g. +213).",
    inputMode: "tel",
    autoComplete: "tel",
    iconBg: "bg-[#25D366]",
    Icon: FaWhatsapp
  }
};

type Props = {
  platformId: SocialPlatformId;
  enabled: boolean;
  value: string;
  onToggle: (next: boolean) => void;
  onValueChange: (next: string) => void;
};

export default function SocialCard({
  platformId,
  enabled,
  value,
  onToggle,
  onValueChange
}: Props) {
  const meta = META[platformId];
  const { Icon } = meta;
  const inputId = `social-${platformId}`;

  return (
    <article
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100/80 transition-opacity duration-200 ${
        enabled ? "opacity-100" : "opacity-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white shadow-inner ${meta.iconBg}`}
          >
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900">{meta.label}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium">
              <span
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${enabled ? "bg-emerald-500" : "bg-slate-300"}`}
                aria-hidden
              />
              <span className={enabled ? "text-emerald-700" : "text-slate-500"}>
                {enabled ? "Active" : "Disabled"}
              </span>
            </p>
          </div>
        </div>

        <ToggleSwitch checked={enabled} onChange={onToggle} label={`Toggle ${meta.label}`} />
      </div>

      <div className="mt-5">
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {meta.inputLabel} {!enabled ? "" : <span className="text-red-500">*</span>}
        </label>
        <input
          id={inputId}
          type={platformId === "whatsapp" ? "tel" : "url"}
          inputMode={meta.inputMode}
          autoComplete={meta.autoComplete}
          disabled={!enabled}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={meta.placeholder}
          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
        />
        <p className="mt-1.5 text-xs text-slate-500">{meta.helper}</p>
      </div>
    </article>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1565C0] ${
        checked ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 translate-x-0.5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-[1.35rem]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
