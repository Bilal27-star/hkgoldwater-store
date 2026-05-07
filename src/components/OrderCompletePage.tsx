import { CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nProvider";

export default function OrderCompletePage() {
  const { t } = useI18n();
  const successMessage = useMemo(() => {
    const message = localStorage.getItem("checkout_success_message");
    if (message) {
      localStorage.removeItem("checkout_success_message");
      return message;
    }
    return "";
  }, []);
  return (
    <div className="min-h-[70vh] bg-[#f9fafb] px-6 py-16">
      <div className="mx-auto max-w-lg rounded-xl bg-white p-10 text-center shadow-md ring-1 ring-gray-100">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#22C55E]/15 text-[#22C55E]">
          <CheckCircle2 className="h-9 w-9" strokeWidth={2} aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-[#0B3D91]">{t("orderComplete.title")}</h1>
        <p className="mt-3 text-gray-600">
          {t("orderComplete.text")}
        </p>
        {successMessage ? (
          <p className="mt-2 text-sm font-medium text-green-700">{successMessage}</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/products"
            className="inline-flex justify-center rounded-xl bg-gradient-to-r from-[#0B3D91] to-[#1565C0] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
          >
            {t("orderComplete.continueShopping")}
          </Link>
          <Link
            to="/"
            className="inline-flex justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-[#0B3D91] transition hover:bg-gray-50"
          >
            {t("orderComplete.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
