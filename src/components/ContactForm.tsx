import { Send } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20";

export default function ContactForm() {
  const { t } = useI18n();
  return (
    <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100 md:p-10 lg:p-12">
      <h2 className="mb-8 text-xl font-semibold tracking-tight text-[#0B3D91] md:text-2xl">
        {t("contactForm.title")}
      </h2>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
        }}
        noValidate
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              {t("contactForm.name")}
            </span>
            <input
              type="text"
              name="name"
              required
              placeholder={t("contactForm.namePlaceholder")}
              className={inputClass}
              autoComplete="name"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              {t("contactForm.email")}
            </span>
            <input
              type="email"
              name="email"
              required
              placeholder={t("contactForm.emailPlaceholder")}
              className={inputClass}
              autoComplete="email"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              {t("contactForm.phone")}
            </span>
            <input
              type="tel"
              name="phone"
              placeholder={t("contactForm.phonePlaceholder")}
              className={inputClass}
              autoComplete="tel"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              {t("contactForm.subject")}
            </span>
            <input
              type="text"
              name="subject"
              required
              placeholder={t("contactForm.subjectPlaceholder")}
              className={inputClass}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">
            {t("contactForm.message")}
          </span>
          <textarea
            name="message"
            required
            rows={5}
            placeholder={t("contactForm.messagePlaceholder")}
            className={`${inputClass} min-h-[140px] resize-y`}
          />
        </label>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1565C0] to-[#0B3D91] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:brightness-[0.92] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1565C0]"
        >
          <Send className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
          {t("contactForm.submit")}
        </button>
      </form>
    </div>
  );
}
