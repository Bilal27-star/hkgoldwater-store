import type { ImgHTMLAttributes } from "react";

export type LogoVariant = "gold" | "dark" | "light";

const LOGO_SRC: Record<LogoVariant, string> = {
  gold: "/logo1.png",
  dark: "/logo1.png",
  light: "/logo1.png"
};

const DEFAULT_SIZE = "h-9 md:h-10 w-auto object-contain";
const HOVER = "transition-transform duration-300 hover:scale-105";

export type LogoProps = {
  variant: LogoVariant;
  /** When `false`, `DEFAULT_SIZE` is omitted so `className` can provide full sizing (e.g. auth cards). */
  useDefaultSize?: boolean;
  className?: string;
  alt?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "alt" | "className" | "src">;

export default function Logo({
  variant,
  useDefaultSize = true,
  className = "",
  alt = "HKGoldWater",
  width = 256,
  height = 256,
  decoding = "async",
  loading = "lazy",
  ...rest
}: LogoProps) {
  const sizePart = useDefaultSize ? DEFAULT_SIZE : "";
  return (
    <img
      {...rest}
      src={LOGO_SRC[variant]}
      alt={alt}
      width={width}
      height={height}
      decoding={decoding}
      loading={loading}
      className={[sizePart, HOVER, className].filter(Boolean).join(" ").trim()}
    />
  );
}
