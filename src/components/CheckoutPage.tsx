import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Check,
  CircleCheck,
  Home,
  MapPin,
  Phone,
  ShieldCheck,
  User
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useI18n } from "../i18n/I18nProvider";
import SiteFooter from "./SiteFooter";
import { createOrderApi, getToken } from "../api";
import { onProductImageError } from "../lib/productImageUrl";

type CheckoutForm = {
  fullName: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
};

type CheckoutOrderPayload = {
  items: Array<{ product_id: string; quantity: number; price: number }>;
  shipping_address: {
    fullName: string;
    phone: string;
    wilaya: string;
    commune: string;
    address: string;
  };
  total_amount: number;
};

function formatDa(value: number) {
  return `${value.toLocaleString("fr-DZ")} DA`;
}
const WILAYAS = [
  "أدرار",
  "الشلف",
  "الأغواط",
  "أم البواقي",
  "باتنة",
  "بجاية",
  "بسكرة",
  "بشار",
  "البليدة",
  "البويرة",
  "تمنراست",
  "تبسة",
  "تلمسان",
  "تيارت",
  "تيزي وزو",
  "الجزائر",
  "الجلفة",
  "جيجل",
  "سطيف",
  "سعيدة",
  "سكيكدة",
  "سيدي بلعباس",
  "عنابة",
  "قالمة",
  "قسنطينة",
  "المدية",
  "مستغانم",
  "المسيلة",
  "معسكر",
  "ورقلة",
  "وهران",
  "البيض",
  "إليزي",
  "برج بوعريريج",
  "بومرداس",
  "الطارف",
  "تندوف",
  "تيسمسيلت",
  "الوادي",
  "خنشلة",
  "سوق أهراس",
  "تيبازة",
  "ميلة",
  "عين الدفلى",
  "النعامة",
  "عين تموشنت",
  "غرداية",
  "غليزان",
  "تيميمون",
  "برج باجي مختار",
  "أولاد جلال",
  "بني عباس",
  "عين صالح",
  "عين قزام",
  "تقرت",
  "جانت",
  "المغير",
  "المنيعة",
  "تيمياوين"
];

type FieldShellProps = {
  icon: LucideIcon;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
};

