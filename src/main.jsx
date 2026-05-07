import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { I18nProvider } from "./i18n/I18nProvider";
import "./index.css";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
