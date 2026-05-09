import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  UserPlus
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import SiteFooter from "./SiteFooter";
import { useI18n } from "../i18n/I18nProvider";
import { getErrorMessage, registerApi } from "../api";

type RegisterMode = "phone" | "email";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputShell =
  "w-full rounded-lg border border-gray-300 bg-white py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/25";

export default function RegisterPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<RegisterMode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isFormValid =
    !!fullName.trim() &&
    !(
      (mode === "email" && !email.trim()) ||
      (mode === "phone" && !phone.trim()) ||
      !password
    );

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!fullName.trim()) next.fullName = t("validation.fullNameRequired");

    if (mode === "email") {
      const v = email.trim();
      if (!v) next.email = t("validation.emailRequired");
      else if (!emailRegex.test(v)) next.email = t("validation.emailInvalid");
    } else {
      const digits = phone.replace(/\D/g, "");
      if (!phone.trim()) next.phone = t("validation.phoneRequired");
      else if (digits.length < 8) next.phone = t("validation.phoneInvalid");
    }

    if (!password) next.password = t("validation.passwordRequired");
    else if (password.length < 8)
      next.password = t("validation.passwordShort");

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitError("");
    setSubmitSuccess("");
    if (
      !fullName.trim() ||
      (mode === "email" && !email.trim()) ||
      (mode === "phone" && !phone.trim()) ||
      !password
    ) {
      setSubmitError("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const name = fullName.trim();
      const payload = {
        name,
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        password
      };
      console.log("REGISTER PAYLOAD:", payload);
      await registerApi(payload);
      setSubmitSuccess("Account created successfully. You can now log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      setSubmitError(getErrorMessage(err, "Registration failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-100">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6 flex justify-center">
              <BrandLogo variant="auth" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {t("auth.createAccount")}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {t("auth.registerSubtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="register-fullname"
                className="mb-1.5 block text-sm font-medium text-gray-800"
              >
                {t("auth.fullName")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  strokeWidth={2}
                  aria-hidden
                />
                <input
                  id="register-fullname"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("auth.fullNamePlaceholder")}
                  className={`${inputShell} pl-10 pr-3`}
                  aria-invalid={!!errors.fullName}
                />
              </div>
              {errors.fullName ? (
                <p className="mt-1.5 text-xs text-red-600">{errors.fullName}</p>
              ) : null}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">
                {t("auth.loginUsing")} <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode("phone");
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.email;
                      return next;
                    });
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition duration-200 ${
                    mode === "phone"
                      ? "border-[#1565C0] bg-blue-50 text-[#0B3D91] shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Phone className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  {t("auth.phone")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("email");
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.phone;
                      return next;
                    });
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition duration-200 ${
                    mode === "email"
                      ? "border-[#1565C0] bg-blue-50 text-[#0B3D91] shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Mail className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  {t("auth.email")}
                </button>
              </div>
            </div>

            <div
              key={mode}
              className="space-y-4 transition-opacity duration-200"
            >
              {mode === "phone" ? (
                <div>
                  <label className="sr-only" htmlFor="register-phone">
                    {t("auth.phoneNumber")}
                  </label>
                  <div className="relative">
                    <Phone
                      className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <input
                      id="register-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("auth.phonePlaceholder")}
                      className={`${inputShell} pl-10 pr-3`}
                      aria-invalid={!!errors.phone}
                    />
                  </div>
                  {errors.phone ? (
                    <p className="mt-1.5 text-xs text-red-600">{errors.phone}</p>
                  ) : null}
                </div>
              ) : (
                <div>
                  <label className="sr-only" htmlFor="register-email">
                    {t("auth.email")}
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("auth.emailPlaceholder")}
                      className={`${inputShell} pl-10 pr-3`}
                      aria-invalid={!!errors.email}
                    />
                  </div>
                  {errors.email ? (
                    <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
                  ) : null}
                </div>
              )}

              <div>
                <label
                  htmlFor="register-password"
                  className="mb-1.5 block text-sm font-medium text-gray-800"
                >
                  {t("auth.password")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.enterPassword")}
                    className={`${inputShell} pl-10 pr-11`}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                    aria-label={showPassword ? t("common.passwordHide") : t("common.passwordShow")}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" strokeWidth={2} aria-hidden />
                    ) : (
                      <Eye className="h-5 w-5" strokeWidth={2} aria-hidden />
                    )}
                  </button>
                </div>
                {errors.password ? (
                  <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#0B3D91] focus:ring-[#0B3D91]"
                />
                {t("common.rememberMe")}
              </label>
              <Link
                to="/contact"
                className="font-medium text-[#1565C0] transition hover:text-[#0B3D91]"
              >
                {t("common.forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B3D91] to-[#1565C0] px-4 py-3.5 text-base font-semibold text-white shadow-sm transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
            >
              <UserPlus className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              {t("auth.createAccountButton")}
            </button>
            {submitError ? (
              <p className="text-sm text-red-600" role="alert">
                {submitError}
              </p>
            ) : null}
            {submitSuccess ? (
              <p className="text-sm text-emerald-600" role="status">
                {submitSuccess}
              </p>
            ) : null}
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="bg-white px-3 text-gray-400">{t("common.or")}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t("common.continueWithGoogle")}
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded bg-[#1877F2] text-xs font-bold text-white"
                aria-hidden
              >
                f
              </span>
              {t("common.continueWithFacebook")}
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            {t("auth.haveAccount")}{" "}
            <Link
              to="/login"
              className="font-semibold text-[#1565C0] transition hover:text-[#0B3D91]"
            >
              {t("common.login")}
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter className="mt-auto" />
    </div>
  );
}
