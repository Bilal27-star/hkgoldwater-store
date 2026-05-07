import { Info } from "lucide-react";

const STEPS = [
  "Toggle the switch to enable or disable each platform.",
  "Enter the complete URL for Facebook, Instagram, and TikTok.",
  "For WhatsApp, enter your business number with country code (+213).",
  "Disabled links will not appear on your website.",
  'Click "Save All Changes" when you\'re ready to publish.'
];

export default function SocialQuickGuide() {
  return (
    <section className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm ring-1 ring-blue-50">
      <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50/90 px-5 py-3">
        <Info className="h-5 w-5 text-[#1565C0]" aria-hidden />
        <h2 className="text-sm font-semibold text-[#0B3D91]">Quick guide</h2>
      </div>
      <ol className="space-y-3 p-5 md:p-6">
        {STEPS.map((text, i) => (
          <li
            key={i}
            className="flex gap-4 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-700"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1565C0] text-xs font-bold text-white">
              {i + 1}
            </span>
            <span className="pt-0.5 leading-relaxed">{text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
