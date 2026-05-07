import { Tag } from "lucide-react";
import { useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";

export default function CartPromoCode() {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0B3D91]">
        <Tag className="h-4 w-4 text-[#1565C0]" strokeWidth={2} aria-hidden />
        {t("cart.promoCode")}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setApplied(false);
          }}
          placeholder={t("cart.promoPlaceholder")}
          className="min-h-[44px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20"
        />
        <button
          type="button"
          className="shrink-0 rounded-lg bg-[#0B3D91] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#083072]"
          onClick={() => code.trim() && setApplied(true)}
        >
          {t("cart.apply")}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {applied && code.trim().toUpperCase() === "SAVE10"
          ? t("cart.promoApplied")
          : t("cart.promoTry")}
      </p>
    </div>
  );
}
