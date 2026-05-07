import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useCart } from "../context/CartContext";
import { useI18n } from "../i18n/I18nProvider";
import CartLineItem from "./cart/CartLineItem";
import CartOrderSummary from "./cart/CartOrderSummary";
import CartPromoCode from "./cart/CartPromoCode";
import SiteFooter from "./SiteFooter";

const SHIPPING_FLAT = 800;
const FREE_SHIPPING_AT = 20000;

export default function CartPage() {
  const { t } = useI18n();
  const { items, removeFromCart, updateQuantity, totalItems } = useCart();
  const cartItems = useMemo(
    () =>
      Array.isArray(items)
        ? items.filter((item) => item && typeof item.id === "string" && item.id.trim())
        : [],
    [items]
  );
  console.log("CART ITEMS:", cartItems);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_AT || subtotal === 0 ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] bg-[#f9fafb] px-6 py-16">
        <div className="mx-auto max-w-lg rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <h1 className="text-2xl font-bold text-[#0B3D91]">{t("cartPage.emptyTitle")}</h1>
          <p className="mt-2 text-gray-600">{t("cartPage.emptyText")}</p>
          <Link
            to="/products"
            className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-[#0B3D91] to-[#1565C0] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
          >
            {t("cartPage.goShopping")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9fafb] pb-16">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#0B3D91] md:text-4xl">
            {t("cartPage.title")}
          </h1>
          <p className="mt-2 text-gray-600">
            {totalItems} {totalItems === 1 ? t("cartPage.item") : t("cartPage.items")} {t("cartPage.inYourCart")}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="space-y-4 lg:col-span-2">
            {cartItems.map((item) => (
              <CartLineItem
                key={item.id}
                item={item}
                onRemove={removeFromCart}
                onUpdateQuantity={updateQuantity}
              />
            ))}
            <CartPromoCode />
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-[72px]">
              <CartOrderSummary subtotal={subtotal} shipping={shipping} total={total} />
            </div>
          </div>
        </div>
      </div>

      <SiteFooter className="mt-16" />
    </div>
  );
}
