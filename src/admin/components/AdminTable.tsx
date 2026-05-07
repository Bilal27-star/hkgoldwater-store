import { Mail, Shield, Trash2, User } from "lucide-react";
import type { ManagedAdmin } from "../types/managedAdmin";

function RoleBadge({ role }: { role: ManagedAdmin["role"] }) {
  if (role === "main_admin") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800 ring-1 ring-violet-200/60">
        <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Main Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-200/60">
      <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Admin
    </span>
  );
}

function formatCreatedAt(isoDate: string) {
  const d = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type AdminTableProps = {
  admins: ManagedAdmin[];
  onRequestDelete: (admin: ManagedAdmin) => void;
};

export default function AdminTable({ admins, onRequestDelete }: AdminTableProps) {
  if (admins.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <User className="h-7 w-7" aria-hidden />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">No administrators yet</h3>
        <p className="mt-2 max-w-sm mx-auto text-sm text-slate-500">
          Add your first admin using the button above. They will appear here once created.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Admin</th>
              <th className="px-5 py-3.5">Email</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Created</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {admins.map((admin) => {
              const initial = admin.name.trim().charAt(0).toUpperCase() || "?";
              const canDelete = admin.role !== "main_admin";

              return (
                <tr
                  key={admin.id}
                  className="transition-colors hover:bg-slate-50/90"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1565C0] text-sm font-bold text-white shadow-sm ring-2 ring-white"
                        aria-hidden
                      >
                        {initial}
                      </span>
                      <span className="font-medium text-slate-900">{admin.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 text-slate-600">
                      <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                      <span className="break-all">{admin.email}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <RoleBadge role={admin.role} />
                  </td>
                  <td className="px-5 py-4 tabular-nums text-slate-600">
                    {formatCreatedAt(admin.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => onRequestDelete(admin)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                        Delete
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
