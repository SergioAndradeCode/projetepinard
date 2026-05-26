import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E4A8C",
          hover: "#163970",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#2E75B6",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#EBF2FA",
          foreground: "#1E4A8C",
        },
        success: "#2E7D32",
        warning: "#BF5A00",
        danger: "#B71C1C",
        background: "#F8FAFC",
        card: "#FFFFFF",
        text: {
          DEFAULT: "#1A1A2E",
          muted: "#6B7280",
        },
        border: "#E2E8F0",
        foreground: "#1A1A2E",
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#6B7280",
        },
        destructive: {
          DEFAULT: "#B71C1C",
          foreground: "#FFFFFF",
        },
        ring: "#1E4A8C",
        input: "#E2E8F0",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      fontSize: {
        h1: ["28px", { fontWeight: "700" }],
        h2: ["22px", { fontWeight: "600" }],
        h3: ["18px", { fontWeight: "600" }],
        body: ["14px", { fontWeight: "400" }],
        label: ["13px", { fontWeight: "500" }],
        small: ["12px", { fontWeight: "400" }],
      },
      borderRadius: {
        xl: "12px",
        lg: "8px",
        md: "6px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
