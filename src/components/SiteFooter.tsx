import { useI18n } from "../i18n/I18nProvider";
import { useSiteContent } from "../hooks/useSiteContent";
import Logo from "./ui/Logo";

type Props = {
  /** e.g. `mt-16`, `mt-auto` — pages control vertical spacing */
  className?: string;
};

/**
 * Shared marketing footer — uses global `.footer` styles from App.css.
 * Logo: `logo-light.svg` on dark footer only.
 */
export default function SiteFooter({ className = "" }: Props) {
  const { t, list } = useI18n();
  const { settings, pages } = useSiteContent();
  const links = list<string>("footer.links");
  const serviceLinks = list<string>("footer.serviceLinks");
  const pageTitles = pages.map((page) => page.title).filter(Boolean);

  return (
    <footer className={`footer ${className}`.trim()} id="contact">
      <div className="container footer-top">
        <div>
          <div className="mb-4 sm:mb-5">
            <Logo variant="light" alt="" />
          </div>
          <p>
            {settings.storeName || t("footer.description")}
          </p>
        </div>

        <div>
          <h5>{t("footer.quickLinks")}</h5>
          <ul>
            {(pageTitles.length > 0 ? pageTitles : links).map((link) => (
              <li key={link}>{link}</li>
            ))}
          </ul>
        </div>

        <div>
          <h5>{t("footer.customerService")}</h5>
          <ul>
            {serviceLinks.map((link) => (
              <li key={link}>{link}</li>
            ))}
          </ul>
        </div>

        <div>
          <h5>{t("footer.contactInfo")}</h5>
          <ul>
            <li>{settings.address || t("footer.address")}</li>
            <li>{settings.phone || t("footer.phone")}</li>
            <li>{settings.email || t("footer.email")}</li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">{settings.footerText || t("footer.copyright")}</div>
    </footer>
  );
}
