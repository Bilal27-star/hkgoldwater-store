import { LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "./context/AdminAuthContext";

export default function AdminTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate();
  const { user, logout } = useAdminAuth();

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="hidden min-w-0 flex-1 lg:block">
        <p className="truncate text-sm font-semibold text-slate-900">ADMIN PANEL</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-slate-50 py-1 pl-1 pr-3 ring-1 ring-slate-100">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1565C0] text-sm font-bold text-white">
            {user?.name?.charAt(0) ?? "A"}
          </span>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-medium text-slate-900">{user?.name ?? "Admin"}</p>
            <p className="truncate text-xs text-slate-500 capitalize">{user?.role ?? "admin"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-[#1565C0] hover:text-[#1565C0]"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
