import type { SocialMediaState, SocialPlatformId } from "../../types/socialMedia";
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import { Eye } from "lucide-react";

type Props = {
  state: SocialMediaState;
};

const ORDER: SocialPlatformId[] = ["facebook", "instagram", "tiktok", "whatsapp"];

export default function SocialLivePreview({ state }: Props) {
  const visible = ORDER.filter((id) => state[id].enabled && state[id].value.trim() !== "");

  return (
    <section className="overflow-hidden rounded-xl border border-emerald-200/90 bg-white shadow-sm ring-1 ring-emerald-100">
      <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/95 px-5 py-3">
        <Eye className="h-5 w-5 text-emerald-700" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-900">Live preview</h2>
      </div>
      <div className="bg-slate-50 px-5 py-8">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
          How buttons appear on your site
        </p>
        {visible.length === 0 ? (
          <p className="text-center text-sm text-slate-500">Enable a platform and add a link to see it here.</p>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {visible.map((id) => (
              <PreviewChip key={id} id={id} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PreviewChip({ id }: { id: SocialPlatformId }) {
  const label =
    id === "facebook"
      ? "Facebook"
      : id === "instagram"
        ? "Instagram"
        : id === "tiktok"
          ? "TikTok"
          : "WhatsApp";

  if (id === "facebook") {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white shadow-md">
        <FaFacebook className="h-5 w-5 shrink-0" aria-hidden />
        {label}
      </span>
    );
  }
  if (id === "instagram") {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] px-4 py-2.5 text-sm font-semibold text-white shadow-md">
        <FaInstagram className="h-5 w-5 shrink-0" aria-hidden />
        {label}
      </span>
    );
  }
  if (id === "tiktok") {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-md">
        <FaTiktok className="h-5 w-5 shrink-0" aria-hidden />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-md">
      <FaWhatsapp className="h-5 w-5 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
