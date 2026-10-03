import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f3f2ed",
        shell: "#f8f7f3",
        surface: "#fcfbf8",
        "surface-strong": "#ffffff",
        "surface-dim": "#ecebe6",
        navy: "#0f172a",
        rule: "#dfded8",
        "rule-strong": "#d4d3cd",
        secondary: "#526071",
        "academic-blue": "#e8eef5",
        paper: "#f5f4f0",
        ink: "#16191c",
        muted: "#6e6a62",
        line: "#e2dfd7",
        forge: "#234b6e",
        "forge-soft": "#e4ebf1",
        "activity-moderate": "#a9c0d3",
        "activity-strong": "#5f84a3",
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
