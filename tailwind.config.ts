import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#f5f4f0",
        ink: "#16191c",
        muted: "#6e6a62",
        line: "#e2dfd7",
        forge: "#234b6e",
        "forge-soft": "#e4ebf1",
        success: "#2f7a4d",
        "success-soft": "#e4f1e8",
        danger: "#b23a34",
        "danger-soft": "#f9ecea",
        warning: "#8a6118",
        "warning-soft": "#f7edd9",
      },
      boxShadow: {
        card: "0 18px 54px rgba(22, 25, 28, 0.06)",
        hero: "0 24px 80px rgba(22, 25, 28, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