function FieldShell({ icon: Icon, label, required, error, children }: FieldShellProps) {
  return (
    <div className="flex gap-3">
      <Icon
        className="mt-2.5 h-5 w-5 shrink-0 text-gray-400"
        strokeWidth={2}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <label className="mb-1.5 block text-sm font-medium text-gray-800">
          {label}
          {required ? (
            <span className="text-red-500" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
        </label>
        {children}
        {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/25";

function CheckoutStepper() {
  const { t } = useI18n();
  return (
    <div className="mb-10 flex flex-wrap items-center justify-center gap-2 md:gap-4">
      <div className="flex items-center gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#22C55E] text-white shadow-sm"
          aria-hidden
        >
          <Check className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-semibold text-[#22C55E] md:text-base">{t("checkout.stepCart")}</span>
      </div>

      <div className="hidden h-0.5 w-12 bg-[#1565C0] sm:block md:w-20" aria-hidden />

      <div className="flex items-center gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1565C0] text-sm font-bold text-white shadow-sm ring-4 ring-[#1565C0]/15"
          aria-current="step"
        >
          2
        </div>
        <span className="text-sm font-bold text-[#0B3D91] md:text-base">{t("checkout.stepCheckout")}</span>
      </div>

      <div className="hidden h-0.5 w-12 bg-gray-200 sm:block md:w-20" aria-hidden />

      <div className="flex items-center gap-2 opacity-90">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-500">
          3
        </div>
        <span className="text-sm font-medium text-gray-500 md:text-base">{t("checkout.stepComplete")}</span>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { t } = useI18n();
  const { items, clearCart, ensureServerCartForCheckout } = useCart();

  const [form, setForm] = useState<CheckoutForm>({
    fullName: "",
    phone: "",
    wilaya: "",
    commune: "",
    address: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [items]
  );
  const total = subtotal;

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = t("validation.fullNameRequired");
    if (!form.phone.trim()) next.phone = t("validation.phoneRequired");
    if (!form.wilaya) next.wilaya = t("checkout.selectWilaya");
    if (!form.commune) next.commune = t("checkout.selectCommune");
    if (!form.address.trim()) next.address = t("checkout.address");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitError("");

    if (!getToken()) {
      setSubmitError("Please login to complete your order");
      return;
    }

    const cartItems = items;
    if (!cartItems || cartItems.length === 0) {
      alert("Cart is empty");
      return;
    }

    const total_amount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    if (!Number.isFinite(total_amount) || total_amount <= 0) {
      setSubmitError("Invalid order total");
      return;
    }

    const orderPayload: CheckoutOrderPayload = {
      items: cartItems.map((item) => ({
        product_id: String(
          item.id || (item as { product_id?: string }).product_id || ""
        ).trim(),
        quantity: item.quantity,
        price: item.price
      })),
      shipping_address: {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        wilaya: form.wilaya.trim(),
        commune: form.commune.trim(),
        address: form.address.trim()
      },
      total_amount
    };

    try {
      await ensureServerCartForCheckout();
      const data = (await createOrderApi(orderPayload)) as { id?: string };
      if (data?.id) {
        sessionStorage.setItem("checkout_order_id", String(data.id));
      }
      clearCart();
      window.location.href = "/order-success";
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to place order");
    }
  }

  return (
    <div className="bg-[#f9fafb] pb-16">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <CheckoutStepper />

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Delivery */}
              <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1565C0]/10 text-[#1565C0]">
                    <User className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0B3D91]">
                    {t("checkout.deliveryInfo")}
                  </h2>
                </div>

                <div className="space-y-5">
                  <FieldShell icon={User} label={t("checkout.fullName")} required error={errors.fullName}>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                      placeholder={t("auth.fullNamePlaceholder")}
                      className={inputClass}
                      autoComplete="name"
                    />
                  </FieldShell>

                  <FieldShell icon={Phone} label={t("checkout.phoneNumber")} required error={errors.phone}>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder={t("auth.phonePlaceholder")}
                      className={inputClass}
                      autoComplete="tel"
                    />
                  </FieldShell>

                  <div className="flex gap-3">
                    <MapPin
                      className="mt-2.5 h-5 w-5 shrink-0 text-gray-400"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-800">
                          {t("checkout.wilaya")}<span className="text-red-500"> *</span>
                        </label>
                        <select
                          name="wilaya"
                          value={form.wilaya}
                          onChange={(e) => {
                            setForm((f) => ({ ...f, wilaya: e.target.value, commune: "" }));
                          }}
                          className={inputClass}
                        >
                          <option value="">{t("checkout.selectWilaya")}</option>
                          {WILAYAS.map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </select>
                        {errors.wilaya ? (
                          <p className="mt-1 text-sm text-red-600">{errors.wilaya}</p>
                        ) : null}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-800">
                          {t("checkout.commune")}<span className="text-red-500"> *</span>
                        </label>
                        <input
                          type="text"
                          name="commune"
                          value={form.commune}
                          onChange={(e) => setForm((f) => ({ ...f, commune: e.target.value }))}
                          placeholder="أدخل البلدية"
                          className={inputClass}
                        />
                        {errors.commune ? (
                          <p className="mt-1 text-sm text-red-600">{errors.commune}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <FieldShell icon={Home} label={t("checkout.address")} required error={errors.address}>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder={t("checkout.addressPlaceholder")}
                      rows={4}
                      className={`${inputClass} min-h-[120px] resize-y`}
                      autoComplete="street-address"
                    />
                  </FieldShell>
                </div>
              </section>

              {/* Payment */}
              <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Banknote className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0B3D91]">{t("checkout.paymentMethod")}</h2>
                </div>

                <div
                  className="flex gap-4 rounded-xl border-2 border-[#1565C0] bg-[#1565C0]/5 p-4"
                  role="radiogroup"
                  aria-label={t("checkout.paymentMethod")}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#1565C0] shadow-sm">
                    <Banknote className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t("checkout.cashOnDelivery")}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {t("checkout.payOnReceive")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
                  <ShieldCheck
                    className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <p>
                    {t("checkout.paymentHint")}
                  </p>
                </div>
              </section>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <aside className="lg:sticky lg:top-[72px]">
                <div className="rounded-xl bg-white p-6 shadow-md ring-1 ring-gray-100">
                  <h2 className="text-lg font-semibold text-[#0B3D91]">{t("checkout.orderSummary")}</h2>

                  <ul className="mt-6 space-y-4 border-b border-gray-100 pb-6">
                    {items.map((item) => (
                      <li key={item.id} className="flex gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <img
                            src={item.image}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={onProductImageError}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold leading-snug text-gray-900">
                            {item.name}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">{t("checkout.qty")}: {item.quantity}</p>
                          <p className="mt-1 text-sm font-semibold text-[#1565C0]">
                            {formatDa(item.price * item.quantity)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-6 space-y-3 text-sm">
                    <div className="flex justify-between text-gray-700">
                      <dt>{t("cart.subtotal").replace(":", "")}</dt>
                      <dd className="font-medium text-gray-900">{formatDa(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <dt>{t("cart.shipping")}</dt>
                      <dd className="font-semibold text-[#22C55E]">{t("checkout.shippingFree")}</dd>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-4 text-base font-bold text-[#0B3D91]">
                      <dt>{t("cart.total")}</dt>
                      <dd>{formatDa(total)}</dd>
                    </div>
                  </dl>

                  <button
                    type="submit"
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B3D91] to-[#1565C0] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91]"
                  >
                    <CircleCheck className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                    {t("checkout.confirmOrder")}
                  </button>

                  <p className="mt-4 text-center text-xs text-gray-500">
                    {t("checkout.terms")}
                  </p>
                  {submitError ? (
                    <p className="mt-3 text-center text-sm text-red-600" role="alert">
                      {submitError}
                    </p>
                  ) : null}
                </div>
              </aside>
            </div>
          </div>
        </form>
      </div>

      <SiteFooter className="mt-16" />
    </div>
  );
}
