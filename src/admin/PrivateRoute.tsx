import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "./context/AdminAuthContext";

export default function PrivateRoute() {
  const { isAuthenticated, isReady } = useAdminAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
