import { Minus, Plus, X } from "lucide-react";
import type { CartItem } from "../../context/CartContext";
import { useI18n } from "../../i18n/I18nProvider";
import { onProductImageError } from "../../lib/productImageUrl";

function formatDa(value: number) {
  return `${value.toLocaleString("fr-DZ")} DA`;
}

type CartLineItemProps = {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
};

export default function CartLineItem({
  item,
  onRemove,
  onUpdateQuantity
}: CartLineItemProps) {
  const { t } = useI18n();
  const lineTotal = item.price * item.quantity;

  return (
    <article className="relative flex gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="absolute right-3 top-3 rounded-lg p-1 text-red-500 transition hover:bg-red-50 hover:text-red-600"
        aria-label={t("cart.remove", { name: item.name })}
      >
        <X className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>

      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
          onError={onProductImageError}
        />
      </div>

      <div className="min-w-0 flex-1 pr-8">
        <h3 className="font-semibold text-[#0B3D91]">{item.name}</h3>
        <p className="mt-1 text-sm text-gray-700">{formatDa(item.price)}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center gap-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center text-gray-700 transition hover:bg-gray-50"
              aria-label={t("cart.decreaseQty")}
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            >
              <Minus className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
            <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-gray-900">
              {item.quantity}
            </span>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center text-gray-700 transition hover:bg-gray-50"
              aria-label={t("cart.increaseQty")}
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
          <p className="text-sm text-gray-700">
            <span className="text-gray-500">{t("cart.subtotal")}</span>{" "}
            <span className="font-semibold text-gray-900">{formatDa(lineTotal)}</span>
          </p>
        </div>
      </div>
    </article>
  );
}
