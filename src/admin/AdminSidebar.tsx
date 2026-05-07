import {
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Share2,
  Settings,
  Shield,
  ShoppingCart
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";

const items: { to: string; label: string; icon: typeof LayoutDashboard }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/admins", label: "Admin Management", icon: Shield },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders & Customers", icon: ShoppingCart },
  { to: "/admin/pages-content", label: "Pages Content", icon: FileText },
  { to: "/admin/social-media", label: "Social Media", icon: Share2 },
  { to: "/admin/settings", label: "Settings", icon: Settings }
];

export default function AdminSidebar({
  mobileOpen,
  onNavigate
}: {
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[260px] border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
          <Link
            to="/admin"
            className="flex min-w-0 shrink-0 items-center transition hover:opacity-90"
            onClick={onNavigate}
            aria-label="Admin home"
          >
            <BrandLogo variant="admin" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin</p>
            <p className="text-sm font-bold text-[#0B3D91]">Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin navigation">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin"}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#1565C0] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#0B3D91]"
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3 lg:hidden">
          <p className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400">
            <LogOut className="h-4 w-4" aria-hidden />
            Use top bar to log out
          </p>
        </div>
      </div>
    </aside>
  );
}
