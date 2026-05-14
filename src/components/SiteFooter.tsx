import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import type { SocialMediaState, SocialPlatformId } from "../admin/types/socialMedia";
import { SOCIAL_MEDIA_DEFAULTS } from "../constants/socialMediaDefaults";
import { useI18n } from "../i18n/I18nProvider";
import { useSiteContent } from "../hooks/useSiteContent";

import Logo from "../assets/logo.png";

function whatsappHref(phone: string) {
  const t = String(phone).trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("//")) return `https:${t}`;
  const digits = t.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}`;
}

function webHref(raw: string) {
  let t = String(raw).trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("//")) return `https:${t}`;
  t = t.replace(/^\/+/, "");
  return `https://${t}`;
}

function socialEntryRaw(entry: SocialMediaState[SocialPlatformId] | undefined): string {
  if (!entry || typeof entry !== "object") return "";
  const o = entry as Record<string, unknown>;
  for (const k of ["value", "url", "link", "href"] as const) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

const FOOTER_SOCIAL_ORDER: { id: SocialPlatformId; Icon: typeof FaFacebook; label: string }[] = [
  { id: "facebook", Icon: FaFacebook, label: "Facebook" },
  { id: "instagram", Icon: FaInstagram, label: "Instagram" },
  { id: "whatsapp", Icon: FaWhatsapp, label: "WhatsApp" },
  { id: "tiktok", Icon: FaTiktok, label: "TikTok" }
];

function countRenderableSocialLinks(social: SocialMediaState): number {
  let n = 0;
  for (const { id } of FOOTER_SOCIAL_ORDER) {
    const entry = social[id];
    if (!entry?.enabled) continue;
    const raw = socialEntryRaw(entry);
    if (!raw) continue;
    const href = id === "whatsapp" ? whatsappHref(raw) : webHref(raw);
    if (href) n += 1;
  }
  return n;
}

/** Use API data when it yields at least one link; otherwise brand placeholders so the footer is never empty. */
function socialForFooter(remote: SocialMediaState | null): SocialMediaState {
  if (!remote) return SOCIAL_MEDIA_DEFAULTS;
  if (countRenderableSocialLinks(remote) === 0) return SOCIAL_MEDIA_DEFAULTS;
  return remote;
}

function FooterSocialRow({ social }: { social: SocialMediaState | null }) {
  const merged = socialForFooter(social);

  const links = FOOTER_SOCIAL_ORDER.map(({ id, Icon, label }) => {
    const entry = merged[id];
    if (!entry?.enabled) return null;
    const raw = socialEntryRaw(entry);
    if (!raw) return null;
    const href = id === "whatsapp" ? whatsappHref(raw) : webHref(raw);
    if (!href) return null;
    return (
      <a
        key={id}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-[#D4AF37] shadow-sm ring-2 ring-[#D4AF37]/40 transition hover:bg-[#D4AF37]/20 hover:text-white hover:ring-[#D4AF37]"
      >
        <Icon className="h-5 w-5" aria-hidden />
      </a>
    );
  }).filter(Boolean);

  if (links.length === 0) return null;

  return <div className="footer-social mb-4 flex flex-wrap gap-3">{links}</div>;
}

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
  const { settings, pages, socialMedia } = useSiteContent();
  const links = list<string>("footer.links");
  const serviceLinks = list<string>("footer.serviceLinks");
  const pageTitles = pages.map((page) => page.title).filter(Boolean);

  return (
    <footer className={`footer ${className}`.trim()} id="contact">
      <div className="container footer-top">
        <div>
          <FooterSocialRow social={socialMedia} />
          <img src={Logo} alt={"Logo "} className="h-12 w-auto mb-4 sm:h-14 sm:mb-5" />
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
