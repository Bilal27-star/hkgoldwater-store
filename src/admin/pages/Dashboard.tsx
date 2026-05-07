import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  FileText,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Users
} from "lucide-react";
import { useAdminData } from "../context/AdminDataContext";

export default function Dashboard() {
  const { orders, customers } = useAdminData();

  const totalOrders = orders.length;
  const totalCustomers = customers.length;
  const activeAdmins = 1;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const activity = orders.slice(0, 3).map((order) => ({
    id: order.id,
    title: "New order received",
    description: `Order ${order.id} from ${order.customerName}.`,
    timeLabel: new Date(order.createdAt).toLocaleString()
  }));
  const statCards = [
    {
      label: "Total Orders",
      value: String(totalOrders),
      icon: ShoppingCart,
      iconBg: "bg-blue-100 text-blue-600"
    },
    {
      label: "Total Customers",
      value: String(totalCustomers),
      icon: Users,
      iconBg: "bg-emerald-100 text-emerald-600"
    },
    {
      label: "Active Admins",
      value: String(activeAdmins),
      icon: UserPlus,
      iconBg: "bg-violet-100 text-violet-600"
    },
    {
      label: "Total revenue",
      value: `${totalRevenue.toLocaleString("en-US")} DA`,
      icon: TrendingUp,
      iconBg: "bg-orange-100 text-orange-600"
    }
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back! Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, iconBg }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
              </div>
              <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBg}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <ul className="mt-4 space-y-4">
            {activity.map((item) => (
              <li key={item.id} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1565C0]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.description}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.timeLabel}</p>
                </div>
              </li>
            ))}
            {activity.length === 0 ? (
              <li className="text-sm text-slate-500">No recent activity.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              to="/admin/settings"
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#1565C0] hover:text-[#1565C0]"
            >
              <FileText className="h-4 w-4" aria-hidden />
              Edit site settings
            </Link>
            <Link
              to="/admin/products"
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#1565C0] hover:text-[#1565C0]"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden />
              Manage products
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#1565C0] hover:text-[#1565C0]"
            >
              <ArrowUpRight className="h-4 w-4" aria-hidden />
              View orders
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
