import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import CartPage from "./components/CartPage";
import CheckoutPage from "./components/CheckoutPage";
import ImprovedHeader from "./components/ImprovedHeader";
import OrderCompletePage from "./components/OrderCompletePage";
import OrderSuccess from "./components/OrderSuccess";
import ContactPage from "./components/ContactPage";
import HomePage from "./components/HomePage";
import ProductListingPage from "./components/ProductListingPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import { Login, Signup, Profile } from "./routes";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLoginPage from "./admin/AdminLoginPage";
import AdminLayout from "./admin/AdminLayout";
import PrivateRoute from "./admin/PrivateRoute";
import Dashboard from "./admin/pages/Dashboard";
import Products from "./admin/pages/Products";
import ProductForm from "./admin/pages/ProductForm";
import Orders from "./admin/pages/Orders";
import Settings from "./admin/pages/Settings";
import AdminManagement from "./admin/pages/AdminManagement";
import PagesContent from "./admin/pages/PagesContent";
import SocialMediaManagement from "./admin/pages/SocialMediaManagement";
import { AdminAuthProvider } from "./admin/context/AdminAuthContext";
import { AdminDataProvider } from "./admin/context/AdminDataContext";
import { API_BASE_URL } from "./api/config";

function AdminCatchAll() {
  return <Navigate to="/admin" replace />;
}

function Layout() {
  return (
    <>
      <ImprovedHeader />
      <Outlet />
    </>
  );
}

export default function App() {
  const isAuthenticated = !!localStorage.getItem("token");
  console.log("isAuthenticated:", isAuthenticated);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("TOKEN FOUND:", !!token);
    if (!token) return;

    (async () => {
      try {
        console.log("PROFILE FETCH:", `${API_BASE_URL}/api/users/profile`);
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const payload = await response.json().catch(() => null);
        console.log("PROFILE FETCH:", response.status, payload);
        if (!response.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("gold_water_auth_user");
          return;
        }
        if (payload && typeof payload === "object") {
          localStorage.setItem("gold_water_auth_user", JSON.stringify(payload));
        }
      } catch (error) {
        console.error("PROFILE FETCH:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("gold_water_auth_user");
      }
    })();
  }, []);

  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AdminDataProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              className: "text-sm shadow-lg",
              duration: 3500
            }}
          />
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<PrivateRoute />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="admins" element={<AdminManagement />} />
                  <Route path="products" element={<Products />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/:id/edit" element={<ProductForm />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="pages-content" element={<PagesContent />} />
                  <Route path="social-media" element={<SocialMediaManagement />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<AdminCatchAll />} />
                </Route>
              </Route>
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/register" element={<Navigate to="/signup" replace />} />
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductListingPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/order-complete" element={<OrderCompletePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AdminDataProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
