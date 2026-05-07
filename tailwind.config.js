/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        modalOverlayIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        modalPanelIn: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" }
        },
        drawerOverlayIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        drawerSlideIn: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" }
        }
      },
      animation: {
        modalOverlayIn: "modalOverlayIn 0.2s ease-out forwards",
        modalPanelIn: "modalPanelIn 0.22s ease-out forwards",
        drawerOverlayIn: "drawerOverlayIn 0.2s ease-out forwards",
        drawerSlideIn: "drawerSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      }
    }
  },
  plugins: [],
}

