import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import ProfileDashboardHeader from "../components/profile/ProfileDashboardHeader";
import AccountInformationCard from "../components/profile/AccountInformationCard";
import OrdersSection from "../components/profile/OrdersSection";
import type { OrderRow } from "../components/profile/OrdersSection";
import ProfilePageSkeleton from "../components/profile/ProfilePageSkeleton";
import ProfileSecuritySection from "../components/profile/ProfileSecuritySection";
import { getOrdersApi } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout, refreshProfile } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersError, setOrdersError] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [bootstrapped, setBootstrapped] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const data = (await getOrdersApi()) as OrderRow[];
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrdersError("Unable to load your orders.");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await Promise.all([refreshProfile(), loadOrders()]);
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshProfile, loadOrders]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-16 pt-10 sm:px-8 lg:px-12 lg:pb-24 lg:pt-14">
        {!bootstrapped ? (
          <ProfilePageSkeleton />
        ) : (
          <>
            <ProfileDashboardHeader user={user} />

            <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="space-y-8 lg:col-span-8">
                <AccountInformationCard user={user} />
                <ProfileSecuritySection onLogout={handleLogout} />
              </div>

              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-24">
                  <OrdersSection orders={orders} loading={ordersLoading} error={ordersError} />
                </div>
              </div>
            </div>

            <p className="mt-12 text-center text-sm text-gray-500">
              Need help?{" "}
              <Link to="/contact" className="font-semibold text-[#1565C0] hover:text-[#0B3D91]">
                Contact support
              </Link>
            </p>
          </>
        )}
      </main>

      <SiteFooter className="mt-auto" />
    </div>
  );
}
