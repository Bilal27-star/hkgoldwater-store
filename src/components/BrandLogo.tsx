import Logo from "../assets/logo.png";

export type BrandLogoVariant = "header" | "auth" | "admin" | "adminAuth";

const variantClass: Record<BrandLogoVariant, string> = {
  header:
    "h-10 w-auto max-h-[46px] max-w-[min(220px,44vw)] sm:h-12 sm:max-h-[54px] sm:max-w-[240px]",
  auth: "h-16 w-auto max-h-[68px] sm:h-[4.5rem] sm:max-h-[76px] max-w-[260px]",
  admin:
    "h-9 w-auto max-h-[40px] max-w-[152px] sm:max-h-[44px] sm:max-w-[172px]",
  adminAuth:
    "mx-auto h-16 w-auto max-h-[62px] sm:h-[4.25rem] sm:max-h-[72px] max-w-[220px]"
};

type Props = {
  variant: BrandLogoVariant;
  className?: string;
  alt?: string;
};

/** Light-surface logo sizing only per variant. */
export default function BrandLogo({ variant, className = "", alt = "Logo" }: Props) {
  const loading = variant === "header" ? "eager" : "lazy";
  return (
    <img
      src={Logo}
      alt={alt}
      width={256}
      height={256}
      decoding="async"
      loading={loading}
      className={`block shrink-0 object-contain object-left ${variantClass[variant]} ${className}`}
    />
  );
}
