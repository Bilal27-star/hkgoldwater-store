export type BrandLogoVariant = "header" | "auth" | "admin" | "adminAuth";

const variantClass: Record<BrandLogoVariant, string> = {
  header:
    "h-9 w-auto max-h-[42px] max-w-[min(200px,42vw)] sm:h-11 sm:max-h-[50px] sm:max-w-[220px]",
  auth: "h-14 w-auto max-h-[60px] sm:h-[4.25rem] sm:max-h-[70px] max-w-[240px]",
  admin:
    "h-8 w-auto max-h-[36px] max-w-[140px] sm:max-h-[40px] sm:max-w-[160px]",
  adminAuth:
    "mx-auto h-14 w-auto max-h-[56px] sm:h-16 sm:max-h-[68px] max-w-[200px]"
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
      src="/logo.png"
      alt={alt}
      width={256}
      height={256}
      decoding="async"
      loading={loading}
      className={`block shrink-0 object-contain object-left ${variantClass[variant]} ${className}`}
    />
  );
}
