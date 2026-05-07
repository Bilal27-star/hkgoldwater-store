import { FileText } from "lucide-react";
import type { WebsiteSettings } from "../../types/websiteSettings";

type Props = {
  value: WebsiteSettings["footerText"];
  onChange: (footerText: string) => void;
};

export default function FooterCopyrightField({ value, onChange }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-lg font-semibold text-slate-900">Footer copyright</h2>
      <p className="mt-1 text-sm text-slate-500">Shown at the bottom of your storefront.</p>
      <div className="relative mt-4">
        <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="ws-footer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20"
          placeholder="© 2026 HKGoldWater. All rights reserved."
        />
      </div>
    </section>
  );
}
