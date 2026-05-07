import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginPage from "../components/LoginPage";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/profile" replace />;
  return <LoginPage />;
}
