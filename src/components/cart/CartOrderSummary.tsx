import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n/I18nProvider";

function formatDa(value: number) {
  return `${value.toLocaleString("fr-DZ")} DA`;
}

const FREE_SHIPPING_AT = 20000;

type CartOrderSummaryProps = {
  subtotal: number;
  shipping: number;
  total: number;
};

export default function CartOrderSummary({
  subtotal,
  shipping,
  total
}: CartOrderSummaryProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const amountForFree = Math.max(0, FREE_SHIPPING_AT - subtotal);
  const showFreeShippingBanner = subtotal > 0 && subtotal < FREE_SHIPPING_AT;

  return (
    <aside className="rounded-xl bg-white p-6 shadow-md ring-1 ring-gray-100">
      <h2 className="text-lg font-semibold text-[#0B3D91]">{t("cart.summary")}</h2>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between text-gray-700">
          <dt>{t("cart.subtotal").replace(":", "")}</dt>
          <dd className="font-medium text-gray-900">{formatDa(subtotal)}</dd>
        </div>
        <div className="flex justify-between text-gray-700">
          <dt>{t("cart.shipping")}</dt>
          <dd className="font-medium text-gray-900">{formatDa(shipping)}</dd>
        </div>
      </dl>

      {showFreeShippingBanner ? (
        <div className="mt-4 rounded-lg bg-[#1565C0]/10 px-3 py-2.5 text-sm text-[#1565C0]">
          {t("cart.freeShippingMore", { amount: formatDa(amountForFree) })}
        </div>
      ) : null}

      <div className="mt-6 flex justify-between border-t border-gray-200 pt-4 text-base font-bold text-[#0B3D91]">
        <span>{t("cart.total")}</span>
        <span>{formatDa(total)}</span>
      </div>

      <button
        type="button"
        onClick={() => navigate("/checkout")}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B3D91] to-[#1565C0] px-6 py-3.5 text-center text-base font-semibold text-white shadow-sm transition hover:brightness-95"
      >
        {t("cart.proceedCheckout")}
        <ArrowRight className="h-5 w-5" strokeWidth={2} aria-hidden />
      </button>

      <div className="mt-4 text-center">
        <Link
          to="/products"
          className="text-sm font-semibold text-[#1565C0] transition hover:text-[#0B3D91]"
        >
          {t("cart.continueShopping")}
        </Link>
      </div>
    </aside>
  );
}
