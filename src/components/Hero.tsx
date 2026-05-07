import { ShoppingCart } from "lucide-react";
import heroBackground from "../imports/Frame51135/f4725104622d6d9ee0bd761236b07bc5d4e5ffe9.png";
import { useI18n } from "../i18n/I18nProvider";

export default function Hero() {
  const { t } = useI18n();
  return (
    <section
      id="home"
      className="relative isolate min-h-[560px] w-full overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0B3D91]/95 via-[#1565C0]/80 to-transparent"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex min-h-[560px] w-full max-w-7xl items-center px-6 py-16 sm:px-8 lg:px-12">
        <div className="max-w-xl text-left">
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            {t("hero.title")}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/90 sm:text-lg">
            {t("hero.subtitle")}
          </p>
          <div className="mt-6 pt-1">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-[#0B3D91] shadow-[0_14px_40px_-12px_rgba(0,0,0,0.35)] transition hover:bg-white/95 hover:shadow-[0_18px_44px_-14px_rgba(0,0,0,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
            >
              <ShoppingCart className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              {t("hero.cta")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
