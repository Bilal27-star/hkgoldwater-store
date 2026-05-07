import { ShieldCheck } from "lucide-react";
import type { AuthUser } from "../../context/AuthContext";
import { getInitials } from "./profileUtils";

type Props = {
  user: AuthUser | null;
};

export default function ProfileDashboardHeader({ user }: Props) {
  const initials = getInitials(user?.name, user?.email);
  const memberLabel =
    user?.createdAt != null && user.createdAt !== ""
      ? new Date(user.createdAt).toLocaleDateString("fr-DZ", {
          month: "long",
          year: "numeric"
        })
      : null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#e4ebf4] bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4fc] p-8 shadow-[0_8px_40px_-12px_rgba(11,61,145,0.15)] transition-shadow duration-300 hover:shadow-[0_12px_48px_-12px_rgba(11,61,145,0.2)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#0B3D91]/5 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[#D4AF37]/10 blur-3xl" aria-hidden />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B3D91] to-[#1565C0] text-2xl font-bold tracking-tight text-white shadow-lg ring-4 ring-white/80"
            aria-hidden
          >
            {initials}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-[#0B3D91] md:text-3xl">
              {user?.name?.trim() || "Welcome"}
            </h1>
            <p className="mt-1 text-sm text-gray-600">{user?.email ?? "—"}</p>
            {memberLabel ? (
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                Member since {memberLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#0B3D91] shadow-sm ring-1 ring-[#0B3D91]/15 transition hover:bg-white">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#D4AF37]" strokeWidth={2} aria-hidden />
            Verified customer
          </span>
          <span className="rounded-full bg-[#0B3D91]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0B3D91] ring-1 ring-[#0B3D91]/20">
            {user?.role === "customer" || !user?.role ? "Customer" : user.role}
          </span>
        </div>
      </div>
    </section>
  );
}
