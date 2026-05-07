import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RegisterPage from "../components/RegisterPage";

export default function Signup() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/profile" replace />;
  return <RegisterPage />;
}
