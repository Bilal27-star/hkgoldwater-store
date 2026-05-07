import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useI18n } from "../i18n/I18nProvider";

export type ProductItem = {
  id: string;
  brand: string;
  title: string;
  category_id?: string | null;
  rating: number;
  reviewCount: number;
  price: number;
  imageUrl: string;
};

type ProductCardProps = {
  product: ProductItem;
};

function formatDa(value: number) {
  return `${value.toLocaleString("fr-DZ")} DA`;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { t } = useI18n();
  const navigate = useNavigate();

  console.log("[ProductCard] product:", product);

  function openProductDetails() {
    if (!product?.id) {
      console.warn("[ProductCard] missing product.id, navigation skipped", product);
      return;
    }
    navigate(`/product/${product.id}`);
  }

  return (
    <article
      className="group flex cursor-pointer flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
      onClick={openProductDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProductDetails();
        }
      }}
      role="link"
      tabIndex={0}
    >
      <div className="mb-4 block overflow-hidden rounded-xl bg-gray-100">
        <img
          src={product.imageUrl}
          alt=""
          className="aspect-square h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <p className="mb-1 text-xs text-gray-500">{product.brand}</p>
      <p className="mb-2 line-clamp-2 text-base font-semibold leading-snug text-gray-900 transition group-hover:text-[#0B3D91]">
        {product.title}
      </p>
      <p className="mb-3 text-sm text-gray-700">
        <span className="text-[#D4AF37]" aria-hidden>
          ★
        </span>{" "}
        {product.rating}{" "}
        <span className="text-gray-500">({product.reviewCount})</span>
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <span className="text-lg font-bold text-[#0B3D91]">{formatDa(product.price)}</span>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1565C0] px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:scale-105 hover:bg-[#1257a8]"
          onClick={(e) => {
            e.stopPropagation();
            addToCart({
              id: product.id,
              name: product.title,
              price: product.price,
              image: product.imageUrl
            });
          }}
        >
          <ShoppingCart className="h-4 w-4" strokeWidth={2} aria-hidden />
          {t("productCard.add")}
        </button>
      </div>
    </article>
  );
}
