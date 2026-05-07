import { Eye, Mail, MapPin, Phone } from "lucide-react";
import type { WebsiteSettings } from "../../types/websiteSettings";

type Props = {
  settings: WebsiteSettings;
};

export default function WebsiteLivePreview({ settings }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-emerald-200/80 bg-white shadow-sm ring-1 ring-emerald-100">
      <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/90 px-5 py-3">
        <Eye className="h-5 w-5 text-emerald-700" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-900">Live preview</h2>
      </div>

      <div className="bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300">
          <div className="flex flex-col items-center border-b border-slate-100 pb-6">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt=""
                className="h-20 w-auto max-w-[200px] object-contain"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-400">
                Logo
              </div>
            )}
            <p className="mt-4 text-center text-lg font-bold text-slate-900">
              {settings.storeName || "Store name"}
            </p>
          </div>

          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#1565C0]" aria-hidden />
              <span className="break-all">{settings.email || "—"}</span>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#1565C0]" aria-hidden />
              <span>{settings.phone || "—"}</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1565C0]" aria-hidden />
              <span className="whitespace-pre-wrap">{settings.address || "—"}</span>
            </li>
          </ul>

          <p className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-500">
            {settings.footerText || "Footer text"}
          </p>
        </div>
      </div>
    </section>
  );
}
