import { Mail, MapPin, Phone, Store } from "lucide-react";
import type { WebsiteSettings } from "../../types/websiteSettings";

type Props = {
  values: WebsiteSettings;
  errors: Partial<Record<keyof WebsiteSettings, string>>;
  onChange: (patch: Partial<WebsiteSettings>) => void;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20";

export default function StoreInformationCard({ values, errors, onChange }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:p-8">
      <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#1565C0]">
          <Store className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Store Information</h2>
          <p className="text-sm text-slate-500">Public details shown on your storefront and preview.</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="ws-store-name" className="block text-sm font-medium text-slate-700">
            Store name <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="ws-store-name"
              value={values.storeName}
              onChange={(e) => onChange({ storeName: e.target.value })}
              className={`${inputClass} ${errors.storeName ? "border-red-300 focus:ring-red-200" : ""}`}
              placeholder="HKGoldWater"
              autoComplete="organization"
            />
          </div>
          {errors.storeName && (
            <p className="mt-1 text-xs text-red-600">{errors.storeName}</p>
          )}
          <p className="mt-1 text-xs text-slate-400">Displayed in the header and preview.</p>
        </div>

        <div>
          <label htmlFor="ws-email" className="block text-sm font-medium text-slate-700">
            Email address <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="ws-email"
              type="email"
              value={values.email}
              onChange={(e) => onChange({ email: e.target.value })}
              className={`${inputClass} ${errors.email ? "border-red-300 focus:ring-red-200" : ""}`}
              placeholder="contact@hkgoldwater.com"
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          <p className="mt-1 text-xs text-slate-400">Customer inquiries are sent here.</p>
        </div>

        <div>
          <label htmlFor="ws-phone" className="block text-sm font-medium text-slate-700">
            Phone number
          </label>
          <div className="relative mt-1">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="ws-phone"
              type="tel"
              value={values.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              className={inputClass}
              placeholder="+213 0 555 123 456"
              autoComplete="tel"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">Include country code.</p>
        </div>

        <div>
          <label htmlFor="ws-address" className="block text-sm font-medium text-slate-700">
            Physical address
          </label>
          <div className="relative mt-1">
            <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <textarea
              id="ws-address"
              rows={3}
              value={values.address}
              onChange={(e) => onChange({ address: e.target.value })}
              className={`${inputClass} min-h-[96px] resize-y py-3 pl-10`}
              placeholder="Enter complete store address"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">Shown in footer and contact blocks.</p>
        </div>
      </div>
    </section>
  );
}
