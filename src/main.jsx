import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { I18nProvider } from "./i18n/I18nProvider";
import { primeSupabaseBaseFromApi } from "./lib/productImageUrl";
import "./index.css";
import "./App.css";

void primeSupabaseBaseFromApi().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <CartProvider>
            <I18nProvider>
              <App />
            </I18nProvider>
          </CartProvider>
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
});
