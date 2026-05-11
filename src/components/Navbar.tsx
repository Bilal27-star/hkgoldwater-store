import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe, Menu, ShoppingCart, User, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useSiteContent } from "../hooks/useSiteContent";
import { STORE_CATEGORIES } from "../constants/catalog";
import Logo from "../assets/logo.png";
import { useI18n } from "../i18n/I18nProvider";

type NavItem = {
  label: string;
  to: string | { pathname: string; hash?: string };
  isActive: (pathname: string, hash: string) => boolean;
};

const NAV_LINKS: Omit<NavItem, "label">[] = [
  {
    to: "/",
    isActive: (pathname) => pathname === "/"
  },
  {
    to: "/products",
    isActive: (pathname) => pathname === "/products"
  },
  {
    to: "/contact",
    isActive: (pathname) => pathname === "/contact"
  }
];

export default function Navbar() {
  const { totalItems } = useCart();
  const { language, setLanguage, t } = useI18n();
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();
  const { settings } = useSiteContent();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const { pathname, hash } = useLocation();
  const categories = STORE_CATEGORIES.map((category) => ({
    slug: category.slug,
    label: t(category.labelKey)
  }));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(target)) {
        setCategoriesOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(target)) {
        setMobileCategoriesOpen(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(target)) {
        setLanguageOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setCategoriesOpen(false);
    setMobileCategoriesOpen(false);
    setLanguageOpen(false);
  }, [pathname, hash]);

  useEffect(() => {
    console.log("navbar auth state", {
      isAuthenticated,
      hasToken: !!token,
      userId: user?.id
    });
  }, [isAuthenticated, token, user?.id]);

  function resolveProfileTarget(): string {
    return isAuthenticated ? "/profile" : "/login";
  }

  const languageLabel =
    language === "fr"
      ? t("common.languageFrench")
      : language === "ar"
        ? t("common.languageArabic")
        : t("common.languageEnglish");

  return (
    <header className="sticky top-0 z-50 border-b border-[#0B3D91]/10 bg-white/95 shadow-[0_2px_12px_rgba(0,0,0,0.05)] backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-6 sm:h-16 sm:px-8 lg:px-12">
        <Link to="/" className="flex shrink-0 items-center p-0" aria-label={settings.storeName || t("common.home")}>
          {/* <Logo variant="gold" loading="eager" alt={settings.storeName || "HKGoldWater"} /> */}
          <img src={Logo} alt={"sasa"} className="h-10 w-auto" />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center gap-7 lg:flex" aria-label="Main">
          <Link
            to="/"
            className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
              pathname === "/"
                ? "border-[#D4AF37] text-[#0B3D91]"
                : "border-transparent text-[#3a4b60] hover:text-[#0B3D91]"
            }`}
          >
            {t("common.home")}
          </Link>

          <div
            className="relative"
            ref={desktopDropdownRef}
            onMouseEnter={() => setCategoriesOpen(true)}
            onMouseLeave={() => setCategoriesOpen(false)}
          >
            <button
              type="button"
              className={`inline-flex items-center gap-1 border-b-2 pb-2 text-sm font-medium transition-colors ${
                pathname === "/products"
                  ? "border-[#D4AF37] text-[#0B3D91]"
                  : "border-transparent text-[#3a4b60] hover:text-[#0B3D91]"
              }`}
              onClick={() => setCategoriesOpen((prev) => !prev)}
              aria-expanded={categoriesOpen}
              aria-haspopup="menu"
            >
              {t("nav.categories")}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  categoriesOpen ? "rotate-180" : "rotate-0"
                }`}
                strokeWidth={2}
                aria-hidden
              />
            </button>

            <div
              className={`absolute top-full mt-3 w-[260px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl transition-all duration-200 ${
                categoriesOpen
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              } z-50`}
              role="menu"
            >
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/products?category=${category.slug}`}
                  className="block border-l-4 border-transparent px-5 py-3 text-[15px] font-medium text-gray-700 transition-all duration-200 hover:border-[#D4AF37] hover:bg-[#0B3D91]/5 hover:pl-6 hover:text-[#0B3D91]"
                  role="menuitem"
                  onClick={() => setCategoriesOpen(false)}
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </div>

          {NAV_LINKS.slice(1).map((link, index) => {
            const active = link.isActive(pathname, hash);
            const label = index === 0 ? t("common.products") : t("common.contact");
            return (
              <Link
                key={label}
                to={link.to}
                className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-[#D4AF37] text-[#0B3D91]"
                    : "border-transparent text-[#3a4b60] hover:text-[#0B3D91]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-2.5 sm:gap-3">
          <input
            type="search"
            placeholder={t("common.searchProducts")}
            className="hidden h-12 w-[min(320px,36vw)] shrink rounded-[14px] border-2 border-[#e4ebf4] bg-[#f8fbff] px-3.5 text-sm text-[#1e2b3c] outline-none placeholder:text-[#6b7a8d] focus:border-[#1565C0] md:block"
            aria-label={t("common.searchProducts")}
          />
          <div className="relative" ref={languageDropdownRef}>
            <button
              type="button"
              onClick={() => setLanguageOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={languageOpen}
              aria-label={t("common.language")}
              className="inline-flex h-11 w-[126px] shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-[#f4f7fc] px-3 text-sm font-medium text-[#0B3D91] transition hover:bg-[#e8eef8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1565C0]"
            >
              <Globe className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              <span className="truncate">{languageLabel}</span>
            </button>

            {languageOpen ? (
              <div
                role="menu"
                aria-label={t("common.language")}
                className="absolute right-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
              >
                {[
                  { code: "en", label: t("common.languageEnglish") },
                  { code: "fr", label: t("common.languageFrench") },
                  { code: "ar", label: t("common.languageArabic") }
                ].map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setLanguage(option.code as "en" | "fr" | "ar");
                      setLanguageOpen(false);
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                      language === option.code ? "bg-slate-100 text-[#0B3D91]" : "text-slate-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              const target = resolveProfileTarget();
              console.log("profile navigation triggered", { target });
              console.log("navbar auth state", {
                isAuthenticated,
                hasToken: !!token,
                userId: user?.id
              });
              setMobileOpen(false);
              navigate(target);
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f7fc] text-[#0B3D91] transition hover:bg-[#e8eef8]"
            aria-label={t("common.account")}
          >
            <User className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>

          <Link
            to="/cart"
            onClick={() => setMobileOpen(false)}
            className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f7fc] text-[#0B3D91] transition hover:bg-[#e8eef8]"
            aria-label={t("common.cart")}
          >
            <ShoppingCart
              className="h-5 w-5 transition-transform duration-200 group-hover:scale-105"
              strokeWidth={2}
              aria-hidden
            />
            {totalItems > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[10px] font-semibold tabular-nums leading-none text-white ring-2 ring-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f7fc] text-[#0B3D91] transition hover:bg-[#e8eef8] lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
            )}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-[#0B3D91]/10 bg-white px-6 py-4 lg:hidden"
        >
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            <Link
              to="/"
              className={`text-sm font-medium ${pathname === "/" ? "text-[#0B3D91]" : "text-[#3a4b60]"}`}
              onClick={() => setMobileOpen(false)}
            >
              {t("common.home")}
            </Link>

            <div className="rounded-xl border border-gray-200" ref={mobileDropdownRef}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[#3a4b60]"
                onClick={() => setMobileCategoriesOpen((prev) => !prev)}
                aria-expanded={mobileCategoriesOpen}
              >
                {t("nav.categories")}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    mobileCategoriesOpen ? "rotate-180" : "rotate-0"
                  }`}
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  mobileCategoriesOpen ? "max-h-80" : "max-h-0"
                }`}
              >
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    to={`/products?category=${category.slug}`}
                    className="block border-l-4 border-transparent px-5 py-3 text-[15px] font-medium text-gray-700 transition-all duration-200 hover:border-[#D4AF37] hover:bg-[#0B3D91]/5 hover:pl-6 hover:text-[#0B3D91]"
                    onClick={() => {
                      setMobileCategoriesOpen(false);
                      setMobileOpen(false);
                    }}
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
            </div>

            {NAV_LINKS.slice(1).map((link, index) => {
              const active = link.isActive(pathname, hash);
              const label = index === 0 ? t("common.products") : t("common.contact");
              return (
                <Link
                  key={label}
                  to={link.to}
                  className={`text-sm font-medium ${
                    active ? "text-[#0B3D91]" : "text-[#3a4b60]"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <input
            type="search"
            placeholder={t("common.searchProducts")}
            className="mt-4 h-12 w-full rounded-[14px] border-2 border-[#e4ebf4] bg-[#f8fbff] px-3.5 text-sm outline-none md:hidden"
            aria-label={t("common.searchProducts")}
          />
        </div>
      ) : null}
    </header>
  );
}
