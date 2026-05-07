import { Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "./ContactForm";
import ContactInfoCard from "./ContactInfoCard";
import { useSiteContent } from "../hooks/useSiteContent";
import SiteFooter from "./SiteFooter";
import { useI18n } from "../i18n/I18nProvider";

export default function ContactPage() {
  const { t } = useI18n();
  const { settings } = useSiteContent();
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
      <section className="mx-auto w-full max-w-7xl flex-1 px-6 pb-16 pt-10 sm:px-8 lg:px-12 lg:pb-24 lg:pt-14">
        <header className="mx-auto mb-12 max-w-2xl text-center lg:mb-14">
          <h1 className="text-3xl font-bold tracking-tight text-[#0B3D91] md:text-4xl">
            {t("contactPage.title")}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-gray-600 md:text-lg">
            {t("contactPage.subtitle")}
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-12">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <ContactInfoCard icon={Phone} title={t("contactPage.phoneTitle")}>
              <p className="font-medium text-gray-900">{settings.phone || "—"}</p>
              <p className="text-gray-500">{t("contactPage.phoneHours")}</p>
            </ContactInfoCard>
            <ContactInfoCard icon={Mail} title={t("contactPage.emailTitle")}>
              <p className="font-medium text-gray-900">{settings.email || "—"}</p>
              <p className="text-gray-500">{t("contactPage.emailHint")}</p>
            </ContactInfoCard>
            <ContactInfoCard icon={MapPin} title={t("contactPage.addressTitle")}>
              <p className="font-medium text-gray-900">{settings.address || "—"}</p>
            </ContactInfoCard>
          </div>

          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </section>

      <SiteFooter className="mt-auto" />
    </div>
  );
}
