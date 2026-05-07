import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type OrderSuccessState = {
  orderId?: string;
};

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as OrderSuccessState | undefined;

  const orderId =
    state?.orderId != null && state.orderId !== "" ? String(state.orderId) : "";

  useEffect(() => {
    if (!orderId) {
      navigate("/");
    }
  }, [orderId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-lg text-center max-w-md w-full">

        {/* ✅ Animation (checkmark) */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* ✅ Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Order Confirmed 🎉
        </h1>

        {/* ✅ Description */}
        <p className="text-gray-600 mb-4">
          Your order has been placed successfully.
        </p>

        {/* ✅ Order ID */}
        <div className="bg-gray-100 rounded-lg p-3 mb-6">
          <p className="text-sm text-gray-500">Order ID</p>
          <p className="font-semibold text-gray-800">{orderId}</p>
        </div>

        {/* ✅ Button */}
        <button
          onClick={() => navigate("/")}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}