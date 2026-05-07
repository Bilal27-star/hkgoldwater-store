import { KeyRound, LogOut, Shield } from "lucide-react";

type Props = {
  onLogout: () => void;
};

export default function ProfileSecuritySection({ onLogout }: Props) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_4px_24px_-8px_rgba(11,61,145,0.12)] ring-1 ring-gray-100 md:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4f7fc] text-[#0B3D91] ring-1 ring-[#0B3D91]/10">
          <Shield className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-[#0B3D91] md:text-xl">Security</h2>
          <p className="mt-0.5 text-sm text-gray-500">Protect your account and session.</p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="rounded-xl border border-dashed border-gray-200 bg-[#f8fbff] px-5 py-4 transition hover:border-[#0B3D91]/20">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-[#0B3D91]/70" strokeWidth={2} aria-hidden />
            <div>
              <p className="font-semibold text-gray-900">Password</p>
              <p className="mt-1 text-sm text-gray-600">
                Password changes will be available here in a future update. Use a strong, unique password for your Gold
                Water account.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50/80 px-5 py-3.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
          Log out
        </button>
      </div>
    </section>
  );
}
