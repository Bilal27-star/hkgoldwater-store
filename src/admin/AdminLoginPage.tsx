import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, Mail } from "lucide-react";
import { useAdminAuth } from "./context/AdminAuthContext";
import Logo from "../components/ui/Logo";

export default function AdminLoginPage() {
  const { login, isAuthenticated, isReady } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from && (location.state as { from?: string }).from !== "/admin/login"
      ? (location.state as { from: string }).from
      : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isReady && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.ok) {
      toast.success("Signed in successfully");
      navigate(from, { replace: true });
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200/80">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Logo
              variant="dark"
              alt=""
              useDefaultSize={false}
              className="h-14 w-auto max-h-[56px] object-contain sm:h-16 sm:max-h-[64px]"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Admin Panel</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none ring-blue-600 focus:border-blue-600 focus:ring-2"
                placeholder="admin@hkgoldwater.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none ring-blue-600 focus:border-blue-600 focus:ring-2"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-lg bg-[#1565C0] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B3D91] disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
